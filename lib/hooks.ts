'use client';

import { useState, useCallback, useEffect, useMemo, useRef } from 'react';
import {
  mockRestaurant,
  mockIngredients,
  mockPurchases,
  mockRecipes,
  mockPosItems,
  mockSalesRecords,
  mockAlerts,
  mockDashboardKPI,
  mockAnalyticsData,
  mockDishesOverTarget,
  seedRestaurant,
  seedIngredients,
  seedPurchases,
  seedRecipes,
  seedPosItems,
  seedSalesRecords,
  seedAlerts,
  seedDashboardKPI,
  seedAnalyticsData,
  seedDishesOverTarget,
} from './mock-data';
import {
  initializeDatabase,
  restaurantDb,
  ingredientDb,
  purchaseDb,
  recipeDb,
  posItemDb,
  salesDb,
  receiptDb,
  alertDb,
  analyticsDb,
  dishesDb,
  dashboardDb,
  setSeedData,
  loadSeedRestaurant,
  subscribeToSales,
  subscribeToReceipts,
} from './db';
import { storage } from './storage';
import { supabaseClient } from './supabase/client';
import type {
  Ingredient,
  Purchase,
  Recipe,
  PosItem,
  Alert,
  DashboardKPI,
  Restaurant,
  AnalyticsDataPoint,
  SalesRecord,
  Receipt,
} from './types';

// Initialize database on first hook call
let dbInitialized = false;
const useSupabase = Boolean(supabaseClient);
const djangoBaseUrl = (process.env.NEXT_PUBLIC_DJANGO_API_URL || '').replace(/\/$/, '');
const useDjango = process.env.NEXT_PUBLIC_BACKEND_PROVIDER === 'django' && Boolean(djangoBaseUrl);
const useRemoteData = useSupabase || useDjango;
const RESTAURANT_ID_STORAGE_KEY = 'costpilot-restaurant-id';
const DJANGO_RESTAURANT_ID_STORAGE_KEY = 'costpilot-django-restaurant-id';
let supabaseRestaurantIdPromise: Promise<string> | null = null;
let djangoRestaurantIdPromise: Promise<string> | null = null;

function ensureDbInitialized() {
  if (!dbInitialized) {
    initializeDatabase(
      mockIngredients,
      mockPurchases,
      mockRecipes,
      mockPosItems,
      mockRestaurant,
      mockSalesRecords,
      mockAlerts,
      mockDashboardKPI,
      mockAnalyticsData,
      mockDishesOverTarget
    );
    setSeedData(
      seedIngredients,
      seedPurchases,
      seedRecipes,
      seedPosItems,
      seedRestaurant,
      seedSalesRecords,
      seedAlerts,
      seedDashboardKPI,
      seedAnalyticsData,
      seedDishesOverTarget
    );
    loadSeedRestaurant();
    dbInitialized = true;
  }
}

function isUuid(value: string) {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
    value
  );
}

async function djangoRequest<T>(path: string, init?: RequestInit): Promise<T> {
  if (!djangoBaseUrl) {
    throw new Error('Django API URL missing. Set NEXT_PUBLIC_DJANGO_API_URL.');
  }

  const response = await fetch(`${djangoBaseUrl}${path}`, {
    headers: {
      'Content-Type': 'application/json',
      ...(init?.headers || {}),
    },
    ...init,
  });

  if (!response.ok) {
    const message = await response.text();
    throw new Error(message || `Django request failed: ${response.status}`);
  }

  return (await response.json()) as T;
}

async function getDjangoRestaurantId() {
  if (typeof window === 'undefined') {
    throw new Error('Django restaurant id requires browser context');
  }

  const cached = window.localStorage.getItem(DJANGO_RESTAURANT_ID_STORAGE_KEY);
  if (cached) return cached;

  if (!djangoRestaurantIdPromise) {
    djangoRestaurantIdPromise = (async () => {
      const rows = await djangoRequest<Array<{ id: number }>>('/api/v1/restaurants/');
      if (rows.length > 0) {
        const id = String(rows[0].id);
        window.localStorage.setItem(DJANGO_RESTAURANT_ID_STORAGE_KEY, id);
        return id;
      }

      const created = await djangoRequest<{ id: number }>('/api/v1/restaurants/', {
        method: 'POST',
        body: JSON.stringify({
          name: seedRestaurant.name,
          region: seedRestaurant.region,
          city: seedRestaurant.city,
          target_food_cost_percentage: seedRestaurant.targetFoodCostPercentage,
        }),
      });

      const id = String(created.id);
      window.localStorage.setItem(DJANGO_RESTAURANT_ID_STORAGE_KEY, id);
      return id;
    })();
  }

  return djangoRestaurantIdPromise;
}

async function getSupabaseRestaurantId() {
  if (!supabaseClient) {
    throw new Error('Supabase client not configured');
  }

  if (typeof window === 'undefined') {
    throw new Error('Supabase restaurant id requires a browser context');
  }

  const cached = window.localStorage.getItem(RESTAURANT_ID_STORAGE_KEY);
  if (cached) {
    return cached;
  }

  if (!supabaseRestaurantIdPromise) {
    supabaseRestaurantIdPromise = (async () => {
      const { data, error } = await supabaseClient.from('restaurants').select('*').limit(1);
      if (error) {
        throw error;
      }

      if (data && data.length > 0) {
        const id = data[0].id as string;
        window.localStorage.setItem(RESTAURANT_ID_STORAGE_KEY, id);
        return id;
      }

      const { data: created, error: createError } = await supabaseClient
        .from('restaurants')
        .insert({
          name: mockRestaurant.name,
          seating_capacity: mockRestaurant.seatingCapacity,
          region: mockRestaurant.region,
          city: mockRestaurant.city,
          cuisine: mockRestaurant.cuisine,
          target_food_cost_percentage: mockRestaurant.targetFoodCostPercentage,
          target_food_cost_range: mockRestaurant.targetFoodCostRange,
          category_targets: mockRestaurant.categoryTargets,
          default_currency: mockRestaurant.defaultCurrency,
          timezone: mockRestaurant.timezone,
          pos_provider: mockRestaurant.posProvider ?? null,
        })
        .select()
        .single();

      if (createError || !created) {
        throw createError || new Error('Failed to create restaurant');
      }

      const id = created.id as string;
      window.localStorage.setItem(RESTAURANT_ID_STORAGE_KEY, id);
      await seedSupabaseData(id);
      return id;
    })();
  }

  return supabaseRestaurantIdPromise;
}

