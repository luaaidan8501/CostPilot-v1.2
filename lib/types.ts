// Core type definitions for CostPilot
export interface Ingredient {
  id: string;
  name: string;
  category: 'Meat' | 'Veg' | 'Dairy' | 'Dry Goods' | 'Beverages' | 'Others';
  unit: 'kg' | 'g' | 'L' | 'mL' | 'pc';
  lastPurchasePrice: number;
  benchmarkPrice: number;
  lastPurchasedDate: Date;
  priceTrend: number[]; // 30-day trend
}

export interface Supplier {
  id: string;
  name: string;
  region: string;
}

export interface Purchase {
  id: string;
  date: Date;
  ingredientId: string;
  ingredientName: string;
  quantity: number;
  unit: string;
  totalPrice: number;
  unitPrice: number;
  supplierId: string;
  supplier: string;
  type: 'Regular' | 'Emergency';
}

export interface RecipeIngredient {
  ingredientId: string;
  ingredientName: string;
  quantityPerPortion: number;
  unit: string;
  unitCost: number;
  costPerPortion: number;
}

export interface Recipe {
  id: string;
  posItemId: string;
  posItemName: string;
  sellingPrice: number;
  ingredients: RecipeIngredient[];
  totalPlateCost: number;
  foodCostPercentage: number;
}

export interface PosItem {
  id: string;
  name: string;
  category: string;
  sellingPrice: number;
  hasRecipe: boolean;
}

export interface DashboardKPI {
  currentFoodCostPercentage: number;
  targetRange: { min: number; max: number };
  projectedFoodCostPercentage: number;
  projectedChange: number;
  topCostDrivers: { ingredient: string; percentage: number }[];
  potentialSavings: number;
}

export interface Alert {
  id: string;
  title: string;
  description: string;
  type: 'ingredient' | 'dish' | 'supplier';
  severity: 'info' | 'warning' | 'critical';
  date: Date;
  status: 'open' | 'snoozed' | 'resolved';
  relatedId?: string;
}

export interface Restaurant {
  id: string;
  name: string;
  seatingCapacity: number;
  region: string;
  city: string;
  cuisine: string;
  targetFoodCostPercentage: number;
  targetFoodCostRange: { min: number; max: number };
  categoryTargets: Record<string, number>;
  defaultCurrency: string;
  timezone: string;
}

export interface AnalyticsDataPoint {
  date: string;
  foodCostPercentage: number;
  category?: string;
  dishName?: string;
  variance?: number;
}
