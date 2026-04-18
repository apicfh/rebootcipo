"use client"

import { useMemo } from "react"

interface HeatmapData {
  data_notte: string
  numero_richieste: number
  hotel_id: number
}

interface HeatmapCalendarProps {
  data: HeatmapData[]
  selectedHotels: number[]
  width?: number
  height?: number
  year?: number
}

export function HeatmapCalendar({
  data,
  selectedHotels,
  width = 800,
  height = 400,
  year = 2025,
}: HeatmapCalendarProps) {
  const processedData = useMemo(() => {
    // Filtra e aggrega i dati per hotel selezionati
    const filteredData = data.filter((d) => selectedHotels.includes(d.hotel_id))

    // Aggrega per data sommando le richieste di tutti gli hotel selezionati
    const aggregated = filteredData.reduce(
      (acc, curr) => {
        const date = curr.data_notte
        acc[date] = (acc[date] || 0) + curr.numero_richieste
        return acc
      },
      {} as Record<string, number>,
    )

    // Trova min e max per la scala colori
    const values = Object.values(aggregated)
    const maxValue = Math.max(...values, 1)

    return { aggregated, maxValue }
  }, [data, selectedHotels])

  const getIntensity = (value: number) => {
    return value / processedData.maxValue
  }

  const getColor = (intensity: number) => {
    if (intensity === 0) return "bg-gray-100"
    if (intensity < 0.25) return "bg-blue-200"
    if (intensity < 0.5) return "bg-blue-400"
    if (intensity < 0.75) return "bg-blue-600"
    return "bg-blue-800"
  }

  const getTextColor = (intensity: number) => {
    if (intensity === 0) return "text-gray-600"
    if (intensity < 0.5) return "text-gray-700"
    return "text-white"
  }

  const generateDates = () => {
    const dates = []
    const start = new Date(`${year}-05-12`)
    const end = new Date(`${year}-09-15`)

    for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
      dates.push(new Date(d))
    }
    return dates
  }

  const dates = generateDates()

  const getMonthLabels = () => {
    const months = ["Gen", "Feb", "Mar", "Apr", "Mag", "Giu", "Lug", "Ago", "Set", "Ott", "Nov", "Dic"]
    const monthCounts: Record<string, number> = {}

    dates.forEach((date) => {
      const monthKey = months[date.getMonth()]
      monthCounts[monthKey] = (monthCounts[monthKey] || 0) + 1
    })

    return Object.entries(monthCounts).map(([month, count]) => ({ month, count }))
  }

  const monthLabels = getMonthLabels()

  return (
    <div className="w-full max-w-4xl mx-auto">
      {/* Header giorni della settimana */}
      <div className="grid gap-0" style={{ gridTemplateColumns: "repeat(7, 1fr)" }}>
        {["Lun", "Mar", "Mer", "Gio", "Ven", "Sab", "Dom"].map((day, index) => (
          <div
            key={`day-${index}`}
            className="text-xs font-medium text-gray-500 text-center p-1 h-6 flex items-center justify-center"
          >
            {day.charAt(0)}
          </div>
        ))}

        {dates.map((date) => {
          const dateStr = date.toISOString().split("T")[0]
          const value = processedData.aggregated[dateStr] || 0
          const intensity = getIntensity(value)
          const colorClass = getColor(intensity)
          const textColorClass = getTextColor(intensity)

          return (
            <div
              key={dateStr}
              className={`w-6 h-6 ${colorClass} text-xs flex items-center justify-center cursor-pointer hover:ring-2 hover:ring-blue-400 hover:scale-110 transition-all ${textColorClass} font-medium relative group`}
              title={`${date.getDate()}/${date.getMonth() + 1}/${date.getFullYear()}: ${value} richieste`}
            >
              {date.getDate()}
              <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-2 py-1 bg-gray-900 text-white text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap z-10">
                {date.toLocaleDateString("it-IT", {
                  weekday: "short",
                  day: "numeric",
                  month: "short",
                  year: "numeric",
                })}
                <br />
                <strong>{value} richieste</strong>
              </div>
            </div>
          )
        })}
      </div>

      <div className="flex justify-center items-center mt-4 gap-4 text-sm text-gray-600">
        {monthLabels.map(({ month, count }, index) => (
          <div key={`month-${month}-${index}`} className="text-center">
            <div className="font-medium">{month}</div>
            <div className="text-xs text-gray-400">{count} giorni</div>
          </div>
        ))}
      </div>

      {/* Legenda */}
      <div className="flex items-center justify-center mt-4 gap-2 text-xs text-gray-600">
        <span>Meno</span>
        <div className="flex gap-1">
          <div className="w-3 h-3 bg-gray-100 rounded-sm"></div>
          <div className="w-3 h-3 bg-blue-200 rounded-sm"></div>
          <div className="w-3 h-3 bg-blue-400 rounded-sm"></div>
          <div className="w-3 h-3 bg-blue-600 rounded-sm"></div>
          <div className="w-3 h-3 bg-blue-800 rounded-sm"></div>
        </div>
        <span>Più</span>
      </div>
    </div>
  )
}
