"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { AlertCircleIcon } from "@/components/icons"

export function MainCostDriver() {
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
          <p className="text-2xl font-bold text-slate-900">Pork Sisig Rice Bowl</p>
          <p className="text-lg text-slate-700">
            Uses <span className="font-bold text-red-600">150g pork belly</span> @ ₱220/kg ={" "}
            <span className="font-bold">₱33 per dish</span>
          </p>
          <p className="text-sm text-slate-600">
            Food cost: <span className="font-bold text-red-600">38%</span> (target: 30%) • Sold 45 times this week •
            Impact: <span className="font-bold">₱360 lost profit</span>
          </p>
        </div>

        {/* Actionable suggestions */}
        <div className="bg-white rounded-lg p-4 space-y-3 border border-slate-200">
          <p className="font-semibold text-slate-900">Suggested Actions:</p>
          <div className="space-y-2">
            <Button variant="outline" className="w-full justify-start text-left h-auto py-3 bg-transparent" size="sm">
              <div className="flex-1">
                <div className="font-medium">Switch to Supplier B for pork</div>
                <div className="text-xs text-slate-600">Save ₱15/kg (brings food cost to 32%)</div>
              </div>
            </Button>
            <Button variant="outline" className="w-full justify-start text-left h-auto py-3 bg-transparent" size="sm">
              <div className="flex-1">
                <div className="font-medium">Reduce portion to 120g</div>
                <div className="text-xs text-slate-600">Brings food cost to 30.4% (target range)</div>
              </div>
            </Button>
            <Button variant="outline" className="w-full justify-start text-left h-auto py-3 bg-transparent" size="sm">
              <div className="flex-1">
                <div className="font-medium">Increase price to ₱280</div>
                <div className="text-xs text-slate-600">Brings food cost to 31% (no recipe change)</div>
              </div>
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
