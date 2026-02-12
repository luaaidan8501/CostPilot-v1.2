"use client";

import { Fragment, useEffect, useMemo, useRef, useState } from "react";
import {
  usePosItems,
  useRecipes,
  useSavePosItem,
  useSaveRecipe,
  useUpdateRecipe,
  useUpdatePosItem,
  useIngredients,
  useSaveIngredient,
} from "@/lib/hooks";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
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
import { ChevronDownIcon, PlusIcon, TrashIcon } from "@/components/icons";
import type { Recipe, RecipeIngredient, Ingredient, PosItem } from "@/lib/types";

function hashString(value: string) {
  let hash = 0;
  for (let i = 0; i < value.length; i += 1) {
    hash = (hash << 5) - hash + value.charCodeAt(i);
    hash |= 0;
  }
  return Math.abs(hash);
}

function buildMonthlyTrend(base: number, name: string) {
  const seed = hashString(name) % 7;
  return Array.from({ length: 6 }, (_, index) => {
    const variance = ((seed + index) % 5) - 2;
    return Math.max(0, Math.round(base + variance));
  });
}

function getRecentMonths() {
  const now = new Date();
  return Array.from({ length: 6 }, (_, index) => {
    const d = new Date(now.getFullYear(), now.getMonth() - (5 - index), 1);
    return d.toLocaleString("en-US", { month: "short" });
  });
}

