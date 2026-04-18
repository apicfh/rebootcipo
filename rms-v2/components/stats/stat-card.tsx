import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import type { LucideIcon } from "lucide-react"

interface StatCardProps {
  title: string
  value: string | number
  description?: string
  icon?: LucideIcon
  trend?: "up" | "down" | "stable"
  trendValue?: string | number
  className?: string
}

export function StatCard({ title, value, description, icon: Icon, trend, trendValue, className }: StatCardProps) {
  return (
    <Card className={`border-2 border-secondary-300 shadow-md hover:shadow-lg transition-shadow ${className}`}>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium text-primary">{title}</CardTitle>
        {Icon && <Icon className="h-4 w-4 text-accent-500" />}
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">{value}</div>
        {description && <CardDescription className="text-accent-600">{description}</CardDescription>}
        {trend && trendValue && (
          <p
            className={`text-xs ${
              trend === "up" ? "text-green-600" : trend === "down" ? "text-red-600" : "text-gray-500"
            }`}
          >
            {trend === "up" ? "↑" : trend === "down" ? "↓" : "→"} {trendValue}
          </p>
        )}
      </CardContent>
    </Card>
  )
}
