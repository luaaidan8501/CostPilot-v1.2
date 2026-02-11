// In-memory database for testing
// Simulates a real backend - persists data during session
// Will be replaced with Supabase when ready

import type {
  Restaurant,
  Ingredient,
  Purchase,
  Recipe,
  PosItem,
  Alert,
  DashboardKPI,
  AnalyticsDataPoint,
  SalesRecord,
  Receipt,
} from './types';

import { storage } from './storage';

const salesListeners = new Set<() => void>();
const receiptListeners = new Set<() => void>();

function notifySalesListeners() {
  salesListeners.forEach((listener) => listener());
}

function notifyReceiptListeners() {
  receiptListeners.forEach((listener) => listener());
}

interface DatabaseState {
  restaurant: Restaurant | null;
  demoRestaurant?: Restaurant | null;
  seedRestaurant?: Restaurant | null;
  ingredients: Map<string, Ingredient>;
  purchases: Map<string, Purchase>;
  recipes: Map<string, Recipe>;
  posItems: Map<string, PosItem>;
  salesRecords: SalesRecord[];
  receipts: Receipt[];
  alerts: Map<string, Alert>;
  dashboardKPI: DashboardKPI | null;
  analyticsData: AnalyticsDataPoint[];
  dishesOverTarget: any[];
}

// Singleton instance - persists across requests during session
let db: DatabaseState = {
  restaurant: null,
  demoRestaurant: null,
  seedRestaurant: null,
  ingredients: new Map(),
  purchases: new Map(),
  recipes: new Map(),
  posItems: new Map(),
  salesRecords: [],
  receipts: [],
  alerts: new Map(),
  dashboardKPI: null,
  analyticsData: [],
  dishesOverTarget: [],
};

// Initialize with mock data on first load
let initialized = false;

export function initializeDatabase(
  mockIngredients: Ingredient[],
  mockPurchases: Purchase[],
  mockRecipes: Recipe[],
  mockPosItems: PosItem[],
  mockRestaurant: Restaurant,
  mockSalesRecords: SalesRecord[],
  mockAlerts: Alert[],
  mockDashboardKPI: DashboardKPI,
  mockAnalyticsData: AnalyticsDataPoint[],
  mockDishesOverTarget: any[]
) {
  if (initialized) return;

  // Store demo/mock data separately so it does not become the user's active data
  db.demoRestaurant = mockRestaurant;
  (db as any).demoIngredients = mockIngredients;
  (db as any).demoPurchases = mockPurchases;
  (db as any).demoRecipes = mockRecipes;
  (db as any).demoPosItems = mockPosItems;
  (db as any).demoSalesRecords = mockSalesRecords;
  (db as any).demoAlerts = mockAlerts;
  (db as any).demoDashboardKPI = mockDashboardKPI;
  (db as any).demoAnalyticsData = mockAnalyticsData;
  (db as any).demoDishesOverTarget = mockDishesOverTarget;

  // Do NOT populate the active maps with demo data by default.
  // The demo data will be loaded explicitly by calling `loadDemoRestaurant()`.
  initialized = true;
}

export function setSeedData(
  seedIngredients: Ingredient[],
  seedPurchases: Purchase[],
  seedRecipes: Recipe[],
  seedPosItems: PosItem[],
  seedRestaurant: Restaurant,
  seedSalesRecords: SalesRecord[],
  seedAlerts: Alert[],
  seedDashboardKPI: DashboardKPI,
  seedAnalyticsData: AnalyticsDataPoint[],
  seedDishesOverTarget: any[]
) {
  db.seedRestaurant = seedRestaurant;
  (db as any).seedIngredients = seedIngredients;
  (db as any).seedPurchases = seedPurchases;
  (db as any).seedRecipes = seedRecipes;
  (db as any).seedPosItems = seedPosItems;
  (db as any).seedSalesRecords = seedSalesRecords;
  (db as any).seedAlerts = seedAlerts;
  (db as any).seedDashboardKPI = seedDashboardKPI;
  (db as any).seedAnalyticsData = seedAnalyticsData;
  (db as any).seedDishesOverTarget = seedDishesOverTarget;
}

