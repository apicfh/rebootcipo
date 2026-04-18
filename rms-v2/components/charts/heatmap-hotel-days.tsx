"use client"

import { useMemo } from "react"

interface HeatmapData {
  data_notte: string
  numero_richieste: number
  hotel_id: number
}

interface Hotel {
  hotel_id: number
  nome_hotel: string
}

interface HeatmapHotelDaysProps {
  data: HeatmapData[]
  hotels: Hotel[]
  selectedHotels: number[]
  year?: number
  zoomLevel?: string // Added zoom level prop
}

export function HeatmapHotelDays({
  data,
  hotels,
  selectedHotels,
  year = 2025,
  zoomLevel = "medium",
}: HeatmapHotelDaysProps) {
  const zoomConfig = useMemo(() => {
    switch (zoomLevel) {
      case "small":
        return { cellSize: "16px", fontSize: "text-xs", padding: "p-2", hotelWidth: "100px" }
      case "medium":
        return { cellSize: "20px", fontSize: "text-xs", padding: "p-3", hotelWidth: "120px" }
      case "large":
        return { cellSize: "24px", fontSize: "text-sm", padding: "p-4", hotelWidth: "140px" }
      case "xlarge":
        return { cellSize: "28px", fontSize: "text-sm", padding: "p-5", hotelWidth: "160px" }
      default:
        return { cellSize: "20px", fontSize: "text-xs", padding: "p-3", hotelWidth: "120px" }
    }
  }, [zoomLevel])

  const processedData = useMemo(() => {
    // Filtra per hotel selezionati
    const filteredData = data.filter((d) => selectedHotels.includes(d.hotel_id))

    // Organizza i dati per mese, hotel e giorno
    const dataByMonth: Record<number, Record<number, Record<number, number>>> = {}

    filteredData.forEach((item) => {
      const date = new Date(item.data_notte)
      const month = date.getMonth() + 1 // 1-12
      const day = date.getDate()
      const hotelId = item.hotel_id

      if (!dataByMonth[month]) dataByMonth[month] = {}
      if (!dataByMonth[month][hotelId]) dataByMonth[month][hotelId] = {}
      dataByMonth[month][hotelId][day] = item.numero_richieste
    })

    // Trova il valore massimo per la scala colori
    const allValues = filteredData.map((d) => d.numero_richieste)
    const maxValue = Math.max(...allValues, 1)

    return { dataByMonth, maxValue }
  }, [data, selectedHotels])

  const getIntensity = (value: number) => {
    return value / processedData.maxValue
  }

  const getColor = (intensity: number) => {
    if (intensity === 0) return "bg-gray-50"
    if (intensity < 0.2) return "bg-blue-100"
    if (intensity < 0.4) return "bg-blue-300"
    if (intensity < 0.6) return "bg-blue-500"
    if (intensity < 0.8) return "bg-blue-700"
    return "bg-blue-900"
  }

  const getTextColor = (intensity: number) => {
    if (intensity === 0) return "text-gray-400"
    if (intensity < 0.4) return "text-gray-700"
    return "text-white"
  }

  const months = [
    { num: 5, name: "Maggio", days: 31 },
    { num: 6, name: "Giugno", days: 30 },
    { num: 7, name: "Luglio", days: 31 },
    { num: 8, name: "Agosto", days: 31 },
    { num: 9, name: "Settembre", days: 30 },
  ]

  const filteredHotels = hotels.filter((h) => selectedHotels.includes(h.hotel_id))

  const renderMonthHeatmap = (month: { num: number; name: string; days: number }) => {
    const monthData = processedData.dataByMonth[month.num] || {}

    return (
      <div key={month.num} className={`border border-gray-200 rounded-lg ${zoomConfig.padding}`}>
        <h3 className={`${zoomConfig.fontSize} font-semibold text-gray-700 mb-3 text-center`}>
          {month.name} {year}
        </h3>

        <div className="overflow-x-auto">
          <div className="min-w-max">
            {/* Header giorni */}
            <div
              className="grid gap-px mb-1"
              style={{ gridTemplateColumns: `${zoomConfig.hotelWidth} repeat(${month.days}, ${zoomConfig.cellSize})` }}
            >
              <div className={`${zoomConfig.fontSize} font-medium text-gray-500 p-1`}></div>
              {Array.from({ length: month.days }, (_, i) => i + 1).map((day) => (
                <div
                  key={day}
                  className={`${zoomConfig.fontSize} text-gray-500 text-center p-1 flex items-center justify-center`}
                  style={{ height: zoomConfig.cellSize }}
                >
                  {day}
                </div>
              ))}
            </div>

            {/* Righe hotel */}
            {filteredHotels.map((hotel) => {
              const hotelData = monthData[hotel.hotel_id] || {}

              return (
                <div
                  key={hotel.hotel_id}
                  className="grid gap-px mb-px"
                  style={{
                    gridTemplateColumns: `${zoomConfig.hotelWidth} repeat(${month.days}, ${zoomConfig.cellSize})`,
                  }}
                >
                  {/* Nome hotel */}
                  <div className={`${zoomConfig.fontSize} font-medium text-gray-700 p-1 truncate flex items-center`}>
                    {hotel.nome_hotel}
                  </div>

                  {/* Celle giorni */}
                  {Array.from({ length: month.days }, (_, i) => i + 1).map((day) => {
                    const value = hotelData[day] || 0
                    const intensity = getIntensity(value)
                    const colorClass = getColor(intensity)
                    const textColorClass = getTextColor(intensity)

                    return (
                      <div
                        key={day}
                        className={`${colorClass} ${zoomConfig.fontSize} flex items-center justify-center cursor-pointer hover:ring-1 hover:ring-blue-400 hover:scale-110 transition-all ${textColorClass} relative group`}
                        style={{ width: zoomConfig.cellSize, height: zoomConfig.cellSize }}
                        title={`${hotel.nome_hotel} - ${day}/${month.num}/${year}: ${value} richieste`}
                      >
                        {value > 0 && (
                          <div className="absolute inset-0 flex items-center justify-center">
                            <div className="w-1 h-1 bg-current rounded-full opacity-60"></div>
                          </div>
                        )}

                        {/* Tooltip */}
                        <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-2 py-1 bg-gray-900 text-white text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap z-10">
                          <strong>{hotel.nome_hotel}</strong>
                          <br />
                          {day}/{month.num}/{year}
                          <br />
                          <strong>{value} richieste</strong>
                        </div>
                      </div>
                    )
                  })}
                </div>
              )
            })}
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="w-full space-y-6">
      <div className="space-y-6">{months.map(renderMonthHeatmap)}</div>

      {/* Legenda */}
      <div className="flex items-center justify-center mt-8 gap-2 text-sm text-gray-600">
        <span>Meno richieste</span>
        <div className="flex gap-1">
          <div
            className={`bg-gray-50 border border-gray-200 rounded-sm`}
            style={{ width: zoomConfig.cellSize, height: zoomConfig.cellSize }}
          ></div>
          <div
            className={`bg-blue-100 rounded-sm`}
            style={{ width: zoomConfig.cellSize, height: zoomConfig.cellSize }}
          ></div>
          <div
            className={`bg-blue-300 rounded-sm`}
            style={{ width: zoomConfig.cellSize, height: zoomConfig.cellSize }}
          ></div>
          <div
            className={`bg-blue-500 rounded-sm`}
            style={{ width: zoomConfig.cellSize, height: zoomConfig.cellSize }}
          ></div>
          <div
            className={`bg-blue-700 rounded-sm`}
            style={{ width: zoomConfig.cellSize, height: zoomConfig.cellSize }}
          ></div>
          <div
            className={`bg-blue-900 rounded-sm`}
            style={{ width: zoomConfig.cellSize, height: zoomConfig.cellSize }}
          ></div>
        </div>
        <span>Più richieste</span>
      </div>
    </div>
  )
}
