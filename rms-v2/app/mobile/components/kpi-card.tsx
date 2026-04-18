"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { MiniBarChart } from "@/components/charts/mini-bar-chart"
import { ArrowUp, ArrowDown } from "lucide-react"
import type { LucideIcon } from "lucide-react"

interface KpiCardProps {
  title: string
  value: string
  subtitle?: string
  icon: LucideIcon
  iconColor?: string
  trendData?: number[]
  showTrend?: boolean
  sdlyValue?: number
  formatValue?: (value: number) => string
}

export function KpiCard({
  title,
  value,
  subtitle,
  icon: Icon,
  iconColor = "text-accent-500",
  trendData = [],
  showTrend = false,
  sdlyValue,
  formatValue,
}: KpiCardProps) {
  const hasSdly = sdlyValue !== undefined
  let difference = 0
  let percentDifference = 0
  let isPositive = false

  if (hasSdly) {
    const currentValue = Number.parseFloat(value.replace(/[^0-9.-]/g, ""))
    difference = currentValue - sdlyValue
    percentDifference = sdlyValue > 0 ? (difference / sdlyValue) * 100 : 0
    isPositive = difference >= 0
  }

  return (
    <Card className="border-2 border-secondary-300 shadow-md">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium text-primary">{title}</CardTitle>
        <Icon className={`h-4 w-4 ${iconColor}`} />
      </CardHeader>
      <CardContent className="pt-0">
        <div className="flex items-center justify-between">
          <div className="flex-1">
            <div className="text-2xl font-bold">{value}</div>
            {subtitle && <p className="text-xs text-accent-600">{subtitle}</p>}

            {hasSdly && (
              <div className="mt-2 flex items-center gap-1">
                <div
                  className={`flex items-center text-xs font-medium ${isPositive ? "text-green-600" : "text-red-600"}`}
                >
                  {isPositive ? <ArrowUp className="h-3 w-3" /> : <ArrowDown className="h-3 w-3" />}
                  <span>{formatValue ? formatValue(Math.abs(difference)) : Math.abs(difference).toFixed(0)}</span>
                  <span className="ml-1">
                    ({isPositive ? "+" : ""}
                    {percentDifference.toFixed(1)}%)
                  </span>
                </div>
                <span className="text-xs text-muted-foreground">vs SDLY</span>
              </div>
            )}
          </div>
          <MiniBarChart data={trendData} showChart={showTrend} />
        </div>
      </CardContent>
    </Card>
  )
}
