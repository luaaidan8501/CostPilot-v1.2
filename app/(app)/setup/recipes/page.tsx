'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { usePosItems, useRecipes, useSaveRecipe, useUpdateRecipe } from '@/lib/hooks';
import { PlusIcon, TrashIcon, ChevronRightIcon } from '@/components/icons';
import type { Recipe, RecipeIngredient } from '@/lib/types';

export default function RecipesSetupPage() {
  const router = useRouter();
  const { data: posItems } = usePosItems();
  const { data: recipes } = useRecipes();
  const saveRecipe = useSaveRecipe();
  const updateRecipe = useUpdateRecipe();

  const [selectedItemId, setSelectedItemId] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    sellingPrice: '',
    ingredients: [] as RecipeIngredient[],
    newIngredient: {
      ingredientName: '',
      quantityPerPortion: '',
      unit: 'kg',
      totalCost: '', // Total cost for the entire quantity
    },
  });

  const selectedItem = posItems.find(p => p.id === selectedItemId);
  const existingRecipe = selectedItemId ? recipes.find(r => r.posItemId === selectedItemId) : null;

  const handleSelectItem = (itemId: string) => {
    setSelectedItemId(itemId);
    const recipe = recipes.find(r => r.posItemId === itemId);
    
    if (recipe) {
      setFormData({
        sellingPrice: recipe.sellingPrice.toString(),
        ingredients: recipe.ingredients,
        newIngredient: {
          ingredientName: '',
          quantityPerPortion: '',
          unit: 'kg',
          totalCost: '',
        },
      });
    } else {
      setFormData({
        sellingPrice: selectedItem?.sellingPrice.toString() || '',
        ingredients: [],
        newIngredient: {
          ingredientName: '',
          quantityPerPortion: '',
          unit: 'kg',
          totalCost: '',
        },
      });
    }
  };

  const handleAddIngredient = () => {
    const { ingredientName, quantityPerPortion, unit, totalCost } = formData.newIngredient;
    if (!ingredientName || !quantityPerPortion || !totalCost) {
      alert('Please fill in all ingredient fields');
      return;
    }

    const qty = parseFloat(quantityPerPortion);
    const cost = parseFloat(totalCost);
    const costPerUnit = cost / qty; // e.g., 30 pesos / 200g = 0.15 pesos/g

    const newIngredient: RecipeIngredient = {
      ingredientId: `ingredient-${Date.now()}`,
      ingredientName,
      quantityPerPortion: qty,
      unit,
      totalCost: cost,
      costPerUnit,
      costPerPortion: cost,
    };

    setFormData({
      ...formData,
      ingredients: [...formData.ingredients, newIngredient],
      newIngredient: {
        ingredientName: '',
        quantityPerPortion: '',
        unit: 'kg',
        totalCost: '',
      },
    });
  };

  const handleRemoveIngredient = (index: number) => {
    setFormData({
      ...formData,
      ingredients: formData.ingredients.filter((_, i) => i !== index),
    });
  };

  const handleSaveRecipe = () => {
    if (!selectedItemId || !formData.sellingPrice || formData.ingredients.length === 0) {
      alert('Please fill in all fields and add at least one ingredient');
      return;
    }

    const totalPlateCost = formData.ingredients.reduce((sum, ing) => sum + ing.costPerPortion, 0);
    const foodCostPercentage = totalPlateCost > 0
      ? Math.round((totalPlateCost / parseFloat(formData.sellingPrice)) * 100)
      : 0;

    const recipe: Recipe = {
      id: existingRecipe?.id || `recipe_${Date.now()}`,
      posItemId: selectedItemId,
      posItemName: selectedItem?.name || '',
      sellingPrice: parseFloat(formData.sellingPrice),
      ingredients: formData.ingredients,
      totalPlateCost,
      foodCostPercentage,
    };

    if (existingRecipe) {
      updateRecipe(existingRecipe.id, recipe);
    } else {
      saveRecipe(recipe);
    }

    alert('Recipe saved!');
      setFormData({
        sellingPrice: '',
        ingredients: [],
        newIngredient: {
          ingredientName: '',
          quantityPerPortion: '',
          unit: 'kg',
          totalCost: '',
        },
      });
    setSelectedItemId(null);
  };  const unmappedItems = posItems.filter(item => !recipes.find(r => r.posItemId === item.id));
  const mappedCount = recipes.filter(r => posItems.find(p => p.id === r.posItemId)).length;

  return (
    <div className="p-6 space-y-6 max-w-5xl mx-auto">
      <div className="text-center md:text-left">
        <h1 className="text-3xl font-bold text-slate-900">Set Up Your Recipes</h1>
        <p className="text-slate-600 mt-1">Add ingredients and costs for each menu item. This is where the magic happens!</p>
      </div>

      {/* Progress */}
      <div className="bg-teal-50 border border-teal-200 rounded-lg p-4">
        <p className="text-sm font-medium text-teal-900">
          {mappedCount} of {posItems.length} menu items have recipes
        </p>
        <div className="w-full bg-teal-200 rounded-full h-2 mt-2">
          <div 
            className="bg-teal-600 h-2 rounded-full transition-all"
            style={{ width: `${(mappedCount / posItems.length) * 100}%` }}
          />
        </div>
      </div>

      {unmappedItems.length === 0 ? (
        // All recipes done
        <Card>
          <CardContent className="text-center py-12">
            <div className="text-4xl mb-4">🎉</div>
            <h2 className="text-2xl font-bold text-slate-900 mb-2">All set!</h2>
            <p className="text-slate-600 mb-6">You've set up recipes for all menu items.</p>
            <Button 
              onClick={() => router.push('/setup/complete')}
              className="bg-teal-600 hover:bg-teal-700"
            >
              Continue <ChevronRightIcon className="w-4 h-4 ml-2" />
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Unmapped Items List */}
          <Card className="lg:col-span-1">
            <CardHeader className="pb-3">
              <CardTitle className="text-lg">Menu Items</CardTitle>
              <CardDescription className="text-xs">Select to add recipe</CardDescription>
            </CardHeader>
            <CardContent className="space-y-2">
              {unmappedItems.map((item) => (
                <button
                  key={item.id}
                  onClick={() => handleSelectItem(item.id)}
                  className={`w-full p-3 rounded-lg text-left text-sm transition-colors ${
                    selectedItemId === item.id
                      ? 'bg-teal-100 border border-teal-300'
                      : 'bg-slate-100 hover:bg-slate-200 border border-slate-200'
                  }`}
                >
                  <p className="font-medium">{item.name}</p>
                  <p className="text-xs text-slate-600">₱{item.sellingPrice}</p>
                </button>
              ))}
            </CardContent>
          </Card>

          {/* Recipe Editor */}
          <Card className="lg:col-span-3">
            {selectedItemId && selectedItem ? (
              <>
                <CardHeader className="pb-3">
                  <CardTitle className="text-lg">{selectedItem.name}</CardTitle>
                  <CardDescription className="text-xs">Create recipe & breakdown</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  {/* Price Summary */}
                  <div className="grid grid-cols-3 gap-2">
                    <div className="bg-slate-50 p-3 rounded text-center">
                      <p className="text-xs text-slate-600">Menu Price</p>
                      <p className="font-bold text-slate-900">₱{formData.sellingPrice || '0'}</p>
                    </div>
                    <div className="bg-slate-50 p-3 rounded text-center">
                      <p className="text-xs text-slate-600">Cost</p>
                      <p className="font-bold">
                        ₱{formData.ingredients.reduce((s, i) => s + i.costPerPortion, 0).toFixed(2)}
                      </p>
                    </div>
                    <div className={`p-3 rounded text-center ${
                      formData.ingredients.reduce((s, i) => s + i.costPerPortion, 0) > 0 &&
                      parseFloat(formData.sellingPrice || '0') > 0
                        ? (((formData.ingredients.reduce((s, i) => s + i.costPerPortion, 0) / parseFloat(formData.sellingPrice)) * 100) <= 30
                            ? 'bg-teal-50'
                            : 'bg-amber-50')
                        : 'bg-slate-50'
                    }`}>
                      <p className="text-xs text-slate-600">%</p>
                      <p className="font-bold">
                        {formData.ingredients.reduce((s, i) => s + i.costPerPortion, 0) > 0 &&
                        parseFloat(formData.sellingPrice || '0') > 0
                          ? Math.round((formData.ingredients.reduce((s, i) => s + i.costPerPortion, 0) / parseFloat(formData.sellingPrice)) * 100)
                          : 0}%
                      </p>
                    </div>
                  </div>

                  {/* Ingredients */}
                  {formData.ingredients.length > 0 && (
                    <div className="space-y-2">
                      <p className="text-sm font-medium">Ingredients</p>
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead className="text-xs">Name</TableHead>
                            <TableHead className="text-right text-xs">Qty</TableHead>
                            <TableHead className="text-right text-xs">Cost/Unit</TableHead>
                            <TableHead className="text-right text-xs">Total Cost</TableHead>
                            <TableHead className="w-8"></TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {formData.ingredients.map((ing, idx) => (
                            <TableRow key={idx}>
                              <TableCell className="text-sm font-medium">{ing.ingredientName}</TableCell>
                              <TableCell className="text-right text-sm">{ing.quantityPerPortion} {ing.unit}</TableCell>
                              <TableCell className="text-right text-sm">₱{ing.costPerUnit.toFixed(2)}/{ing.unit}</TableCell>
                              <TableCell className="text-right text-sm">₱{ing.costPerPortion.toFixed(2)}</TableCell>
                              <TableCell>
                                <button onClick={() => handleRemoveIngredient(idx)} className="text-red-600 hover:text-red-700">
                                  <TrashIcon className="w-4 h-4" />
                                </button>
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </div>
                  )}

                  {/* Add Ingredient */}
                  <div className="bg-slate-50 p-3 rounded space-y-2">
                    <p className="text-sm font-medium">Add Ingredient</p>
                    <div className="grid grid-cols-4 gap-2">
                      <Input
                        placeholder="Name"
                        className="h-8 text-xs"
                        value={formData.newIngredient.ingredientName}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            newIngredient: { ...formData.newIngredient, ingredientName: e.target.value },
                          })
                        }
                      />
                      <Input
                        placeholder="Qty"
                        type="number"
                        step="0.01"
                        className="h-8 text-xs"
                        value={formData.newIngredient.quantityPerPortion}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            newIngredient: { ...formData.newIngredient, quantityPerPortion: e.target.value },
                          })
                        }
                      />
                      <select
                        value={formData.newIngredient.unit}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            newIngredient: { ...formData.newIngredient, unit: e.target.value },
                          })
                        }
                        className="border border-slate-300 rounded text-xs h-8"
                      >
                        <option value="kg">kg</option>
                        <option value="g">g</option>
                        <option value="L">L</option>
                        <option value="mL">mL</option>
                        <option value="pc">pc</option>
                      </select>
                      <Input
                        placeholder="Total Cost"
                        type="number"
                        step="0.01"
                        className="h-8 text-xs"
                        value={formData.newIngredient.totalCost}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            newIngredient: { ...formData.newIngredient, totalCost: e.target.value },
                          })
                        }
                      />
                    </div>
                    <Button onClick={handleAddIngredient} variant="outline" className="w-full h-8 text-xs">
                      <PlusIcon className="w-3 h-3 mr-1" />
                      Add
                    </Button>
                  </div>

                  {/* Save */}
                  <Button onClick={handleSaveRecipe} className="w-full bg-teal-600 hover:bg-teal-700 h-9">
                    Save Recipe
                  </Button>
                </CardContent>
              </>
            ) : (
              <CardContent className="text-center py-12">
                <p className="text-slate-600">Select a menu item to create a recipe</p>
              </CardContent>
            )}
          </Card>
        </div>
      )}

      {/* Navigation */}
      <div className="flex gap-3 justify-center">
        <Button variant="outline" onClick={() => router.back()} className="h-10">
          Back
        </Button>
        {unmappedItems.length > 0 && (
          <Button 
            onClick={() => router.push('/setup/complete')}
            className="bg-slate-600 hover:bg-slate-700 h-10"
          >
            Skip & Continue →
          </Button>
        )}
      </div>
    </div>
  );
}