// Load demo restaurant as the active restaurant (for demo mode)
export function loadDemoRestaurant() {
  if (!db.demoRestaurant) return null;
  // Set active restaurant
  db.restaurant = db.demoRestaurant;

  // Populate active collections from demo storage if they're currently empty
  if ((db as any).demoPosItems && db.posItems.size === 0) {
    (db as any).demoPosItems.forEach((item: PosItem) => db.posItems.set(item.id, item));
  }
  if ((db as any).demoRecipes && db.recipes.size === 0) {
    (db as any).demoRecipes.forEach((r: Recipe) => db.recipes.set(r.id, r));
  }
  if ((db as any).demoIngredients && db.ingredients.size === 0) {
    (db as any).demoIngredients.forEach((ing: Ingredient) => db.ingredients.set(ing.id, ing));
  }
  if ((db as any).demoPurchases && db.purchases.size === 0) {
    (db as any).demoPurchases.forEach((p: Purchase) => db.purchases.set(p.id, p));
  }
  if ((db as any).demoAlerts && db.alerts.size === 0) {
    (db as any).demoAlerts.forEach((a: Alert) => db.alerts.set(a.id, a));
  }
  if ((db as any).demoSalesRecords && db.salesRecords.length === 0) {
    db.salesRecords = (db as any).demoSalesRecords;
  }
  if ((db as any).demoDashboardKPI && !db.dashboardKPI) {
    db.dashboardKPI = (db as any).demoDashboardKPI;
  }
  if ((db as any).demoAnalyticsData && db.analyticsData.length === 0) {
    db.analyticsData = (db as any).demoAnalyticsData;
  }
  if ((db as any).demoDishesOverTarget && db.dishesOverTarget.length === 0) {
    db.dishesOverTarget = (db as any).demoDishesOverTarget;
  }

  return db.restaurant;
}

// Load seeded restaurant as the active restaurant (for onboarding-ready demo)
export function loadSeedRestaurant() {
  if (!db.seedRestaurant) return null;
  db.restaurant = db.seedRestaurant;

  if ((db as any).seedPosItems && db.posItems.size === 0) {
    (db as any).seedPosItems.forEach((item: PosItem) => db.posItems.set(item.id, item));
  }
  if ((db as any).seedRecipes && db.recipes.size === 0) {
    (db as any).seedRecipes.forEach((r: Recipe) => db.recipes.set(r.id, r));
  }
  if ((db as any).seedIngredients && db.ingredients.size === 0) {
    (db as any).seedIngredients.forEach((ing: Ingredient) => db.ingredients.set(ing.id, ing));
  }
  if ((db as any).seedPurchases && db.purchases.size === 0) {
    (db as any).seedPurchases.forEach((p: Purchase) => db.purchases.set(p.id, p));
  }
  if ((db as any).seedAlerts && db.alerts.size === 0) {
    (db as any).seedAlerts.forEach((a: Alert) => db.alerts.set(a.id, a));
  }
  if ((db as any).seedSalesRecords && db.salesRecords.length === 0) {
    db.salesRecords = (db as any).seedSalesRecords;
  }
  if ((db as any).seedDashboardKPI && !db.dashboardKPI) {
    db.dashboardKPI = (db as any).seedDashboardKPI;
  }
  if ((db as any).seedAnalyticsData && db.analyticsData.length === 0) {
    db.analyticsData = (db as any).seedAnalyticsData;
  }
  if ((db as any).seedDishesOverTarget && db.dishesOverTarget.length === 0) {
    db.dishesOverTarget = (db as any).seedDishesOverTarget;
  }

  return db.restaurant;
}

// Unload active restaurant (clear selection) and clear active demo data
export function unloadRestaurant() {
  db.restaurant = null;
  db.ingredients = new Map();
  db.purchases = new Map();
  db.recipes = new Map();
  db.posItems = new Map();
  db.alerts = new Map();
  db.dashboardKPI = null;
  db.analyticsData = [];
  db.dishesOverTarget = [];
}

// Restaurant operations
export const restaurantDb = {
  get: () => db.restaurant,
  set: (restaurant: Restaurant) => {
    db.restaurant = restaurant;
  },
};

// Ingredient operations
export const ingredientDb = {
  getAll: () => Array.from(db.ingredients.values()),
  getById: (id: string) => db.ingredients.get(id),
  add: (ingredient: Ingredient) => {
    db.ingredients.set(ingredient.id, ingredient);
    return ingredient;
  },
  update: (id: string, ingredient: Partial<Ingredient>) => {
    const existing = db.ingredients.get(id);
    if (!existing) return null;
    const updated = { ...existing, ...ingredient };
    db.ingredients.set(id, updated);
    return updated;
  },
  delete: (id: string) => {
    return db.ingredients.delete(id);
  },
};

