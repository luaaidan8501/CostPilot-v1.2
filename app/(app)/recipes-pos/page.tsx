"use client"

import { useState } from "react"
import { usePosItems, useRecipeByPosItem } from "@/lib/hooks"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { SearchIcon, PlusIcon } from "@/components/icons"

export default function RecipesPosPage() {
  const [selectedPosItemId, setSelectedPosItemId] = useState<string | null>(null)
  const [searchTerm, setSearchTerm] = useState("")

  const { data: posItems } = usePosItems()
  const { data: recipe } = useRecipeByPosItem(selectedPosItemId || "")

  const filteredItems = posItems.filter((item) => item.name.toLowerCase().includes(searchTerm.toLowerCase()))

  const unmappedItems = posItems.filter((item) => !item.hasRecipe)
  const mappedItems = posItems.filter((item) => item.hasRecipe)

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto">
      <div className="text-center md:text-left">
        <h1 className="text-3xl font-bold text-slate-900">Recipes & POS Mapping</h1>
        <p className="text-slate-600 mt-1">Link menu items to recipes and track food costs</p>
      </div>

      <div className="bg-emerald-50 border-2 border-emerald-200 rounded-lg p-4 flex items-start gap-3">
        <div className="text-2xl">🔒</div>
        <div className="flex-1">
          <p className="font-semibold text-emerald-900">Your recipes are private and secure</p>
          <p className="text-sm text-emerald-700 mt-1">
            Only you and your team can see your recipes. We never share or sell your data. Your business secrets stay
            yours.
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
                  <p className="text-sm text-slate-600">₱ {item.sellingPrice}</p>
                  {item.hasRecipe && (
                    <span className="inline-block text-xs bg-teal-100 text-teal-700 px-2 py-1 rounded mt-1">
                      Has Recipe
                    </span>
                  )}
                </button>
              ))}
            </div>

            <div className="pt-4 border-t border-slate-200 space-y-2">
              <p className="text-sm font-medium text-slate-600">Mapping Status</p>
              <p className="text-lg font-bold text-teal-600">
                {mappedItems.length} / {posItems.length}
              </p>
              <p className="text-xs text-slate-500">items have recipes</p>
            </div>
          </CardContent>
        </Card>

        {/* Recipe Editor */}
        <div className="lg:col-span-2">
          {selectedPosItemId && recipe ? (
            <Card>
              <CardHeader>
                <CardTitle>{recipe.posItemName}</CardTitle>
                <CardDescription>Edit recipe and cost breakdown</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Top Summary */}
                <div className="grid grid-cols-3 gap-4">
                  <div className="bg-slate-50 p-4 rounded-lg">
                    <p className="text-sm text-slate-600">Selling Price</p>
                    <p className="text-2xl font-bold text-slate-900">₱ {recipe.sellingPrice}</p>
                  </div>
                  <div className="bg-slate-50 p-4 rounded-lg">
                    <p className="text-sm text-slate-600">Plate Cost</p>
                    <p className="text-2xl font-bold text-slate-900">₱ {recipe.totalPlateCost.toFixed(2)}</p>
                  </div>
                  <div className={`p-4 rounded-lg ${recipe.foodCostPercentage <= 30 ? "bg-teal-50" : "bg-amber-50"}`}>
                    <p className={`text-sm ${recipe.foodCostPercentage <= 30 ? "text-teal-600" : "text-amber-600"}`}>
                      Food Cost %
                    </p>
                    <p
                      className={`text-2xl font-bold ${recipe.foodCostPercentage <= 30 ? "text-teal-900" : "text-amber-900"}`}
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
                          <TableHead className="text-right">Unit Cost</TableHead>
                          <TableHead className="text-right">Cost/Portion</TableHead>
                          <TableHead className="text-right">% of Plate</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {recipe.ingredients.map((ingredient, idx) => (
                          <TableRow key={idx}>
                            <TableCell className="font-medium">{ingredient.ingredientName}</TableCell>
                            <TableCell className="text-right">
                              {ingredient.quantityPerPortion} {ingredient.unit}
                            </TableCell>
                            <TableCell className="text-right">₱ {ingredient.unitCost}</TableCell>
                            <TableCell className="text-right">₱ {ingredient.costPerPortion.toFixed(2)}</TableCell>
                            <TableCell className="text-right">
                              {((ingredient.costPerPortion / recipe.totalPlateCost) * 100).toFixed(1)}%
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex gap-3 pt-4 border-t border-slate-200">
                  <Button className="flex-1 bg-teal-600 hover:bg-teal-700">Save Recipe</Button>
                  <Button variant="outline" className="flex-1 bg-transparent">
                    Duplicate Recipe
                  </Button>
                </div>
              </CardContent>
            </Card>
          ) : (
            <Card className="flex items-center justify-center min-h-96">
              <div className="text-center">
                <p className="text-slate-600 mb-4">Select a menu item to edit its recipe</p>
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
            <CardDescription>These items don't have recipes yet</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {unmappedItems.map((item) => (
                <div key={item.id} className="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
                  <div>
                    <p className="font-medium">{item.name}</p>
                    <p className="text-sm text-slate-600">₱ {item.sellingPrice}</p>
                  </div>
                  <Button variant="outline" size="sm" onClick={() => setSelectedPosItemId(item.id)}>
                    Create Recipe
                  </Button>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