async function seedSupabaseData(restaurantId: string) {
  if (!supabaseClient) return;

  const { data: existingIngredients } = await supabaseClient
    .from('ingredients')
    .select('id')
    .eq('restaurant_id', restaurantId)
    .limit(1);

  if (existingIngredients && existingIngredients.length > 0) {
    return;
  }

  await supabaseClient.from('ingredients').insert(
    mockIngredients.map((ingredient) => ({
      restaurant_id: restaurantId,
      name: ingredient.name,
      category: ingredient.category,
      unit: ingredient.unit,
      last_purchase_price: ingredient.lastPurchasePrice,
      benchmark_price: ingredient.benchmarkPrice,
      last_purchased_date: ingredient.lastPurchasedDate?.toISOString?.() ?? null,
      price_trend: ingredient.priceTrend,
      current_stock: ingredient.currentStock,
    }))
  );

  const { data: posItems } = await supabaseClient
    .from('pos_items')
    .insert(
      mockPosItems.map((item) => ({
        restaurant_id: restaurantId,
        name: item.name,
        category: item.category ?? null,
        selling_price: item.sellingPrice,
        has_recipe: item.hasRecipe,
      }))
    )
    .select();

  const posItemMap = new Map<string, string>();
  (posItems ?? []).forEach((item: any) => {
    posItemMap.set(item.name, item.id);
  });

  await supabaseClient.from('recipes').insert(
    mockRecipes.map((recipe) => ({
      restaurant_id: restaurantId,
      pos_item_id: posItemMap.get(recipe.posItemName ?? recipe.posItemId) ?? null,
      pos_item_name: recipe.posItemName,
      selling_price: recipe.sellingPrice,
      ingredients: recipe.ingredients,
      total_plate_cost: recipe.totalPlateCost,
      food_cost_percentage: recipe.foodCostPercentage,
    }))
  );

  await supabaseClient.from('purchases').insert(
    mockPurchases.map((purchase) => ({
      restaurant_id: restaurantId,
      date: purchase.date?.toISOString?.() ?? new Date().toISOString(),
      ingredient_id: isUuid(purchase.ingredientId) ? purchase.ingredientId : null,
      ingredient_name: purchase.ingredientName,
      quantity: purchase.quantity,
      unit: purchase.unit,
      total_price: purchase.totalPrice,
      unit_price: purchase.unitPrice,
      supplier_id: purchase.supplierId,
      supplier: purchase.supplier,
      type: purchase.type,
    }))
  );

  await supabaseClient.from('sales_records').insert(
    mockSalesRecords.map((record) => ({
      restaurant_id: restaurantId,
      pos_item_id: posItemMap.get(record.posItemName ?? record.posItemId) ?? null,
      pos_item_name: record.posItemName,
      date: record.date?.toISOString?.() ?? new Date().toISOString(),
      quantity: record.quantity,
    }))
  );

  await supabaseClient.from('alerts').insert(
    mockAlerts.map((alert) => ({
      restaurant_id: restaurantId,
      title: alert.title,
      description: alert.description,
      type: alert.type,
      severity: alert.severity,
      date: alert.date?.toISOString?.() ?? new Date().toISOString(),
      status: alert.status,
      related_id: alert.relatedId ?? null,
    }))
  );

  await supabaseClient.from('dashboard_kpis').insert({
    restaurant_id: restaurantId,
    payload: mockDashboardKPI,
  });

  await supabaseClient.from('analytics_data').insert({
    restaurant_id: restaurantId,
    payload: mockAnalyticsData,
  });

  await supabaseClient.from('dishes_over_target').insert({
    restaurant_id: restaurantId,
    payload: mockDishesOverTarget,
  });
}

function mapRestaurantRow(row: any): Restaurant {
  return {
    id: row.id,
    name: row.name,
    seatingCapacity: row.seating_capacity ?? 0,
    region: row.region ?? '',
    city: row.city ?? '',
    cuisine: row.cuisine ?? '',
    targetFoodCostPercentage: Number(row.target_food_cost_percentage ?? 0),
    targetFoodCostRange: row.target_food_cost_range ?? { min: 0, max: 0 },
    categoryTargets: row.category_targets ?? {},
    defaultCurrency: row.default_currency ?? 'PHP',
    timezone: row.timezone ?? 'Asia/Manila',
    posProvider: row.pos_provider ?? undefined,
  };
}

function mapIngredientRow(row: any): Ingredient {
  return {
    id: row.id,
    name: row.name,
    category: row.category ?? 'Others',
    unit: row.unit ?? 'kg',
    lastPurchasePrice: Number(row.last_purchase_price ?? 0),
    benchmarkPrice: Number(row.benchmark_price ?? 0),
    lastPurchasedDate: row.last_purchased_date ? new Date(row.last_purchased_date) : new Date(),
    priceTrend: Array.isArray(row.price_trend) ? row.price_trend : [],
    currentStock: Number(row.current_stock ?? 0),
  };
}

function mapDjangoIngredientRow(row: any): Ingredient {
  return {
    id: String(row.id),
    name: row.name,
    category: row.category ?? 'Others',
    unit: row.unit ?? 'kg',
    lastPurchasePrice: Number(row.last_purchase_price ?? 0),
    benchmarkPrice: Number(row.benchmark_price ?? 0),
    lastPurchasedDate: row.updated_at ? new Date(row.updated_at) : new Date(),
    priceTrend: [Number(row.last_purchase_price ?? 0)],
    currentStock: Number(row.current_stock ?? 0),
  };
}

function mapPurchaseRow(row: any): Purchase {
  return {
    id: row.id,
    date: row.date ? new Date(row.date) : new Date(),
    ingredientId: row.ingredient_id ?? '',
    ingredientName: row.ingredient_name ?? '',
    quantity: Number(row.quantity ?? 0),
    unit: row.unit ?? 'kg',
    totalPrice: Number(row.total_price ?? 0),
    unitPrice: Number(row.unit_price ?? 0),
    supplierId: row.supplier_id ?? '',
    supplier: row.supplier ?? '',
    type: row.type ?? 'Regular',
  };
}

