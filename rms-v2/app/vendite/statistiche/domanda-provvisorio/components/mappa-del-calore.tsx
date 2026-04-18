"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { HeatmapHotelDays } from "@/components/charts/heatmap-hotel-days"
import { DomandaTravelbrainService, type HeatmapGiorniRichiestiData } from "@/lib/services/domanda-travelbrain-service"

interface HeatmapCalendarData {
  data_notte: string
  numero_richieste: number
  hotel_id: number
}

export function MappaDelCalore() {
  const [selectedYears, setSelectedYears] = useState<number[]>([2025])
  const [selectedHotels, setSelectedHotels] = useState<number[]>([])
  const [aggregateView, setAggregateView] = useState(false)
  const [aggregateHotels, setAggregateHotels] = useState(false)
  const [zoomLevel, setZoomLevel] = useState<string>("medium")
  const [heatmapData, setHeatmapData] = useState<HeatmapGiorniRichiestiData[]>([])
  const [hotels, setHotels] = useState<{ hotel_id: number; nome_hotel: string }[]>([])
  const [loading, setLoading] = useState(false)

  const availableYears = [2020, 2021, 2022, 2023, 2024, 2025, 2026]

  useEffect(() => {
    const loadHotels = async () => {
      try {
        const hotelData = await DomandaTravelbrainService.getHotelsTravelbrain()
        setHotels(hotelData)
        setSelectedHotels(hotelData.map((h) => h.hotel_id))
      } catch (error) {
        console.error("Errore nel caricamento hotel:", error)
      }
    }
    loadHotels()
  }, [])

  useEffect(() => {
    const loadHeatmapData = async () => {
      if (selectedYears.length === 0 || selectedHotels.length === 0) {
        setHeatmapData([])
        return
      }

      setLoading(true)
      try {
        console.log("[v0] Caricamento heatmap con parametri:", { anni: selectedYears, hotelIds: selectedHotels })
        const data = await DomandaTravelbrainService.getHeatmapGiorniRichiesti({
          anni: selectedYears,
          hotelIds: selectedHotels,
        })
        console.log("[v0] Dati heatmap ricevuti:", data)
        setHeatmapData(data)
      } catch (error) {
        console.error("Errore nel caricamento dati heatmap:", error)
      } finally {
        setLoading(false)
      }
    }

    loadHeatmapData()
  }, [selectedYears, selectedHotels])

  const handleYearToggle = (year: number) => {
    setSelectedYears((prev) => (prev.includes(year) ? prev.filter((y) => y !== year) : [...prev, year].sort()))
  }

  const handleHotelToggle = (hotelId: number) => {
    setSelectedHotels((prev) => (prev.includes(hotelId) ? prev.filter((h) => h !== hotelId) : [...prev, hotelId]))
  }

  const handleSelectAllHotels = () => {
    setSelectedHotels(hotels.map((h) => h.hotel_id))
  }

  const handleDeselectAllHotels = () => {
    setSelectedHotels([])
  }

  const convertDataForHeatmap = (data: HeatmapGiorniRichiestiData[], year: number): HeatmapCalendarData[] => {
    const filtered = data.filter((d) => d.anno === year)
    console.log("[v0] Dati filtrati per anno", year, ":", filtered)

    const converted = filtered.map((d) => ({
      data_notte: d.day,
      numero_richieste: d.requests,
      hotel_id: d.hotel_id,
    }))

    console.log("[v0] Dati convertiti per HeatmapHotelDays anno", year, ":", converted)
    return converted
  }

  const getHotelAggregatedData = (data: HeatmapCalendarData[]): HeatmapCalendarData[] => {
    const aggregated: Record<string, number> = {}

    data.forEach((d) => {
      const key = d.data_notte
      aggregated[key] = (aggregated[key] || 0) + d.numero_richieste
    })

    return Object.entries(aggregated).map(([date, requests]) => ({
      data_notte: date,
      numero_richieste: requests,
      hotel_id: 0, // ID speciale per dati aggregati
    }))
  }

  const getAggregatedData = (): HeatmapCalendarData[] => {
    const aggregated: Record<string, Record<number, number>> = {}

    const filteredData = heatmapData.filter((d) => selectedYears.includes(d.anno))
    console.log("[v0] Dati filtrati per aggregazione:", filteredData)

    filteredData.forEach((d) => {
      const monthDay = d.day.substring(5) // "MM-DD"
      const key = `2025-${monthDay}` // Anno fisso per visualizzazione
      if (!aggregated[key]) aggregated[key] = {}
      aggregated[key][d.hotel_id] = (aggregated[key][d.hotel_id] || 0) + d.requests
    })

    const result: HeatmapCalendarData[] = []
    Object.entries(aggregated).forEach(([date, hotelData]) => {
      Object.entries(hotelData).forEach(([hotelId, requests]) => {
        result.push({
          data_notte: date,
          numero_richieste: requests,
          hotel_id: Number.parseInt(hotelId),
        })
      })
    })

    console.log("[v0] Dati aggregati per HeatmapHotelDays:", result)
    return aggregateHotels ? getHotelAggregatedData(result) : result
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Mappa del Calore</CardTitle>
        <p className="text-sm text-gray-600">
          Heatmap della densità richieste per hotel e giorno della stagione (12 maggio - 15 settembre)
        </p>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="space-y-4">
          <div>
            <Label className="text-sm font-medium mb-2 block">Anni</Label>
            <div className="flex flex-wrap gap-2">
              {availableYears.map((year) => (
                <div key={year} className="flex items-center space-x-2">
                  <Checkbox
                    id={`year-${year}`}
                    checked={selectedYears.includes(year)}
                    onCheckedChange={() => handleYearToggle(year)}
                  />
                  <Label htmlFor={`year-${year}`} className="text-sm">
                    {year}
                  </Label>
                </div>
              ))}
            </div>
            <div className="mt-2">
              {selectedYears.map((year) => (
                <Badge key={year} variant="secondary" className="mr-1">
                  {year}
                </Badge>
              ))}
            </div>
          </div>

          <Separator />

          <div>
            <div className="flex items-center justify-between mb-2">
              <Label className="text-sm font-medium">Hotel</Label>
              <div className="space-x-2">
                <Button variant="outline" size="sm" onClick={handleSelectAllHotels}>
                  Seleziona tutti
                </Button>
                <Button variant="outline" size="sm" onClick={handleDeselectAllHotels}>
                  Deseleziona tutti
                </Button>
              </div>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-2 max-h-32 overflow-y-auto">
              {hotels.map((hotel) => (
                <div key={hotel.hotel_id} className="flex items-center space-x-2">
                  <Checkbox
                    id={`hotel-${hotel.hotel_id}`}
                    checked={selectedHotels.includes(hotel.hotel_id)}
                    onCheckedChange={() => handleHotelToggle(hotel.hotel_id)}
                  />
                  <Label htmlFor={`hotel-${hotel.hotel_id}`} className="text-xs">
                    {hotel.nome_hotel}
                  </Label>
                </div>
              ))}
            </div>
            <div className="mt-2">
              <Badge variant="outline">{selectedHotels.length} hotel selezionati</Badge>
            </div>
          </div>

          <Separator />

          <div className="space-y-4">
            <Label className="text-sm font-medium">Controlli Visualizzazione</Label>

            <div className="flex flex-wrap gap-4">
              {selectedYears.length > 1 && (
                <div className="flex items-center space-x-2">
                  <Checkbox id="aggregate-view" checked={aggregateView} onCheckedChange={setAggregateView} />
                  <Label htmlFor="aggregate-view" className="text-sm">
                    Aggrega anni
                  </Label>
                </div>
              )}

              <div className="flex items-center space-x-2">
                <Checkbox id="aggregate-hotels" checked={aggregateHotels} onCheckedChange={setAggregateHotels} />
                <Label htmlFor="aggregate-hotels" className="text-sm">
                  Aggrega hotel
                </Label>
              </div>

              <div className="flex items-center space-x-2">
                <Label htmlFor="zoom-level" className="text-sm">
                  Zoom:
                </Label>
                <Select value={zoomLevel} onValueChange={setZoomLevel}>
                  <SelectTrigger className="w-24">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="small">S</SelectItem>
                    <SelectItem value="medium">M</SelectItem>
                    <SelectItem value="large">L</SelectItem>
                    <SelectItem value="xlarge">XL</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>

          <Separator />
        </div>

        <div className="space-y-6">
          {loading ? (
            <div className="flex items-center justify-center h-64">
              <p className="text-gray-600">Caricamento dati...</p>
            </div>
          ) : selectedYears.length === 0 || selectedHotels.length === 0 ? (
            <div className="flex items-center justify-center h-64">
              <p className="text-gray-600">Seleziona almeno un anno e un hotel per visualizzare la heatmap</p>
            </div>
          ) : aggregateView && selectedYears.length > 1 ? (
            <div>
              <h3 className="text-lg font-medium mb-4">
                Vista Aggregata ({selectedYears.join(", ")}){aggregateHotels && " - Hotel Aggregati"}
              </h3>
              <HeatmapHotelDays
                data={getAggregatedData()}
                hotels={aggregateHotels ? [{ hotel_id: 0, nome_hotel: "Tutti gli Hotel" }] : hotels}
                selectedHotels={aggregateHotels ? [0] : selectedHotels}
                year={2025}
                zoomLevel={zoomLevel}
              />
            </div>
          ) : (
            selectedYears.map((year) => {
              const yearData = convertDataForHeatmap(heatmapData, year)
              const finalData = aggregateHotels ? getHotelAggregatedData(yearData) : yearData

              return (
                <div key={year}>
                  <h3 className="text-lg font-medium mb-4">
                    Anno {year}
                    {aggregateHotels && " - Hotel Aggregati"}
                  </h3>
                  <HeatmapHotelDays
                    data={finalData}
                    hotels={aggregateHotels ? [{ hotel_id: 0, nome_hotel: "Tutti gli Hotel" }] : hotels}
                    selectedHotels={aggregateHotels ? [0] : selectedHotels}
                    year={year}
                    zoomLevel={zoomLevel}
                  />
                </div>
              )
            })
          )}
        </div>
      </CardContent>
    </Card>
  )
}
