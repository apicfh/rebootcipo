"use client"

import { useState, useEffect } from "react"
import { getRoomTypeIds, getStayWeekStartsBookings, getRequestWeekStartsBookings, getForecastBookingsForSpecificWeek } from "@/lib/services/predittivo-service"
import { FilterPredittivConversioni } from "@/components/predittivo/filter-conversioni"
import { GraficoConversioni } from "@/components/predittivo/grafico-conversioni"

export function ConversioniSection({ hotelId }: { hotelId: string }) {
  const [rooms, setRooms] = useState<{ id: string; nome: string }[]>([])
  const [stayWeeks, setStayWeeks] = useState<{ start: string; label: string }[]>([])
  const [requestWeeks, setRequestWeeks] = useState<{ start: string; label: string }[]>([])
  const [roomTypeIds, setRoomTypeIds] = useState<string[]>([])
  const [weekValue, setWeekValue] = useState("all")
  const [useStayWeek, setUseStayWeek] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [isLoadingFilters, setIsLoadingFilters] = useState(true)
  const [chartData, setChartData] = useState<any[]>([])
  const [roomTypeId, setRoomTypeId] = useState("all"); // Declare roomTypeId variable

  // Carica room types e settimane (sia stay che request)
  useEffect(() => {
    const loadFilters = async () => {
      try {
        console.log("[v0] Loading filters for conversioni...")

        const [roomIds, stayWeeksList, requestWeeksList] = await Promise.all([
          getRoomTypeIds(),
          getStayWeekStartsBookings(),
          getRequestWeekStartsBookings(),
        ])

        console.log("[v0] Room IDs:", roomIds)
        console.log("[v0] Stay weeks (bookings):", stayWeeksList)
        console.log("[v0] Request weeks (bookings):", requestWeeksList)

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
      console.log("[v0] Conversioni - handleApply called")
      console.log("[v0] Conversioni - roomTypeIds:", roomTypeIds)
      console.log("[v0] Conversioni - weekValue:", weekValue)
      console.log("[v0] Conversioni - useStayWeek:", useStayWeek)
      
      const data = await getForecastBookingsForSpecificWeek(
        roomTypeIds.length > 0 ? roomTypeIds : undefined,
        weekValue === "all" ? undefined : weekValue,
        useStayWeek,
      )
      console.log("[v0] Conversioni - Chart data loaded (raw from service):", data)
      console.log("[v0] Conversioni - Data length:", data.length)
      if (data.length > 0) {
        console.log("[v0] Conversioni - First item:", data[0])
        console.log("[v0] Conversioni - Max value in data:", Math.max(...data.map(d => d.reservation_num)))
      }
      
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
      <FilterPredittivConversioni
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

      {chartData.length > 0 && <GraficoConversioni data={chartData} isLoading={isLoading} />}
    </div>
  )
}
