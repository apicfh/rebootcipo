"use client"

import { useState } from "react"
import { supabase } from "@/lib/supabase/client"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { RichiesteSection } from "@/components/predittivo/richieste-section"
import { ConversioniSection } from "@/components/predittivo/conversioni-section"
import { CrescitaSection } from "@/components/predittivo/crescita-section"
import { useEffect } from "react"

export default function PredittivePage() {
  const [hotelId, setHotelId] = useState<string>("")

  useEffect(() => {
    const loadHotelId = async () => {
      const { data: sessionData } = await supabase.auth.getSession()

      if (sessionData?.session?.user?.user_metadata?.hotel_id) {
        setHotelId(sessionData.session.user.user_metadata.hotel_id)
      } else {
        // Fallback: get first hotel
        const { data: hotels } = await supabase.from("hotel").select("id").limit(1)
        if (hotels && hotels.length > 0) {
          setHotelId(hotels[0].id)
        }
      }
    }

    loadHotelId()
  }, [])

  if (!hotelId) {
    return (
      <div className="flex h-[300px] items-center justify-center">
        <p className="text-muted-foreground">Caricamento...</p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Predittivo</h1>
        <p className="mt-2 text-gray-600">Analisi predittive su richieste e conversioni</p>
      </div>

      <Tabs defaultValue="richieste" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="richieste">Richieste</TabsTrigger>
          <TabsTrigger value="conversioni">Conversioni</TabsTrigger>
          <TabsTrigger value="crescita">Crescita</TabsTrigger>
        </TabsList>

        <TabsContent value="richieste" className="space-y-6">
          <RichiesteSection hotelId={hotelId} />
        </TabsContent>

        <TabsContent value="conversioni" className="space-y-6">
          <ConversioniSection hotelId={hotelId} />
        </TabsContent>

        <TabsContent value="crescita" className="space-y-6">
          <CrescitaSection hotelId={hotelId} />
        </TabsContent>
      </Tabs>
    </div>
  )
}
