"use client"

import type React from "react"

import { useState, useEffect, useMemo } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Switch } from "@/components/ui/switch"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import {
  LineChart,
  AreaChart,
  Line,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts"
import {
  DomandaTravelbrainService,
  type DomandaTravelbrainFilters,
  type HotelData,
} from "@/lib/services/domanda-travelbrain-service"
import { getHotelColorByName } from "./filtri-travelbrain"
import { ElegantDatePicker } from "@/components/ui/elegant-date-picker"

function toggleHotel(
  hotelId: number,
  selectedHotels: number[],
  setSelectedHotels: React.Dispatch<React.SetStateAction<number[]>>,
) {
  if (selectedHotels.includes(hotelId)) {
    setSelectedHotels(selectedHotels.filter((id) => id !== hotelId))
  } else {
    setSelectedHotels([...selectedHotels, hotelId])
  }
}

export function AndamentoPreventivi() {
  const [data, setData] = useState<any[]>([])
  const [sdlyData, setSdlyData] = useState<any[]>([])
  const [loading, setLoading] = useState(false)
  const [isAggregated, setIsAggregated] = useState(true)
  const [showSDLY, setShowSDLY] = useState(false)
  const [separateConfirmed, setSeparateConfirmed] = useState(false)
  const [isCumulative, setIsCumulative] = useState(false)
  const [hotels, setHotels] = useState<HotelData[]>([])

  const [selectedHotels, setSelectedHotels] = useState<number[]>([])
  const [creationDateStart, setCreationDateStart] = useState<Date>()
  const [creationDateEnd, setCreationDateEnd] = useState<Date>()
  const [hasLoadedData, setHasLoadedData] = useState(false)
  const [chartKey, setChartKey] = useState(0)

  const isWeeklyGranularity = useMemo(() => {
    if (!creationDateStart || !creationDateEnd) return false
    const diffTime = Math.abs(creationDateEnd.getTime() - creationDateStart.getTime())
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
    return diffDays > 30
  }, [creationDateStart, creationDateEnd])

  useEffect(() => {
    loadHotels()
  }, [])

  useEffect(() => {
    if (hasLoadedData && selectedHotels.length > 0) {
      console.log("[v0] Ricaricamento automatico dati per cambio filtri")
      loadData()
    }
  }, [selectedHotels, creationDateStart, creationDateEnd, showSDLY])

  const loadHotels = async () => {
    try {
      const hotelsData = await DomandaTravelbrainService.getHotels({})
      console.log("[v0] Hotels caricati:", hotelsData)
      setHotels(hotelsData)
      if (hotelsData.length > 0) {
        setSelectedHotels([hotelsData[0].hotel_id])
      }
    } catch (error) {
      console.error("Errore caricamento hotel:", error)
    }
  }

  const loadData = async () => {
    if (selectedHotels.length === 0) return

    setLoading(true)
    setData([])
    setSdlyData([])
    setChartKey((prev) => prev + 1)

    try {
      const filters: DomandaTravelbrainFilters = {
        creationDateStart,
        creationDateEnd,
        hotelIds: selectedHotels,
        showSDLY: false,
      }

      console.log("[v0] Filtri inviati alla RPC:", filters)
      const result = await DomandaTravelbrainService.getAndamentoPreventivi(filters)
      console.log("[v0] Dati correnti ricevuti:", result)
      setData(result)

      if (creationDateStart && creationDateEnd) {
        const sdlyFilters: DomandaTravelbrainFilters = {
          creationDateStart: new Date(
            creationDateStart.getFullYear() - 1,
            creationDateStart.getMonth(),
            creationDateStart.getDate(),
          ),
          creationDateEnd: new Date(
            creationDateEnd.getFullYear() - 1,
            creationDateEnd.getMonth(),
            creationDateEnd.getDate(),
          ),
          hotelIds: selectedHotels,
          showSDLY: false,
        }

        console.log("[v0] Filtri SDLY inviati:", sdlyFilters)
        const sdlyResult = await DomandaTravelbrainService.getAndamentoPreventivi(sdlyFilters)
        console.log("[v0] Dati SDLY ricevuti:", sdlyResult)
        setSdlyData(sdlyResult)
      }

      setHasLoadedData(true)
    } catch (error) {
      console.error("[v0] Errore caricamento andamento preventivi:", error)
      setData([])
      setSdlyData([])
      setHasLoadedData(false)
    } finally {
      setLoading(false)
    }
  }

  const chartData = useMemo(() => {
    console.log("[v0] NUOVO CALCOLO chartData - dati correnti:", data)
    console.log("[v0] NUOVO CALCOLO chartData - dati SDLY:", sdlyData)
    console.log("[v0] NUOVO isAggregated:", isAggregated)

    if (!data.length) {
      console.log("[v0] NUOVO Nessun dato disponibile per chartData")
      return []
    }

    let processedData = [...data]
    let processedSdlyData = [...sdlyData]

    if (isWeeklyGranularity) {
      const weeklyData = new Map()
      const weeklySdlyData = new Map()

      // Aggrega dati correnti per settimana
      data.forEach((item) => {
        const date = new Date(item.data_creazione)
        const weekStart = new Date(date)
        weekStart.setDate(date.getDate() - date.getDay())
        const weekKey = weekStart.toISOString().split("T")[0]

        if (!weeklyData.has(weekKey)) {
          weeklyData.set(weekKey, {
            data_creazione: weekKey,
            hotel_id: item.hotel_id,
            numero_preventivi: 0,
            preventivi_accettati: 0,
            preventivi_non_accettati: 0,
          })
        }

        const weekItem = weeklyData.get(weekKey)
        weekItem.numero_preventivi += item.numero_preventivi
        weekItem.preventivi_accettati += item.preventivi_accettati || 0
        weekItem.preventivi_non_accettati += item.preventivi_non_accettati || 0
      })

      // Aggrega dati SDLY per settimana
      sdlyData.forEach((item) => {
        const date = new Date(item.data_creazione)
        const weekStart = new Date(date)
        weekStart.setDate(date.getDate() - date.getDay())
        const weekKey = weekStart.toISOString().split("T")[0]

        if (!weeklySdlyData.has(weekKey)) {
          weeklySdlyData.set(weekKey, {
            data_creazione: weekKey,
            hotel_id: item.hotel_id,
            numero_preventivi: 0,
            preventivi_accettati: 0,
            preventivi_non_accettati: 0,
          })
        }

        const weekItem = weeklySdlyData.get(weekKey)
        weekItem.numero_preventivi += item.numero_preventivi
        weekItem.preventivi_accettati += item.preventivi_accettati || 0
        weekItem.preventivi_non_accettati += item.preventivi_non_accettati || 0
      })

      processedData = Array.from(weeklyData.values())
      processedSdlyData = Array.from(weeklySdlyData.values())
    }

    const dates = [...new Set(processedData.map((item) => item.data_creazione))].sort()

    const result = dates.map((date) => {
      const dateData = { data_creazione: date }

      const currentDayData = processedData.filter((item) => item.data_creazione === date)

      const sdlyDate = new Date(date)
      sdlyDate.setFullYear(sdlyDate.getFullYear() - 1)
      const sdlyDateStr = sdlyDate.toISOString().split("T")[0]
      const sdlyDayData = processedSdlyData.filter((item) => item.data_creazione === sdlyDateStr)

      if (isAggregated) {
        if (separateConfirmed) {
          dateData.preventivi_accettati = currentDayData.reduce(
            (sum, item) => sum + (item.preventivi_accettati || 0),
            0,
          )
          dateData.preventivi_non_accettati = currentDayData.reduce(
            (sum, item) => sum + (item.preventivi_non_accettati || 0),
            0,
          )

          if (showSDLY && sdlyDayData.length > 0) {
            dateData.preventivi_accettati_sdly = sdlyDayData.reduce(
              (sum, item) => sum + (item.preventivi_accettati || 0),
              0,
            )
            dateData.preventivi_non_accettati_sdly = sdlyDayData.reduce(
              (sum, item) => sum + (item.preventivi_non_accettati || 0),
              0,
            )
          }
        } else {
          dateData.numero_preventivi = currentDayData.reduce((sum, item) => sum + item.numero_preventivi, 0)

          if (showSDLY && sdlyDayData.length > 0) {
            dateData.numero_preventivi_sdly = sdlyDayData.reduce((sum, item) => sum + item.numero_preventivi, 0)
          }
        }
      } else {
        currentDayData.forEach((item) => {
          const hotel = hotels.find((h) => h.hotel_id === item.hotel_id)
          const hotelName = hotel?.hotel_name || `Hotel ${item.hotel_id}`

          if (separateConfirmed) {
            dateData[`${hotelName} - Confermati`] = item.preventivi_accettati || 0
            dateData[`${hotelName} - Non Confermati`] = item.preventivi_non_accettati || 0
          } else {
            dateData[hotelName] = item.numero_preventivi
          }
        })

        if (showSDLY) {
          sdlyDayData.forEach((item) => {
            const hotel = hotels.find((h) => h.hotel_id === item.hotel_id)
            const hotelName = hotel?.hotel_name || `Hotel ${item.hotel_id}`

            if (separateConfirmed) {
              dateData[`${hotelName} (SDLY) - Confermati`] = item.preventivi_accettati || 0
              dateData[`${hotelName} (SDLY) - Non Confermati`] = item.preventivi_non_accettati || 0
            } else {
              dateData[`${hotelName} (SDLY)`] = item.numero_preventivi
            }
          })
        }
      }

      return dateData
    })

    if (isCumulative) {
      const cumulativeData = []
      const keys = Object.keys(result[0] || {}).filter((key) => key !== "data_creazione")

      result.forEach((item, index) => {
        const cumulativeItem = { data_creazione: item.data_creazione }

        keys.forEach((key) => {
          const currentValue = item[key] || 0
          const previousValue = index > 0 ? cumulativeData[index - 1][key] || 0 : 0
          cumulativeItem[key] = previousValue + currentValue
        })

        cumulativeData.push(cumulativeItem)
      })

      return cumulativeData
    }

    return result
  }, [data, sdlyData, isAggregated, hotels, separateConfirmed, showSDLY, isCumulative, isWeeklyGranularity])

  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      const date = new Date(label)
      const formattedDate = isWeeklyGranularity
        ? `Settimana del ${date.toLocaleDateString("it-IT", { day: "numeric", month: "short", year: "numeric" })}`
        : `${date.toLocaleDateString("it-IT", { day: "numeric", month: "short", year: "numeric" })}`

      return (
        <div className="bg-white p-3 border border-gray-200 rounded-lg shadow-lg">
          <p className="font-medium text-gray-900 mb-2">{formattedDate}</p>
          {payload.map((entry, index) => (
            <div key={index} className="flex items-center justify-between gap-4 mb-1">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full" style={{ backgroundColor: entry.color }} />
                <span className="text-sm text-gray-700">{entry.name}:</span>
              </div>
              <span className="font-medium text-gray-900">{entry.value}</span>
            </div>
          ))}
          {separateConfirmed && payload.length >= 2 && (
            <div className="mt-2 pt-2 border-t border-gray-100">
              <div className="flex items-center justify-between gap-4">
                <span className="text-sm text-gray-600">Tasso Conversione:</span>
                <span className="font-medium text-blue-600">
                  {(() => {
                    const confermati =
                      payload.find((p) => p.dataKey.includes("accettati") && !p.dataKey.includes("sdly"))?.value || 0
                    const nonConfermati =
                      payload.find((p) => p.dataKey.includes("non_accettati") && !p.dataKey.includes("sdly"))?.value ||
                      0
                    const totale = confermati + nonConfermati
                    return totale > 0 ? `${((confermati / totale) * 100).toFixed(1)}%` : "0%"
                  })()}
                </span>
              </div>
            </div>
          )}
        </div>
      )
    }
    return null
  }

  const selectedHotelsList = hotels.filter((h) => selectedHotels.includes(h.hotel_id))

  console.log("[v0] Stato componente:", {
    hasLoadedData,
    loading,
    dataLength: data.length,
    chartDataLength: chartData.length,
    selectedHotels,
    isAggregated,
    showSDLY,
    separateConfirmed,
    isCumulative,
    isWeeklyGranularity,
  })

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Filtri Andamento Preventivi</CardTitle>
          <p className="text-sm text-gray-600">
            Analizza l'andamento settimanale dei preventivi creati per hotel selezionati
          </p>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label className="text-sm font-medium mb-2 block">Hotel - {selectedHotels.length} selezionati</Label>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2">
              {hotels.map((hotel) => (
                <Button
                  key={hotel.hotel_id}
                  variant={selectedHotels.includes(hotel.hotel_id) ? "default" : "outline"}
                  size="sm"
                  onClick={() => toggleHotel(hotel.hotel_id, selectedHotels, setSelectedHotels)}
                  className="text-xs"
                  style={{
                    backgroundColor: selectedHotels.includes(hotel.hotel_id)
                      ? getHotelColorByName(hotel.hotel_name)
                      : undefined,
                  }}
                >
                  {hotel.hotel_name}
                </Button>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label className="text-sm font-medium mb-2 block">Data Creazione Inizio</Label>
              <ElegantDatePicker
                date={creationDateStart}
                onDateChange={setCreationDateStart}
                placeholder="Seleziona data inizio"
              />
            </div>
            <div>
              <Label className="text-sm font-medium mb-2 block">Data Creazione Fine</Label>
              <ElegantDatePicker
                date={creationDateEnd}
                onDateChange={setCreationDateEnd}
                placeholder="Seleziona data fine"
              />
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-4 p-3 bg-gray-50 border border-blue-200 rounded text-sm text-blue-700">
            <div className="flex items-center space-x-2">
              <Switch id="sdly-mode" checked={showSDLY} onCheckedChange={setShowSDLY} />
              <Label htmlFor="sdly-mode" className="text-sm">
                Mostra SDLY
              </Label>
            </div>
            <div className="flex items-center space-x-2">
              <Switch id="separate-confirmed" checked={separateConfirmed} onCheckedChange={setSeparateConfirmed} />
              <Label htmlFor="separate-confirmed" className="text-sm">
                Separa Confermati/Non Confermati
              </Label>
            </div>
            <div className="flex items-center space-x-2">
              <Switch id="cumulative-mode" checked={isCumulative} onCheckedChange={setIsCumulative} />
              <Label htmlFor="cumulative-mode" className="text-sm">
                Visualizzazione Cumulativa
              </Label>
            </div>
          </div>

          {isWeeklyGranularity && (
            <div className="p-2 bg-blue-50 border border-blue-200 rounded text-sm text-blue-700">
              &#x1F4C8; Granularità settimanale attivata automaticamente (periodo &gt; 30 giorni)
            </div>
          )}

          <Button onClick={loadData} disabled={selectedHotels.length === 0} className="w-full">
            Carica Andamento Preventivi
          </Button>
        </CardContent>
      </Card>

      {hasLoadedData && (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>
                Andamento {isWeeklyGranularity ? "Settimanale" : "Giornaliero"} Preventivi
                {isCumulative && " (Cumulativo)"}
                {showSDLY && " (SDLY)"}
                {separateConfirmed && " - Confermati vs Non Confermati"}
              </CardTitle>
              <div className="flex items-center space-x-4">
                {selectedHotelsList.length > 1 && (
                  <div className="flex items-center space-x-2">
                    <Switch id="aggregate-mode" checked={isAggregated} onCheckedChange={setIsAggregated} />
                    <Label htmlFor="aggregate-mode">Aggrega</Label>
                  </div>
                )}
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="flex items-center justify-center h-64">
                <div className="text-center">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-2"></div>
                  <p className="text-gray-600">Caricamento dati...</p>
                </div>
              </div>
            ) : chartData.length > 0 ? (
              <ResponsiveContainer
                width="100%"
                height={400}
                key={`chart-${chartKey}-${isAggregated}-${separateConfirmed}-${isCumulative}`}
              >
                {isCumulative ? (
                  <AreaChart data={chartData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis
                      dataKey="data_creazione"
                      type="category"
                      tick={{ fontSize: 12 }}
                      tickFormatter={(value) => {
                        const date = new Date(value)
                        return isWeeklyGranularity
                          ? `S${Math.ceil(date.getDate() / 7)}/${date.getMonth() + 1}`
                          : `${date.getDate()}/${date.getMonth() + 1}`
                      }}
                      interval="preserveStartEnd"
                    />
                    <YAxis yAxisId="left" orientation="left" />
                    {separateConfirmed && <YAxis yAxisId="right" orientation="right" />}
                    <Tooltip content={<CustomTooltip />} />
                    <Legend />
                    {isAggregated ? (
                      separateConfirmed ? (
                        <>
                          <Area
                            yAxisId="right"
                            key="aggregated-confirmed"
                            type="monotone"
                            dataKey="preventivi_accettati"
                            stackId="1"
                            stroke="#22c55e"
                            fill="#22c55e"
                            fillOpacity={0.6}
                            strokeWidth={2}
                            name="Preventivi Confermati"
                          />
                          <Area
                            yAxisId="left"
                            key="aggregated-not-confirmed"
                            type="monotone"
                            dataKey="preventivi_non_accettati"
                            stackId="2"
                            stroke="#ef4444"
                            fill="#ef4444"
                            fillOpacity={0.6}
                            strokeWidth={2}
                            name="Preventivi Non Confermati"
                          />
                          {showSDLY && (
                            <>
                              <Area
                                yAxisId="right"
                                key="aggregated-confirmed-sdly"
                                type="monotone"
                                dataKey="preventivi_accettati_sdly"
                                stackId="3"
                                stroke="#22c55e"
                                fill="#22c55e"
                                fillOpacity={0.3}
                                strokeWidth={2}
                                strokeDasharray="5 5"
                                name="Preventivi Confermati (SDLY)"
                              />
                              <Area
                                yAxisId="left"
                                key="aggregated-not-confirmed-sdly"
                                type="monotone"
                                dataKey="preventivi_non_accettati_sdly"
                                stackId="4"
                                stroke="#ef4444"
                                fill="#ef4444"
                                fillOpacity={0.3}
                                strokeWidth={2}
                                strokeDasharray="5 5"
                                name="Preventivi Non Confermati (SDLY)"
                              />
                            </>
                          )}
                        </>
                      ) : (
                        <>
                          <Area
                            yAxisId="left"
                            key="aggregated-area"
                            type="monotone"
                            dataKey="numero_preventivi"
                            stroke="#3b82f6"
                            fill="#3b82f6"
                            fillOpacity={0.6}
                            strokeWidth={2}
                            name="Preventivi Totali"
                          />
                          {showSDLY && (
                            <Area
                              yAxisId="left"
                              key="aggregated-area-sdly"
                              type="monotone"
                              dataKey="numero_preventivi_sdly"
                              stroke="#3b82f6"
                              fill="#3b82f6"
                              fillOpacity={0.3}
                              strokeWidth={2}
                              strokeDasharray="5 5"
                              name="Preventivi Totali (SDLY)"
                            />
                          )}
                        </>
                      )
                    ) : (
                      selectedHotelsList.flatMap((hotel) => {
                        const areas = []
                        const color = getHotelColorByName(hotel.hotel_name)
                        if (separateConfirmed) {
                          areas.push(
                            <Area
                              yAxisId="right"
                              key={`area-${hotel.hotel_id}-confirmed`}
                              type="monotone"
                              dataKey={`${hotel.hotel_name} - Confermati`}
                              stroke={color}
                              fill={color}
                              fillOpacity={0.6}
                              strokeWidth={2}
                              name={`${hotel.hotel_name} - Confermati`}
                            />,
                            <Area
                              yAxisId="left"
                              key={`area-${hotel.hotel_id}-not-confirmed`}
                              type="monotone"
                              dataKey={`${hotel.hotel_name} - Non Confermati`}
                              stroke={color}
                              fill={color}
                              fillOpacity={0.3}
                              strokeWidth={2}
                              name={`${hotel.hotel_name} - Non Confermati`}
                            />,
                          )
                        } else {
                          areas.push(
                            <Area
                              yAxisId="left"
                              key={`area-${hotel.hotel_id}`}
                              type="monotone"
                              dataKey={hotel.hotel_name}
                              stroke={color}
                              fill={color}
                              fillOpacity={0.6}
                              strokeWidth={2}
                              name={hotel.hotel_name}
                            />,
                          )
                        }
                        return areas
                      })
                    )}
                  </AreaChart>
                ) : (
                  <LineChart data={chartData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis
                      dataKey="data_creazione"
                      type="category"
                      tick={{ fontSize: 12 }}
                      tickFormatter={(value) => {
                        const date = new Date(value)
                        return isWeeklyGranularity
                          ? `S${Math.ceil(date.getDate() / 7)}/${date.getMonth() + 1}`
                          : `${date.getDate()}/${date.getMonth() + 1}`
                      }}
                      interval="preserveStartEnd"
                    />
                    <YAxis yAxisId="left" orientation="left" />
                    {separateConfirmed && <YAxis yAxisId="right" orientation="right" />}
                    <Tooltip content={<CustomTooltip />} />
                    <Legend />
                    {isAggregated ? (
                      separateConfirmed ? (
                        <>
                          <Line
                            yAxisId="right"
                            key="aggregated-confirmed"
                            type="monotone"
                            dataKey="preventivi_accettati"
                            stroke="#22c55e"
                            strokeWidth={2}
                            name="Preventivi Confermati"
                          />
                          <Line
                            yAxisId="left"
                            key="aggregated-not-confirmed"
                            type="monotone"
                            dataKey="preventivi_non_accettati"
                            stroke="#ef4444"
                            strokeWidth={2}
                            name="Preventivi Non Confermati"
                          />
                          {showSDLY && (
                            <>
                              <Line
                                yAxisId="right"
                                key="aggregated-confirmed-sdly"
                                type="monotone"
                                dataKey="preventivi_accettati_sdly"
                                stroke="#22c55e"
                                strokeWidth={2}
                                strokeDasharray="5 5"
                                name="Preventivi Confermati (SDLY)"
                              />
                              <Line
                                yAxisId="left"
                                key="aggregated-not-confirmed-sdly"
                                type="monotone"
                                dataKey="preventivi_non_accettati_sdly"
                                stroke="#ef4444"
                                strokeWidth={2}
                                strokeDasharray="5 5"
                                name="Preventivi Non Confermati (SDLY)"
                              />
                            </>
                          )}
                        </>
                      ) : (
                        <>
                          <Line
                            yAxisId="left"
                            key="aggregated-line"
                            type="monotone"
                            dataKey="numero_preventivi"
                            stroke="#3b82f6"
                            strokeWidth={2}
                            name="Preventivi Totali"
                          />
                          {showSDLY && (
                            <Line
                              yAxisId="left"
                              key="aggregated-line-sdly"
                              type="monotone"
                              dataKey="numero_preventivi_sdly"
                              stroke="#3b82f6"
                              strokeWidth={2}
                              strokeDasharray="5 5"
                              name="Preventivi Totali (SDLY)"
                            />
                          )}
                        </>
                      )
                    ) : (
                      selectedHotelsList.flatMap((hotel) => {
                        const lines = []
                        const color = getHotelColorByName(hotel.hotel_name)
                        if (separateConfirmed) {
                          lines.push(
                            <Line
                              yAxisId="right"
                              key={`line-${hotel.hotel_id}-confirmed`}
                              type="monotone"
                              dataKey={`${hotel.hotel_name} - Confermati`}
                              stroke={color}
                              strokeWidth={2}
                              name={`${hotel.hotel_name} - Confermati`}
                              strokeDasharray="0"
                            />,
                            <Line
                              yAxisId="left"
                              key={`line-${hotel.hotel_id}-not-confirmed`}
                              type="monotone"
                              dataKey={`${hotel.hotel_name} - Non Confermati`}
                              stroke={color}
                              strokeWidth={2}
                              name={`${hotel.hotel_name} - Non Confermati`}
                              strokeDasharray="5 5"
                            />,
                          )
                          if (showSDLY) {
                            lines.push(
                              <Line
                                yAxisId="right"
                                key={`line-${hotel.hotel_id}-confirmed-sdly`}
                                type="monotone"
                                dataKey={`${hotel.hotel_name} (SDLY) - Confermati`}
                                stroke={color}
                                strokeWidth={1}
                                name={`${hotel.hotel_name} (SDLY) - Confermati`}
                                strokeDasharray="2 2"
                              />,
                              <Line
                                yAxisId="left"
                                key={`line-${hotel.hotel_id}-not-confirmed-sdly`}
                                type="monotone"
                                dataKey={`${hotel.hotel_name} (SDLY) - Non Confermati`}
                                stroke={color}
                                strokeWidth={1}
                                name={`${hotel.hotel_name} (SDLY) - Non Confermati`}
                                strokeDasharray="8 2"
                              />,
                            )
                          }
                        } else {
                          lines.push(
                            <Line
                              yAxisId="left"
                              key={`line-${hotel.hotel_id}`}
                              type="monotone"
                              dataKey={hotel.hotel_name}
                              stroke={color}
                              strokeWidth={2}
                              name={hotel.hotel_name}
                            />,
                          )
                          if (showSDLY) {
                            lines.push(
                              <Line
                                yAxisId="left"
                                key={`line-${hotel.hotel_id}-sdly`}
                                type="monotone"
                                dataKey={`${hotel.hotel_name} (SDLY)`}
                                stroke={color}
                                strokeWidth={1}
                                name={`${hotel.hotel_name} (SDLY)`}
                                strokeDasharray="5 5"
                              />,
                            )
                          }
                        }
                        return lines
                      })
                    )}
                  </LineChart>
                )}
              </ResponsiveContainer>
            ) : (
              <div className="flex items-center justify-center h-64">
                <p className="text-gray-600">Nessun dato disponibile per i filtri selezionati</p>
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  )
}
