"use client"

import { useState, useEffect } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Sidebar } from "@/components/sidebar"
import { HotelRecensioniCard } from "@/components/tripadvisor/hotel-recensioni-card"
import { Button } from "@/components/ui/button"
import { LineChart } from "lucide-react"
import { type RecensioneTripadvisor, getAllRecensioniTripadvisor } from "@/lib/services/recensioni-tripadvisor-service"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { AlertCircle } from "lucide-react"
import Link from "next/link"
import { DebugRecensioni } from "@/components/tripadvisor/debug-recensioni"

export default function RecensioniTripadvisorPage() {
  const [recensioni, setRecensioni] = useState<RecensioneTripadvisor[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [showDebug, setShowDebug] = useState(false)

  // Carica tutte le recensioni
  useEffect(() => {
    async function fetchRecensioni() {
      setLoading(true)
      setError(null)
      try {
        const data = await getAllRecensioniTripadvisor()
        console.log("Recensioni caricate:", data.length)
        setRecensioni(data)
      } catch (err) {
        console.error("Errore nel caricamento delle recensioni:", err)
        setError("Si è verificato un errore nel caricamento delle recensioni. Riprova più tardi.")
      } finally {
        setLoading(false)
      }
    }

    fetchRecensioni()
  }, [])

  // Raggruppa le recensioni per hotel e calcola le statistiche
  const getHotelStats = () => {
    const hotelMap = new Map<string, { id: string; nome: string; recensioni: RecensioneTripadvisor[] }>()

    // Raggruppa le recensioni per hotel
    recensioni.forEach((recensione) => {
      if (recensione.hotel_id && recensione.hotel_nome) {
        if (!hotelMap.has(recensione.hotel_id)) {
          hotelMap.set(recensione.hotel_id, {
            id: recensione.hotel_id,
            nome: recensione.hotel_nome,
            recensioni: [],
          })
        }
        hotelMap.get(recensione.hotel_id)?.recensioni.push(recensione)
      }
    })

    // Calcola le statistiche per ogni hotel
    const sevenDaysAgo = new Date()
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7)

    return Array.from(hotelMap.values())
      .filter((hotel) => hotel.nome.toLowerCase() !== "tutti") // Esclude l'hotel "tutti"
      .map((hotel) => {
        const numeroRecensioni = hotel.recensioni.length

        // Calcola la media delle valutazioni
        const sommaValutazioni = hotel.recensioni.reduce((sum, rec) => sum + Number(rec.valutazione), 0)
        const mediaValutazione = numeroRecensioni > 0 ? sommaValutazioni / numeroRecensioni : 0

        // Conta le nuove recensioni negli ultimi 7 giorni
        const nuoveRecensioni = hotel.recensioni.filter(
          (rec) => new Date(rec.data_pubblicazione) >= sevenDaysAgo,
        ).length

        return {
          id: hotel.id,
          nome: hotel.nome,
          numeroRecensioni,
          mediaValutazione,
          nuoveRecensioni,
        }
      })
      .sort((a, b) => b.numeroRecensioni - a.numeroRecensioni) // Ordina per numero di recensioni (decrescente)
  }

  const hotelStats = getHotelStats()

  return (
    <div className="flex min-h-screen">
      <Sidebar />
      <div className="flex-1 p-8">
        <div className="flex flex-col md:flex-row md:items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold">Panoramica</h1>
            <p className="text-muted-foreground">Carrellata rapida recensioni totali e ultime recensioni</p>
          </div>
          <div className="flex gap-2 mt-4 md:mt-0">
            <Button variant="outline" onClick={() => setShowDebug(!showDebug)} className="mr-2">
              {showDebug ? "Nascondi Debug" : "Mostra Debug"}
            </Button>
            <Link href="/recensionitripadvisor/andamento">
              <Button className="flex items-center gap-2">
                <LineChart className="h-4 w-4" />
                Andamento
              </Button>
            </Link>
          </div>
        </div>

        {showDebug && <DebugRecensioni />}

        {error && (
          <Alert variant="destructive" className="my-4">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Errore</AlertTitle>
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
            {[...Array(12)].map((_, i) => (
              <Card key={i} className="animate-pulse h-40">
                <CardContent className="p-6">
                  <div className="h-5 bg-gray-200 rounded w-3/4 mb-4"></div>
                  <div className="flex space-x-1 mb-4">
                    {[...Array(5)].map((_, j) => (
                      <div key={j} className="h-4 w-4 bg-gray-200 rounded-full"></div>
                    ))}
                  </div>
                  <div className="h-4 bg-gray-200 rounded w-1/2 mb-4"></div>
                  <div className="h-6 bg-gray-200 rounded w-2/3 mt-auto"></div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : hotelStats.length === 0 ? (
          <Card className="mt-6">
            <CardContent className="p-12 flex flex-col items-center justify-center">
              <img
                src="/icons/recensioni-panda.png"
                alt="Nessuna recensione"
                className="h-32 w-32 mb-4 opacity-80"
                onError={(e) => {
                  console.error("Errore nel caricamento dell'immagine recensioni-panda.png")
                  e.currentTarget.src = "/placeholder.svg?key=nuux4"
                }}
              />
              <h3 className="text-xl font-medium mb-2">Nessuna recensione trovata</h3>
              <p className="text-muted-foreground text-center">
                Non ci sono recensioni disponibili al momento. Prova a importare nuove recensioni da Tripadvisor.
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
            {hotelStats.map((hotel) => (
              <HotelRecensioniCard
                key={hotel.id}
                hotelId={hotel.id}
                hotelNome={hotel.nome}
                numeroRecensioni={hotel.numeroRecensioni}
                mediaValutazione={hotel.mediaValutazione}
                nuoveRecensioni={hotel.nuoveRecensioni}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