function mapPosItemRow(row: any): PosItem {
  return {
    id: row.id,
    name: row.name,
    category: row.category ?? '',
    sellingPrice: Number(row.selling_price ?? 0),
    hasRecipe: Boolean(row.has_recipe),
  };
}

function mapDjangoDishRow(row: any): PosItem {
  return {
    id: String(row.id),
    name: row.name,
    category: row.category ?? '',
    sellingPrice: Number(row.selling_price ?? 0),
    hasRecipe: Boolean(row.has_recipe),
  };
}

function mapRecipeRow(row: any): Recipe {
  return {
    id: row.id,
    posItemId: row.pos_item_id ?? '',
    posItemName: row.pos_item_name ?? '',
    sellingPrice: Number(row.selling_price ?? 0),
    ingredients: Array.isArray(row.ingredients) ? row.ingredients : [],
    totalPlateCost: Number(row.total_plate_cost ?? 0),
    foodCostPercentage: Number(row.food_cost_percentage ?? 0),
  };
}

function mapDjangoRecipeRow(row: any): Recipe {
  return {
    id: String(row.id),
    posItemId: String(row.dish),
    posItemName: row.dish_name ?? '',
    sellingPrice: Number(row.dish_selling_price ?? 0),
    ingredients: Array.isArray(row.items)
      ? row.items.map((item: any) => ({
          ingredientId: String(item.ingredient),
          ingredientName: item.ingredient_name ?? '',
          quantityPerPortion: Number(item.quantity_per_portion ?? 0),
          unit: 'kg',
          totalCost:
            Number(item.quantity_per_portion ?? 0) * Number(item.cost_per_unit ?? 0),
          costPerUnit: Number(item.cost_per_unit ?? 0),
          costPerPortion: Number(item.cost_per_portion ?? 0),
        }))
      : [],
    totalPlateCost: Number(row.total_plate_cost ?? 0),
    foodCostPercentage: Number(row.food_cost_percentage ?? 0),
  };
}

function mapAlertRow(row: any): Alert {
  return {
    id: row.id,
    title: row.title ?? '',
    description: row.description ?? '',
    type: row.type ?? 'ingredient',
    severity: row.severity ?? 'info',
    date: row.date ? new Date(row.date) : new Date(),
    status: row.status ?? 'open',
    relatedId: row.related_id ?? undefined,
  };
}

function mapSalesRow(row: any): SalesRecord {
  return {
    id: row.id,
    posItemId: row.pos_item_id ?? '',
    posItemName: row.pos_item_name ?? '',
    date: row.date ? new Date(row.date) : new Date(),
    quantity: Number(row.quantity ?? 0),
  };
}

function mapReceiptRow(row: any): Receipt {
  return {
    id: row.id,
    fileName: row.file_name ?? '',
    fileUrl: row.file_url ?? undefined,
    uploadedAt: row.uploaded_at ? new Date(row.uploaded_at) : new Date(),
    receiptDate: row.receipt_date ? new Date(row.receipt_date) : undefined,
    weekStart: row.week_start ? new Date(row.week_start) : new Date(),
    items: Array.isArray(row.items) ? row.items : [],
  };
}

// Mock hooks simulating API calls with TanStack Query structure
// Now backed by in-memory database that persists during session

export function useDashboardSummary(dateRange?: { start: Date; end: Date }) {
  ensureDbInitialized();
  const [data, setData] = useState<DashboardKPI | null>(() =>
    useSupabase ? null : dashboardDb.get() ?? mockDashboardKPI
  );
  const [isLoading, setIsLoading] = useState(useSupabase);

  useEffect(() => {
    if (!useSupabase || !supabaseClient) return;
    let active = true;

    (async () => {
      try {
        const restaurantId = await getSupabaseRestaurantId();
        const { data: rows, error } = await supabaseClient
          .from('dashboard_kpis')
          .select('payload, created_at')
          .eq('restaurant_id', restaurantId)
          .order('created_at', { ascending: false })
          .limit(1);

        if (error) {
          throw error;
        }

        if (rows && rows.length > 0) {
          if (active) {
            setData(rows[0].payload ?? mockDashboardKPI);
          }
        } else {
          await supabaseClient.from('dashboard_kpis').insert({
            restaurant_id: restaurantId,
            payload: mockDashboardKPI,
          });
          if (active) {
            setData(mockDashboardKPI);
          }
        }
      } catch (error) {
        console.error('[useDashboardSummary] Supabase error', error);
        if (active) {
          setData(dashboardDb.get() ?? mockDashboardKPI);
        }
      } finally {
        if (active) {
          setIsLoading(false);
        }
      }
    })();

    return () => {
      active = false;
    };
  }, []);

  return {
    data: data ?? mockDashboardKPI,
    isLoading,
    error: null,
  };
}

export function useRestaurant() {
  ensureDbInitialized();
  const [data, setData] = useState<Restaurant | null>(() =>
    useSupabase ? null : restaurantDb.get()
  );
  const [isLoading, setIsLoading] = useState(useSupabase);

  useEffect(() => {
    if (!useSupabase || !supabaseClient) return;
    let active = true;

    (async () => {
      try {
        const restaurantId = await getSupabaseRestaurantId();
        const { data: row, error } = await supabaseClient
          .from('restaurants')
          .select('*')
          .eq('id', restaurantId)
          .single();

        if (error) {
          throw error;
        }

        if (active) {
          setData(mapRestaurantRow(row));
        }
      } catch (error) {
        console.error('[useRestaurant] Supabase error', error);
        if (active) {
          setData(restaurantDb.get());
        }
      } finally {
        if (active) {
          setIsLoading(false);
        }
      }
    })();

    return () => {
      active = false;
    };
  }, []);

  return {
    data,
    isLoading,
    error: null,
  };
}

