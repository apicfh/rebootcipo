"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { DateRangePicker } from "@/components/ui/date-range-picker"
import { BarChart } from "@/components/charts/bar-chart"
import { supabase } from "@/lib/supabase/client"
import { format } from "date-fns"
import { it } from "date-fns/locale"

interface Hotel {
  id: string
  nome: string
}

interface DomandaData {
  data_richiesta: string
  richieste_totali: number
  nome_hotel: string
}

export default function PressioneDomandaPage() {
  const [hotels, setHotels] = useState<Hotel[]>([])
  const [selectedHotel, setSelectedHotel] = useState<string>("")
  const [dateRange, setDateRange] = useState<{ from: Date; to: Date } | undefined>()
  const [data, setData] = useState<DomandaData[]>([])
  const [loading, setLoading] = useState(false)

  // Carica lista hotel
  useEffect(() => {
    async function loadHotels() {
      const { data: hotelsData, error } = await supabase.from("hotel").select("id, nome").order("nome")

      if (error) {
        console.error("Errore caricamento hotel:", error)
        return
      }

      setHotels(hotelsData || [])
    }

    loadHotels()
  }, [])

  // Carica dati pressione domanda
  const loadData = async () => {
    if (!selectedHotel || !dateRange?.from || !dateRange?.to) return

    setLoading(true)
    try {
      const { data: domandaData, error } = await supabase
        .from("pressione_domanda")
        .select("*")
        .eq("id_hotel", selectedHotel)
        .gte("data_richiesta", format(dateRange.from, "yyyy-MM-dd"))
        .lte("data_richiesta", format(dateRange.to, "yyyy-MM-dd"))
        .order("data_richiesta")

      if (error) {
        console.error("Errore caricamento dati:", error)
        return
      }

      setData(domandaData || [])
    } catch (error) {
      console.error("Errore:", error)
    } finally {
      setLoading(false)
    }
  }

  // Prepara dati per il grafico
  const chartData = data.map((item) => ({
    name: format(new Date(item.data_richiesta), "dd/MM", { locale: it }),
    value: item.richieste_totali,
    fullDate: item.data_richiesta,
  }))

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Pressione Domanda</h1>
        <p className="text-muted-foreground">Analizza la pressione della domanda per hotel e periodo</p>
      </div>

      {/* Filtri */}
      <Card>
        <CardHeader>
          <CardTitle>Filtri</CardTitle>
          <CardDescription>Seleziona hotel e periodo per l'analisi</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="text-sm font-medium mb-2 block">Hotel</label>
              <Select value={selectedHotel} onValueChange={setSelectedHotel}>
                <SelectTrigger>
                  <SelectValue placeholder="Seleziona hotel" />
                </SelectTrigger>
                <SelectContent>
                  {hotels.map((hotel) => (
                    <SelectItem key={hotel.id} value={hotel.id}>
                      {hotel.nome}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <label className="text-sm font-medium mb-2 block">Periodo</label>
              <DateRangePicker value={dateRange} onChange={setDateRange} placeholder="Seleziona periodo" />
            </div>

            <div className="flex items-end">
              <Button
                onClick={loadData}
                disabled={!selectedHotel || !dateRange?.from || !dateRange?.to || loading}
                className="w-full"
              >
                {loading ? "Caricamento..." : "Carica Dati"}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Grafico */}
      {data.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Andamento Richieste</CardTitle>
            <CardDescription>Numero di richieste per giorno nel periodo selezionato</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-80">
              <BarChart data={chartData} xAxisKey="name" yAxisKey="value" color="#3b82f6" />
            </div>
          </CardContent>
        </Card>
      )}

      {/* Statistiche */}
      {data.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="p-6">
              <div className="text-2xl font-bold">{data.reduce((sum, item) => sum + item.richieste_totali, 0)}</div>
              <p className="text-xs text-muted-foreground">Richieste Totali</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-6">
              <div className="text-2xl font-bold">
                {Math.round(data.reduce((sum, item) => sum + item.richieste_totali, 0) / data.length)}
              </div>
              <p className="text-xs text-muted-foreground">Media Giornaliera</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-6">
              <div className="text-2xl font-bold">{Math.max(...data.map((item) => item.richieste_totali))}</div>
              <p className="text-xs text-muted-foreground">Picco Massimo</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-6">
              <div className="text-2xl font-bold">{data.length}</div>
              <p className="text-xs text-muted-foreground">Giorni Analizzati</p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Messaggio vuoto */}
      {!loading && data.length === 0 && selectedHotel && dateRange && (
        <Card>
          <CardContent className="p-8">
            <div className="text-center">
              <p className="text-muted-foreground">Nessun dato disponibile per il periodo selezionato</p>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
