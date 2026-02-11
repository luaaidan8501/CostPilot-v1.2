"use client";

import { useState } from "react";
import { useIngredients, usePurchases } from "@/lib/hooks";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
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
import {
  TrendingUpIcon,
  TrendingDownIcon,
  SearchIcon,
} from "@/components/icons";

const categories = [
  "All",
  "Meat",
  "Veg",
  "Dairy",
  "Dry Goods",
  "Beverages",
  "Others",
];

export default function IngredientsPage() {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [selectedIngredientId, setSelectedIngredientId] = useState<string | null>(
    null
  );

  const filters = {
    category: selectedCategory !== "All" ? selectedCategory : undefined,
    search: searchTerm,
  };

  const { data: ingredients, isLoading } = useIngredients(filters);
  const { data: purchases } = usePurchases();

  const selectedIngredient = ingredients.find(
    (ingredient) => ingredient.id === selectedIngredientId
  );
  const latestPurchase = purchases
    .filter((purchase) => purchase.ingredientId === selectedIngredientId)
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())[0];
  const lowestSupplier = purchases
    .filter((purchase) => purchase.ingredientId === selectedIngredientId)
    .reduce((lowest, current) => {
      if (!lowest || current.unitPrice < lowest.unitPrice) return current;
      return lowest;
    }, undefined as typeof purchases[number] | undefined);

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto">
      <div>
        <h1 className="text-3xl font-bold text-slate-900">Ingredients</h1>
        <p className="text-slate-600 mt-1">
          Compare your prices with market benchmarks
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Ingredient Catalog</CardTitle>
          <CardDescription>
            Track ingredient costs and market prices
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Filters */}
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1 relative">
              <SearchIcon className="absolute left-3 top-3 w-4 h-4 text-slate-400" />
              <Input
                placeholder="Search ingredients..."
                className="pl-10"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <Select
              value={selectedCategory}
              onValueChange={setSelectedCategory}
            >
              <SelectTrigger className="w-full sm:w-40">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {categories.map((cat) => (
                  <SelectItem key={cat} value={cat}>
                    {cat}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Table */}
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Ingredient</TableHead>
                  <TableHead className="text-right">Current Stock</TableHead>
                  <TableHead className="text-right">Last Purchase</TableHead>
                  <TableHead className="text-right">Benchmark</TableHead>
                  <TableHead className="text-right">Difference</TableHead>
                  <TableHead className="text-right pr-6">Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {ingredients.map((ingredient) => {
                  const diff =
                    ((ingredient.lastPurchasePrice -
                      ingredient.benchmarkPrice) /
                      ingredient.benchmarkPrice) *
                    100;
                  const isAbove = diff > 0;

                  return (
                    <TableRow key={ingredient.id}>
                      <TableCell className="font-medium">
                        {ingredient.name}
                      </TableCell>
                      <TableCell className="text-right font-medium text-slate-900">
                        {ingredient.currentStock} {ingredient.unit}
                      </TableCell>
                      <TableCell className="text-right font-medium">
                        ₱ {ingredient.lastPurchasePrice}/{ingredient.unit}
                      </TableCell>
                      <TableCell className="text-right text-slate-600">
                        ₱ {ingredient.benchmarkPrice}/{ingredient.unit}
                      </TableCell>
                      <TableCell className="text-right">
                        <span
                          className={`inline-flex items-center gap-1 font-medium ${
                            isAbove ? "text-red-600" : "text-emerald-600"
                          }`}
                        >
                          {isAbove ? (
                            <TrendingUpIcon className="w-4 h-4" />
                          ) : (
                            <TrendingDownIcon className="w-4 h-4" />
                          )}
                          {Math.abs(diff).toFixed(1)}%
                        </span>
                      </TableCell>
                      <TableCell className="pr-6">
                        <div className="flex justify-end">
                          {isAbove ? (
                            <span className="inline-block px-2 py-1 bg-red-100 text-red-700 text-xs rounded font-medium">
                              Above Market
                            </span>
                          ) : (
                            <span className="inline-block px-2 py-1 bg-emerald-100 text-emerald-700 text-xs rounded font-medium">
                              Good Deal
                            </span>
                          )}
                        </div>
                      </TableCell>
                      <TableCell className="text-right">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setSelectedIngredientId(ingredient.id)}
                        >
                          Details
                        </Button>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      <Dialog
        open={Boolean(selectedIngredient)}
        onOpenChange={(open) => !open && setSelectedIngredientId(null)}
      >
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>
              {selectedIngredient?.name || "Ingredient Details"}
            </DialogTitle>
            <DialogDescription>
              Latest purchase and pricing overview
            </DialogDescription>
          </DialogHeader>
          {selectedIngredient && (
            <div className="space-y-3 text-sm text-slate-700">
              <div className="flex items-center justify-between">
                <span className="text-slate-500">Last purchased</span>
                <span>
                  {selectedIngredient.lastPurchasedDate
                    ? new Date(selectedIngredient.lastPurchasedDate).toLocaleDateString(
                        "en-US",
                        {
                          year: "numeric",
                          month: "short",
                          day: "numeric",
                        }
                      )
                    : "—"}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-500">Last purchase price</span>
                <span>
                  ₱ {selectedIngredient.lastPurchasePrice}/
                  {selectedIngredient.unit}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-500">Benchmark price</span>
                <span>
                  ₱ {selectedIngredient.benchmarkPrice}/{selectedIngredient.unit}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-500">Supplier</span>
                <span>{latestPurchase?.supplier || "—"}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-500">Lowest supplier price</span>
                <span>
                  {lowestSupplier
                    ? `${lowestSupplier.supplier} • ₱ ${lowestSupplier.unitPrice}/${lowestSupplier.unit}`
                    : "—"}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-500">Supplier price</span>
                <span>
                  {latestPurchase
                    ? `₱ ${latestPurchase.unitPrice}/${latestPurchase.unit}`
                    : "—"}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-500">Last purchase total</span>
                <span>{latestPurchase ? `₱ ${latestPurchase.totalPrice}` : "—"}</span>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