export function useIngredients(filters?: {
  category?: string;
  supplier?: string;
  hasRecentPurchase?: boolean;
  search?: string;
}) {
  ensureDbInitialized();
  const [data, setData] = useState<Ingredient[]>(() =>
    useSupabase ? [] : ingredientDb.getAll()
  );
  const [isLoading, setIsLoading] = useState(useRemoteData);

  useEffect(() => {
    if (useDjango) {
      let active = true;

      const fetchIngredients = async () => {
        try {
          const restaurantId = await getDjangoRestaurantId();
          const rows = await djangoRequest<Array<any>>(
            `/api/v1/ingredients/?restaurant=${restaurantId}`
          );
          if (active) {
            setData(rows.map(mapDjangoIngredientRow));
          }
        } catch (error) {
          console.error('[useIngredients] Django error', error);
          if (active) {
            setData(ingredientDb.getAll());
          }
        } finally {
          if (active) {
            setIsLoading(false);
          }
        }
      };

      fetchIngredients();
      const handleRefresh = () => fetchIngredients();
      window.addEventListener('costpilot-ingredients-refresh', handleRefresh);
      return () => {
        active = false;
        window.removeEventListener('costpilot-ingredients-refresh', handleRefresh);
      };
    }

    if (!useSupabase || !supabaseClient) return;
    let active = true;

    const fetchIngredients = async () => {
      try {
        const restaurantId = await getSupabaseRestaurantId();
        const { data: rows, error } = await supabaseClient
          .from('ingredients')
          .select('*')
          .eq('restaurant_id', restaurantId);

        if (error) {
          throw error;
        }

        if (active) {
          setData((rows ?? []).map(mapIngredientRow));
        }
      } catch (error) {
        console.error('[useIngredients] Supabase error', error);
        if (active) {
          setData(ingredientDb.getAll());
        }
      } finally {
        if (active) {
          setIsLoading(false);
        }
      }
    };

    fetchIngredients();

    const handleRefresh = () => {
      fetchIngredients();
    };

    window.addEventListener('costpilot-ingredients-refresh', handleRefresh);

    return () => {
      active = false;
      window.removeEventListener('costpilot-ingredients-refresh', handleRefresh);
    };
  }, []);

  const filtered = useMemo(() => {
    let next = data;
    if (filters?.search) {
      const search = filters.search.toLowerCase();
      next = next.filter((i) => i.name.toLowerCase().includes(search));
    }
    if (filters?.category) {
      next = next.filter((i) => i.category === filters.category);
    }
    return next;
  }, [data, filters?.search, filters?.category]);

  return {
    data: filtered,
    isLoading,
    error: null,
  };
}

export function useIngredientDetails(ingredientId: string) {
  ensureDbInitialized();
  const [data, setData] = useState<Ingredient | null>(() =>
    useSupabase ? null : ingredientDb.getById(ingredientId)
  );
  const [isLoading, setIsLoading] = useState(useRemoteData);

  useEffect(() => {
    if (useDjango) {
      let active = true;

      (async () => {
        try {
          const row = await djangoRequest<any>(`/api/v1/ingredients/${ingredientId}/`);
          if (active) {
            setData(mapDjangoIngredientRow(row));
          }
        } catch (error) {
          console.error('[useIngredientDetails] Django error', error);
          if (active) {
            setData(ingredientDb.getById(ingredientId));
          }
        } finally {
          if (active) {
            setIsLoading(false);
          }
        }
      })();

      return () => {
        active = false;
      };
    }

    if (!useSupabase || !supabaseClient) return;
    let active = true;

    (async () => {
      try {
        const { data: row, error } = await supabaseClient
          .from('ingredients')
          .select('*')
          .eq('id', ingredientId)
          .single();

        if (error) {
          throw error;
        }

        if (active) {
          setData(mapIngredientRow(row));
        }
      } catch (error) {
        console.error('[useIngredientDetails] Supabase error', error);
        if (active) {
          setData(ingredientDb.getById(ingredientId));
        }
      } finally {
        if (active) {
          setIsLoading(false);
        }
      }
    })();

    return () => {
      active = false;
    };
  }, [ingredientId]);

  return {
    data,
    isLoading,
    error: null,
  };
}

export function usePurchases(dateRange?: { start: Date; end: Date }) {
  ensureDbInitialized();
  const [data, setData] = useState<Purchase[]>(() =>
    useSupabase ? [] : purchaseDb.getAll()
  );
  const [isLoading, setIsLoading] = useState(useSupabase);

  useEffect(() => {
    if (!useSupabase || !supabaseClient) return;
    let active = true;

    const fetchPurchases = async () => {
      try {
        const restaurantId = await getSupabaseRestaurantId();
        const { data: rows, error } = await supabaseClient
          .from('purchases')
          .select('*')
          .eq('restaurant_id', restaurantId)
          .order('date', { ascending: false });

        if (error) {
          throw error;
        }

        if (active) {
          setData((rows ?? []).map(mapPurchaseRow));
        }
      } catch (error) {
        console.error('[usePurchases] Supabase error', error);
        if (active) {
          setData(purchaseDb.getAll());
        }
      } finally {
        if (active) {
          setIsLoading(false);
        }
      }
    };

    fetchPurchases();

    const handleRefresh = () => {
      fetchPurchases();
    };

    window.addEventListener('costpilot-purchases-refresh', handleRefresh);

    return () => {
      active = false;
      window.removeEventListener('costpilot-purchases-refresh', handleRefresh);
    };
  }, []);

  const filtered = useMemo(() => {
    if (!dateRange) return data;
    return data.filter(
      (purchase) => purchase.date >= dateRange.start && purchase.date <= dateRange.end
    );
  }, [data, dateRange]);

  return {
    data: filtered,
    isLoading,
    error: null,
  };
}

