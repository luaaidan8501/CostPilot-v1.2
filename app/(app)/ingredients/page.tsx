'use client';

import { useState } from 'react';
import { useIngredients } from '@/lib/hooks';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { TrendingUpIcon, TrendingDownIcon, SearchIcon } from '@/components/icons';

const categories = ['All', 'Meat', 'Veg', 'Dairy', 'Dry Goods', 'Beverages', 'Others'];

export default function IngredientsPage() {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');

  const filters = {
    category: selectedCategory !== 'All' ? selectedCategory : undefined,
    search: searchTerm,
  };

  const { data: ingredients, isLoading } = useIngredients(filters);

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-slate-900">Ingredients</h1>
        <p className="text-slate-600 mt-1">Compare your prices with market benchmarks</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Ingredient Catalog</CardTitle>
          <CardDescription>Track ingredient costs and market prices</CardDescription>
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
            <Select value={selectedCategory} onValueChange={setSelectedCategory}>
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
                  <TableHead>Unit</TableHead>
                  <TableHead className="text-right">Last Purchase</TableHead>
                  <TableHead className="text-right">Benchmark</TableHead>
                  <TableHead className="text-right">Difference</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {ingredients.map((ingredient) => {
                  const diff = ((ingredient.lastPurchasePrice - ingredient.benchmarkPrice) / ingredient.benchmarkPrice) * 100;
                  const isAbove = diff > 0;

                  return (
                    <TableRow key={ingredient.id}>
                      <TableCell className="font-medium">{ingredient.name}</TableCell>
                      <TableCell className="text-slate-600">{ingredient.unit}</TableCell>
                      <TableCell className="text-right font-medium">₱ {ingredient.lastPurchasePrice}</TableCell>
                      <TableCell className="text-right text-slate-600">₱ {ingredient.benchmarkPrice}</TableCell>
                      <TableCell className="text-right">
                        <span className={`inline-flex items-center gap-1 font-medium ${isAbove ? 'text-red-600' : 'text-emerald-600'}`}>
                          {isAbove ? <TrendingUpIcon className="w-4 h-4" /> : <TrendingDownIcon className="w-4 h-4" />}
                          {Math.abs(diff).toFixed(1)}%
                        </span>
                      </TableCell>
                      <TableCell>
                        {isAbove ? (
                          <span className="inline-block px-2 py-1 bg-red-100 text-red-700 text-xs rounded font-medium">
                            Above Market
                          </span>
                        ) : (
                          <span className="inline-block px-2 py-1 bg-emerald-100 text-emerald-700 text-xs rounded font-medium">
                            Good Deal
                          </span>
                        )}
                      </TableCell>
                      <TableCell>
                        <Button variant="ghost" size="sm">
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
    </div>
  );
}
