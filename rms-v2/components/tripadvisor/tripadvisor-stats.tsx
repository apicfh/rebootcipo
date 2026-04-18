"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import { AlertCircle } from "lucide-react"
import { BarChart } from "@/components/charts/bar-chart"
import { PieChart } from "@/components/charts/pie-chart"

interface TripadvisorStatsProps {
  locationId: string
}

type ReviewStats = {
  total: number
  average: number
  distribution: {
    excellent: number
    verygood: number
    average: number
    poor: number
    terrible: number
  }
  monthly: {
    month: string
    count: number
    average: number
  }[]
}

export function TripadvisorStats({ locationId }: TripadvisorStatsProps) {
  const [stats, setStats] = useState<ReviewStats | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    async function fetchReviewStats() {
      if (!locationId) return

      setLoading(true)
      try {
        const response = await fetch(`/api/tripadvisor/reviews?locationId=${locationId}&limit=100`)

        if (!response.ok) {
          throw new Error(`Errore nel recupero delle recensioni: ${response.status}`)
        }

        const reviews = await response.json()

        // Calcola le statistiche generali
        const total = reviews.length
        const sum = reviews.reduce((acc: number, review: any) => acc + review.rating, 0)
        const average = total > 0 ? sum / total : 0

        // Calcola la distribuzione delle valutazioni
        const distribution = {
          excellent: reviews.filter((r: any) => r.rating === 5).length,
          verygood: reviews.filter((r: any) => r.rating === 4).length,
          average: reviews.filter((r: any) => r.rating === 3).length,
          poor: reviews.filter((r: any) => r.rating === 2).length,
          terrible: reviews.filter((r: any) => r.rating === 1).length,
        }

        // Calcola le statistiche mensili (ultimi 6 mesi)
        const monthlyStats: { [key: string]: { count: number; sum: number } } = {}
        const now = new Date()
        const sixMonthsAgo = new Date()
        sixMonthsAgo.setMonth(now.getMonth() - 6)

        reviews.forEach((review: any) => {
          const reviewDate = new Date(review.published_date)
          if (reviewDate >= sixMonthsAgo) {
            const monthYear = `${reviewDate.getMonth() + 1}/${reviewDate.getFullYear()}`
            if (!monthlyStats[monthYear]) {
              monthlyStats[monthYear] = { count: 0, sum: 0 }
            }
            monthlyStats[monthYear].count++
            monthlyStats[monthYear].sum += review.rating
          }
        })

        // Converti in array e ordina per data
        const monthly = Object.entries(monthlyStats)
          .map(([month, data]) => ({
            month,
            count: data.count,
            average: data.sum / data.count,
          }))
          .sort((a, b) => {
            const [aMonth, aYear] = a.month.split("/").map(Number)
            const [bMonth, bYear] = b.month.split("/").map(Number)
            return aYear === bYear ? aMonth - bMonth : aYear - bYear
          })

        setStats({ total, average, distribution, monthly })
      } catch (err) {
        console.error("Errore nel recupero delle statistiche:", err)
        setError("Impossibile caricare le statistiche delle recensioni")
      } finally {
        setLoading(false)
      }
    }

    fetchReviewStats()
  }, [locationId])

  if (loading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-[300px] w-full" />
        <Skeleton className="h-[300px] w-full" />
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex items-center gap-2 text-red-500 p-4 border border-red-200 rounded-lg bg-red-50">
        <AlertCircle className="h-5 w-5" />
        <span>{error}</span>
      </div>
    )
  }

  if (!stats) {
    return <div className="text-center text-muted-foreground py-8">Nessun dato disponibile</div>
  }

  // Prepara i dati per i grafici
  const distributionData = [
    { name: "Eccellente (5★)", value: stats.distribution.excellent },
    { name: "Molto buono (4★)", value: stats.distribution.verygood },
    { name: "Nella media (3★)", value: stats.distribution.average },
    { name: "Scarso (2★)", value: stats.distribution.poor },
    { name: "Pessimo (1★)", value: stats.distribution.terrible },
  ]

  const monthlyData = stats.monthly.map((item) => ({
    name: item.month,
    Recensioni: item.count,
    Media: Number.parseFloat((item.average * 20).toFixed(1)), // Scala 0-5 a 0-100 per il grafico
  }))

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Distribuzione valutazioni</CardTitle>
            <CardDescription>Suddivisione delle recensioni per valutazione</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-[300px]">
              <PieChart data={distributionData} colors={["#4CAF50", "#8BC34A", "#FFC107", "#FF9800", "#F44336"]} />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Statistiche generali</CardTitle>
            <CardDescription>Riepilogo delle recensioni</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-gray-50 p-4 rounded-lg text-center">
                  <div className="text-3xl font-bold">{stats.total}</div>
                  <div className="text-sm text-muted-foreground">Recensioni totali</div>
                </div>
                <div className="bg-gray-50 p-4 rounded-lg text-center">
                  <div className="text-3xl font-bold">{stats.average.toFixed(1)}</div>
                  <div className="text-sm text-muted-foreground">Valutazione media</div>
                </div>
              </div>

              <div className="space-y-2">
                <div className="text-sm font-medium">Distribuzione valutazioni</div>
                <div className="space-y-1">
                  {Object.entries(stats.distribution).map(([key, value], index) => {
                    const labels = {
                      excellent: "Eccellente (5★)",
                      verygood: "Molto buono (4★)",
                      average: "Nella media (3★)",
                      poor: "Scarso (2★)",
                      terrible: "Pessimo (1★)",
                    }
                    const colors = ["bg-green-500", "bg-lime-500", "bg-yellow-500", "bg-orange-500", "bg-red-500"]
                    const percentage = stats.total > 0 ? (value / stats.total) * 100 : 0

                    return (
                      <div key={key} className="flex items-center gap-2">
                        <div className="text-xs w-32">{labels[key as keyof typeof labels]}</div>
                        <div className="flex-1 bg-gray-200 rounded-full h-2">
                          <div className={`${colors[index]} h-2 rounded-full`} style={{ width: `${percentage}%` }} />
                        </div>
                        <div className="text-xs w-12 text-right">{percentage.toFixed(1)}%</div>
                      </div>
                    )
                  })}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Andamento mensile</CardTitle>
          <CardDescription>Recensioni e valutazione media negli ultimi 6 mesi</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="h-[300px]">
            <BarChart
              data={monthlyData}
              categories={["Recensioni"]}
              index="name"
              colors={["#3B82F6"]}
              valueFormatter={(value) => `${value}`}
              yAxisWidth={40}
            />
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
