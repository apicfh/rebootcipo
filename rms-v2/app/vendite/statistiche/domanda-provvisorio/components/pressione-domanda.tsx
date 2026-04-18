"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { ElegantDatePicker } from "@/components/ui/elegant-date-picker"
import { Checkbox } from "@/components/ui/checkbox"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { Info } from "lucide-react"
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer } from "recharts"
import { supabase } from "@/lib/supabase/client"
import { DomandaTravelbrainService } from "@/lib/services/domanda-travelbrain-service"
import { format } from "date-fns"
import { it } from "date-fns/locale"

function getLastSaturdayOfMay(year: number): Date {
  // Inizia dall'ultimo giorno di maggio
  const lastDayOfMay = new Date(year, 4, 31) // Mese 4 = maggio (0-indexed)

  // Trova l'ultimo sabato
  const dayOfWeek = lastDayOfMay.getDay()
  const daysToSubtract = dayOfWeek === 6 ? 0 : dayOfWeek + 1

  return new Date(year, 4, 31 - daysToSubtract)
}

function getSecondSaturdayOfSeptember(year: number): Date {
  // Inizia dal primo giorno di settembre
  const firstDayOfSeptember = new Date(year, 8, 1) // Mese 8 = settembre (0-indexed)

  // Trova il primo sabato
  const dayOfWeek = firstDayOfSeptember.getDay()
  const daysToFirstSaturday = dayOfWeek === 6 ? 0 : (6 - dayOfWeek + 7) % 7

  // Aggiungi 7 giorni per arrivare al secondo sabato
  return new Date(year, 8, 1 + daysToFirstSaturday + 7)
}

function getDefaultSeasonDates(): { soggiornoInizio: Date; soggiornoFine: Date } {
  const now = new Date()
  const currentYear = now.getFullYear()
  const currentMonth = now.getMonth() // 0-indexed: 0=gennaio, 11=dicembre

  // Se siamo tra gennaio (0) e settembre (8), usa anno corrente
  // Se siamo tra ottobre (9) e dicembre (11), usa anno successivo
  const targetYear = currentMonth >= 9 ? currentYear + 1 : currentYear

  return {
    soggiornoInizio: getLastSaturdayOfMay(targetYear),
    soggiornoFine: getSecondSaturdayOfSeptember(targetYear),
  }
}

interface Hotel {
  hotel_id: number
  nome_hotel: string
}

interface PressioneData {
  hotel_id: number
  nome_hotel: string
  day_date: string
  pressione_giornaliera: bigint
}

interface StatsData {
  pressione_totale: number
  media_giornaliera: number
  preventivi_totali: number
  giorni_analizzati: number
  hotel_distribution: Array<{
    hotel_id: number
    nome_hotel: string
    pressione: number
  }>
}

