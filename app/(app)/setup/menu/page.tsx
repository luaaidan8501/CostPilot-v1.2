'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { usePosItems, useSavePosItem } from '@/lib/hooks';
import { PlusIcon, TrashIcon } from '@/components/icons';
import type { PosItem } from '@/lib/types';

export default function MenuSetupPage() {
  const router = useRouter();
  const { data: posItems } = usePosItems();
  const savePosItem = useSavePosItem();
  
  const [formData, setFormData] = useState({
    name: '',
    sellingPrice: '',
    category: 'Mains',
  });

  const handleAddItem = (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.name || !formData.sellingPrice) {
      alert('Please fill in all fields');
      return;
    }

    const newPosItem: PosItem = {
      id: `pos_${Date.now()}`,
      name: formData.name,
      category: formData.category,
      sellingPrice: parseFloat(formData.sellingPrice),
      hasRecipe: false,
    };

    savePosItem(newPosItem);

    // Reset form
    setFormData({
      name: '',
      sellingPrice: '',
      category: 'Mains',
    });

    alert('Menu item added! You can add more or continue to recipes.');
  };

  const handleContinue = () => {
    if (posItems.length === 0) {
      alert('Please add at least one menu item before continuing');
      return;
    }
    router.push('/setup/recipes');
  };

  return (
    <div className="p-6 space-y-6 max-w-4xl mx-auto">
      <div className="text-center md:text-left">
        <h1 className="text-3xl font-bold text-slate-900">Set Up Your Menu</h1>
        <p className="text-slate-600 mt-1">Add the menu items you serve. You'll create recipes for each item next.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Add Item Form */}
        <Card className="lg:col-span-1">
          <CardHeader>
            <CardTitle className="text-lg">Add Menu Item</CardTitle>
            <CardDescription className="text-xs">Name & selling price</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleAddItem} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="itemName" className="text-sm">Item Name *</Label>
                <Input
                  id="itemName"
                  placeholder="e.g., Adobo Rice"
                  className="h-9 text-sm"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="itemCategory" className="text-sm">Category</Label>
                <select
                  id="itemCategory"
                  value={formData.category}
                  onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                  className="w-full border border-slate-300 rounded px-2 py-2 text-sm"
                >
                  <option value="Mains">Mains</option>
                  <option value="Appetizers">Appetizers</option>
                  <option value="Drinks">Drinks</option>
                  <option value="Desserts">Desserts</option>
                  <option value="Sides">Sides</option>
                </select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="itemPrice" className="text-sm">Selling Price (₱) *</Label>
                <Input
                  id="itemPrice"
                  type="number"
                  placeholder="e.g., 150"
                  className="h-9 text-sm"
                  step="0.01"
                  value={formData.sellingPrice}
                  onChange={(e) => setFormData({ ...formData, sellingPrice: e.target.value })}
                />
              </div>

              <Button type="submit" className="w-full bg-teal-600 hover:bg-teal-700 text-sm h-9">
                <PlusIcon className="w-4 h-4 mr-2" />
                Add Item
              </Button>
            </form>
          </CardContent>
        </Card>

        {/* Items List */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="text-lg">Your Menu Items ({posItems.length})</CardTitle>
            <CardDescription className="text-xs">Items you've added</CardDescription>
          </CardHeader>
          <CardContent>
            {posItems.length === 0 ? (
              <div className="text-center py-8">
                <p className="text-slate-500 text-sm">No menu items yet. Add your first item on the left!</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="text-xs">Name</TableHead>
                      <TableHead className="text-xs">Category</TableHead>
                      <TableHead className="text-right text-xs">Price</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {posItems.map((item) => (
                      <TableRow key={item.id}>
                        <TableCell className="font-medium text-sm">{item.name}</TableCell>
                        <TableCell className="text-xs text-slate-600">{item.category}</TableCell>
                        <TableCell className="text-right text-sm">₱ {item.sellingPrice}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Navigation */}
      <div className="flex gap-3 justify-center">
        <Button variant="outline" onClick={() => router.back()} className="h-10">
          Back
        </Button>
        <Button 
          onClick={handleContinue} 
          className="bg-teal-600 hover:bg-teal-700 h-10"
          disabled={posItems.length === 0}
        >
          Continue to Recipes →
        </Button>
      </div>
    </div>
  );
}
