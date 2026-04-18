"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Star, ArrowUpRight, AlertCircle } from "lucide-react"
import { Skeleton } from "@/components/ui/skeleton"
import Link from "next/link"

type Hotel = {
  id: string
  nome: string
  tripadvisor_id?: string
}

type RecentReviewsStats = {
  total: number
  average: number
  distribution: {
    excellent: number
    verygood: number
    average: number
    poor: number
    terrible: number
  }
}

export function HotelTripadvisorCard({ hotel }: { hotel: Hotel }) {
  const [stats, setStats] = useState<RecentReviewsStats | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    async function fetchRecentReviews() {
      if (!hotel.tripadvisor_id) return

      setLoading(true)
      try {
        // Ottieni le recensioni delle ultime 2 settimane
        const twoWeeksAgo = new Date()
        twoWeeksAgo.setDate(twoWeeksAgo.getDate() - 14)

        // Limitiamo a 5 recensioni come specificato dall'API di Tripadvisor
        const response = await fetch(`/api/tripadvisor/reviews?locationId=${hotel.tripadvisor_id}&limit=5`)

        if (!response.ok) {
          throw new Error(`Errore nel recupero delle recensioni: ${response.status}`)
        }

        const data = await response.json()
        const reviews = data.reviews || []

        // Filtra le recensioni delle ultime 2 settimane
        const recentReviews = reviews.filter((review: any) => {
          const reviewDate = new Date(review.published_date)
          return reviewDate >= twoWeeksAgo
        })

        // Calcola le statistiche
        const total = recentReviews.length
        const sum = recentReviews.reduce((acc: number, review: any) => acc + review.rating, 0)
        const average = total > 0 ? sum / total : 0

        // Calcola la distribuzione delle valutazioni
        const distribution = {
          excellent: recentReviews.filter((r: any) => r.rating === 5).length,
          verygood: recentReviews.filter((r: any) => r.rating === 4).length,
          average: recentReviews.filter((r: any) => r.rating === 3).length,
          poor: recentReviews.filter((r: any) => r.rating === 2).length,
          terrible: recentReviews.filter((r: any) => r.rating === 1).length,
        }

        setStats({ total, average, distribution })
      } catch (err) {
        console.error("Errore nel recupero delle recensioni recenti:", err)
        setError("Impossibile caricare le recensioni recenti")
      } finally {
        setLoading(false)
      }
    }

    fetchRecentReviews()
  }, [hotel.tripadvisor_id])

  // Funzione per renderizzare le stelle in base al rating
  const renderStars = (rating: number) => {
    const stars = []
    const fullStars = Math.floor(rating)
    const hasHalfStar = rating % 1 >= 0.5

    for (let i = 0; i < fullStars; i++) {
      stars.push(<Star key={`star-${i}`} className="w-4 h-4 fill-yellow-400 text-yellow-400" />)
    }

    if (hasHalfStar) {
      stars.push(<Star key="half-star" className="w-4 h-4 fill-yellow-400 text-yellow-400 fill-half" />)
    }

    return stars
  }

  return (
    <Card className="overflow-hidden">
      <CardHeader className="pb-2">
        <CardTitle>{hotel.nome}</CardTitle>
        <CardDescription>Recensioni ultime 2 settimane</CardDescription>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="space-y-2">
            <Skeleton className="h-20 w-full" />
            <div className="flex justify-between">
              <Skeleton className="h-4 w-1/3" />
              <Skeleton className="h-4 w-1/3" />
            </div>
          </div>
        ) : error ? (
          <div className="flex items-center gap-2 text-red-500">
            <AlertCircle className="h-4 w-4" />
            <span>{error}</span>
          </div>
        ) : stats ? (
          <div className="space-y-4">
            <div className="flex flex-col items-center justify-center p-4 bg-gray-50 rounded-lg">
              <div className="text-4xl font-bold">{stats.total}</div>
              <div className="text-sm text-muted-foreground">Nuove recensioni</div>
            </div>

            {stats.total > 0 ? (
              <>
                <div className="flex items-center justify-center gap-1">
                  {renderStars(stats.average)}
                  <span className="ml-1 text-sm font-medium">{stats.average.toFixed(1)}</span>
                </div>

                <div className="grid grid-cols-5 gap-1 text-xs text-center">
                  <div>
                    <div className="font-medium">{stats.distribution.excellent}</div>
                    <div className="text-muted-foreground">5★</div>
                  </div>
                  <div>
                    <div className="font-medium">{stats.distribution.verygood}</div>
                    <div className="text-muted-foreground">4★</div>
                  </div>
                  <div>
                    <div className="font-medium">{stats.distribution.average}</div>
                    <div className="text-muted-foreground">3★</div>
                  </div>
                  <div>
                    <div className="font-medium">{stats.distribution.poor}</div>
                    <div className="text-muted-foreground">2★</div>
                  </div>
                  <div>
                    <div className="font-medium">{stats.distribution.terrible}</div>
                    <div className="text-muted-foreground">1★</div>
                  </div>
                </div>
              </>
            ) : (
              <div className="text-center text-muted-foreground py-2">Nessuna recensione nelle ultime 2 settimane</div>
            )}
          </div>
        ) : (
          <div className="text-center text-muted-foreground py-4">Nessun dato disponibile</div>
        )}
      </CardContent>
      <CardFooter className="pt-2">
        <Button variant="outline" className="w-full" asChild>
          <Link href={`/statistiche/tripadvisor/hotel/${hotel.id}`} className="flex items-center justify-center gap-1">
            <span>Visualizza dettagli</span>
            <ArrowUpRight className="h-4 w-4" />
          </Link>
        </Button>
      </CardFooter>
    </Card>
  )
}
