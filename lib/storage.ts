// Local storage helper for persisting user data during testing
// This is temporary - will be replaced with Supabase later

import type {
  Restaurant,
  Ingredient,
  Purchase,
  Recipe,
  PosItem,
  Alert,
  DashboardKPI,
  AnalyticsDataPoint,
} from './types';

const STORAGE_PREFIX = 'costpilot_';

interface StoredData {
  restaurant: Restaurant | null;
  ingredients: Ingredient[];
  purchases: Purchase[];
  recipes: Recipe[];
  posItems: PosItem[];
  alerts: Alert[];
  dashboardKPI: DashboardKPI | null;
  analyticsData: AnalyticsDataPoint[];
  dishesOverTarget: any[];
}

const defaultData: StoredData = {
  restaurant: null,
  ingredients: [],
  purchases: [],
  recipes: [],
  posItems: [],
  alerts: [],
  dashboardKPI: null,
  analyticsData: [],
  dishesOverTarget: [],
};

export const storage = {
  // Get all data for current restaurant
  getAll: (): StoredData => {
    if (typeof window === 'undefined') return defaultData;
    
    try {
      const data = localStorage.getItem(`${STORAGE_PREFIX}data`);
      return data ? JSON.parse(data) : defaultData;
    } catch {
      return defaultData;
    }
  },

  // Save all data
  saveAll: (data: StoredData) => {
    if (typeof window === 'undefined') return;
    
    try {
      localStorage.setItem(`${STORAGE_PREFIX}data`, JSON.stringify(data));
    } catch (e) {
      console.error('Failed to save data:', e);
    }
  },

  // Restaurant
  getRestaurant: (): Restaurant | null => {
    return storage.getAll().restaurant;
  },

  saveRestaurant: (restaurant: Restaurant) => {
    const data = storage.getAll();
    data.restaurant = restaurant;
    storage.saveAll(data);
  },

  // Ingredients
  getIngredients: (): Ingredient[] => {
    return storage.getAll().ingredients;
  },

  saveIngredients: (ingredients: Ingredient[]) => {
    const data = storage.getAll();
    data.ingredients = ingredients;
    storage.saveAll(data);
  },

  addIngredient: (ingredient: Ingredient) => {
    const data = storage.getAll();
    data.ingredients = [...data.ingredients, ingredient];
    storage.saveAll(data);
  },

  // Purchases
  getPurchases: (): Purchase[] => {
    return storage.getAll().purchases;
  },

  savePurchases: (purchases: Purchase[]) => {
    const data = storage.getAll();
    data.purchases = purchases;
    storage.saveAll(data);
  },

  addPurchase: (purchase: Purchase) => {
    const data = storage.getAll();
    data.purchases = [...data.purchases, purchase];
    storage.saveAll(data);
  },

  // Recipes
  getRecipes: (): Recipe[] => {
    return storage.getAll().recipes;
  },

  saveRecipes: (recipes: Recipe[]) => {
    const data = storage.getAll();
    data.recipes = recipes;
    storage.saveAll(data);
  },

  addRecipe: (recipe: Recipe) => {
    const data = storage.getAll();
    data.recipes = [...data.recipes, recipe];
    storage.saveAll(data);
  },

  updateRecipe: (id: string, recipe: Partial<Recipe>) => {
    const data = storage.getAll();
    const index = data.recipes.findIndex((r) => r.id === id);
    if (index !== -1) {
      data.recipes[index] = { ...data.recipes[index], ...recipe };
      storage.saveAll(data);
    }
  },

  // POS Items
  getPosItems: (): PosItem[] => {
    return storage.getAll().posItems;
  },

  savePosItems: (posItems: PosItem[]) => {
    const data = storage.getAll();
    data.posItems = posItems;
    storage.saveAll(data);
  },

  addPosItem: (posItem: PosItem) => {
    const data = storage.getAll();
    data.posItems = [...data.posItems, posItem];
    storage.saveAll(data);
  },

  // Clear all data
  clearAll: () => {
    if (typeof window === 'undefined') return;
    localStorage.removeItem(`${STORAGE_PREFIX}data`);
  },
};
