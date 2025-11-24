'use client';

import { useState } from 'react';
import { useAnalyticsData, useDishesOverTarget } from '@/lib/hooks';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
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

export default function AnalyticsPage() {
  const [dateRange, setDateRange] = useState('30days');

  const { data: dishesOverTarget } = useDishesOverTarget();

  const topWorstPerformers = dishesOverTarget.slice(0, 10);

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto">
      <div className="text-center md:text-left">
        <h1 className="text-3xl font-bold text-slate-900">Analytics</h1>
        <p className="text-slate-600 mt-1">Analyze trends and performance</p>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <Select value={dateRange} onValueChange={setDateRange}>
          <SelectTrigger className="w-full sm:w-40">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="7days">Last 7 days</SelectItem>
            <SelectItem value="30days">Last 30 days</SelectItem>
            <SelectItem value="90days">Last 90 days</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Simple Performance Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Average Food Cost %</CardTitle>
            <CardDescription>For selected period</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-4xl font-bold text-teal-600">30.2%</div>
            <p className="text-sm text-slate-600 mt-2">Target: 28–32%</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Dishes Over Target</CardTitle>
            <CardDescription>In current period</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-4xl font-bold text-red-600">{dishesOverTarget.length}</div>
            <p className="text-sm text-slate-600 mt-2">Require attention</p>
          </CardContent>
        </Card>
      </div>

      {/* Tables */}
      <Tabs defaultValue="dishes" className="space-y-4">
        <TabsList>
          <TabsTrigger value="dishes">Dishes Over Target</TabsTrigger>
          <TabsTrigger value="volatility">Volatile Ingredients</TabsTrigger>
        </TabsList>

        <TabsContent value="dishes" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Dishes Over Target (Last 30 Days)</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Dish</TableHead>
                      <TableHead className="text-right">Avg Food Cost %</TableHead>
                      <TableHead className="text-right">Target</TableHead>
                      <TableHead className="text-right">Variance</TableHead>
                      <TableHead className="text-right">Sales Volume</TableHead>
                      <TableHead className="text-right">Revenue Impact</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {topWorstPerformers.map((dish) => (
                      <TableRow key={dish.dish}>
                        <TableCell className="font-medium">{dish.dish}</TableCell>
                        <TableCell className="text-right text-red-600">{dish.foodCostPercentage}%</TableCell>
                        <TableCell className="text-right">{dish.target}%</TableCell>
                        <TableCell className="text-right text-red-600 font-medium">+{dish.variance}%</TableCell>
                        <TableCell className="text-right">{dish.salesVolume}</TableCell>
                        <TableCell className="text-right">₱ {dish.revenueImpact}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="volatility" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Most Volatile Ingredients</CardTitle>
              <CardDescription>Ingredients with significant price fluctuations</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {[
                  { name: 'Chicken Thigh', change: '+18%', usage: 'High', impact: 'Critical' },
                  { name: 'Cooking Oil', change: '+12%', usage: 'Medium', impact: 'High' },
                  { name: 'Pork Belly', change: '+8%', usage: 'Medium', impact: 'Medium' },
                ].map((item) => (
                  <div key={item.name} className="flex flex-col md:flex-row md:items-center justify-between p-3 bg-slate-50 rounded-lg gap-2 md:gap-0">
                    <div>
                      <p className="font-medium">{item.name}</p>
                      <div className="flex gap-3 mt-1 text-xs text-slate-600">
                        <span>Usage: {item.usage}</span>
                        <span>Impact: {item.impact}</span>
                      </div>
                    </div>
                    <div className="text-red-600 font-medium text-lg">{item.change}</div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
