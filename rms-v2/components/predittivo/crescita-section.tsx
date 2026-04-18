"use client"

import { useState, useEffect } from "react"
import { getRoomTypeIds, getStayWeekStarts, getStayWeekStartsBookings, getGrowthQuotesPace, getGrowthBookingsPace, getGrowthPaceCombined } from "@/lib/services/predittivo-service"
import type { GrowthRpcParams, GrowthRpcOutput, GrowthCombinedRpcOutput } from "@/lib/services/predittivo-service"
import { FilterCrescita } from "@/components/predittivo/filter-crescita"
import { GraficoCrescita } from "@/components/predittivo/grafico-crescita"

interface CrescitaSectionProps {
  hotelId: string
}

export function CrescitaSection({ hotelId }: CrescitaSectionProps) {
  const [rooms, setRooms] = useState<{ id: string; nome: string }[]>([])
  const [stayWeeksQuotes, setStayWeeksQuotes] = useState<{ start: string; label: string }[]>([])
  const [stayWeeksBookings, setStayWeeksBookings] = useState<{ start: string; label: string }[]>([])
  const [roomTypeIds, setRoomTypeIds] = useState<string[]>([])
  const [stayWeekStart, setStayWeekStart] = useState("")
  const [mode, setMode] = useState<'incremental' | 'cumulative'>('incremental')
  const [metricType, setMetricType] = useState<'quotes' | 'bookings' | 'combined'>('combined')
  const [includeForecast, setIncludeForecast] = useState(true)
  const [isLoading, setIsLoading] = useState(false)
  const [isLoadingFilters, setIsLoadingFilters] = useState(true)
  const [chartData, setChartData] = useState<GrowthRpcOutput[] | GrowthCombinedRpcOutput[]>([])
  const [stayWeeks, setStayWeeks] = useState<{ start: string; label: string }[]>([])

  // Carica room types e settimane (sia quotes che bookings)
  useEffect(() => {
    const loadFilters = async () => {
      try {
        console.log("[v0] Crescita - Loading filters...")

        const [roomIds, stayWeeksQuotesList, stayWeeksBookingsList] = await Promise.all([
          getRoomTypeIds(),
          getStayWeekStarts(),
          getStayWeekStartsBookings(),
        ])

        console.log("[v0] Crescita - Room IDs:", roomIds)
        console.log("[v0] Crescita - Stay weeks (quotes):", stayWeeksQuotesList)
        console.log("[v0] Crescita - Stay weeks (bookings):", stayWeeksBookingsList)

        setRooms(roomIds.map((id) => ({ id, nome: id })))

        const formattedStayWeeksQuotes = stayWeeksQuotesList.map((week) => ({
          start: week,
          label: new Date(week).toLocaleDateString("it-IT", { year: "numeric", month: "long", day: "numeric" }),
        }))

        const formattedStayWeeksBookings = stayWeeksBookingsList.map((week) => ({
          start: week,
          label: new Date(week).toLocaleDateString("it-IT", { year: "numeric", month: "long", day: "numeric" }),
        }))

        setStayWeeksQuotes(formattedStayWeeksQuotes)
        setStayWeeksBookings(formattedStayWeeksBookings)

        // Set primo stay week come default (da quotes per default)
        if (formattedStayWeeksQuotes.length > 0) {
          setStayWeekStart(formattedStayWeeksQuotes[0].start)
        }
      } catch (error) {
        console.error("[v0] Crescita - Error loading filters:", error)
      } finally {
        setIsLoadingFilters(false)
      }
    }

    loadFilters()
  }, [])

  // Seleziona la lista di stay weeks corretta in base al metricType
  const activeStayWeeks = metricType === 'bookings' ? stayWeeksBookings : 
                           metricType === 'combined' ? stayWeeksBookings : 
                           stayWeeksQuotes

  const handleApply = async () => {
    if (!stayWeekStart) {
      console.error("[v0] Crescita - Stay week not selected")
      return
    }

    setIsLoading(true)
    try {
      console.log("[v0] Crescita - handleApply called", {
        hotelId,
        roomTypeIds,
        stayWeekStart,
        mode,
        metricType,
        includeForecast,
      })

      const params: GrowthRpcParams = {
        p_hotel_id: hotelId,
        p_stay_week_start: stayWeekStart,
        p_room_type_ids: roomTypeIds.length > 0 ? roomTypeIds : null,
        p_mode: mode,
        p_include_forecast: includeForecast,
      }

      let data: GrowthRpcOutput[] | GrowthCombinedRpcOutput[] = []

      if (metricType === 'quotes') {
        data = await getGrowthQuotesPace(params)
      } else if (metricType === 'bookings') {
        data = await getGrowthBookingsPace(params)
      } else {
        data = await getGrowthPaceCombined(params)
      }

      console.log("[v0] Crescita - Chart data loaded:", {
        count: data.length,
        firstItem: data[0],
      })

      setChartData(data)
    } catch (error) {
      console.error("[v0] Crescita - Error loading chart data:", error)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="space-y-6">
      <FilterCrescita
        roomTypeIds={roomTypeIds}
        stayWeekStart={stayWeekStart}
        rooms={rooms}
        stayWeeks={activeStayWeeks}
        isLoading={isLoading || isLoadingFilters}
        mode={mode}
        metricType={metricType}
        includeForecast={includeForecast}
        onRoomChange={setRoomTypeIds}
        onStayWeekChange={setStayWeekStart}
        onModeChange={setMode}
        onMetricTypeChange={(newMetricType) => {
          setMetricType(newMetricType)
          // Reset stay week selection quando cambia metricType
          setStayWeekStart("")
          setChartData([])
        }}
        onIncludeForecastChange={setIncludeForecast}
        onApply={handleApply}
      />

      {chartData.length > 0 && (
        <GraficoCrescita
          data={chartData}
          metricType={metricType}
          mode={mode}
          includeForecast={includeForecast}
          isLoading={isLoading}
        />
      )}
    </div>
  )
}
