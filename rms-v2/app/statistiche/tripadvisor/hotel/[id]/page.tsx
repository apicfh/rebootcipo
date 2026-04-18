"use client"

import { useState, useEffect } from "react"
import { useParams } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import { ArrowLeft } from "lucide-react"
import Link from "next/link"
import { supabase } from "@/lib/supabase/client"
import { TripadvisorLocationDetails } from "@/components/tripadvisor/tripadvisor-location-details"
import { TripadvisorReviews } from "@/components/tripadvisor/tripadvisor-reviews"
import { TripadvisorStats } from "@/components/tripadvisor/tripadvisor-stats"

type Hotel = {
  id: string
  nome: string
  tripadvisor_id?: string
}

export default function HotelDetailPage() {
  const params = useParams()
  const hotelId = params.id as string

  const [hotel, setHotel] = useState<Hotel | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    async function fetchHotel() {
      if (!hotelId) return

      setLoading(true)
      try {
        const { data, error } = await supabase
          .from("hotel")
          .select("id, nome, tripadvisor_id")
          .eq("id", hotelId)
          .single()

        if (error) {
          throw error
        }

        setHotel(data)
      } catch (err) {
        console.error("Errore nel recupero dell'hotel:", err)
        setError("Impossibile caricare i dettagli dell'hotel")
      } finally {
        setLoading(false)
      }
    }

    fetchHotel()
  }, [hotelId])

  if (loading) {
    return (
      <div className="container mx-auto py-6 space-y-6">
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="sm" disabled>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Indietro
          </Button>
          <Skeleton className="h-8 w-64" />
        </div>
        <Skeleton className="h-[600px] w-full" />
      </div>
    )
  }

  if (error || !hotel) {
    return (
      <div className="container mx-auto py-6 space-y-6">
        <Button variant="ghost" size="sm" asChild>
          <Link href="/statistiche/tripadvisor">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Indietro
          </Link>
        </Button>
        <Card>
          <CardHeader>
            <CardTitle>Errore</CardTitle>
            <CardDescription>{error || "Hotel non trovato"}</CardDescription>
          </CardHeader>
          <CardContent>
            <Button asChild>
              <Link href="/statistiche/tripadvisor">Torna alla dashboard</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="container mx-auto py-6 space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="sm" asChild>
            <Link href="/statistiche/tripadvisor">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Indietro
            </Link>
          </Button>
          <h1 className="text-2xl font-bold">{hotel.nome}</h1>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-sm text-muted-foreground">Powered by</span>
          <img src="/icons/tripadvisor-logo.png" alt="Tripadvisor" className="h-8" />
        </div>
      </div>

      {!hotel.tripadvisor_id ? (
        <Card>
          <CardHeader>
            <CardTitle>Nessun ID Tripadvisor</CardTitle>
            <CardDescription>
              Questo hotel non ha un ID Tripadvisor configurato. Vai alla sezione di amministrazione per configurarlo.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button asChild>
              <Link href="/admin/tripadvisor">Configura ID Tripadvisor</Link>
            </Button>
          </CardContent>
        </Card>
      ) : (
        <Tabs defaultValue="info" className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="info">Informazioni</TabsTrigger>
            <TabsTrigger value="reviews">Recensioni</TabsTrigger>
            <TabsTrigger value="stats">Statistiche</TabsTrigger>
          </TabsList>

          <TabsContent value="info" className="mt-6">
            <TripadvisorLocationDetails locationId={hotel.tripadvisor_id} />
          </TabsContent>

          <TabsContent value="reviews" className="mt-6">
            <TripadvisorReviews locationId={hotel.tripadvisor_id} limit={20} />
          </TabsContent>

          <TabsContent value="stats" className="mt-6">
            <TripadvisorStats locationId={hotel.tripadvisor_id} />
          </TabsContent>
        </Tabs>
      )}
    </div>
  )
}