// Purchase operations
export const purchaseDb = {
  getAll: () => Array.from(db.purchases.values()),
  getById: (id: string) => db.purchases.get(id),
  add: (purchase: Purchase) => {
    db.purchases.set(purchase.id, purchase);
    return purchase;
  },
  update: (id: string, purchase: Partial<Purchase>) => {
    const existing = db.purchases.get(id);
    if (!existing) return null;
    const updated = { ...existing, ...purchase };
    db.purchases.set(id, updated);
    return updated;
  },
  delete: (id: string) => {
    return db.purchases.delete(id);
  },
};

// Recipe operations
export const recipeDb = {
  getAll: () => Array.from(db.recipes.values()),
  getById: (id: string) => db.recipes.get(id),
  getByPosItemId: (posItemId: string) => {
    return Array.from(db.recipes.values()).find(r => r.posItemId === posItemId);
  },
  add: (recipe: Recipe) => {
    db.recipes.set(recipe.id, recipe);
    return recipe;
  },
  update: (id: string, recipe: Partial<Recipe>) => {
    const existing = db.recipes.get(id);
    if (!existing) return null;
    const updated = { ...existing, ...recipe };
    db.recipes.set(id, updated);
    return updated;
  },
  delete: (id: string) => {
    return db.recipes.delete(id);
  },
};

// POS Item operations
export const posItemDb = {
  getAll: () => Array.from(db.posItems.values()),
  getById: (id: string) => db.posItems.get(id),
  add: (posItem: PosItem) => {
    db.posItems.set(posItem.id, posItem);
    return posItem;
  },
  update: (id: string, posItem: Partial<PosItem>) => {
    const existing = db.posItems.get(id);
    if (!existing) return null;
    const updated = { ...existing, ...posItem };
    db.posItems.set(id, updated);
    return updated;
  },
  delete: (id: string) => {
    return db.posItems.delete(id);
  },
};

// Sales records
export const salesDb = {
  getAll: () => db.salesRecords,
  set: (records: SalesRecord[]) => {
    db.salesRecords = records;
    notifySalesListeners();
  },
};

// Receipts
export const receiptDb = {
  getAll: () => db.receipts,
  set: (receipts: Receipt[]) => {
    db.receipts = receipts;
    if (typeof window !== 'undefined') {
      storage.saveReceipts(receipts);
    }
    notifyReceiptListeners();
  },
  addMany: (receipts: Receipt[]) => {
    db.receipts = [...db.receipts, ...receipts];
    if (typeof window !== 'undefined') {
      storage.saveReceipts(db.receipts);
    }
    notifyReceiptListeners();
  },
};

export function subscribeToSales(listener: () => void) {
  salesListeners.add(listener);
  return () => salesListeners.delete(listener);
}

export function subscribeToReceipts(listener: () => void) {
  receiptListeners.add(listener);
  return () => receiptListeners.delete(listener);
}

// Alert operations
export const alertDb = {
  getAll: () => Array.from(db.alerts.values()),
  getById: (id: string) => db.alerts.get(id),
  add: (alert: Alert) => {
    db.alerts.set(alert.id, alert);
    return alert;
  },
  update: (id: string, alert: Partial<Alert>) => {
    const existing = db.alerts.get(id);
    if (!existing) return null;
    const updated = { ...existing, ...alert };
    db.alerts.set(id, updated);
    return updated;
  },
  delete: (id: string) => {
    return db.alerts.delete(id);
  },
};

// Analytics data
export const analyticsDb = {
  getAll: () => db.analyticsData,
  set: (data: AnalyticsDataPoint[]) => {
    db.analyticsData = data;
  },
};

// Dishes over target
export const dishesDb = {
  getAll: () => db.dishesOverTarget,
  set: (data: any[]) => {
    db.dishesOverTarget = data;
  },
};

// Dashboard KPI
export const dashboardDb = {
  get: () => db.dashboardKPI,
  set: (kpi: DashboardKPI) => {
    db.dashboardKPI = kpi;
  },
};

// Clear all data (for testing)
export function clearDatabase() {
  db = {
    restaurant: null,
    demoRestaurant: null,
    seedRestaurant: null,
    ingredients: new Map(),
    purchases: new Map(),
    recipes: new Map(),
    posItems: new Map(),
    salesRecords: [],
    receipts: [],
    alerts: new Map(),
    dashboardKPI: null,
    analyticsData: [],
    dishesOverTarget: [],
  };
  initialized = false;
}
