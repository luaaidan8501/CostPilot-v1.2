'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useAnalyticsData } from '@/lib/hooks';

export function FoodCostChart() {
  const { data: chartData } = useAnalyticsData();

  const avgFoodCost = chartData.reduce((sum, d) => sum + d.foodCostPercentage, 0) / chartData.length || 0;
  const maxFoodCost = Math.max(...chartData.map(d => d.foodCostPercentage), 0);
  const minFoodCost = Math.min(...chartData.map(d => d.foodCostPercentage), 100);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Food Cost % Over Time</CardTitle>
        <CardDescription>Track your food cost percentage against target range (28–32%)</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="space-y-2">
            <p className="text-sm text-slate-600">Average Food Cost %</p>
            <p className="text-3xl font-bold text-teal-600">{avgFoodCost.toFixed(1)}%</p>
          </div>
          <div className="space-y-2">
            <p className="text-sm text-slate-600">Highest</p>
            <p className="text-3xl font-bold text-red-600">{maxFoodCost.toFixed(1)}%</p>
          </div>
          <div className="space-y-2">
            <p className="text-sm text-slate-600">Lowest</p>
            <p className="text-3xl font-bold text-green-600">{minFoodCost.toFixed(1)}%</p>
          </div>
        </div>
        <div className="mt-6 p-4 bg-teal-50 rounded-lg border border-teal-200">
          <p className="text-sm text-slate-700">
            <span className="font-semibold">Target Range:</span> 28–32% food cost is ideal for profitability
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
