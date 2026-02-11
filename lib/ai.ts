import type { Ingredient } from './types';

interface IngredientSuggestion {
  name: string;
  reason: string;
}

const knownSubstitutes: Record<string, IngredientSuggestion[]> = {
  'Chicken Thigh': [
    { name: 'Chicken Breast', reason: 'Often priced lower per kg; adjust cook time for leaner meat.' },
    { name: 'Pork Belly', reason: 'Comparable richness; check portion cost impact.' },
  ],
  'Pork Belly': [
    { name: 'Pork Shoulder', reason: 'Cheaper cut with good yield for braised dishes.' },
    { name: 'Chicken Thigh', reason: 'Lower cost protein with similar cooking methods.' },
  ],
  'Tomato': [
    { name: 'Canned Tomato', reason: 'Stable pricing and longer shelf life.' },
  ],
  'Cooking Oil': [
    { name: 'Canola Oil', reason: 'Often lower price with neutral flavor.' },
    { name: 'Palm Oil', reason: 'Commonly cheaper; check flavor and sourcing.' },
  ],
};

export function suggestIngredientAlternatives(
  ingredient: Ingredient | undefined,
  allIngredients: Ingredient[]
): IngredientSuggestion[] {
  if (!ingredient) return [];

  const curated = knownSubstitutes[ingredient.name];
  if (curated && curated.length > 0) return curated;

  const sameCategory = allIngredients
    .filter((item) => item.category === ingredient.category && item.id !== ingredient.id)
    .sort((a, b) => a.benchmarkPrice - b.benchmarkPrice)
    .slice(0, 3)
    .map((item) => ({
      name: item.name,
      reason: `Benchmark price is lower (₱${item.benchmarkPrice}).`,
    }));

  return sameCategory;
}
