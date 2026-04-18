"use client"

import { useState, useEffect } from "react"
import { supabase } from "@/lib/supabase/client"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Checkbox } from "@/components/ui/checkbox"
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts"
import { format, subDays, startOfDay, endOfDay, getDay, addDays, subYears } from "date-fns"
import { it } from "date-fns/locale"
import { ArrowUp, ArrowDown, Minus, Info } from "lucide-react"

interface Hotel {
  id: number
  nome: string
}

interface Prenotazione {
  id: number
  id_hotel: number
  data_prenotazione: string
  arrivo: string
  partenza: string
}

interface PickUpMetrics {
  prenotazioni: number
  notti: number
}

interface ChartDataPoint {
  date: string
  displayDate: string
  dayOfWeek: string
  notti2026: number
  notti2025: number
}

export default function PickUpPage() {
  const [hotels, setHotels] = useState<Hotel[]>([])
  const [selectedHotel, setSelectedHotel] = useState<string>("globale")
  const [pickUpDays, setPickUpDays] = useState<string>("7")
  const [customDays, setCustomDays] = useState<string>("7")
  const [showYoYComparison, setShowYoYComparison] = useState(true)
  const [loading, setLoading] = useState(false)

  const [metrics2026, setMetrics2026] = useState<PickUpMetrics>({ prenotazioni: 0, notti: 0 })
  const [metrics2025, setMetrics2025] = useState<PickUpMetrics>({ prenotazioni: 0, notti: 0 })
  const [chartData, setChartData] = useState<ChartDataPoint[]>([])

  // Carica lista hotel
  useEffect(() => {
    async function fetchHotels() {
      const { data } = await supabase.from("hotel").select("id, nome").order("nome")
      if (data) {
        setHotels(data)
      }
    }
    fetchHotels()
  }, [])

  // Funzione per calcolare la data corrispondente dell'anno precedente allineata a day of week
  function getCorrespondingDateLastYear(date: Date): Date {
    const dayOfWeek = getDay(date)
    const lastYearDate = subYears(date, 1)
    const lastYearDayOfWeek = getDay(lastYearDate)
    const diff = dayOfWeek - lastYearDayOfWeek
    return addDays(lastYearDate, diff)
  }

  // Funzione per generare le notti da una prenotazione (arrivo incluso, partenza esclusa)
  function generateNights(arrivo: string, partenza: string): Date[] {
    const nights: Date[] = []
    const arrivoDate = new Date(arrivo)
    const partenzaDate = new Date(partenza)

    let currentDate = new Date(arrivoDate)
    while (currentDate < partenzaDate) {
      nights.push(new Date(currentDate))
      currentDate = addDays(currentDate, 1)
    }

    return nights
  }

  // Carica dati pick up
  useEffect(() => {
    async function fetchPickUpData() {
      console.log("[v0] Fetch triggered with pickUpDays:", pickUpDays, "customDays:", customDays)
      
      setLoading(true)
      try {
        const today = new Date()
        const daysToSubtract = pickUpDays === "custom" ? Number.parseInt(customDays) : Number.parseInt(pickUpDays)
        console.log("[v0] daysToSubtract calculated:", daysToSubtract)

        // Calcola range date prenotazione (anno corrente)
        // Sottrai (daysToSubtract - 1) perché vogliamo includere oggi più i giorni precedenti
        // Es: pickUpDays = 2 significa oggi + ieri, quindi subDays(today, 1)
        const startDate2025 = startOfDay(subDays(today, daysToSubtract - 1))
        const endDate2025 = endOfDay(today)

        // Calcola range date prenotazione (anno precedente) allineato a day of week
        let startDate2024 = getCorrespondingDateLastYear(startDate2025)
        let endDate2024 = getCorrespondingDateLastYear(endDate2025)
        
        console.log("[v0] Pick Up - BEFORE FIX 2024:", format(startDate2024, "yyyy-MM-dd"), "to", format(endDate2024, "yyyy-MM-dd"))
        
        // Assicura che startDate2024 < endDate2024 (in caso di inversione dovuta ai day-of-week)
        if (startDate2024 > endDate2024) {
          console.log("[v0] Pick Up - INVERTING dates because start > end")
          ;[startDate2024, endDate2024] = [endDate2024, startDate2024]
        }
        
        console.log("[v0] Pick Up - AFTER FIX 2024:", format(startDate2024, "yyyy-MM-dd"), "to", format(endDate2024, "yyyy-MM-dd"))

        console.log(
          "[v0] Pick Up - Range 2025:",
          format(startDate2025, "yyyy-MM-dd"),
          "to",
          format(endDate2025, "yyyy-MM-dd"),
        )
        console.log(
          "[v0] Pick Up - Range 2024:",
          format(startDate2024, "yyyy-MM-dd"),
          "to",
          format(endDate2024, "yyyy-MM-dd"),
        )
        console.log("[v0] Filtro hotel selezionato:", {
          selectedHotel,
          tipo: typeof selectedHotel,
          isGlobale: selectedHotel === "globale",
        })

        // Query per prenotazioni 2026 (data_prenotazione nel 2025)
        let query2026 = supabase
          .from("prenotazioni")
          .select("id, id_hotel, data_prenotazione, arrivo, partenza")
          .gte("data_prenotazione", format(startDate2025, "yyyy-MM-dd"))
          .lte("data_prenotazione", format(endDate2025, "yyyy-MM-dd"))
          .gte("arrivo", "2026-05-01")
          .lte("arrivo", "2026-09-30")

        if (selectedHotel !== "globale") {
          console.log("[v0] Applicando filtro hotel UUID:", selectedHotel)
          query2026 = query2026.eq("id_hotel", selectedHotel)
        } else {
          console.log("[v0] Modalità globale - nessun filtro hotel applicato")
        }

        // Query per prenotazioni 2025 (data_prenotazione nel 2024)
        let query2025 = supabase
          .from("prenotazioni")
          .select("id, id_hotel, data_prenotazione, arrivo, partenza")
          .gte("data_prenotazione", format(startDate2024, "yyyy-MM-dd"))
          .lte("data_prenotazione", format(endDate2024, "yyyy-MM-dd"))
          .gte("arrivo", "2025-05-01")
          .lte("arrivo", "2025-09-30")

        if (selectedHotel !== "globale") {
          query2025 = query2025.eq("id_hotel", selectedHotel)
        }

        const [result2026, result2025] = await Promise.all([query2026, query2025])

        const prenotazioni2026 = result2026.data || []
        const prenotazioni2025 = result2025.data || []

        console.log("[v0] Prenotazioni 2026 RAW COUNT:", prenotazioni2026.length)
        console.log("[v0] Prenotazioni 2025 RAW COUNT:", prenotazioni2025.length)
        console.log("[v0] Prenotazioni 2025 SAMPLE (first 3):", prenotazioni2025.slice(0, 3).map(p => ({
          id: p.id,
          data_prenotazione: p.data_prenotazione,
          arrivo: p.arrivo,
          partenza: p.partenza
        })))
        if (result2026.error) console.error("[v0] Errore query 2026:", result2026.error)
        if (result2025.error) console.error("[v0] Errore query 2025:", result2025.error)

        // Calcola metriche 2026
        const notti2026Map = new Map<string, number>()
        let totalNotti2026 = 0

        prenotazioni2026.forEach((p) => {
          const nights = generateNights(p.arrivo, p.partenza)
          totalNotti2026 += nights.length

          nights.forEach((night) => {
            const dateKey = format(night, "yyyy-MM-dd")
            notti2026Map.set(dateKey, (notti2026Map.get(dateKey) || 0) + 1)
          })
        })

        // Calcola metriche 2025
        const notti2025Map = new Map<string, number>()
        let totalNotti2025 = 0

        prenotazioni2025.forEach((p) => {
          const nights = generateNights(p.arrivo, p.partenza)
          totalNotti2025 += nights.length

          nights.forEach((night) => {
            const dateKey = format(night, "yyyy-MM-dd")
            notti2025Map.set(dateKey, (notti2025Map.get(dateKey) || 0) + 1)
          })
        })

        setMetrics2026({ prenotazioni: prenotazioni2026.length, notti: totalNotti2026 })
        setMetrics2025({ prenotazioni: prenotazioni2025.length, notti: totalNotti2025 })

        // Genera dati per il grafico (maggio-settembre 2026)
        const chartDataPoints: ChartDataPoint[] = []
        const startChartDate = new Date("2026-05-01")
        const endChartDate = new Date("2026-09-30")

        let currentChartDate = new Date(startChartDate)
        while (currentChartDate <= endChartDate) {
          const dateKey2026 = format(currentChartDate, "yyyy-MM-dd")
          const correspondingDate2025 = getCorrespondingDateLastYear(currentChartDate)
          const dateKey2025 = format(correspondingDate2025, "yyyy-MM-dd")

          chartDataPoints.push({
            date: dateKey2026,
            displayDate: format(currentChartDate, "dd/MM"),
            dayOfWeek: format(currentChartDate, "EEEE", { locale: it }),
            notti2026: notti2026Map.get(dateKey2026) || 0,
            notti2025: notti2025Map.get(dateKey2025) || 0,
          })

          currentChartDate = addDays(currentChartDate, 1)
        }

        setChartData(chartDataPoints)
      } catch (error) {
        console.error("[v0] Errore nel caricamento dati pick up:", error)
      } finally {
        setLoading(false)
      }
    }

    fetchPickUpData()
  }, [selectedHotel, pickUpDays, customDays])

  // Calcola variazioni percentuali
  const prenotazioniVariation =
    metrics2025.prenotazioni > 0
      ? ((metrics2026.prenotazioni - metrics2025.prenotazioni) / metrics2025.prenotazioni) * 100
      : 0

  const nottiVariation = metrics2025.notti > 0 ? ((metrics2026.notti - metrics2025.notti) / metrics2025.notti) * 100 : 0

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold text-primary-700">Pick Up</h1>
      </div>

      {/* Filtri */}
      <Card>
        <CardHeader>
          <CardTitle>Filtri</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Selezione Hotel */}
            <div className="space-y-2">
              <Label>Hotel</Label>
              <Select value={selectedHotel} onValueChange={setSelectedHotel}>
                <SelectTrigger>
                  <SelectValue placeholder="Seleziona hotel" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="globale">Globale</SelectItem>
                  {hotels.map((hotel) => (
                    <SelectItem key={hotel.id} value={hotel.id.toString()}>
                      {hotel.nome}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Selezione Pick Up Days */}
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <Label>Pick Up a</Label>
                <div className="group relative">
                  <Info className="w-4 h-4 text-gray-400 cursor-help" />
                  <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 hidden group-hover:block bg-gray-900 text-white text-xs rounded p-3 w-48 z-10">
                    Quando i giorni di pick up portano allo scavalcamento del mese, il sistema recupera un range più ampio del dovuto per via del calendario. In quel caso aggiungi/togli una giornata al pick up per vedere i dati corretti!
                  </div>
                </div>
              </div>
              <div className="flex gap-2">
                <Select value={pickUpDays} onValueChange={setPickUpDays}>
                  <SelectTrigger className="flex-1">
                    <SelectValue placeholder="Seleziona periodo" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="1">Ieri (1 giorno)</SelectItem>
                    <SelectItem value="3">3 giorni</SelectItem>
                    <SelectItem value="7">7 giorni</SelectItem>
                    <SelectItem value="30">30 giorni</SelectItem>
                    <SelectItem value="custom">Personalizzato</SelectItem>
                  </SelectContent>
                </Select>
                {pickUpDays === "custom" && (
                  <Input
                    type="number"
                    min="1"
                    value={customDays}
                    onChange={(e) => setCustomDays(e.target.value)}
                    placeholder="Giorni"
                    className="w-24"
                  />
                )}
              </div>
            </div>
          </div>

          {/* Checkbox confronto YoY */}
          <div className="flex items-center space-x-2">
            <Checkbox
              id="yoy-comparison"
              checked={showYoYComparison}
              onCheckedChange={(checked) => setShowYoYComparison(checked as boolean)}
            />
            <Label htmlFor="yoy-comparison" className="cursor-pointer">
              Mostra confronto anno precedente
            </Label>
          </div>
        </CardContent>
      </Card>

      {/* Card Metriche */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Card Prenotazioni */}
        <Card>
          <CardHeader>
            <CardTitle>Prenotazioni</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="text-4xl font-bold text-primary-700">{metrics2026.prenotazioni}</div>
              {showYoYComparison && (
                <div className="flex items-center gap-2 text-sm">
                  <span className="text-muted-foreground">vs anno precedente:</span>
                  <span className="font-medium">{metrics2025.prenotazioni}</span>
                  {prenotazioniVariation !== 0 && (
                    <span
                      className={`flex items-center gap-1 ${
                        prenotazioniVariation > 0 ? "text-green-600" : "text-red-600"
                      }`}
                    >
                      {prenotazioniVariation > 0 ? (
                        <ArrowUp className="h-4 w-4" />
                      ) : prenotazioniVariation < 0 ? (
                        <ArrowDown className="h-4 w-4" />
                      ) : (
                        <Minus className="h-4 w-4" />
                      )}
                      {Math.abs(prenotazioniVariation).toFixed(1)}%
                    </span>
                  )}
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Card Notti */}
        <Card>
          <CardHeader>
            <CardTitle>Notti</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="text-4xl font-bold text-primary-700">{metrics2026.notti}</div>
              {showYoYComparison && (
                <div className="flex items-center gap-2 text-sm">
                  <span className="text-muted-foreground">vs anno precedente:</span>
                  <span className="font-medium">{metrics2025.notti}</span>
                  {nottiVariation !== 0 && (
                    <span
                      className={`flex items-center gap-1 ${nottiVariation > 0 ? "text-green-600" : "text-red-600"}`}
                    >
                      {nottiVariation > 0 ? (
                        <ArrowUp className="h-4 w-4" />
                      ) : nottiVariation < 0 ? (
                        <ArrowDown className="h-4 w-4" />
                      ) : (
                        <Minus className="h-4 w-4" />
                      )}
                      {Math.abs(nottiVariation).toFixed(1)}%
                    </span>
                  )}
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Grafico a Barre */}
      <Card>
        <CardHeader>
          <CardTitle>Distribuzione Notti per Periodo di Soggiorno</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="h-96 flex items-center justify-center">
              <p className="text-muted-foreground">Caricamento dati...</p>
            </div>
          ) : (
            <ResponsiveContainer width="100%" height={400}>
              <BarChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="displayDate" tick={{ fontSize: 12 }} interval="preserveStartEnd" />
                <YAxis />
                <Tooltip
                  content={({ active, payload }) => {
                    if (active && payload && payload.length) {
                      const data = payload[0].payload
                      return (
                        <div className="bg-white p-3 border border-gray-200 rounded shadow-lg">
                          <p className="font-semibold">{data.displayDate}</p>
                          <p className="text-sm text-muted-foreground">{data.dayOfWeek}</p>
                          <p className="text-sm">
                            <span className="font-medium text-primary-700">2026:</span> {data.notti2026} notti
                          </p>
                          {showYoYComparison && (
                            <p className="text-sm">
                              <span className="font-medium text-accent-600">2025:</span> {data.notti2025} notti
                            </p>
                          )}
                        </div>
                      )
                    }
                    return null
                  }}
                />
                <Legend />
                <Bar dataKey="notti2026" fill="#1e40af" name="Notti 2026" />
                {showYoYComparison && <Bar dataKey="notti2025" fill="#f59e0b" name="Notti 2025" />}
              </BarChart>
            </ResponsiveContainer>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
