"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Skeleton } from "@/components/ui/skeleton"
import { AlertCircle, Plus, X } from "lucide-react"
import { LineChart } from "@/components/charts/line-chart"
import { supabase } from "@/lib/supabase/client"

type Hotel = {
  id: string
  nome: string
  tripadvisor_id?: string
}

type Competitor = {
  id: string
  hotel_id: string
  nome: string
  tripadvisor_id: string
}

type CompetitorRating = {
  id: string
  nome: string
  rating: number
  reviews: number
}

export function CompetitorAnalysis({ hotels }: { hotels: Hotel[] }) {
  const [selectedHotelId, setSelectedHotelId] = useState<string>("")
  const [competitors, setCompetitors] = useState<Competitor[]>([])
  const [newCompetitorName, setNewCompetitorName] = useState("")
  const [newCompetitorId, setNewCompetitorId] = useState("")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [ratings, setRatings] = useState<CompetitorRating[]>([])
  const [loadingRatings, setLoadingRatings] = useState(false)

  // Carica i competitor per l'hotel selezionato
  useEffect(() => {
    async function fetchCompetitors() {
      if (!selectedHotelId) {
        setCompetitors([])
        return
      }

      setLoading(true)
      try {
        // Simula il recupero dei competitor dal database
        // In un'implementazione reale, dovresti avere una tabella per i competitor
        const { data, error } = await supabase.from("competitor").select("*").eq("hotel_id", selectedHotelId)

        if (error) {
          throw error
        }

        setCompetitors(data || [])
      } catch (err) {
        console.error("Errore nel recupero dei competitor:", err)
        setError("Impossibile caricare i competitor")
      } finally {
        setLoading(false)
      }
    }

    fetchCompetitors()
  }, [selectedHotelId])

  // Carica i rating per l'hotel selezionato e i suoi competitor
  useEffect(() => {
    async function fetchRatings() {
      if (!selectedHotelId || competitors.length === 0) {
        setRatings([])
        return
      }

      setLoadingRatings(true)
      try {
        // Ottieni l'hotel selezionato
        const selectedHotel = hotels.find((h) => h.id === selectedHotelId)
        if (!selectedHotel || !selectedHotel.tripadvisor_id) {
          throw new Error("Hotel selezionato non ha un ID Tripadvisor")
        }

        // Prepara l'array con l'hotel selezionato e i suoi competitor
        const allLocations = [
          { id: selectedHotel.id, nome: selectedHotel.nome, tripadvisor_id: selectedHotel.tripadvisor_id },
          ...competitors,
        ]

        // Recupera i rating per ogni location
        const ratingsPromises = allLocations.map(async (location) => {
          const response = await fetch(`/api/tripadvisor/location?locationId=${location.tripadvisor_id}`)
          if (!response.ok) {
            throw new Error(`Errore nel recupero dei dettagli per ${location.nome}`)
          }
          const data = await response.json()
          return {
            id: location.id,
            nome: location.nome,
            rating: data.rating || 0,
            reviews: data.num_reviews || 0,
          }
        })

        const results = await Promise.all(ratingsPromises)
        setRatings(results)
      } catch (err) {
        console.error("Errore nel recupero dei rating:", err)
        setError("Impossibile caricare i rating dei competitor")
      } finally {
        setLoadingRatings(false)
      }
    }

    fetchRatings()
  }, [selectedHotelId, competitors, hotels])

  // Aggiungi un nuovo competitor
  const handleAddCompetitor = async () => {
    if (!selectedHotelId || !newCompetitorName || !newCompetitorId) {
      return
    }

    try {
      // Verifica che l'ID Tripadvisor sia valido
      const response = await fetch(`/api/tripadvisor/location?locationId=${newCompetitorId}`)
      if (!response.ok) {
        throw new Error("ID Tripadvisor non valido")
      }

      // Salva il nuovo competitor nel database
      const { data, error } = await supabase
        .from("competitor")
        .insert({
          hotel_id: selectedHotelId,
          nome: newCompetitorName,
          tripadvisor_id: newCompetitorId,
        })
        .select()

      if (error) {
        throw error
      }

      // Aggiorna la lista dei competitor
      if (data && data.length > 0) {
        setCompetitors([...competitors, data[0]])
      }

      // Resetta i campi
      setNewCompetitorName("")
      setNewCompetitorId("")
    } catch (err) {
      console.error("Errore nell'aggiunta del competitor:", err)
      setError("Impossibile aggiungere il competitor")
    }
  }

  // Rimuovi un competitor
  const handleRemoveCompetitor = async (id: string) => {
    try {
      const { error } = await supabase.from("competitor").delete().eq("id", id)

      if (error) {
        throw error
      }

      // Aggiorna la lista dei competitor
      setCompetitors(competitors.filter((c) => c.id !== id))
    } catch (err) {
      console.error("Errore nella rimozione del competitor:", err)
      setError("Impossibile rimuovere il competitor")
    }
  }

  // Prepara i dati per il grafico
  const chartData = ratings.map((r) => ({
    name: r.nome,
    Rating: r.rating * 20, // Scala 0-5 a 0-100 per il grafico
    Recensioni: r.reviews,
  }))

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Analisi Competitor</CardTitle>
          <CardDescription>Confronta il tuo hotel con i competitor su Tripadvisor</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-6">
            <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center">
              <div className="w-full sm:w-auto">
                <Select value={selectedHotelId} onValueChange={setSelectedHotelId}>
                  <SelectTrigger className="w-full sm:w-[300px]">
                    <SelectValue placeholder="Seleziona un hotel" />
                  </SelectTrigger>
                  <SelectContent>
                    {hotels.map((hotel) => (
                      <SelectItem key={hotel.id} value={hotel.id}>
                        {hotel.nome}
                        {!hotel.tripadvisor_id && " (Nessun ID Tripadvisor)"}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {selectedHotelId && (
              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="col-span-1 md:col-span-2">
                    <Input
                      placeholder="Nome del competitor"
                      value={newCompetitorName}
                      onChange={(e) => setNewCompetitorName(e.target.value)}
                    />
                  </div>
                  <div className="flex gap-2">
                    <Input
                      placeholder="ID Tripadvisor"
                      value={newCompetitorId}
                      onChange={(e) => setNewCompetitorId(e.target.value)}
                    />
                    <Button onClick={handleAddCompetitor} disabled={!newCompetitorName || !newCompetitorId}>
                      <Plus className="h-4 w-4" />
                    </Button>
                  </div>
                </div>

                {loading ? (
                  <div className="space-y-2">
                    {[1, 2, 3].map((i) => (
                      <Skeleton key={i} className="h-10 w-full" />
                    ))}
                  </div>
                ) : error ? (
                  <div className="flex items-center gap-2 text-red-500">
                    <AlertCircle className="h-4 w-4" />
                    <span>{error}</span>
                  </div>
                ) : competitors.length === 0 ? (
                  <div className="text-center text-muted-foreground py-4">
                    Nessun competitor configurato. Aggiungi un competitor per iniziare il confronto.
                  </div>
                ) : (
                  <div className="space-y-2">
                    {competitors.map((competitor) => (
                      <div key={competitor.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                        <div>
                          <div className="font-medium">{competitor.nome}</div>
                          <div className="text-xs text-muted-foreground">ID: {competitor.tripadvisor_id}</div>
                        </div>
                        <Button variant="ghost" size="sm" onClick={() => handleRemoveCompetitor(competitor.id)}>
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                    ))}
                  </div>
                )}

                {loadingRatings ? (
                  <Skeleton className="h-[300px] w-full" />
                ) : ratings.length > 0 ? (
                  <Card>
                    <CardHeader>
                      <CardTitle>Confronto rating</CardTitle>
                      <CardDescription>Confronto tra il tuo hotel e i competitor</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="h-[300px]">
                        <LineChart
                          data={chartData}
                          index="name"
                          categories={["Rating"]}
                          colors={["#3B82F6"]}
                          valueFormatter={(value) => `${(value / 20).toFixed(1)}/5`}
                          yAxisWidth={40}
                        />
                      </div>
                    </CardContent>
                  </Card>
                ) : null}
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
