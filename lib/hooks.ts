'use client';

import { useState, useCallback } from 'react';
import {
  mockRestaurant,
  mockIngredients,
  mockPurchases,
  mockRecipes,
  mockPosItems,
  mockAlerts,
  mockDashboardKPI,
  mockAnalyticsData,
  mockDishesOverTarget,
} from './mock-data';
import type {
  Ingredient,
  Purchase,
  Recipe,
  PosItem,
  Alert,
  DashboardKPI,
  Restaurant,
  AnalyticsDataPoint,
} from './types';

// Mock hooks simulating API calls with TanStack Query structure
export function useDashboardSummary(dateRange?: { start: Date; end: Date }) {
  const [isLoading] = useState(false);
  return {
    data: mockDashboardKPI,
    isLoading,
    error: null,
  };
}

export function useRestaurant() {
  const [isLoading] = useState(false);
  return {
    data: mockRestaurant,
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
  const [isLoading] = useState(false);
  
  let filtered = mockIngredients;
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
  const [isLoading] = useState(false);
  const ingredient = mockIngredients.find(i => i.id === ingredientId);
  return {
    data: ingredient,
    isLoading,
    error: null,
  };
}

export function usePurchases(dateRange?: { start: Date; end: Date }) {
  const [isLoading] = useState(false);
  return {
    data: mockPurchases,
    isLoading,
    error: null,
  };
}

export function useRecipes() {
  const [isLoading] = useState(false);
  return {
    data: mockRecipes,
    isLoading,
    error: null,
  };
}

export function useRecipeByPosItem(posItemId: string) {
  const [isLoading] = useState(false);
  const recipe = mockRecipes.find(r => r.posItemId === posItemId);
  return {
    data: recipe,
    isLoading,
    error: null,
  };
}

export function usePosItems(filters?: { hasRecipe?: boolean }) {
  const [isLoading] = useState(false);
  let data = mockPosItems;
  if (filters?.hasRecipe !== undefined) {
    data = data.filter(item => item.hasRecipe === filters.hasRecipe);
  }
  return {
    data,
    isLoading,
    error: null,
  };
}

export function useAlerts(filters?: { type?: string; severity?: string; status?: string }) {
  const [isLoading] = useState(false);
  let filtered = mockAlerts;
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
  const [isLoading] = useState(false);
  return {
    data: mockAnalyticsData,
    isLoading,
    error: null,
  };
}

export function useDishesOverTarget() {
  const [isLoading] = useState(false);
  return {
    data: mockDishesOverTarget,
    isLoading,
    error: null,
  };
}
