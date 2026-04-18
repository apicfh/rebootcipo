"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { getLocationReviews, type TripadvisorReview } from "@/lib/services/tripadvisor-service"
import { Star, StarHalf } from "lucide-react"

interface TripadvisorReviewsProps {
  locationId: string
  limit?: number
}

export function TripadvisorReviews({ locationId, limit = 5 }: TripadvisorReviewsProps) {
  const [reviews, setReviews] = useState<TripadvisorReview[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    async function fetchReviews() {
      setLoading(true)
      setError(null)
      try {
        if (!locationId) {
          throw new Error("ID location non specificato")
        }

        console.log("Recupero recensioni per location ID:", locationId)
        const reviewsData = await getLocationReviews(locationId, limit)
        setReviews(reviewsData)
      } catch (err) {
        console.error("Errore nel recupero delle recensioni:", err)
        setError("Impossibile caricare le recensioni. Riprova più tardi.")
      } finally {
        setLoading(false)
      }
    }

    if (locationId) {
      fetchReviews()
    } else {
      setLoading(false)
      setError("ID location non specificato")
    }
  }, [locationId, limit])

  // Funzione per formattare la data
  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return new Intl.DateTimeFormat("it-IT", {
      year: "numeric",
      month: "long",
      day: "numeric",
    }).format(date)
  }

  // Funzione per renderizzare le stelle
  const renderStars = (rating: number) => {
    const stars = []
    const fullStars = Math.floor(rating)
    const hasHalfStar = rating % 1 >= 0.5

    for (let i = 0; i < fullStars; i++) {
      stars.push(<Star key={`star-${i}`} className="h-4 w-4 fill-yellow-400 text-yellow-400" />)
    }

    if (hasHalfStar) {
      stars.push(<StarHalf key="half-star" className="h-4 w-4 fill-yellow-400 text-yellow-400" />)
    }

    const emptyStars = 5 - fullStars - (hasHalfStar ? 1 : 0)
    for (let i = 0; i < emptyStars; i++) {
      stars.push(<Star key={`empty-star-${i}`} className="h-4 w-4 text-gray-300" />)
    }

    return stars
  }

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <img src="/icons/tripadvisor-logo.png" alt="Tripadvisor" width={24} height={24} className="mr-2" />
            Recensioni Tripadvisor
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex justify-center py-4">
            <div className="animate-pulse flex space-x-4">
              <div className="flex-1 space-y-4 py-1">
                <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                <div className="space-y-2">
                  <div className="h-4 bg-gray-200 rounded"></div>
                  <div className="h-4 bg-gray-200 rounded w-5/6"></div>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    )
  }

  if (error) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <img src="/icons/tripadvisor-logo.png" alt="Tripadvisor" width={24} height={24} className="mr-2" />
            Recensioni Tripadvisor
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-red-500">{error}</p>
        </CardContent>
      </Card>
    )
  }

  if (reviews.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <img src="/icons/tripadvisor-logo.png" alt="Tripadvisor" width={24} height={24} className="mr-2" />
            Recensioni Tripadvisor
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p>Nessuna recensione disponibile</p>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center">
          <img src="/icons/tripadvisor-logo.png" alt="Tripadvisor" width={24} height={24} className="mr-2" />
          Recensioni Tripadvisor
        </CardTitle>
        <CardDescription>Le ultime recensioni degli ospiti</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {reviews.map((review) => (
            <div key={review.id} className="border-b pb-4 last:border-b-0">
              <div className="flex items-center mb-2">
                <div className="flex mr-2">{renderStars(review.rating)}</div>
                <h3 className="font-semibold">{review.title}</h3>
              </div>
              <p className="text-sm text-gray-600 mb-2">{review.text}</p>
              <div className="flex justify-between items-center text-xs text-gray-500">
                <span>{review.user.username}</span>
                <span>{formatDate(review.published_date)}</span>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}
