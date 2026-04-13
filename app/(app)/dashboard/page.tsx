"use client"

import { useDashboardSummary, useDishesOverTarget } from "@/lib/hooks"
import { FoodCostChart } from "@/components/dashboard/food-cost-chart"
import { MainCostDriver } from "@/components/dashboard/main-cost-driver"
import { Skeleton } from "@/components/ui/skeleton"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { ShieldCheckIcon } from "@/components/icons"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

export default function DashboardPage() {
  const [selectedDish, setSelectedDish] = useState<string>("all")
  const { data: kpi, isLoading } = useDashboardSummary()
  const { data: dishesOverTarget } = useDishesOverTarget()
  const topWorstPerformers = dishesOverTarget.slice(0, 10)
  const mainDish = topWorstPerformers[0]
  const mainIngredient = kpi?.topCostDrivers?.[0]?.ingredient ?? "Chicken Thigh"
  const ingredientUsage = mainIngredient.toLowerCase().includes("chicken") ? "0.20 kg" : "0.15 kg"

  if (isLoading) {
    return (
      <div className="p-6 space-y-4 max-w-7xl mx-auto">
        <Skeleton className="h-40 w-full" />
        <Skeleton className="h-96 w-full" />
      </div>
    )
  }

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto">
      <div className="text-center md:text-left">
        <h1 className="text-3xl font-bold text-slate-900">Dashboard</h1>
        <p className="text-slate-600 mt-1">Track your food costs in real-time</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <MainCostDriver
          dishName={mainDish?.dish ?? "Chicken Adobo Plate"}
          ingredientName={mainIngredient}
          ingredientUsage={ingredientUsage}
          unitPrice="₱180/kg"
          costPerDish="₱36"
          foodCostPercent={`${mainDish?.foodCostPercentage ?? 36}%`}
          targetPercent={`${mainDish?.target ?? 30}%`}
          salesCount={`${mainDish?.salesVolume ?? 45}`}
          impact={`₱${mainDish?.revenueImpact ?? 360}`}
        />
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <p className="text-sm font-medium text-slate-600">Select dish for 2-week trend</p>
            <Select value={selectedDish} onValueChange={setSelectedDish}>
              <SelectTrigger className="w-[220px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All dishes</SelectItem>
                {topWorstPerformers.map((dish) => (
                  <SelectItem key={dish.dish} value={dish.dish}>
                    {dish.dish}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <FoodCostChart dishName={selectedDish === "all" ? null : selectedDish} />
        </div>
      </div>

      <Card className="border border-emerald-200 bg-emerald-50">
        <CardContent className="py-4 flex flex-col md:flex-row md:items-center md:justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-emerald-100 rounded-full">
              <ShieldCheckIcon className="w-5 h-5 text-emerald-700" />
            </div>
            <div>
              <p className="font-semibold text-emerald-900">Your recipes are private and secure</p>
              <p className="text-sm text-emerald-800">
                We use recipes only to calculate costs. They are never shared outside your restaurant.
              </p>
            </div>
          </div>
          <div className="text-sm text-emerald-900 font-medium">Confidence: high</div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Dish Watchlist (Last 2 Weeks)</CardTitle>
          <CardDescription>Prioritize dishes that are above target</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Dish</TableHead>
                  <TableHead className="text-right">Food Cost %</TableHead>
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
    </div>
  )
}