export function useRecipes() {
  ensureDbInitialized();
  const [data, setData] = useState<Recipe[]>(() =>
    useSupabase ? [] : recipeDb.getAll()
  );
  const [isLoading, setIsLoading] = useState(useRemoteData);

  useEffect(() => {
    if (useDjango) {
      let active = true;

      const fetchRecipes = async () => {
        try {
          const restaurantId = await getDjangoRestaurantId();
          const rows = await djangoRequest<Array<any>>(
            `/api/v1/recipes/?restaurant=${restaurantId}`
          );
          if (active) {
            setData(rows.map(mapDjangoRecipeRow));
          }
        } catch (error) {
          console.error('[useRecipes] Django error', error);
          if (active) {
            setData(recipeDb.getAll());
          }
        } finally {
          if (active) {
            setIsLoading(false);
          }
        }
      };

      fetchRecipes();

      const handleRefresh = () => {
        fetchRecipes();
      };

      window.addEventListener('costpilot-recipes-refresh', handleRefresh);

      return () => {
        active = false;
        window.removeEventListener('costpilot-recipes-refresh', handleRefresh);
      };
    }

    if (!useSupabase || !supabaseClient) return;
    let active = true;

    const fetchRecipes = async () => {
      try {
        const restaurantId = await getSupabaseRestaurantId();
        const { data: rows, error } = await supabaseClient
          .from('recipes')
          .select('*')
          .eq('restaurant_id', restaurantId);

        if (error) {
          throw error;
        }

        if (active) {
          setData((rows ?? []).map(mapRecipeRow));
        }
      } catch (error) {
        console.error('[useRecipes] Supabase error', error);
        if (active) {
          setData(recipeDb.getAll());
        }
      } finally {
        if (active) {
          setIsLoading(false);
        }
      }
    };

    fetchRecipes();

    const handleRefresh = () => {
      fetchRecipes();
    };

    window.addEventListener('costpilot-recipes-refresh', handleRefresh);

    return () => {
      active = false;
      window.removeEventListener('costpilot-recipes-refresh', handleRefresh);
    };
  }, []);

  return {
    data,
    isLoading,
    error: null,
  };
}

export function useRecipeByPosItem(posItemId: string) {
  ensureDbInitialized();
  const [data, setData] = useState<Recipe | null>(() =>
    useSupabase ? null : recipeDb.getByPosItemId(posItemId)
  );
  const [isLoading, setIsLoading] = useState(useRemoteData);

  useEffect(() => {
    if (useDjango) {
      if (!posItemId) {
        setData(null);
        setIsLoading(false);
        return;
      }

      let active = true;
      (async () => {
        try {
          const rows = await djangoRequest<Array<any>>(`/api/v1/recipes/?dish=${posItemId}`);
          if (active) {
            setData(rows.length > 0 ? mapDjangoRecipeRow(rows[0]) : null);
          }
        } catch (error) {
          console.error('[useRecipeByPosItem] Django error', error);
          if (active) {
            setData(recipeDb.getByPosItemId(posItemId));
          }
        } finally {
          if (active) {
            setIsLoading(false);
          }
        }
      })();

      return () => {
        active = false;
      };
    }

    if (!useSupabase || !supabaseClient) return;
    let active = true;

    (async () => {
      try {
        const { data: row, error } = await supabaseClient
          .from('recipes')
          .select('*')
          .eq('pos_item_id', posItemId)
          .maybeSingle();

        if (error) {
          throw error;
        }

        if (active) {
          setData(row ? mapRecipeRow(row) : null);
        }
      } catch (error) {
        console.error('[useRecipeByPosItem] Supabase error', error);
        if (active) {
          setData(recipeDb.getByPosItemId(posItemId));
        }
      } finally {
        if (active) {
          setIsLoading(false);
        }
      }
    })();

    return () => {
      active = false;
    };
  }, [posItemId]);

  return {
    data,
    isLoading,
    error: null,
  };
}

export function usePosItems(filters?: { hasRecipe?: boolean }) {
  ensureDbInitialized();
  const [data, setData] = useState<PosItem[]>(() =>
    useSupabase ? [] : posItemDb.getAll()
  );
  const [isLoading, setIsLoading] = useState(useRemoteData);

  useEffect(() => {
    if (useDjango) {
      let active = true;

      const fetchPosItems = async () => {
        try {
          const restaurantId = await getDjangoRestaurantId();
          const rows = await djangoRequest<Array<any>>(
            `/api/v1/dishes/?restaurant=${restaurantId}`
          );
          if (active) {
            setData(rows.map(mapDjangoDishRow));
          }
        } catch (error) {
          console.error('[usePosItems] Django error', error);
          if (active) {
            setData(posItemDb.getAll());
          }
        } finally {
          if (active) {
            setIsLoading(false);
          }
        }
      };

      fetchPosItems();
      const handleRefresh = () => fetchPosItems();
      window.addEventListener('costpilot-positems-refresh', handleRefresh);
      return () => {
        active = false;
        window.removeEventListener('costpilot-positems-refresh', handleRefresh);
      };
    }

    if (!useSupabase || !supabaseClient) return;
    let active = true;

    const fetchPosItems = async () => {
      try {
        const restaurantId = await getSupabaseRestaurantId();
        const { data: rows, error } = await supabaseClient
          .from('pos_items')
          .select('*')
          .eq('restaurant_id', restaurantId);

        if (error) {
          throw error;
        }

        if (active) {
          setData((rows ?? []).map(mapPosItemRow));
        }
      } catch (error) {
        console.error('[usePosItems] Supabase error', error);
        if (active) {
          setData(posItemDb.getAll());
        }
      } finally {
        if (active) {
          setIsLoading(false);
        }
      }
    };

    fetchPosItems();

    const handleRefresh = () => {
      fetchPosItems();
    };

    window.addEventListener('costpilot-positems-refresh', handleRefresh);

    return () => {
      active = false;
      window.removeEventListener('costpilot-positems-refresh', handleRefresh);
    };
  }, []);

  const filtered = useMemo(() => {
    if (filters?.hasRecipe === undefined) return data;
    return data.filter((item) => item.hasRecipe === filters.hasRecipe);
  }, [data, filters?.hasRecipe]);

  return {
    data: filtered,
    isLoading,
    error: null,
  };
}

