"use client"

import { useDashboardSummary } from "@/lib/hooks"
import { DashboardKPI } from "@/components/dashboard/kpi-cards"
import { FoodCostChart } from "@/components/dashboard/food-cost-chart"
import { DishesOverTargetTable } from "@/components/dashboard/dishes-over-target"
import { MainCostDriver } from "@/components/dashboard/main-cost-driver"
import { Skeleton } from "@/components/ui/skeleton"

export default function DashboardPage() {
  const { data: kpi, isLoading } = useDashboardSummary()

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

      <MainCostDriver />

      <DashboardKPI kpi={kpi} />
      <FoodCostChart />
      <DishesOverTargetTable />
    </div>
  )
}
