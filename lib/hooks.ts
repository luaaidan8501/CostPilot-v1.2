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

// Mock hooks simulating API calls with TanStack Query structure
// Now backed by in-memory database that persists during session

export function useDashboardSummary(dateRange?: { start: Date; end: Date }) {
  ensureDbInitialized();
  const [isLoading] = useState(false);
  return {
    data: dashboardDb.get() ?? mockDashboardKPI,
    isLoading,
    error: null,
  };
}

export function useRestaurant() {
  ensureDbInitialized();
  const [isLoading] = useState(false);
  return {
    data: restaurantDb.get(),
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
  const [isLoading] = useState(false);
  
  let filtered = ingredientDb.getAll();
  
  if (filters?.search) {
    filtered = filtered.filter(i =>
      i.name.toLowerCase().includes(filters.search!.toLowerCase())
    );
  }
  if (filters?.category) {
    filtered = filtered.filter(i => i.category === filters.category);
  }

  return {
    data: filtered,
    isLoading,
    error: null,
  };
}

export function useIngredientDetails(ingredientId: string) {
  ensureDbInitialized();
  const [isLoading] = useState(false);
  const ingredient = ingredientDb.getById(ingredientId);
  return {
    data: ingredient,
    isLoading,
    error: null,
  };
}

export function usePurchases(dateRange?: { start: Date; end: Date }) {
  ensureDbInitialized();
  const [isLoading] = useState(false);
  return {
    data: purchaseDb.getAll(),
    isLoading,
    error: null,
  };
}

export function useRecipes() {
  ensureDbInitialized();
  const [isLoading] = useState(false);
  return {
    data: recipeDb.getAll(),
    isLoading,
    error: null,
  };
}

export function useRecipeByPosItem(posItemId: string) {
  ensureDbInitialized();
  const [isLoading] = useState(false);
  const recipe = recipeDb.getByPosItemId(posItemId);
  return {
    data: recipe,
    isLoading,
    error: null,
  };
}

export function usePosItems(filters?: { hasRecipe?: boolean }) {
  ensureDbInitialized();
  const [isLoading] = useState(false);
  let data = posItemDb.getAll();
  if (filters?.hasRecipe !== undefined) {
    data = data.filter(item => item.hasRecipe === filters.hasRecipe);
  }
  return {
    data,
    isLoading,
    error: null,
  };
}

export function useSalesRecords(dateRange?: { start: Date; end: Date }) {
  ensureDbInitialized();
  const [isLoading] = useState(false);
  const [allRecords, setAllRecords] = useState(() => salesDb.getAll());

  useEffect(() => {
    const update = () => setAllRecords(salesDb.getAll());
    update();
    return subscribeToSales(update);
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
  return useCallback((records: SalesRecord[]) => {
    salesDb.set(records);
  }, []);
}

export function useReceipts() {
  ensureDbInitialized();
  const [isLoading] = useState(false);
  const [receipts, setReceipts] = useState(() => receiptDb.getAll());
  const hasHydratedRef = useRef(false);

  useEffect(() => {
    if (!hasHydratedRef.current && typeof window !== 'undefined') {
      const savedReceipts = storage.getReceipts();
      if (savedReceipts.length > 0) {
        receiptDb.set(savedReceipts);
      }
      hasHydratedRef.current = true;
    }
    const update = () => setReceipts(receiptDb.getAll());
    update();
    return subscribeToReceipts(update);
  }, []);

  return {
    data: receipts,
    isLoading,
    error: null,
  };
}

export function useAddReceipts() {
  ensureDbInitialized();
  return useCallback((receipts: Receipt[]) => {
    receiptDb.addMany(receipts);
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
  const [isLoading] = useState(false);
  let filtered = alertDb.getAll();
  if (filters?.type) {
    filtered = filtered.filter(a => a.type === filters.type);
  }
  if (filters?.severity) {
    filtered = filtered.filter(a => a.severity === filters.severity);
  }
  if (filters?.status) {
    filtered = filtered.filter(a => a.status === filters.status);
  }
  return {
    data: filtered,
    isLoading,
    error: null,
  };
}

export function useAnalyticsData(dateRange?: { start: Date; end: Date }, groupBy?: string) {
  ensureDbInitialized();
  const [isLoading] = useState(false);
  return {
    data: analyticsDb.getAll(),
    isLoading,
    error: null,
  };
}

export function useDishesOverTarget() {
  ensureDbInitialized();
  const [isLoading] = useState(false);
  return {
    data: dishesDb.getAll(),
    isLoading,
    error: null,
  };
}

// Data mutation hooks - for saving/updating data
export function useSaveRestaurant() {
  ensureDbInitialized();
  return useCallback((restaurant: Restaurant) => {
    restaurantDb.set(restaurant);
    console.log('[useSaveRestaurant] Restaurant saved:', restaurant);
  }, []);
}

export function useSavePurchase() {
  ensureDbInitialized();
  return useCallback((purchase: Purchase) => {
    purchaseDb.add(purchase);
  }, []);
}

export function useSaveRecipe() {
  ensureDbInitialized();
  return useCallback((recipe: Recipe) => {
    recipeDb.add(recipe);
  }, []);
}

export function useUpdateRecipe() {
  ensureDbInitialized();
  return useCallback((id: string, recipe: Partial<Recipe>) => {
    recipeDb.update(id, recipe);
  }, []);
}

export function useSavePosItem() {
  ensureDbInitialized();
  return useCallback((posItem: PosItem) => {
    posItemDb.add(posItem);
  }, []);
}

export function useUpdatePosItem() {
  ensureDbInitialized();
  return useCallback((id: string, posItem: Partial<PosItem>) => {
    posItemDb.update(id, posItem);
  }, []);
}

export function useSaveIngredient() {
  ensureDbInitialized();
  return useCallback((ingredient: Ingredient) => {
    ingredientDb.add(ingredient);
  }, []);
}
