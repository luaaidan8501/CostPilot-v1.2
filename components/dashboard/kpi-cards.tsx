"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import type { DashboardKPI as DashboardKPIType } from "@/lib/types"
import { TrendingUpIcon } from "@/components/icons"

interface KPICardsProps {
  kpi: DashboardKPIType
}

export function DashboardKPI({ kpi }: KPICardsProps) {
  const { currentFoodCostPercentage, targetRange, projectedChange, potentialSavings, topCostDrivers } = kpi
  const isWithinTarget = currentFoodCostPercentage >= targetRange.min && currentFoodCostPercentage <= targetRange.max
  const isAboveTarget = currentFoodCostPercentage > targetRange.max

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      {/* Current Food Cost % */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium text-slate-600">Current Food Cost % (2 Weeks)</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <div className="flex items-baseline gap-2">
              <span
                className={`text-3xl font-bold ${
                  isWithinTarget ? "text-teal-600" : isAboveTarget ? "text-red-600" : "text-amber-600"
                }`}
              >
                {currentFoodCostPercentage}%
              </span>
            </div>
            <p className="text-xs text-slate-500">
              Target: {targetRange.min}–{targetRange.max}%
            </p>
            <div
              className={`inline-flex items-center gap-1 px-2 py-1 rounded text-xs font-medium ${
                isWithinTarget ? "bg-teal-100 text-teal-700" : "bg-red-100 text-red-700"
              }`}
            >
              {isWithinTarget ? "Within Target" : isAboveTarget ? "Above Target" : "Below Target"}
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium text-slate-600">Projected Food Cost (Next Week)</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <div className="flex items-baseline gap-2">
              <span className="text-3xl font-bold text-slate-900">33.5%</span>
              <span className="flex items-center gap-1 text-red-600">
                <TrendingUpIcon className="w-4 h-4" />
                <span className="text-sm font-medium">+{projectedChange}%</span>
              </span>
            </div>
            <p className="text-xs text-slate-500">Based on current recipes and latest ingredient prices</p>
            <p className="text-xs text-amber-600 font-medium">Above your 32% target</p>
          </div>
        </CardContent>
      </Card>

      {/* Top Cost Driver */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium text-slate-600">Top Cost Driver</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <div className="text-2xl font-bold text-slate-900">{topCostDrivers[0]?.ingredient}</div>
            <p className="text-xs text-slate-500">{topCostDrivers[0]?.percentage}% of plate costs</p>
            <p className="text-xs text-amber-600 font-medium">⚠ Highest cost impact</p>
          </div>
        </CardContent>
      </Card>

      {/* Potential Savings */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium text-slate-600">Potential Monthly Savings</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <div className="flex items-baseline gap-2">
              <span className="text-3xl font-bold text-emerald-600">₱ {potentialSavings.toLocaleString()}</span>
            </div>
            <p className="text-xs text-slate-500">If you switch to median supplier prices</p>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