export function useSalesRecords(dateRange?: { start: Date; end: Date }) {
  ensureDbInitialized();
  const [isLoading, setIsLoading] = useState(useSupabase);
  const [allRecords, setAllRecords] = useState<SalesRecord[]>(() =>
    useSupabase ? [] : salesDb.getAll()
  );

  useEffect(() => {
    if (!useSupabase || !supabaseClient) {
      const update = () => setAllRecords(salesDb.getAll());
      update();
      return subscribeToSales(update);
    }

    let active = true;
    (async () => {
      try {
        const restaurantId = await getSupabaseRestaurantId();
        const { data: rows, error } = await supabaseClient
          .from('sales_records')
          .select('*')
          .eq('restaurant_id', restaurantId)
          .order('date', { ascending: false });

        if (error) {
          throw error;
        }

        if (active) {
          setAllRecords((rows ?? []).map(mapSalesRow));
        }
      } catch (error) {
        console.error('[useSalesRecords] Supabase error', error);
        if (active) {
          setAllRecords(salesDb.getAll());
        }
      } finally {
        if (active) {
          setIsLoading(false);
        }
      }
    })();

    return () => {
      active = false;
    };
  }, []);

  const filtered = useMemo(() => {
    if (!dateRange) return allRecords;
    return allRecords.filter((record) => record.date >= dateRange.start && record.date <= dateRange.end);
  }, [allRecords, dateRange]);

  return {
    data: filtered,
    isLoading,
    error: null,
  };
}

export function useSetSalesRecords() {
  ensureDbInitialized();
  return useCallback(async (records: SalesRecord[]) => {
    if (!useSupabase || !supabaseClient) {
      salesDb.set(records);
      return;
    }

    const restaurantId = await getSupabaseRestaurantId();
    await supabaseClient
      .from('sales_records')
      .delete()
      .eq('restaurant_id', restaurantId);

    if (records.length > 0) {
      await supabaseClient.from('sales_records').insert(
        records.map((record) => ({
          restaurant_id: restaurantId,
          pos_item_id: isUuid(record.posItemId) ? record.posItemId : null,
          pos_item_name: record.posItemName,
          date: record.date?.toISOString?.() ?? new Date().toISOString(),
          quantity: record.quantity,
        }))
      );
    }
  }, []);
}

export function useReceipts() {
  ensureDbInitialized();
  const [isLoading, setIsLoading] = useState(useSupabase);
  const [receipts, setReceipts] = useState<Receipt[]>(() =>
    useSupabase ? [] : receiptDb.getAll()
  );
  const hasHydratedRef = useRef(false);

  useEffect(() => {
    if (!useSupabase && !hasHydratedRef.current && typeof window !== 'undefined') {
      const savedReceipts = storage.getReceipts();
      if (savedReceipts.length > 0) {
        receiptDb.set(savedReceipts);
      }
      hasHydratedRef.current = true;
    }

    if (!useSupabase || !supabaseClient) {
      const update = () => setReceipts(receiptDb.getAll());
      update();
      return subscribeToReceipts(update);
    }

    let active = true;

    const fetchReceipts = async () => {
      try {
        const restaurantId = await getSupabaseRestaurantId();
        const { data: rows, error } = await supabaseClient
          .from('receipts')
          .select('*')
          .eq('restaurant_id', restaurantId)
          .order('uploaded_at', { ascending: false });

        if (error) {
          throw error;
        }

        if (active) {
          setReceipts((rows ?? []).map(mapReceiptRow));
        }
      } catch (error) {
        console.error('[useReceipts] Supabase error', error);
        if (active) {
          setReceipts(receiptDb.getAll());
        }
      } finally {
        if (active) {
          setIsLoading(false);
        }
      }
    };

    fetchReceipts();

    const handleRefresh = () => {
      fetchReceipts();
    };

    window.addEventListener('costpilot-receipts-refresh', handleRefresh);

    return () => {
      active = false;
      window.removeEventListener('costpilot-receipts-refresh', handleRefresh);
    };
  }, []);

  return {
    data: receipts,
    isLoading,
    error: null,
  };
}

export function useAddReceipts() {
  ensureDbInitialized();
  return useCallback(async (receipts: Receipt[]) => {
    if (!useSupabase || !supabaseClient) {
      receiptDb.addMany(receipts);
      return;
    }

    const restaurantId = await getSupabaseRestaurantId();
    await supabaseClient.from('receipts').insert(
      receipts.map((receipt) => ({
        restaurant_id: restaurantId,
        file_name: receipt.fileName,
        file_url: receipt.fileUrl ?? null,
        uploaded_at: receipt.uploadedAt?.toISOString?.() ?? new Date().toISOString(),
        receipt_date: receipt.receiptDate?.toISOString?.() ?? null,
        week_start: receipt.weekStart?.toISOString?.() ?? new Date().toISOString(),
        items: receipt.items ?? [],
      }))
    );

    if (typeof window !== 'undefined') {
      window.dispatchEvent(new Event('costpilot-receipts-refresh'));
    }
  }, []);
}

export function useSetupComplete() {
  const [setupComplete, setSetupComplete] = useState(false);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    setSetupComplete(storage.getSetupComplete());
    const handleUpdate = () => setSetupComplete(storage.getSetupComplete());
    window.addEventListener('costpilot-setup-complete', handleUpdate);
    return () => window.removeEventListener('costpilot-setup-complete', handleUpdate);
  }, []);

  return setupComplete;
}

export function useSetSetupComplete() {
  return useCallback((value: boolean) => {
    if (typeof window === 'undefined') return;
    storage.setSetupComplete(value);
    window.dispatchEvent(new Event('costpilot-setup-complete'));
  }, []);
}

export function useAlerts(filters?: { type?: string; severity?: string; status?: string }) {
  ensureDbInitialized();
  const [data, setData] = useState<Alert[]>(() =>
    useSupabase ? [] : alertDb.getAll()
  );
  const [isLoading, setIsLoading] = useState(useSupabase);

  useEffect(() => {
    if (!useSupabase || !supabaseClient) return;
    let active = true;

    (async () => {
      try {
        const restaurantId = await getSupabaseRestaurantId();
        const { data: rows, error } = await supabaseClient
          .from('alerts')
          .select('*')
          .eq('restaurant_id', restaurantId)
          .order('date', { ascending: false });

        if (error) {
          throw error;
        }

        if (active) {
          setData((rows ?? []).map(mapAlertRow));
        }
      } catch (error) {
        console.error('[useAlerts] Supabase error', error);
        if (active) {
          setData(alertDb.getAll());
        }
      } finally {
        if (active) {
          setIsLoading(false);
        }
      }
    })();

    return () => {
      active = false;
    };
  }, []);

  const filtered = useMemo(() => {
    let next = data;
    if (filters?.type) {
      next = next.filter((alert) => alert.type === filters.type);
    }
    if (filters?.severity) {
      next = next.filter((alert) => alert.severity === filters.severity);
    }
    if (filters?.status) {
      next = next.filter((alert) => alert.status === filters.status);
    }
    return next;
  }, [data, filters?.type, filters?.severity, filters?.status]);

  return {
    data: filtered,
    isLoading,
    error: null,
  };
}

