'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useAnalyticsData, useDashboardSummary } from '@/lib/hooks';
import { ChartContainer } from '@/components/ui/chart';
import { Area, AreaChart, CartesianGrid, ReferenceLine, XAxis, YAxis } from 'recharts';

interface FoodCostChartProps {
  dishName?: string | null;
}

export function FoodCostChart({ dishName }: FoodCostChartProps) {
  const { data: chartData } = useAnalyticsData();
  const { data: kpi } = useDashboardSummary();

  const filtered = dishName
    ? chartData.filter((point) => point.dishName === dishName)
    : chartData;
  const sliced = filtered.slice(-14);
  const series = sliced.length
    ? sliced.map((d, index) => ({
        label: `Day ${index + 1}`,
        value: d.foodCostPercentage,
      }))
    : Array.from({ length: 14 }).map((_, index) => ({
        label: `Day ${index + 1}`,
        value: kpi?.currentFoodCostPercentage ?? 0,
      }));

  const avgFoodCost = series.reduce((sum, d) => sum + d.value, 0) / (series.length || 1);
  const projected = (kpi?.currentFoodCostPercentage ?? 0) + (kpi?.projectedChange ?? 0);
  const targetMin = kpi?.targetRange?.min ?? 28;
  const targetMax = kpi?.targetRange?.max ?? 32;

  return (
    <Card>
      <CardHeader>
        <CardTitle>2-Week Food Cost + Projection</CardTitle>
        <CardDescription>
          {dishName ? `Focused on ${dishName}` : 'Focus on the last 14 days with a clear projected trend'}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
          <div className="space-y-2">
            <p className="text-sm text-slate-600">Average (Last 14 Days)</p>
            <p className="text-3xl font-bold text-teal-600">{avgFoodCost.toFixed(1)}%</p>
          </div>
          <div className="space-y-2">
            <p className="text-sm text-slate-600">Projected (Next 2 Weeks)</p>
            <p className="text-3xl font-bold text-slate-900">{projected.toFixed(1)}%</p>
          </div>
          <div className="space-y-2">
            <p className="text-sm text-slate-600">Target Range</p>
            <p className="text-2xl font-bold text-slate-700">
              {targetMin}–{targetMax}%
            </p>
          </div>
        </div>
        <ChartContainer
          config={{
            value: { label: 'Food Cost %', color: 'hsl(var(--chart-1))' },
          }}
          className="h-56 w-full"
        >
          <AreaChart data={series} margin={{ left: 0, right: 12, top: 10 }}>
            <CartesianGrid vertical={false} />
            <XAxis dataKey="label" tickLine={false} axisLine={false} tickMargin={8} />
            <YAxis tickLine={false} axisLine={false} tickMargin={8} domain={[0, 'auto']} />
            <ReferenceLine y={targetMax} stroke="hsl(var(--chart-3))" strokeDasharray="4 4" />
            <Area
              type="monotone"
              dataKey="value"
              stroke="var(--color-value)"
              fill="var(--color-value)"
              fillOpacity={0.18}
            />
          </AreaChart>
        </ChartContainer>
      </CardContent>
    </Card>
  );
}
