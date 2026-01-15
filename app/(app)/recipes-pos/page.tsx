"use client";

import { useEffect, useRef, useState } from "react";
import {
  usePosItems,
  useRecipeByPosItem,
  useSaveRecipe,
  useUpdateRecipe,
  useUpdatePosItem,
  useIngredients,
  useSaveIngredient,
} from "@/lib/hooks";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { SearchIcon, PlusIcon, TrashIcon } from "@/components/icons";
import type { Recipe, RecipeIngredient, Ingredient } from "@/lib/types";

export default function RecipesPosPage() {
  const [selectedPosItemId, setSelectedPosItemId] = useState<string | null>(
    null
  );
  const [searchTerm, setSearchTerm] = useState("");
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [showAddIngredientDialog, setShowAddIngredientDialog] = useState(false);

  const { data: posItems } = usePosItems();
  const { data: ingredients } = useIngredients();
  const { data: recipe } = useRecipeByPosItem(selectedPosItemId || "");
  const saveRecipe = useSaveRecipe();
  const updateRecipe = useUpdateRecipe();
  const updatePosItem = useUpdatePosItem();
  const saveIngredient = useSaveIngredient();

  // New ingredient form state
  const [newIngredientForm, setNewIngredientForm] = useState({
    name: "",
    category: "Meat" as
      | "Meat"
      | "Veg"
      | "Dairy"
      | "Dry Goods"
      | "Beverages"
      | "Others",
    unit: "kg" as "kg" | "g" | "L" | "mL" | "pc",
    lastPurchasePrice: "",
  });

  // Form state for creating/editing recipes
  const [formData, setFormData] = useState<{
    sellingPrice: string;
    ingredients: RecipeIngredient[];
    newIngredient: {
      ingredientId: string;
      quantityPerPortion: string;
      selectedUnit: string;
    };
  }>({
    sellingPrice: "",
    ingredients: [],
    newIngredient: {
      ingredientId: "",
      quantityPerPortion: "",
      selectedUnit: "kg",
    },
  });

  const posItemsRef = useRef(posItems);

  useEffect(() => {
    posItemsRef.current = posItems;
  }, [posItems]);

  useEffect(() => {
    if (!selectedPosItemId) {
      setFormData({
        sellingPrice: "",
        ingredients: [],
        newIngredient: {
          ingredientId: "",
          quantityPerPortion: "",
          selectedUnit: "kg",
        },
      });
      return;
    }

    const selectedItem = posItemsRef.current.find(
      (item) => item.id === selectedPosItemId
    );
    setFormData({
      sellingPrice:
        recipe?.sellingPrice.toString() ||
        selectedItem?.sellingPrice.toString() ||
        "",
      ingredients: recipe?.ingredients || [],
      newIngredient: {
        ingredientId: "",
        quantityPerPortion: "",
        selectedUnit: "kg",
      },
    });
    setEditMode(false);
    setShowCreateForm(false);
  }, [recipe, selectedPosItemId]);

  const filteredItems = posItems.filter((item) =>
    item.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const unmappedItems = posItems.filter((item) => !item.hasRecipe);
  const mappedItems = posItems.filter((item) => item.hasRecipe);

  const handleAddIngredient = () => {
    const { ingredientId, quantityPerPortion, selectedUnit } =
      formData.newIngredient;
    if (!ingredientId || !quantityPerPortion) return;

    const selectedIngredient = ingredients.find(
      (ing) => ing.id === ingredientId
    );
    if (!selectedIngredient) return;

    const qty = parseFloat(quantityPerPortion);
    const costPerUnit = selectedIngredient.lastPurchasePrice;
    const baseUnit = selectedIngredient.unit;

    // Unit conversion to base unit
    const conversionFactors: Record<string, number> = {
      g: 0.001, // 1g = 0.001kg
      kg: 1,
      mL: 0.001, // 1mL = 0.001L
      L: 1,
      pc: 1, // pieces don't convert
    };

    const conversionFactor = conversionFactors[selectedUnit] || 1;
    const qtyInBaseUnit = qty * conversionFactor;

    const newIngredient: RecipeIngredient = {
      ingredientId,
      ingredientName: selectedIngredient.name,
      quantityPerPortion: qtyInBaseUnit,
      unit: baseUnit,
      totalCost: qtyInBaseUnit * costPerUnit,
      costPerUnit,
      costPerPortion: qtyInBaseUnit * costPerUnit,
    };

    setFormData({
      ...formData,
      ingredients: [...formData.ingredients, newIngredient],
      newIngredient: {
        ingredientId: "",
        quantityPerPortion: "",
        selectedUnit: "kg",
      },
    });
  };

  const handleRemoveIngredient = (index: number) => {
    setFormData({
      ...formData,
      ingredients: formData.ingredients.filter((_, i) => i !== index),
    });
  };

  const handleSaveNewIngredient = () => {
    if (!newIngredientForm.name || !newIngredientForm.lastPurchasePrice) return;

    const newIngredient: Ingredient = {
      id: `ing_${Date.now()}`,
      name: newIngredientForm.name,
      category: newIngredientForm.category,
      unit: newIngredientForm.unit,
      lastPurchasePrice: parseFloat(newIngredientForm.lastPurchasePrice),
      benchmarkPrice: parseFloat(newIngredientForm.lastPurchasePrice),
      lastPurchasedDate: new Date(),
      priceTrend: [parseFloat(newIngredientForm.lastPurchasePrice)],
      currentStock: 0,
    };

    saveIngredient(newIngredient);
    setShowAddIngredientDialog(false);
    setNewIngredientForm({
      name: "",
      category: "Meat",
      unit: "kg",
      lastPurchasePrice: "",
    });
  };

  const handleSaveRecipe = () => {
    if (!selectedPosItemId || !formData.sellingPrice) return;

    const selectedItem = posItems.find((p) => p.id === selectedPosItemId);
    if (!selectedItem) return;

    const totalPlateCost = formData.ingredients.reduce(
      (sum, ing) => sum + ing.costPerPortion,
      0
    );
    const foodCostPercentage =
      totalPlateCost > 0
        ? Math.round((totalPlateCost / parseFloat(formData.sellingPrice)) * 100)
        : 0;

    const newRecipe: Recipe = {
      id: recipe?.id || `recipe_${Date.now()}`,
      posItemId: selectedPosItemId,
      posItemName: selectedItem.name,
      sellingPrice: parseFloat(formData.sellingPrice),
      ingredients: formData.ingredients,
      totalPlateCost,
      foodCostPercentage,
    };

    if (recipe) {
      updateRecipe(recipe.id, newRecipe);
    } else {
      saveRecipe(newRecipe);
    }

    updatePosItem(selectedPosItemId, { hasRecipe: true });
    setEditMode(false);
    setShowCreateForm(false);
  };

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto">
      <div className="text-center md:text-left">
        <h1 className="text-3xl font-bold text-slate-900">
          Recipes & POS Mapping
        </h1>
        <p className="text-slate-600 mt-1">
          Link menu items to recipes and track food costs
        </p>
      </div>

      <div className="bg-emerald-50 border-2 border-emerald-200 rounded-lg p-4 flex items-start gap-3">
        <div className="text-2xl">🔒</div>
        <div className="flex-1">
          <p className="font-semibold text-emerald-900">
            Your recipes are private and secure
          </p>
          <p className="text-sm text-emerald-700 mt-1">
            Only you and your team can see your recipes. We never share or sell
            your data. Your business secrets stay yours.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* POS Items List */}
        <Card className="lg:col-span-1">
          <CardHeader>
            <CardTitle>Menu Items</CardTitle>
            <CardDescription>Select to edit recipe</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="relative">
              <SearchIcon className="absolute left-3 top-3 w-4 h-4 text-slate-400" />
              <Input
                placeholder="Search menu items..."
                className="pl-10"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>

            <div className="space-y-2 max-h-96 overflow-y-auto">
              {filteredItems.map((item) => (
                <button
                  key={item.id}
                  onClick={() => setSelectedPosItemId(item.id)}
                  className={`w-full p-3 rounded-lg text-left transition-colors ${
                    selectedPosItemId === item.id
                      ? "bg-teal-100 border border-teal-300"
                      : "hover:bg-slate-100 border border-transparent"
                  }`}
                >
                  <p className="font-medium">{item.name}</p>
                  <p className="text-sm text-slate-600">
                    ₱ {item.sellingPrice}
                  </p>
                  {item.hasRecipe && (
                    <span className="inline-block text-xs bg-teal-100 text-teal-700 px-2 py-1 rounded mt-1">
                      Has Recipe
                    </span>
                  )}
                </button>
              ))}
            </div>

            <div className="pt-4 border-t border-slate-200 space-y-2">
              <p className="text-sm font-medium text-slate-600">
                Mapping Status
              </p>
              <p className="text-lg font-bold text-teal-600">
                {mappedItems.length} / {posItems.length}
              </p>
              <p className="text-xs text-slate-500">items have recipes</p>
            </div>
          </CardContent>
        </Card>

        {/* Recipe Editor */}
        <div className="lg:col-span-2">
          {selectedPosItemId && recipe && !editMode ? (
            <Card>
              <CardHeader>
                <CardTitle>{recipe.posItemName}</CardTitle>
                <CardDescription>Recipe and cost breakdown</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Top Summary */}
                <div className="grid grid-cols-3 gap-4">
                  <div className="bg-slate-50 p-4 rounded-lg">
                    <p className="text-sm text-slate-600">Selling Price</p>
                    <p className="text-2xl font-bold text-slate-900">
                      ₱ {recipe.sellingPrice}
                    </p>
                  </div>
                  <div className="bg-slate-50 p-4 rounded-lg">
                    <p className="text-sm text-slate-600">Plate Cost</p>
                    <p className="text-2xl font-bold text-slate-900">
                      ₱ {recipe.totalPlateCost.toFixed(2)}
                    </p>
                  </div>
                  <div
                    className={`p-4 rounded-lg ${
                      recipe.foodCostPercentage <= 30
                        ? "bg-teal-50"
                        : "bg-amber-50"
                    }`}
                  >
                    <p
                      className={`text-sm ${
                        recipe.foodCostPercentage <= 30
                          ? "text-teal-600"
                          : "text-amber-600"
                      }`}
                    >
                      Food Cost %
                    </p>
                    <p
                      className={`text-2xl font-bold ${
                        recipe.foodCostPercentage <= 30
                          ? "text-teal-900"
                          : "text-amber-900"
                      }`}
                    >
                      {recipe.foodCostPercentage}%
                    </p>
                  </div>
                </div>

                {/* Ingredients Table */}
                <div className="space-y-2">
                  <h3 className="font-semibold text-slate-900">Ingredients</h3>
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Ingredient</TableHead>
                          <TableHead className="text-right">Qty</TableHead>
                          <TableHead className="text-right">
                            Unit Cost
                          </TableHead>
                          <TableHead className="text-right">
                            Cost/Portion
                          </TableHead>
                          <TableHead className="text-right">
                            % of Plate
                          </TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {recipe.ingredients.map((ingredient, idx) => (
                          <TableRow key={idx}>
                            <TableCell className="font-medium">
                              {ingredient.ingredientName}
                            </TableCell>
                            <TableCell className="text-right">
                              {ingredient.quantityPerPortion} {ingredient.unit}
                            </TableCell>
                            <TableCell className="text-right">
                              ₱ {ingredient.costPerUnit}
                            </TableCell>
                            <TableCell className="text-right">
                              ₱ {ingredient.costPerPortion.toFixed(2)}
                            </TableCell>
                            <TableCell className="text-right">
                              {(
                                (ingredient.costPerPortion /
                                  recipe.totalPlateCost) *
                                100
                              ).toFixed(1)}
                              %
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex gap-3 pt-4 border-t border-slate-200">
                  <Button
                    onClick={() => setEditMode(true)}
                    className="flex-1 bg-teal-600 hover:bg-teal-700"
                  >
                    Edit Recipe
                  </Button>
                  <Button variant="outline" className="flex-1">
                    Duplicate Recipe
                  </Button>
                </div>
              </CardContent>
            </Card>
          ) : selectedPosItemId && (editMode || !recipe) ? (
            <Card>
              <CardHeader>
                <CardTitle>
                  {posItems.find((p) => p.id === selectedPosItemId)?.name ||
                    "New Recipe"}
                </CardTitle>
                <CardDescription>
                  {editMode ? "Edit recipe" : "Create recipe"}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Selling Price */}
                <div className="space-y-2">
                  <Label htmlFor="sellingPrice">Selling Price (₱)</Label>
                  <Input
                    id="sellingPrice"
                    type="number"
                    placeholder="e.g., 250"
                    value={formData.sellingPrice}
                    onChange={(e) =>
                      setFormData({ ...formData, sellingPrice: e.target.value })
                    }
                    step="0.01"
                  />
                </div>

                {/* Ingredients */}
                <div className="space-y-4">
                  <h3 className="font-semibold text-slate-900">Ingredients</h3>

                  {formData.ingredients.length > 0 && (
                    <div className="overflow-x-auto">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Ingredient</TableHead>
                            <TableHead className="text-right">Qty</TableHead>
                            <TableHead className="text-right">Unit</TableHead>
                            <TableHead className="text-right">
                              Unit Price
                            </TableHead>
                            <TableHead className="text-right">
                              Cost/Portion
                            </TableHead>
                            <TableHead className="text-center">
                              Action
                            </TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {formData.ingredients.map((ing, idx) => (
                            <TableRow key={idx}>
                              <TableCell className="font-medium">
                                {ing.ingredientName}
                              </TableCell>
                              <TableCell className="text-right">
                                {ing.quantityPerPortion}
                              </TableCell>
                              <TableCell className="text-right">
                                {ing.unit}
                              </TableCell>
                              <TableCell className="text-right">
                                ₱ {ing.costPerUnit}
                              </TableCell>
                              <TableCell className="text-right font-semibold">
                                ₱ {ing.costPerPortion.toFixed(2)}
                              </TableCell>
                              <TableCell className="text-center">
                                <button
                                  onClick={() => handleRemoveIngredient(idx)}
                                  className="text-red-600 hover:text-red-700"
                                >
                                  <TrashIcon className="w-4 h-4" />
                                </button>
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </div>
                  )}

                  {/* Add Ingredient Form */}
                  <div className="bg-slate-50 p-4 rounded-lg space-y-3">
                    <p className="text-sm font-medium text-slate-700">
                      Add Ingredient from List
                    </p>
                    <div className="grid grid-cols-3 gap-2">
                      <select
                        value={formData.newIngredient.ingredientId}
                        onChange={(e) => {
                          if (e.target.value === "__ADD_NEW__") {
                            setShowAddIngredientDialog(true);
                          } else {
                            setFormData({
                              ...formData,
                              newIngredient: {
                                ...formData.newIngredient,
                                ingredientId: e.target.value,
                              },
                            });
                          }
                        }}
                        className="border border-slate-300 rounded px-3 py-2 bg-white col-span-2"
                      >
                        <option value="">Select Ingredient</option>
                        {ingredients.map((ing) => (
                          <option key={ing.id} value={ing.id}>
                            {ing.name} ({ing.unit}) - ₱{ing.lastPurchasePrice}/
                            {ing.unit}
                          </option>
                        ))}
                        <option
                          value="__ADD_NEW__"
                          className="font-semibold text-teal-600"
                        >
                          + Add New Ingredient
                        </option>
                      </select>
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      <Input
                        placeholder="Quantity"
                        type="number"
                        step="0.01"
                        value={formData.newIngredient.quantityPerPortion}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            newIngredient: {
                              ...formData.newIngredient,
                              quantityPerPortion: e.target.value,
                            },
                          })
                        }
                      />
                      <select
                        value={formData.newIngredient.selectedUnit}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            newIngredient: {
                              ...formData.newIngredient,
                              selectedUnit: e.target.value,
                            },
                          })
                        }
                        className="border border-slate-300 rounded px-3 py-2 bg-white"
                      >
                        <option value="g">g (grams)</option>
                        <option value="kg">kg</option>
                        <option value="mL">mL</option>
                        <option value="L">L (liters)</option>
                        <option value="pc">pc (pieces)</option>
                      </select>
                    </div>
                    {formData.newIngredient.ingredientId &&
                      formData.newIngredient.quantityPerPortion && (
                        <div className="bg-white p-2 rounded text-sm text-slate-700">
                          <p>
                            Cost: ₱
                            {(() => {
                              const ingredient = ingredients.find(
                                (i) =>
                                  i.id === formData.newIngredient.ingredientId
                              );
                              if (!ingredient) return "0.00";
                              const conversionFactors: Record<string, number> =
                                {
                                  g: 0.001,
                                  kg: 1,
                                  mL: 0.001,
                                  L: 1,
                                  pc: 1,
                                };
                              const factor =
                                conversionFactors[
                                  formData.newIngredient.selectedUnit
                                ] || 1;
                              const qty =
                                parseFloat(
                                  formData.newIngredient.quantityPerPortion
                                ) || 0;
                              const cost =
                                qty * factor * ingredient.lastPurchasePrice;
                              return cost.toFixed(2);
                            })()}
                          </p>
                        </div>
                      )}
                    <Button
                      onClick={handleAddIngredient}
                      variant="outline"
                      className="w-full"
                    >
                      <PlusIcon className="w-4 h-4 mr-2" />
                      Add Ingredient
                    </Button>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex gap-3 pt-4 border-t border-slate-200">
                  <Button
                    onClick={handleSaveRecipe}
                    className="flex-1 bg-teal-600 hover:bg-teal-700"
                  >
                    Save Recipe
                  </Button>
                  <Button
                    onClick={() => {
                      setEditMode(false);
                      setShowCreateForm(false);
                    }}
                    variant="outline"
                    className="flex-1"
                  >
                    Cancel
                  </Button>
                </div>
              </CardContent>
            </Card>
          ) : (
            <Card className="flex items-center justify-center min-h-96">
              <div className="text-center">
                <p className="text-slate-600 mb-4">
                  Select a menu item to edit or create a recipe
                </p>
                <Button variant="outline">
                  <PlusIcon className="w-4 h-4 mr-2" />
                  Create Recipe
                </Button>
              </div>
            </Card>
          )}
        </div>
      </div>

      {/* Unmapped Items */}
      {unmappedItems.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Unmapped Menu Items</CardTitle>
            <CardDescription>
              These items don't have recipes yet
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {unmappedItems.map((item) => (
                <div
                  key={item.id}
                  className="flex items-center justify-between p-3 bg-slate-50 rounded-lg"
                >
                  <div>
                    <p className="font-medium">{item.name}</p>
                    <p className="text-sm text-slate-600">
                      ₱ {item.sellingPrice}
                    </p>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      setSelectedPosItemId(item.id);
                      setEditMode(true);
                      setShowCreateForm(true);
                    }}
                  >
                    Create Recipe
                  </Button>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Add New Ingredient Dialog */}
      <Dialog
        open={showAddIngredientDialog}
        onOpenChange={setShowAddIngredientDialog}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add New Ingredient</DialogTitle>
            <DialogDescription>
              Add a new ingredient to your master list
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="ingredientName">Ingredient Name</Label>
              <Input
                id="ingredientName"
                placeholder="e.g., Chicken Breast"
                value={newIngredientForm.name}
                onChange={(e) =>
                  setNewIngredientForm({
                    ...newIngredientForm,
                    name: e.target.value,
                  })
                }
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="category">Category</Label>
              <select
                id="category"
                value={newIngredientForm.category}
                onChange={(e) =>
                  setNewIngredientForm({
                    ...newIngredientForm,
                    category: e.target
                      .value as typeof newIngredientForm.category,
                  })
                }
                className="w-full border border-slate-300 rounded px-3 py-2"
              >
                <option value="Meat">Meat</option>
                <option value="Veg">Vegetables</option>
                <option value="Dairy">Dairy</option>
                <option value="Dry Goods">Dry Goods</option>
                <option value="Beverages">Beverages</option>
                <option value="Others">Others</option>
              </select>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="unit">Unit</Label>
                <select
                  id="unit"
                  value={newIngredientForm.unit}
                  onChange={(e) =>
                    setNewIngredientForm({
                      ...newIngredientForm,
                      unit: e.target.value as typeof newIngredientForm.unit,
                    })
                  }
                  className="w-full border border-slate-300 rounded px-3 py-2"
                >
                  <option value="kg">kg</option>
                  <option value="g">g</option>
                  <option value="L">L</option>
                  <option value="mL">mL</option>
                  <option value="pc">pc</option>
                </select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="price">Price per Unit (₱)</Label>
                <Input
                  id="price"
                  type="number"
                  step="0.01"
                  placeholder="e.g., 180"
                  value={newIngredientForm.lastPurchasePrice}
                  onChange={(e) =>
                    setNewIngredientForm({
                      ...newIngredientForm,
                      lastPurchasePrice: e.target.value,
                    })
                  }
                />
              </div>
            </div>
          </div>
          <div className="flex gap-3">
            <Button
              onClick={handleSaveNewIngredient}
              className="flex-1 bg-teal-600 hover:bg-teal-700"
            >
              Add Ingredient
            </Button>
            <Button
              onClick={() => {
                setShowAddIngredientDialog(false);
                setNewIngredientForm({
                  name: "",
                  category: "Meat",
                  unit: "kg",
                  lastPurchasePrice: "",
                });
              }}
              variant="outline"
              className="flex-1"
            >
              Cancel
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