export function useAnalyticsData(dateRange?: { start: Date; end: Date }, groupBy?: string) {
  ensureDbInitialized();
  const [data, setData] = useState<AnalyticsDataPoint[]>(() =>
    useSupabase ? [] : analyticsDb.getAll()
  );
  const [isLoading, setIsLoading] = useState(useSupabase);

  useEffect(() => {
    if (!useSupabase || !supabaseClient) return;
    let active = true;

    (async () => {
      try {
        const restaurantId = await getSupabaseRestaurantId();
        const { data: rows, error } = await supabaseClient
          .from('analytics_data')
          .select('payload, created_at')
          .eq('restaurant_id', restaurantId)
          .order('created_at', { ascending: false })
          .limit(1);

        if (error) {
          throw error;
        }

        if (rows && rows.length > 0) {
          if (active) {
            setData(rows[0].payload ?? mockAnalyticsData);
          }
        } else {
          await supabaseClient.from('analytics_data').insert({
            restaurant_id: restaurantId,
            payload: mockAnalyticsData,
          });
          if (active) {
            setData(mockAnalyticsData);
          }
        }
      } catch (error) {
        console.error('[useAnalyticsData] Supabase error', error);
        if (active) {
          setData(analyticsDb.getAll());
        }
      } finally {
        if (active) {
          setIsLoading(false);
        }
      }
    })();

    return () => {
      active = false;
    };
  }, []);

  return {
    data,
    isLoading,
    error: null,
  };
}

export function useDishesOverTarget() {
  ensureDbInitialized();
  const [data, setData] = useState<any[]>(() =>
    useSupabase ? [] : dishesDb.getAll()
  );
  const [isLoading, setIsLoading] = useState(useSupabase);

  useEffect(() => {
    if (!useSupabase || !supabaseClient) return;
    let active = true;

    (async () => {
      try {
        const restaurantId = await getSupabaseRestaurantId();
        const { data: rows, error } = await supabaseClient
          .from('dishes_over_target')
          .select('payload, created_at')
          .eq('restaurant_id', restaurantId)
          .order('created_at', { ascending: false })
          .limit(1);

        if (error) {
          throw error;
        }

        if (rows && rows.length > 0) {
          if (active) {
            setData(rows[0].payload ?? mockDishesOverTarget);
          }
        } else {
          await supabaseClient.from('dishes_over_target').insert({
            restaurant_id: restaurantId,
            payload: mockDishesOverTarget,
          });
          if (active) {
            setData(mockDishesOverTarget);
          }
        }
      } catch (error) {
        console.error('[useDishesOverTarget] Supabase error', error);
        if (active) {
          setData(dishesDb.getAll());
        }
      } finally {
        if (active) {
          setIsLoading(false);
        }
      }
    })();

    return () => {
      active = false;
    };
  }, []);

  return {
    data,
    isLoading,
    error: null,
  };
}

// Data mutation hooks - for saving/updating data
export function useSaveRestaurant() {
  ensureDbInitialized();
  return useCallback(async (restaurant: Restaurant) => {
    if (!useSupabase || !supabaseClient) {
      restaurantDb.set(restaurant);
      console.log('[useSaveRestaurant] Restaurant saved:', restaurant);
      return;
    }

    const restaurantId = await getSupabaseRestaurantId();
    await supabaseClient
      .from('restaurants')
      .update({
        name: restaurant.name,
        seating_capacity: restaurant.seatingCapacity,
        region: restaurant.region,
        city: restaurant.city,
        cuisine: restaurant.cuisine,
        target_food_cost_percentage: restaurant.targetFoodCostPercentage,
        target_food_cost_range: restaurant.targetFoodCostRange,
        category_targets: restaurant.categoryTargets,
        default_currency: restaurant.defaultCurrency,
        timezone: restaurant.timezone,
        pos_provider: restaurant.posProvider ?? null,
        updated_at: new Date().toISOString(),
      })
      .eq('id', restaurantId);
  }, []);
}

export function useSavePurchase() {
  ensureDbInitialized();
  return useCallback(async (purchase: Purchase) => {
    if (!useSupabase || !supabaseClient) {
      purchaseDb.add(purchase);
      return;
    }

    const restaurantId = await getSupabaseRestaurantId();
    await supabaseClient.from('purchases').insert({
      restaurant_id: restaurantId,
      date: purchase.date?.toISOString?.() ?? new Date().toISOString(),
      ingredient_id: isUuid(purchase.ingredientId) ? purchase.ingredientId : null,
      ingredient_name: purchase.ingredientName,
      quantity: purchase.quantity,
      unit: purchase.unit,
      total_price: purchase.totalPrice,
      unit_price: purchase.unitPrice,
      supplier_id: purchase.supplierId,
      supplier: purchase.supplier,
      type: purchase.type,
    });

    if (typeof window !== 'undefined') {
      window.dispatchEvent(new Event('costpilot-purchases-refresh'));
    }
  }, []);
}

export function useSaveRecipe() {
  ensureDbInitialized();
  return useCallback(async (recipe: Recipe) => {
    if (useDjango) {
      const restaurantId = await getDjangoRestaurantId();
      await djangoRequest('/api/v1/recipes/', {
        method: 'POST',
        body: JSON.stringify({
          restaurant: Number(restaurantId),
          dish: Number(recipe.posItemId),
          total_plate_cost: recipe.totalPlateCost,
          food_cost_percentage: recipe.foodCostPercentage,
          items: recipe.ingredients.map((item) => ({
            ingredient: Number(item.ingredientId),
            quantity_per_portion: item.quantityPerPortion,
            cost_per_unit: item.costPerUnit,
            cost_per_portion: item.costPerPortion,
          })),
        }),
      });

      if (typeof window !== 'undefined') {
        window.dispatchEvent(new Event('costpilot-recipes-refresh'));
      }
      return;
    }

    if (!useSupabase || !supabaseClient) {
      recipeDb.add(recipe);
      return;
    }

    const restaurantId = await getSupabaseRestaurantId();
    await supabaseClient.from('recipes').insert({
      restaurant_id: restaurantId,
      pos_item_id: isUuid(recipe.posItemId) ? recipe.posItemId : null,
      pos_item_name: recipe.posItemName,
      selling_price: recipe.sellingPrice,
      ingredients: recipe.ingredients,
      total_plate_cost: recipe.totalPlateCost,
      food_cost_percentage: recipe.foodCostPercentage,
    });

    if (typeof window !== 'undefined') {
      window.dispatchEvent(new Event('costpilot-recipes-refresh'));
    }
  }, []);
}