export function PressioneDomanda() {
  const defaultDates = getDefaultSeasonDates()
  const [soggiornoInizio, setSoggiornoInizio] = useState<Date | null>(defaultDates.soggiornoInizio)
  const [soggiornoFine, setSoggiornoFine] = useState<Date | null>(defaultDates.soggiornoFine)
  const [selectedHotels, setSelectedHotels] = useState<number[]>([])
  const [allHotelsSelected, setAllHotelsSelected] = useState(true)

  // Stati per i dati
  const [hotels, setHotels] = useState<Hotel[]>([])
  const [data, setData] = useState<PressioneData[]>([])
  const [stats, setStats] = useState<StatsData | null>(null)
  const [loading, setLoading] = useState(false)

  // Carica lista hotel
  useEffect(() => {
    async function loadHotels() {
      try {
        const { data: hotelsData, error } = await supabase.rpc("get_performance_operatori_travelbrain_hotels")

        if (error) {
          console.error("[v0] Errore caricamento hotel:", error)
          return
        }

        console.log("[v0] Hotel caricati:", hotelsData?.length || 0)
        setHotels(hotelsData || [])

        // Seleziona tutti gli hotel di default
        const allHotelIds = (hotelsData || []).map((h: Hotel) => h.hotel_id)
        setSelectedHotels(allHotelIds)
      } catch (error) {
        console.error("[v0] Errore:", error)
      }
    }

    loadHotels()
  }, [])

  // Carica dati pressione domanda
  const loadData = async () => {
    if (selectedHotels.length === 0) {
      console.log("[v0] Nessun hotel selezionato")
      return
    }

    setLoading(true)
    try {
      const params = {
        soggiornoInizio: soggiornoInizio ? format(soggiornoInizio, "yyyy-MM-dd") : null,
        soggiornoFine: soggiornoFine ? format(soggiornoFine, "yyyy-MM-dd") : null,
        selectedHotels: selectedHotels,
      }
      console.log("[v0] Parametri completi inviati:", params)

      const [pressioneData, preventiviTotali] = await Promise.all([
        supabase
          .rpc("get_pressione_domanda_travelbrain", {
            p_soggiorno_inizio: params.soggiornoInizio,
            p_soggiorno_fine: params.soggiornoFine,
            p_hotel_ids: params.selectedHotels,
          })
          .then((res) => {
            if (res.error) throw res.error
            return res.data
          }),
        DomandaTravelbrainService.getConteggioPreventiviPressione(
          params.soggiornoInizio,
          params.soggiornoFine,
          params.selectedHotels,
        ),
      ])

      console.log("[v0] Dati caricati:", pressioneData?.length || 0, "preventivi totali:", preventiviTotali)
      setData(pressioneData || [])

      if (pressioneData && pressioneData.length > 0) {
        // Calculate total pressure
        const pressione_totale = pressioneData.reduce((sum, item) => sum + Number(item.pressione_giornaliera), 0)

        // Calculate unique days
        const uniqueDays = new Set(pressioneData.map((item) => item.day_date))
        const giorni_analizzati = uniqueDays.size

        // Calculate daily average
        const media_giornaliera = giorni_analizzati > 0 ? pressione_totale / giorni_analizzati : 0

        // Calculate hotel distribution
        const hotelTotals = new Map<number, { nome_hotel: string; pressione: number }>()
        pressioneData.forEach((item) => {
          const current = hotelTotals.get(item.hotel_id) || { nome_hotel: item.nome_hotel, pressione: 0 }
          hotelTotals.set(item.hotel_id, {
            nome_hotel: item.nome_hotel,
            pressione: current.pressione + Number(item.pressione_giornaliera),
          })
        })

        const hotel_distribution = Array.from(hotelTotals.entries()).map(([hotel_id, data]) => ({
          hotel_id,
          nome_hotel: data.nome_hotel,
          pressione: data.pressione,
        }))

        setStats({
          pressione_totale,
          media_giornaliera: Math.round(media_giornaliera),
          preventivi_totali: preventiviTotali,
          giorni_analizzati,
          hotel_distribution,
        })
      } else {
        setStats(null)
      }
    } catch (error) {
      console.error("[v0] Errore:", error)
    } finally {
      setLoading(false)
    }
  }

  const handleHotelToggle = (hotelId: number) => {
    if (allHotelsSelected) {
      // Passa a selezione parziale
      setAllHotelsSelected(false)
      setSelectedHotels([hotelId])
    } else {
      setSelectedHotels((prev) => (prev.includes(hotelId) ? prev.filter((id) => id !== hotelId) : [...prev, hotelId]))
    }
  }

  const handleAllHotelsToggle = () => {
    if (allHotelsSelected) {
      // Deseleziona tutti
      setSelectedHotels([])
      setAllHotelsSelected(false)
    } else {
      // Seleziona tutti
      const allHotelIds = hotels.map((h) => h.hotel_id)
      setSelectedHotels(allHotelIds)
      setAllHotelsSelected(true)
    }
  }

  const chartData = data.reduce(
    (acc, item) => {
      const dateKey = format(new Date(item.day_date), "dd/MM", { locale: it })
      const existingEntry = acc.find((entry) => entry.name === dateKey)

      if (existingEntry) {
        existingEntry.value += Number(item.pressione_giornaliera)
      } else {
        acc.push({
          name: dateKey,
          value: Number(item.pressione_giornaliera),
          fullDate: item.day_date,
        })
      }

      return acc
    },
    [] as Array<{ name: string; value: number; fullDate: string }>,
  )

  return (
    <div className="space-y-6">
      {/* Filtri */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <CardTitle>Filtri Pressione Domanda</CardTitle>
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button variant="ghost" size="icon" className="h-5 w-5 rounded-full">
                    <Info className="h-4 w-4 text-muted-foreground" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent side="right" className="max-w-sm">
                  <div className="space-y-2 text-sm">
                    <p className="font-semibold">Pressione Domanda</p>
                    <p>
                      Analizza i preventivi attivi non ancora opzionati (stati "Letto" e "Non Letto" di HotelDoor)
                      mostrando le notti di soggiorno richieste.
                    </p>
                    <div className="space-y-1 pt-2 border-t">
                      <p>
                        <span className="font-medium">Pressione Totale:</span> numero totale di notti richieste
                      </p>
                      <p>
                        <span className="font-medium">Media Giornaliera:</span> media di notti richieste per giorno
                      </p>
                      <p>
                        <span className="font-medium">Preventivi Totali:</span> numero di preventivi distinti attivi
                      </p>
                      <p>
                        <span className="font-medium">Giorni Analizzati:</span> ampiezza del periodo analizzato
                      </p>
                    </div>
                  </div>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>
          <p className="text-sm text-gray-600">Configura i parametri per l'analisi della pressione della domanda</p>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Date Soggiorno */}
          <div>
            <h4 className="text-sm font-medium mb-3">Date Soggiorno</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="text-sm text-gray-600 mb-2 block">Soggiorno Inizio</label>
                <ElegantDatePicker
                  date={soggiornoInizio}
                  onDateChange={setSoggiornoInizio}
                  placeholder="Seleziona data inizio soggiorno"
                />
              </div>
              <div>
                <label className="text-sm text-gray-600 mb-2 block">Soggiorno Fine</label>
                <ElegantDatePicker
                  date={soggiornoFine}
                  onDateChange={setSoggiornoFine}
                  placeholder="Seleziona data fine soggiorno"
                />
              </div>
            </div>
          </div>

          {/* Selezione Hotel */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <h4 className="text-sm font-medium">Hotel</h4>
              <div className="flex items-center space-x-2">
                <Checkbox id="all-hotels" checked={allHotelsSelected} onCheckedChange={handleAllHotelsToggle} />
                <label htmlFor="all-hotels" className="text-sm text-gray-600">
                  {allHotelsSelected ? "Tutti selezionati" : "Selezione parziale"}
                </label>
              </div>
            </div>

            {!allHotelsSelected && (
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 max-h-48 overflow-y-auto border rounded-lg p-3">
                {hotels.map((hotel) => (
                  <div key={hotel.hotel_id} className="flex items-center space-x-2">
                    <Checkbox
                      id={`hotel-${hotel.hotel_id}`}
                      checked={selectedHotels.includes(hotel.hotel_id)}
                      onCheckedChange={() => handleHotelToggle(hotel.hotel_id)}
                    />
                    <label htmlFor={`hotel-${hotel.hotel_id}`} className="text-sm text-gray-700 cursor-pointer">
                      {hotel.nome_hotel}
                    </label>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Pulsante Applica */}
          <div className="flex justify-end">
            <Button onClick={loadData} disabled={selectedHotels.length === 0 || loading} className="px-8">
              {loading ? "Caricamento..." : "Applica Filtri"}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Statistiche */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="p-6">
              <div className="text-2xl font-bold">{stats.pressione_totale.toLocaleString()}</div>
              <p className="text-xs text-muted-foreground">Pressione Totale</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-6">
              <div className="text-2xl font-bold">{stats.media_giornaliera.toLocaleString()}</div>
              <p className="text-xs text-muted-foreground">Media Giornaliera</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-6">
              <div className="text-2xl font-bold">{stats.preventivi_totali.toLocaleString()}</div>
              <p className="text-xs text-muted-foreground">Preventivi Totali</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-6">
              <div className="text-2xl font-bold">{stats.giorni_analizzati}</div>
              <p className="text-xs text-muted-foreground">Giorni Analizzati</p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Grafico */}
      {data.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Andamento Pressione Domanda</CardTitle>
            <p className="text-sm text-gray-600">Numero di richieste per periodo nel range selezionato</p>
          </CardHeader>
          <CardContent>
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis />
                  <RechartsTooltip />
                  <Bar dataKey="value" fill="#3b82f6" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Messaggio vuoto */}
      {!loading && data.length === 0 && selectedHotels.length > 0 && (
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
