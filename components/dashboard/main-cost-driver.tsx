"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { AlertCircleIcon } from "@/components/icons"

interface MainCostDriverProps {
  dishName: string
  ingredientName: string
  ingredientUsage: string
  unitPrice: string
  costPerDish: string
  foodCostPercent: string
  targetPercent: string
  salesCount: string
  impact: string
}

export function MainCostDriver({
  dishName,
  ingredientName,
  ingredientUsage,
  unitPrice,
  costPerDish,
  foodCostPercent,
  targetPercent,
  salesCount,
  impact,
}: MainCostDriverProps) {
  return (
    <Card className="border-2 border-amber-500 bg-gradient-to-r from-amber-50 to-orange-50">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-xl">
          <AlertCircleIcon className="w-6 h-6 text-amber-600" />
          Your #1 Cost Problem This Week
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Main insight in plain language */}
        <div className="space-y-2">
          <p className="text-2xl font-bold text-slate-900">{dishName}</p>
          <p className="text-lg text-slate-700">
            Uses <span className="font-bold text-red-600">{ingredientUsage} {ingredientName}</span> @ {unitPrice} ={" "}
            <span className="font-bold">{costPerDish} per dish</span>
          </p>
          <p className="text-sm text-slate-600">
            Food cost: <span className="font-bold text-red-600">{foodCostPercent}</span> (target: {targetPercent}) • Sold {salesCount} times this week •
            Impact: <span className="font-bold">{impact} lost profit</span>
          </p>
        </div>

        {/* Actionable suggestions */}
        <div className="bg-white rounded-lg p-4 space-y-3 border border-slate-200">
          <p className="font-semibold text-slate-900">Suggested Actions:</p>
          <div className="space-y-2">
            <Button variant="outline" className="w-full justify-start text-left h-auto py-3 bg-transparent" size="sm">
              <div className="flex-1">
                <div className="font-medium">Switch to lower-priced supplier for {ingredientName.toLowerCase()}</div>
                <div className="text-xs text-slate-600">Bring food cost closer to target without recipe changes</div>
              </div>
            </Button>
            <Button variant="outline" className="w-full justify-start text-left h-auto py-3 bg-transparent" size="sm">
              <div className="flex-1">
                <div className="font-medium">Adjust portion size for {ingredientName.toLowerCase()}</div>
                <div className="text-xs text-slate-600">Test a smaller portion to hit target range</div>
              </div>
            </Button>
            <Button variant="outline" className="w-full justify-start text-left h-auto py-3 bg-transparent" size="sm">
              <div className="flex-1">
                <div className="font-medium">Increase dish price slightly</div>
                <div className="text-xs text-slate-600">Restores margin without changing ingredients</div>
              </div>
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
