"use client"

import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { useDishesOverTarget } from "@/lib/hooks"
import { AlertTriangleIcon } from "@/components/icons"

export function DishesOverTargetTable() {
  const { data: dishes } = useDishesOverTarget()

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <AlertTriangleIcon className="w-5 h-5 text-amber-600" />
          Dishes Over Target
        </CardTitle>
        <CardDescription>Menu items with food cost exceeding target for the last 2 weeks</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Dish</TableHead>
                <TableHead>Main Ingredient</TableHead>
                <TableHead className="text-right">Food Cost %</TableHead>
                <TableHead className="text-right">Target</TableHead>
                <TableHead className="text-right">Variance</TableHead>
                <TableHead className="text-right">Sales Vol.</TableHead>
                <TableHead className="text-right">Revenue Impact</TableHead>
                <TableHead>Action</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {dishes.map((dish) => (
                <TableRow key={dish.dish}>
                  <TableCell className="font-medium">{dish.dish}</TableCell>
                  <TableCell>
                    <div className="text-sm">
                      <div className="font-medium">{dish.mainIngredient}</div>
                      <div className="text-xs text-slate-500">
                        {dish.ingredientAmount} @ ₱{dish.ingredientPrice}/{dish.ingredientUnit}
                      </div>
                    </div>
                  </TableCell>
                  <TableCell className="text-right text-red-600 font-medium">{dish.foodCostPercentage}%</TableCell>
                  <TableCell className="text-right">{dish.target}%</TableCell>
                  <TableCell className="text-right">
                    <span className="text-red-600 font-medium">+{dish.variance}%</span>
                  </TableCell>
                  <TableCell className="text-right">{dish.salesVolume}</TableCell>
                  <TableCell className="text-right">₱ {dish.revenueImpact}</TableCell>
                  <TableCell>
                    <Button variant="ghost" size="sm">
                      Review
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  )
}