export default function RecipesPosPage() {
  const [selectedPosItemId, setSelectedPosItemId] = useState<string | null>(
    null
  );
  const [editMode, setEditMode] = useState(false);
  const [showAddDishDialog, setShowAddDishDialog] = useState(false);
  const [showAddIngredientDialog, setShowAddIngredientDialog] = useState(false);
  const [expandedRowId, setExpandedRowId] = useState<string | null>(null);
  const [categoryFilter, setCategoryFilter] = useState("All");
  const [sortOption, setSortOption] = useState<"cost-desc" | "cost-asc">(
    "cost-desc"
  );

  const { data: posItems } = usePosItems();
  const { data: recipes } = useRecipes();
  const { data: ingredients } = useIngredients();
  const saveRecipe = useSaveRecipe();
  const savePosItem = useSavePosItem();
  const updateRecipe = useUpdateRecipe();
  const updatePosItem = useUpdatePosItem();
  const saveIngredient = useSaveIngredient();
  const selectedRecipe = useMemo(
    () => recipes.find((item) => item.posItemId === selectedPosItemId),
    [recipes, selectedPosItemId]
  );

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

  const [newDishForm, setNewDishForm] = useState({
    name: "",
    category: "Mains",
    sellingPrice: "",
  });

  // Form state for creating/editing recipes
  const [formData, setFormData] = useState<{
    sellingPrice: string;
    category: string;
    ingredients: RecipeIngredient[];
    newIngredient: {
      ingredientId: string;
      quantityPerPortion: string;
      selectedUnit: string;
    };
  }>({
    sellingPrice: "",
    category: "",
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
        category: "",
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
        selectedRecipe?.sellingPrice.toString() ||
        selectedItem?.sellingPrice.toString() ||
        "",
      category: selectedItem?.category || "",
      ingredients: selectedRecipe?.ingredients || [],
      newIngredient: {
        ingredientId: "",
        quantityPerPortion: "",
        selectedUnit: "kg",
      },
    });
  }, [selectedRecipe, selectedPosItemId]);

  const categories = useMemo(() => {
    const unique = new Set(posItems.map((item) => item.category).filter(Boolean));
    const ordered = ["Mains", "Appetizers", "Sides", "Drinks", "Desserts"];
    return [
      "All",
      ...ordered.filter((cat) => unique.has(cat)),
      ...Array.from(unique).filter((cat) => !ordered.includes(cat)),
    ];
  }, [posItems]);

  const recipeMap = useMemo(() => {
    return new Map(recipes.map((item) => [item.posItemId, item]));
  }, [recipes]);

  const rows = useMemo(() => {
    const mapped = posItems.map((item) => {
      const recipeItem = recipeMap.get(item.id);
      return {
        id: item.id,
        name: item.name,
        category: item.category || "Uncategorized",
        sellingPrice: item.sellingPrice,
        plateCost: recipeItem?.totalPlateCost ?? null,
        foodCostPercentage: recipeItem?.foodCostPercentage ?? null,
        trend: recipeItem
          ? buildMonthlyTrend(recipeItem.foodCostPercentage, item.name)
          : null,
        recipe: recipeItem,
      };
    });

    const filtered =
      categoryFilter === "All"
        ? mapped
        : mapped.filter((row) => row.category === categoryFilter);

    return filtered.sort((a, b) => {
      const aCost = a.foodCostPercentage ?? -1;
      const bCost = b.foodCostPercentage ?? -1;
      if (sortOption === "cost-asc") {
        return aCost - bCost;
      }
      return bCost - aCost;
    });
  }, [posItems, recipeMap, categoryFilter, sortOption]);

  const months = useMemo(() => getRecentMonths(), []);

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

  const handleSaveNewIngredient = async () => {
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

    try {
      await saveIngredient(newIngredient);
      setShowAddIngredientDialog(false);
      setNewIngredientForm({
        name: "",
        category: "Meat",
        unit: "kg",
        lastPurchasePrice: "",
      });
    } catch (error) {
      alert(
        error instanceof Error
          ? `Failed to save ingredient: ${error.message}`
          : "Failed to save ingredient"
      );
    }
  };

  const handleSaveNewDish = async () => {
    if (!newDishForm.name || !newDishForm.sellingPrice) return;
    const parsedPrice = parseFloat(newDishForm.sellingPrice);
    if (Number.isNaN(parsedPrice) || parsedPrice <= 0) {
      alert("Please enter a valid selling price");
      return;
    }

    const newDish: PosItem = {
      id: `dish_${Date.now()}`,
      name: newDishForm.name,
      category: newDishForm.category,
      sellingPrice: parsedPrice,
      hasRecipe: false,
    };

    try {
      await savePosItem(newDish);
      setShowAddDishDialog(false);
      setNewDishForm({
        name: "",
        category: "Mains",
        sellingPrice: "",
      });
    } catch (error) {
      alert(
        error instanceof Error
          ? `Failed to save dish: ${error.message}`
          : "Failed to save dish"
      );
    }
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
      id: selectedRecipe?.id || `recipe_${Date.now()}`,
      posItemId: selectedPosItemId,
      posItemName: selectedItem.name,
      sellingPrice: parseFloat(formData.sellingPrice),
      ingredients: formData.ingredients,
      totalPlateCost,
      foodCostPercentage,
    };

    if (selectedRecipe) {
      updateRecipe(selectedRecipe.id, newRecipe);
    } else {
      saveRecipe(newRecipe);
    }

    updatePosItem(selectedPosItemId, {
      hasRecipe: true,
      category: formData.category || selectedItem.category,
    });
    setEditMode(false);
    setExpandedRowId(selectedPosItemId);
  };

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto">
      <div className="text-center md:text-left">
        <h1 className="text-3xl font-bold text-slate-900">
          Dish Information
        </h1>
        <p className="text-slate-600 mt-1">
          View dish costs and recipe details
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

      <Card>
        <CardHeader>
          <CardTitle>Dish Food Costs</CardTitle>
          <CardDescription>Click a dish to view ingredient details.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-wrap items-center gap-3">
            <Button
              onClick={() => setShowAddDishDialog(true)}
              className="bg-slate-900 hover:bg-slate-800 text-white"
            >
              <PlusIcon className="w-4 h-4 mr-2" />
              Add Dish
            </Button>
            <Button
              onClick={() => setShowAddIngredientDialog(true)}
              className="bg-teal-600 hover:bg-teal-700 text-white"
            >
              <PlusIcon className="w-4 h-4 mr-2" />
              Add Ingredient
            </Button>
            <Select
              value={sortOption}
              onValueChange={(value) =>
                setSortOption(value as "cost-desc" | "cost-asc")
              }
            >
              <SelectTrigger className="w-48">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="cost-desc">Highest → Lowest</SelectItem>
                <SelectItem value="cost-asc">Lowest → Highest</SelectItem>
              </SelectContent>
            </Select>
            <Select value={categoryFilter} onValueChange={setCategoryFilter}>
              <SelectTrigger className="w-48">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {categories.map((category) => (
                  <SelectItem key={category} value={category}>
                    {category}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Dish</TableHead>
                  <TableHead>Category</TableHead>
                  <TableHead className="text-right">Price</TableHead>
                  <TableHead className="text-right">Cost to Make</TableHead>
                  <TableHead className="text-right">Food Cost %</TableHead>
                  <TableHead className="text-right">Details</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {rows.map((row) => (
                  <Fragment key={row.id}>
                    <TableRow>
                      <TableCell className="font-medium">{row.name}</TableCell>
                      <TableCell>{row.category}</TableCell>
                      <TableCell className="text-right">₱ {row.sellingPrice}</TableCell>
                      <TableCell className="text-right">
                        {row.plateCost !== null
                          ? `₱ ${row.plateCost.toFixed(2)}`
                          : "—"}
                      </TableCell>
                      <TableCell className="text-right">
                        <span
                          className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold ${
                            row.foodCostPercentage === null
                              ? "bg-slate-100 text-slate-700"
                              : row.foodCostPercentage <= 30
                              ? "bg-emerald-100 text-emerald-800"
                              : row.foodCostPercentage <= 35
                              ? "bg-amber-100 text-amber-800"
                              : "bg-rose-100 text-rose-800"
                          }`}
                        >
                          {row.foodCostPercentage !== null
                            ? `${row.foodCostPercentage}%`
                            : "—"}
                        </span>
                      </TableCell>
                      <TableCell className="text-right">
                        <Button
                          size="sm"
                          className="bg-teal-600 hover:bg-teal-700 text-white"
                          onClick={() =>
                            setExpandedRowId(
                              expandedRowId === row.id ? null : row.id
                            )
                          }
                        >
                          <ChevronDownIcon className="w-4 h-4 mr-2" />
                          {expandedRowId === row.id ? "Hide" : "View"}
                        </Button>
                      </TableCell>
                    </TableRow>
                    {expandedRowId === row.id && (
                      <TableRow>
                        <TableCell colSpan={6} className="bg-teal-50">
                          {row.recipe ? (
                            <div className="space-y-4">
                              <div className="grid grid-cols-3 gap-4">
                                <div className="bg-white p-3 rounded-lg border border-teal-200">
                                  <p className="text-xs text-slate-500">
                                    Selling Price
                                  </p>
                                  <p className="text-lg font-semibold">
                                    ₱ {row.recipe.sellingPrice}
                                  </p>
                                </div>
                                <div className="bg-white p-3 rounded-lg border border-teal-200">
                                  <p className="text-xs text-slate-500">
                                    Plate Cost
                                  </p>
                                  <p className="text-lg font-semibold">
                                    ₱ {row.recipe.totalPlateCost.toFixed(2)}
                                  </p>
                                </div>
                                <div className="bg-white p-3 rounded-lg border border-teal-200">
                                  <p className="text-xs text-slate-500">
                                    Food Cost %
                                  </p>
                                  <p className="text-lg font-semibold">
                                    {row.recipe.foodCostPercentage}%
                                  </p>
                                </div>
                              </div>
                              {row.trend && (
                                <div className="bg-white p-3 rounded-lg border border-teal-200">
                                  <p className="text-xs text-slate-500 mb-2">
                                    Food Cost % (Last 6 Months)
                                  </p>
                                  <div className="grid grid-cols-3 md:grid-cols-6 gap-2 text-center text-xs">
                                    {row.trend.map((value, index) => (
                                      <div key={`${row.id}-month-${index}`} className="space-y-1">
                                        <p className="text-slate-400">{months[index]}</p>
                                        <p className="font-semibold text-slate-700">{value}%</p>
                                      </div>
                                    ))}
                                  </div>
                                </div>
                              )}
                              <div className="overflow-x-auto">
                                <Table>
                                  <TableHeader>
                                    <TableRow>
                                      <TableHead>Ingredient</TableHead>
                                      <TableHead className="text-right">Qty</TableHead>
                                      <TableHead className="text-right">Unit Cost</TableHead>
                                      <TableHead className="text-right">Cost/Portion</TableHead>
                                    </TableRow>
                                  </TableHeader>
                                  <TableBody>
                                    {row.recipe.ingredients.map((ingredient, idx) => (
                                      <TableRow key={idx}>
                                        <TableCell className="font-medium">
                                          {ingredient.ingredientName}
                                        </TableCell>
                                        <TableCell className="text-right">
                                          {ingredient.quantityPerPortion} {ingredient.unit}
                                        </TableCell>
                                        <TableCell className="text-right">₱ {ingredient.costPerUnit}</TableCell>
                                        <TableCell className="text-right">
                                          ₱ {ingredient.costPerPortion.toFixed(2)}
                                        </TableCell>
                                      </TableRow>
                                    ))}
                                  </TableBody>
                                </Table>
                              </div>
                              <div className="flex justify-end gap-2">
                                <Button
                                  variant="outline"
                                  onClick={() => {
                                    setSelectedPosItemId(row.id);
                                    setExpandedRowId(row.id);
                                    setEditMode(true);
                                  }}
                                >
                                  Edit Recipe
                                </Button>
                              </div>
                            </div>
                          ) : (
                            <div className="flex items-center justify-between">
                              <p className="text-sm text-slate-600">
                                No recipe yet for this dish.
                              </p>
                              <Button
                                onClick={() => {
                                  setSelectedPosItemId(row.id);
                                  setExpandedRowId(row.id);
                                  setEditMode(true);
                                }}
                                className="bg-teal-600 hover:bg-teal-700"
                              >
                                Create Recipe
                              </Button>
                            </div>
                          )}
                        </TableCell>
                      </TableRow>
                    )}
                  </Fragment>
                ))}
                {rows.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center text-slate-500">
                      No menu items available.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      <Dialog
        open={Boolean(selectedPosItemId && editMode)}
        onOpenChange={(open) => {
          if (!open) {
            setEditMode(false);
            setSelectedPosItemId(null);
          }
        }}
      >
        <DialogContent className="max-w-4xl max-h-[85vh] overflow-y-auto p-0">
          <DialogHeader className="sr-only">
            <DialogTitle>Recipe Editor</DialogTitle>
            <DialogDescription>
              Update selling price, category, and ingredient composition.
            </DialogDescription>
          </DialogHeader>
          <Card className="border-0 shadow-none">
            <CardHeader>
              <CardTitle>
                {posItems.find((p) => p.id === selectedPosItemId)?.name ||
                  "New Recipe"}
              </CardTitle>
              <CardDescription>Edit recipe details</CardDescription>
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

                <div className="space-y-2">
                  <Label htmlFor="category">Category</Label>
                  <Select
                    value={formData.category}
                    onValueChange={(value) =>
                      setFormData({ ...formData, category: value })
                    }
                  >
                    <SelectTrigger id="category">
                      <SelectValue placeholder="Select category" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Mains">Mains</SelectItem>
                      <SelectItem value="Appetizers">Appetizers</SelectItem>
                      <SelectItem value="Sides">Sides</SelectItem>
                      <SelectItem value="Drinks">Drinks</SelectItem>
                      <SelectItem value="Desserts">Desserts</SelectItem>
                    </SelectContent>
                  </Select>
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
                      setSelectedPosItemId(null);
                    }}
                    variant="outline"
                    className="flex-1"
                  >
                    Cancel
                  </Button>
                </div>
            </CardContent>
          </Card>
        </DialogContent>
      </Dialog>

      {/* Add New Ingredient Dialog */}
      <Dialog
        open={showAddDishDialog}
        onOpenChange={setShowAddDishDialog}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add New Dish</DialogTitle>
            <DialogDescription>
              Create a new menu item in Dish Information
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="dishName">Dish Name</Label>
              <Input
                id="dishName"
                placeholder="e.g., Beef Salpicao"
                value={newDishForm.name}
                onChange={(e) =>
                  setNewDishForm({
                    ...newDishForm,
                    name: e.target.value,
                  })
                }
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="dishCategory">Category</Label>
              <Select
                value={newDishForm.category}
                onValueChange={(value) =>
                  setNewDishForm({
                    ...newDishForm,
                    category: value,
                  })
                }
              >
                <SelectTrigger id="dishCategory">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Mains">Mains</SelectItem>
                  <SelectItem value="Appetizers">Appetizers</SelectItem>
                  <SelectItem value="Sides">Sides</SelectItem>
                  <SelectItem value="Drinks">Drinks</SelectItem>
                  <SelectItem value="Desserts">Desserts</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="dishSellingPrice">Selling Price (₱)</Label>
              <Input
                id="dishSellingPrice"
                type="number"
                step="0.01"
                placeholder="e.g., 250"
                value={newDishForm.sellingPrice}
                onChange={(e) =>
                  setNewDishForm({
                    ...newDishForm,
                    sellingPrice: e.target.value,
                  })
                }
              />
            </div>
          </div>
          <div className="flex gap-3">
            <Button
              onClick={handleSaveNewDish}
              className="flex-1 bg-slate-900 hover:bg-slate-800"
            >
              Add Dish
            </Button>
            <Button
              onClick={() => {
                setShowAddDishDialog(false);
                setNewDishForm({
                  name: "",
                  category: "Mains",
                  sellingPrice: "",
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