export function useUpdateRecipe() {
  ensureDbInitialized();
  return useCallback(async (id: string, recipe: Partial<Recipe>) => {
    if (useDjango) {
      await djangoRequest(`/api/v1/recipes/${id}/`, {
        method: 'PATCH',
        body: JSON.stringify({
          dish: recipe.posItemId ? Number(recipe.posItemId) : undefined,
          total_plate_cost: recipe.totalPlateCost,
          food_cost_percentage: recipe.foodCostPercentage,
          items: recipe.ingredients
            ? recipe.ingredients.map((item) => ({
                ingredient: Number(item.ingredientId),
                quantity_per_portion: item.quantityPerPortion,
                cost_per_unit: item.costPerUnit,
                cost_per_portion: item.costPerPortion,
              }))
            : undefined,
        }),
      });

      if (typeof window !== 'undefined') {
        window.dispatchEvent(new Event('costpilot-recipes-refresh'));
      }
      return;
    }

    if (!useSupabase || !supabaseClient) {
      recipeDb.update(id, recipe);
      return;
    }

    await supabaseClient
      .from('recipes')
      .update({
        pos_item_id: recipe.posItemId && isUuid(recipe.posItemId) ? recipe.posItemId : undefined,
        pos_item_name: recipe.posItemName,
        selling_price: recipe.sellingPrice,
        ingredients: recipe.ingredients,
        total_plate_cost: recipe.totalPlateCost,
        food_cost_percentage: recipe.foodCostPercentage,
        updated_at: new Date().toISOString(),
      })
      .eq('id', id);

    if (typeof window !== 'undefined') {
      window.dispatchEvent(new Event('costpilot-recipes-refresh'));
    }
  }, []);
}

export function useSavePosItem() {
  ensureDbInitialized();
  return useCallback(async (posItem: PosItem) => {
    if (useDjango) {
      const restaurantId = await getDjangoRestaurantId();
      await djangoRequest('/api/v1/dishes/', {
        method: 'POST',
        body: JSON.stringify({
          restaurant: Number(restaurantId),
          name: posItem.name,
          category: posItem.category ?? 'Mains',
          selling_price: posItem.sellingPrice,
          has_recipe: posItem.hasRecipe,
        }),
      });

      if (typeof window !== 'undefined') {
        window.dispatchEvent(new Event('costpilot-positems-refresh'));
      }
      return;
    }

    if (!useSupabase || !supabaseClient) {
      posItemDb.add(posItem);
      return;
    }

    const restaurantId = await getSupabaseRestaurantId();
    await supabaseClient.from('pos_items').insert({
      restaurant_id: restaurantId,
      name: posItem.name,
      category: posItem.category ?? null,
      selling_price: posItem.sellingPrice,
      has_recipe: posItem.hasRecipe,
    });

    if (typeof window !== 'undefined') {
      window.dispatchEvent(new Event('costpilot-positems-refresh'));
    }
  }, []);
}

export function useUpdatePosItem() {
  ensureDbInitialized();
  return useCallback(async (id: string, posItem: Partial<PosItem>) => {
    if (useDjango) {
      await djangoRequest(`/api/v1/dishes/${id}/`, {
        method: 'PATCH',
        body: JSON.stringify({
          name: posItem.name,
          category: posItem.category,
          selling_price: posItem.sellingPrice,
          has_recipe: posItem.hasRecipe,
        }),
      });

      if (typeof window !== 'undefined') {
        window.dispatchEvent(new Event('costpilot-positems-refresh'));
      }
      return;
    }

    if (!useSupabase || !supabaseClient) {
      posItemDb.update(id, posItem);
      return;
    }

    await supabaseClient
      .from('pos_items')
      .update({
        name: posItem.name,
        category: posItem.category,
        selling_price: posItem.sellingPrice,
        has_recipe: posItem.hasRecipe,
        updated_at: new Date().toISOString(),
      })
      .eq('id', id);

    if (typeof window !== 'undefined') {
      window.dispatchEvent(new Event('costpilot-positems-refresh'));
    }
  }, []);
}

export function useSaveIngredient() {
  ensureDbInitialized();
  return useCallback(async (ingredient: Ingredient) => {
    if (useDjango) {
      const restaurantId = await getDjangoRestaurantId();
      await djangoRequest('/api/v1/ingredients/', {
        method: 'POST',
        body: JSON.stringify({
          restaurant: Number(restaurantId),
          name: ingredient.name,
          category: ingredient.category,
          unit: ingredient.unit,
          last_purchase_price: ingredient.lastPurchasePrice,
          benchmark_price: ingredient.benchmarkPrice,
          current_stock: ingredient.currentStock,
        }),
      });

      if (typeof window !== 'undefined') {
        window.dispatchEvent(new Event('costpilot-ingredients-refresh'));
      }
      return;
    }

    if (!useSupabase || !supabaseClient) {
      ingredientDb.add(ingredient);
      return;
    }

    const restaurantId = await getSupabaseRestaurantId();
    const { error } = await supabaseClient.from('ingredients').insert({
      restaurant_id: restaurantId,
      name: ingredient.name,
      category: ingredient.category,
      unit: ingredient.unit,
      last_purchase_price: ingredient.lastPurchasePrice,
      benchmark_price: ingredient.benchmarkPrice,
      last_purchased_date: ingredient.lastPurchasedDate?.toISOString?.() ?? null,
      price_trend: ingredient.priceTrend,
      current_stock: ingredient.currentStock,
    });

    if (error) {
      throw new Error(error.message);
    }

    if (typeof window !== 'undefined') {
      window.dispatchEvent(new Event('costpilot-ingredients-refresh'));
    }
  }, []);
}
