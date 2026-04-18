"use client"

import { useState, useEffect } from "react"
import { getRoomTypeIds, getStayWeekStarts, getRequestWeekStarts, getForecastQuotesForSpecificWeek } from "@/lib/services/predittivo-service"
import { FilterPredittivorichieste } from "@/components/predittivo/filter-richieste"
import { GraficoRichieste } from "@/components/predittivo/grafico-richieste"

export function RichiesteSection({ hotelId }: { hotelId: string }) {
  const [rooms, setRooms] = useState<{ id: string; nome: string }[]>([])
  const [stayWeeks, setStayWeeks] = useState<{ start: string; label: string }[]>([])
  const [requestWeeks, setRequestWeeks] = useState<{ start: string; label: string }[]>([])
  const [roomTypeIds, setRoomTypeIds] = useState<string[]>([])
  const [weekValue, setWeekValue] = useState("all")
  const [useStayWeek, setUseStayWeek] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [isLoadingFilters, setIsLoadingFilters] = useState(true)
  const [chartData, setChartData] = useState<any[]>([])

  // Carica room types e settimane (sia stay che request)
  useEffect(() => {
    const loadFilters = async () => {
      try {
        console.log("[v0] Loading filters...")

        const [roomIds, stayWeeksList, requestWeeksList] = await Promise.all([
          getRoomTypeIds(),
          getStayWeekStarts(),
          getRequestWeekStarts(),
        ])

        console.log("[v0] Room IDs:", roomIds)
        console.log("[v0] Stay weeks:", stayWeeksList)
        console.log("[v0] Request weeks:", requestWeeksList)

        setRooms(roomIds.map((id) => ({ id, nome: id })))

        setStayWeeks(
          stayWeeksList.map((week) => ({
            start: week,
            label: new Date(week).toLocaleDateString("it-IT", { year: "numeric", month: "long", day: "numeric" }),
          })),
        )

        setRequestWeeks(
          requestWeeksList.map((week) => ({
            start: week,
            label: new Date(week).toLocaleDateString("it-IT", { year: "numeric", month: "long", day: "numeric" }),
          })),
        )
      } catch (error) {
        console.error("[v0] Error loading filters:", error)
      } finally {
        setIsLoadingFilters(false)
      }
    }

    loadFilters()
  }, [])

  const handleApply = async () => {
    setIsLoading(true)
    try {
      const data = await getForecastQuotesForSpecificWeek(
        roomTypeIds.length > 0 ? roomTypeIds : undefined,
        weekValue === "all" ? undefined : weekValue,
        useStayWeek,
      )
      console.log("[v0] Chart data loaded:", data)
      setChartData(data)
    } catch (error) {
      console.error("[v0] Error loading chart data:", error)
    } finally {
      setIsLoading(false)
    }
  }

  const weeksToDisplay = useStayWeek ? requestWeeks : stayWeeks

  return (
    <div className="space-y-6">
      <FilterPredittivorichieste
        roomTypeIds={roomTypeIds}
        stayWeekStart={weekValue}
        rooms={rooms}
        weeks={weeksToDisplay}
        isLoading={isLoading || isLoadingFilters}
        useStayWeek={useStayWeek}
        onRoomChange={setRoomTypeIds}
        onWeekChange={setWeekValue}
        onToggleWeekType={(useStay) => {
          setUseStayWeek(useStay)
          setWeekValue("all")
        }}
        onApply={handleApply}
      />

      {chartData.length > 0 && <GraficoRichieste data={chartData} isLoading={isLoading} />}
    </div>
  )
}
