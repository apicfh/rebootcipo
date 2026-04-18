"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { TripadvisorSearch } from "./tripadvisor-search"
import { supabase } from "@/lib/supabase/client"
import { toast } from "@/components/ui/use-toast"

type Hotel = {
  id: string
  nome: string
  nome_completo?: string
  tripadvisor_id?: string
}

export function TripadvisorManager() {
  const [hotels, setHotels] = useState<Hotel[]>([])
  const [selectedHotel, setSelectedHotel] = useState<string>("")
  const [tripadvisorId, setTripadvisorId] = useState<string>("")
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)

  // Funzione per estrarre il numero dall'ID di Tripadvisor
  const extractNumericId = (id: string): string => {
    // Se l'ID è nel formato "d1234567", estrai solo la parte numerica
    if (id && id.startsWith("d") && !isNaN(Number.parseInt(id.substring(1)))) {
      return id.substring(1)
    }
    // Se l'ID è già un numero, restituiscilo
    if (id && !isNaN(Number.parseInt(id))) {
      return id
    }
    // Altrimenti, cerca qualsiasi sequenza di numeri nell'ID
    const matches = id ? id.match(/\d+/) : null
    return matches ? matches[0] : ""
  }

  useEffect(() => {
    async function fetchHotels() {
      setLoading(true)
      try {
        const { data, error } = await supabase
          .from("hotel")
          .select("id, nome, nome_completo, tripadvisor_id")
          .order("nome", { ascending: true })

        if (error) {
          throw error
        }

        setHotels(data || [])
      } catch (error) {
        console.error("Errore nel recupero degli hotel:", error)
        toast({
          title: "Errore",
          description: "Impossibile caricare l'elenco degli hotel",
          variant: "destructive",
        })
      } finally {
        setLoading(false)
      }
    }

    fetchHotels()
  }, [])

  useEffect(() => {
    if (selectedHotel) {
      const hotel = hotels.find((h) => h.id === selectedHotel)
      setTripadvisorId(hotel?.tripadvisor_id || "")
    } else {
      setTripadvisorId("")
    }
  }, [selectedHotel, hotels])

  const handleSave = async () => {
    if (!selectedHotel) {
      toast({
        title: "Errore",
        description: "Seleziona un hotel",
        variant: "destructive",
      })
      return
    }

    // Estrai il numero dall'ID di Tripadvisor se presente
    const processedId = tripadvisorId ? extractNumericId(tripadvisorId) : ""

    if (tripadvisorId && !processedId) {
      toast({
        title: "Errore",
        description: "L'ID Tripadvisor deve contenere un numero valido",
        variant: "destructive",
      })
      return
    }

    setSaving(true)
    try {
      const { error } = await supabase
        .from("hotel")
        .update({ tripadvisor_id: processedId || null })
        .eq("id", selectedHotel)

      if (error) {
        throw error
      }

      // Aggiorna l'elenco degli hotel
      setHotels(hotels.map((hotel) => (hotel.id === selectedHotel ? { ...hotel, tripadvisor_id: processedId } : hotel)))

      toast({
        title: "Salvato",
        description: "ID Tripadvisor aggiornato con successo",
      })
    } catch (error) {
      console.error("Errore nel salvataggio dell'ID Tripadvisor:", error)
      toast({
        title: "Errore",
        description: "Impossibile salvare l'ID Tripadvisor",
        variant: "destructive",
      })
    } finally {
      setSaving(false)
    }
  }

  return (
    <Tabs defaultValue="manage">
      <TabsList className="grid w-full grid-cols-2">
        <TabsTrigger value="manage">Gestione ID</TabsTrigger>
        <TabsTrigger value="search">Ricerca</TabsTrigger>
      </TabsList>

      <TabsContent value="manage" className="mt-4">
        <Card>
          <CardHeader>
            <CardTitle>Gestione ID Tripadvisor</CardTitle>
            <CardDescription>Collega i tuoi hotel agli ID di Tripadvisor</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4">
              <div className="grid gap-2">
                <Label htmlFor="hotel">Hotel</Label>
                <Select value={selectedHotel} onValueChange={setSelectedHotel} disabled={loading}>
                  <SelectTrigger>
                    <SelectValue placeholder="Seleziona un hotel" />
                  </SelectTrigger>
                  <SelectContent>
                    {hotels.map((hotel) => (
                      <SelectItem key={hotel.id} value={hotel.id}>
                        {hotel.nome_completo || hotel.nome}
                        {hotel.tripadvisor_id && " (ID collegato)"}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="grid gap-2">
                <Label htmlFor="tripadvisor-id">ID Tripadvisor</Label>
                <Input
                  id="tripadvisor-id"
                  placeholder="Inserisci l'ID Tripadvisor"
                  value={tripadvisorId}
                  onChange={(e) => setTripadvisorId(e.target.value)}
                />
                <p className="text-xs text-muted-foreground">
                  L'ID Tripadvisor si trova nell'URL della pagina della struttura su Tripadvisor. Es:
                  https://www.tripadvisor.it/Hotel_Review-g194791-d1234567-Reviews-... In questo caso l'ID è "1234567"
                  (solo il numero).
                </p>
              </div>

              <Button onClick={handleSave} disabled={saving || !selectedHotel}>
                {saving ? "Salvataggio..." : "Salva"}
              </Button>
            </div>
          </CardContent>
        </Card>
      </TabsContent>

      <TabsContent value="search" className="mt-4">
        <TripadvisorSearch />
      </TabsContent>
    </Tabs>
  )
}
