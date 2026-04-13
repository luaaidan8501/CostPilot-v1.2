"use client"

import { useState } from "react"
import { useAlerts, useIngredients } from "@/lib/hooks"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { AlertCircleIcon, AlertTriangleIcon, InfoIcon } from "@/components/icons"
import { suggestIngredientAlternatives } from "@/lib/ai"
import { mockAlerts, mockIngredients } from "@/lib/mock-data"

export default function AlertsPage() {
  const [filterStatus, setFilterStatus] = useState("open")
  const [filterSeverity, setFilterSeverity] = useState<string | undefined>(undefined)

  const { data: alerts } = useAlerts({
    status: filterStatus as any,
    severity: filterSeverity || undefined,
  })
  const { data: ingredients } = useIngredients()
  const activeIngredients = ingredients.length ? ingredients : mockIngredients
  const activeAlerts = (alerts.length ? alerts : mockAlerts).filter((alert) => {
    if (filterStatus && alert.status !== filterStatus) return false
    if (filterSeverity && alert.severity !== filterSeverity) return false
    return true
  })

  const getSeverityIcon = (severity: string) => {
    switch (severity) {
      case "critical":
        return <AlertCircleIcon className="w-5 h-5 text-red-600" />
      case "warning":
        return <AlertTriangleIcon className="w-5 h-5 text-amber-600" />
      default:
        return <InfoIcon className="w-5 h-5 text-blue-600" />
    }
  }

  const getSeverityBg = (severity: string) => {
    switch (severity) {
      case "critical":
        return "bg-red-50 border-l-4 border-red-600"
      case "warning":
        return "bg-amber-50 border-l-4 border-amber-600"
      default:
        return "bg-blue-50 border-l-4 border-blue-600"
    }
  }

  const formatDate = (date: Date) => {
    return new Date(date).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    })
  }

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto">
      <div className="text-center md:text-left">
        <h1 className="text-3xl font-bold text-slate-900">Alerts & Notifications</h1>
        <p className="text-slate-600 mt-1">Action items and alerts for your restaurant</p>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <Select value={filterStatus} onValueChange={setFilterStatus}>
          <SelectTrigger className="w-full sm:w-40">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="open">Open</SelectItem>
            <SelectItem value="snoozed">Snoozed</SelectItem>
            <SelectItem value="resolved">Resolved</SelectItem>
          </SelectContent>
        </Select>

        <div className="relative w-full sm:w-40">
          <Select value={filterSeverity} onValueChange={setFilterSeverity}>
            <SelectTrigger className="w-full">
              <SelectValue placeholder="All Severities" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="critical">Critical</SelectItem>
              <SelectItem value="warning">Warning</SelectItem>
              <SelectItem value="info">Info</SelectItem>
            </SelectContent>
          </Select>
          {filterSeverity && (
            <Button
              variant="ghost"
              size="sm"
              className="absolute right-8 top-1/2 -translate-y-1/2 h-5 w-5 p-0 hover:bg-slate-100"
              onClick={() => setFilterSeverity(undefined)}
            >
              ×
            </Button>
          )}
        </div>
      </div>

      {/* Alerts List */}
      <div className="space-y-4">
        {activeAlerts.length > 0 ? (
          activeAlerts.map((alert) => (
            <div key={alert.id} className={`p-4 rounded-lg ${getSeverityBg(alert.severity)}`}>
              <div className="flex flex-col md:flex-row items-start gap-4">
                <div className="pt-1 flex-shrink-0">{getSeverityIcon(alert.severity)}</div>
                <div className="flex-1 min-w-0">
                  <div className="flex flex-col md:flex-row md:items-center md:gap-2 mb-1">
                    <h3 className="font-semibold text-slate-900">{alert.title}</h3>
                    <Badge variant="secondary" className="text-xs w-fit">
                      {alert.type}
                    </Badge>
                  </div>
                  <p className="text-slate-700 mb-2 break-words">{alert.description}</p>
                  {alert.type === "ingredient" && (
                    <div className="bg-white/70 border border-slate-200 rounded-md p-3 mb-2">
                      <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide">
                        Smart Suggestions
                      </p>
                      {(() => {
                        const ingredient = activeIngredients.find((item) => item.id === alert.relatedId)
                        const suggestions = suggestIngredientAlternatives(ingredient, activeIngredients)
                        if (suggestions.length === 0) {
                          return (
                            <p className="text-sm text-slate-600 mt-1">
                              No suggestions yet. Add more ingredient benchmarks to improve results.
                            </p>
                          )
                        }
                        return (
                          <div className="mt-2 space-y-1">
                            {suggestions.map((suggestion) => (
                              <p key={suggestion.name} className="text-sm text-slate-700">
                                <span className="font-medium">{suggestion.name}</span> — {suggestion.reason}
                              </p>
                            ))}
                            <p className="text-xs text-slate-500 mt-1">
                              Rule-based suggestions (AI-ready).
                            </p>
                          </div>
                        )
                      })()}
                    </div>
                  )}
                  <p className="text-xs text-slate-500">{formatDate(alert.date)}</p>
                </div>
                <div className="flex gap-2 w-full md:w-auto flex-shrink-0">
                  <Button variant="ghost" size="sm" className="flex-1 md:flex-none">
                    {alert.type === "ingredient"
                      ? "View Ingredient"
                      : alert.type === "dish"
                        ? "View Recipe"
                        : "View Details"}
                  </Button>
                  <Button variant="outline" size="sm" className="flex-1 md:flex-none bg-transparent">
                    Snooze 7d
                  </Button>
                </div>
              </div>
            </div>
          ))
        ) : (
          <Card>
            <CardContent className="flex items-center justify-center py-12">
              <p className="text-slate-600">No alerts to display</p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  )
}
