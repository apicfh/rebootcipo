"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Star, MapPin, Globe, Phone, ExternalLink } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"

type TripadvisorLocation = {
  location_id: string
  name: string
  description: string
  web_url: string
  address_obj: {
    street1: string
    city: string
    country: string
    postalcode: string
  }
  rating: number
  num_reviews: number
  phone: string
  website: string
  photo: {
    images: {
      small: { url: string }
      medium: { url: string }
      large: { url: string }
    }
  }
}

interface TripadvisorLocationDetailsProps {
  locationId: string
}

export function TripadvisorLocationDetails({ locationId }: TripadvisorLocationDetailsProps) {
  const [location, setLocation] = useState<TripadvisorLocation | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    async function fetchLocationDetails() {
      if (!locationId) return

      setLoading(true)
      try {
        const response = await fetch(`/api/tripadvisor/location?locationId=${locationId}`)

        if (!response.ok) {
          throw new Error(`Errore nel recupero dei dettagli: ${response.status}`)
        }

        const data = await response.json()
        setLocation(data)
      } catch (err) {
        console.error("Errore nel recupero dei dettagli:", err)
        setError("Impossibile caricare i dettagli della struttura")
      } finally {
        setLoading(false)
      }
    }

    fetchLocationDetails()
  }, [locationId])

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

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Dettagli Tripadvisor</CardTitle>
          <CardDescription>Caricamento dettagli in corso...</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col md:flex-row gap-4">
            <Skeleton className="h-40 w-full md:w-1/3 rounded-md" />
            <div className="w-full md:w-2/3 space-y-2">
              <Skeleton className="h-6 w-3/4" />
              <Skeleton className="h-4 w-1/2" />
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-5/6" />
              <div className="flex gap-2 mt-4">
                <Skeleton className="h-9 w-28" />
                <Skeleton className="h-9 w-28" />
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
          <CardTitle>Dettagli Tripadvisor</CardTitle>
          <CardDescription className="text-red-500">{error}</CardDescription>
        </CardHeader>
      </Card>
    )
  }

  if (!location) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Dettagli Tripadvisor</CardTitle>
          <CardDescription>Nessun dettaglio disponibile</CardDescription>
        </CardHeader>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle>{location.name}</CardTitle>
          <div className="flex items-center gap-1 text-sm bg-green-50 text-green-700 px-2 py-1 rounded-full">
            <img src="/icons/tripadvisor-logo.png" alt="Tripadvisor" className="h-4" />
            Tripadvisor
          </div>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex">{renderStars(location.rating)}</div>
          <CardDescription>{location.num_reviews} recensioni</CardDescription>
        </div>
      </CardHeader>
      <CardContent>
        <div className="flex flex-col md:flex-row gap-4">
          {location.photo && (
            <div className="w-full md:w-1/3">
              <img
                src={location.photo.images.medium.url || "/placeholder.svg"}
                alt={location.name}
                className="w-full h-auto rounded-md object-cover"
                onError={(e) => {
                  e.currentTarget.src = "/placeholder.svg?height=200&width=300"
                }}
              />
            </div>
          )}
          <div className="w-full md:w-2/3 space-y-2">
            {location.description && <p className="text-sm">{location.description}</p>}

            {location.address_obj && (
              <div className="flex items-start gap-2 text-sm">
                <MapPin className="w-4 h-4 mt-0.5 flex-shrink-0" />
                <span>
                  {location.address_obj.street1}, {location.address_obj.city}, {location.address_obj.country}
                  {location.address_obj.postalcode ? ` - ${location.address_obj.postalcode}` : ""}
                </span>
              </div>
            )}

            {location.phone && (
              <div className="flex items-center gap-2 text-sm">
                <Phone className="w-4 h-4" />
                <span>{location.phone}</span>
              </div>
            )}

            {location.website && (
              <div className="flex items-center gap-2 text-sm">
                <Globe className="w-4 h-4" />
                <a
                  href={location.website}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-primary hover:underline"
                >
                  {new URL(location.website).hostname}
                </a>
              </div>
            )}

            <div className="flex gap-2 pt-2">
              {location.web_url && (
                <Button variant="outline" size="sm" asChild>
                  <a
                    href={location.web_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-1"
                  >
                    <ExternalLink className="w-4 h-4" />
                    Vedi su Tripadvisor
                  </a>
                </Button>
              )}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
