import { Phone, Hotel, TrendingUp, Euro, ArrowUp, ArrowDown } from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"

interface MobileStatCardProps {
  title: string
  value: string | number
  trend: number[]
  trendDirection: "up" | "down" | "neutral"
  icon: "phone" | "hotel" | "trending-up" | "euro"
  color: "blue" | "green" | "amber" | "purple" | "red"
}

export function MobileStatCard({ title, value, trend, trendDirection, icon, color }: MobileStatCardProps) {
  // Colori per le diverse categorie
  const colorClasses = {
    blue: "bg-blue-50 text-blue-700 border-blue-200",
    green: "bg-green-50 text-green-700 border-green-200",
    amber: "bg-amber-50 text-amber-700 border-amber-200",
    purple: "bg-purple-50 text-purple-700 border-purple-200",
    red: "bg-red-50 text-red-700 border-red-200",
  }

  // Icone per le diverse categorie
  const IconComponent = () => {
    switch (icon) {
      case "phone":
        return <Phone className="h-5 w-5" />
      case "hotel":
        return <Hotel className="h-5 w-5" />
      case "trending-up":
        return <TrendingUp className="h-5 w-5" />
      case "euro":
        return <Euro className="h-5 w-5" />
      default:
        return <TrendingUp className="h-5 w-5" />
    }
  }

  // Normalizza i valori del trend per il grafico mini
  const normalizedTrend =
    trend && trend.length > 0
      ? trend.map((value) => {
          const max = Math.max(...trend)
          const min = Math.min(...trend)
          const range = max - min || 1
          return ((value - min) / range) * 100
        })
      : []

  // Calcola la larghezza di ciascuna barra
  const barWidth = trend && trend.length > 0 ? 100 / trend.length : 10

  return (
    <Card className={`border ${colorClasses[color]} overflow-hidden`}>
      <CardContent className="p-4">
        <div className="flex items-center justify-between">
          <div className="flex-1">
            <div className="flex items-center space-x-2">
              <div className={`p-2 rounded-full ${colorClasses[color]}`}>
                <IconComponent />
              </div>
              <h3 className="text-sm font-medium text-gray-600">{title}</h3>
            </div>
            <div className="mt-2 flex items-end">
              <span className="text-2xl font-bold">{value}</span>
              <div className="ml-2 flex items-center">
                {trendDirection === "up" ? (
                  <ArrowUp className="h-4 w-4 text-green-500" />
                ) : trendDirection === "down" ? (
                  <ArrowDown className="h-4 w-4 text-red-500" />
                ) : null}
              </div>
            </div>
          </div>

          {/* Mini grafico a barre */}
          <div className="flex items-end h-12 space-x-[2px]">
            {normalizedTrend.map((height, index) => (
              <div
                key={index}
                className={`w-[3px] rounded-t-sm ${trendDirection === "up" ? "bg-green-400" : "bg-red-400"}`}
                style={{
                  height: `${Math.max(5, height)}%`,
                }}
              />
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
