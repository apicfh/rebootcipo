"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import { toast } from "@/components/ui/use-toast"
import { Copy, ExternalLink, Search, Star } from "lucide-react"

type TripadvisorLocation = {
  location_id: string
  name: string
  address_obj?: {
    street1?: string
    city?: string
    country?: string
  }
  rating?: number
  num_reviews?: number
  web_url?: string
  photo?: {
    images?: {
      small?: { url?: string }
    }
  }
}

export function TripadvisorSearch() {
  const [query, setQuery] = useState("")
  const [results, setResults] = useState<TripadvisorLocation[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleSearch = async () => {
    if (!query.trim()) return

    setLoading(true)
    setError(null)

    try {
      const response = await fetch(`/api/tripadvisor/search?query=${encodeURIComponent(query)}`)

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || "Errore nella ricerca")
      }

      const data = await response.json()
      setResults(data || [])
    } catch (err: any) {
      console.error("Errore nella ricerca:", err)
      setError(err.message || "Errore durante la ricerca")
      setResults([])
    } finally {
      setLoading(false)
    }
  }

  // Funzione per renderizzare le stelle in base al rating
  const renderStars = (rating?: number) => {
    if (!rating) return null

    const stars = []
    const fullStars = Math.floor(rating)
    const hasHalfStar = rating % 1 >= 0.5

    for (let i = 0; i < fullStars; i++) {
      stars.push(<Star key={`star-${i}`} className="h-4 w-4 fill-yellow-400 text-yellow-400" />)
    }

    if (hasHalfStar) {
      stars.push(<Star key="half-star" className="h-4 w-4 fill-yellow-400 text-yellow-400 fill-half" />)
    }

    return <div className="flex">{stars}</div>
  }

  const copyToClipboard = (id: string) => {
    navigator.clipboard.writeText(id)
    toast({
      title: "Copiato",
      description: `ID ${id} copiato negli appunti`,
    })
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Ricerca su Tripadvisor</CardTitle>
        <CardDescription>Cerca strutture su Tripadvisor per ottenere il loro ID</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="flex gap-2 mb-6">
          <Input
            placeholder="Cerca hotel su Tripadvisor..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleSearch()}
            className="flex-1"
          />
          <Button onClick={handleSearch} disabled={loading}>
            {loading ? "Ricerca..." : <Search className="h-4 w-4 mr-2" />}
          </Button>
        </div>

        {error && <p className="text-red-500 mb-4">{error}</p>}

        <div className="space-y-4">
          {loading ? (
            // Skeleton loader durante il caricamento
            [...Array(3)].map((_, i) => (
              <div key={i} className="flex gap-4">
                <Skeleton className="h-24 w-24 rounded-md" />
                <div className="flex-1">
                  <Skeleton className="h-5 w-3/4 mb-2" />
                  <Skeleton className="h-4 w-1/2 mb-2" />
                  <Skeleton className="h-4 w-5/6" />
                </div>
              </div>
            ))
          ) : results.length > 0 ? (
            results.map((location) => (
              <div key={location.location_id} className="flex gap-4 border-b pb-4 last:border-b-0">
                {location.photo?.images?.small?.url ? (
                  <img
                    src={location.photo.images.small.url || "/placeholder.svg"}
                    alt={location.name}
                    className="h-24 w-24 object-cover rounded-md"
                    onError={(e) => {
                      e.currentTarget.src = "/placeholder.svg?height=100&width=100"
                    }}
                  />
                ) : (
                  <div className="h-24 w-24 bg-muted flex items-center justify-center rounded-md">
                    <span className="text-xs text-muted-foreground">No image</span>
                  </div>
                )}
                <div className="flex-1">
                  <h3 className="font-medium">{location.name}</h3>
                  <div className="flex items-center gap-1 my-1">
                    {renderStars(location.rating)}
                    <span className="text-xs text-muted-foreground">({location.num_reviews || 0} recensioni)</span>
                  </div>
                  {location.address_obj && (
                    <div className="text-sm text-muted-foreground">
                      {location.address_obj.street1 ? `${location.address_obj.street1}, ` : ""}
                      {location.address_obj.city}, {location.address_obj.country}
                    </div>
                  )}
                  <div className="flex gap-2 mt-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => copyToClipboard(location.location_id)}
                      title="Copia ID"
                    >
                      <Copy className="h-4 w-4 mr-1" /> ID: {location.location_id}
                    </Button>
                    {location.web_url && (
                      <Button variant="outline" size="sm" asChild>
                        <a
                          href={location.web_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center gap-1"
                        >
                          <ExternalLink className="h-4 w-4" /> Vedi su Tripadvisor
                        </a>
                      </Button>
                    )}
                  </div>
                </div>
              </div>
            ))
          ) : query && !loading ? (
            <p className="text-center text-muted-foreground py-4">Nessun risultato trovato</p>
          ) : null}
        </div>
      </CardContent>
    </Card>
  )
}
