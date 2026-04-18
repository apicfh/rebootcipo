"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { ElegantDatePicker } from "@/components/ui/elegant-date-picker"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Switch } from "@/components/ui/switch"
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from "recharts"
import { format, subDays, startOfYear } from "date-fns"
import { it } from "date-fns/locale"
import { createBrowserClient } from "@supabase/ssr"
import { Loader2, TrendingUp, Users, Percent } from "lucide-react"

interface PerformanceData {
  day: string
  hotel_id: number
  operator_name: string
  quotes: number // Changed from bigint to number to match RPC integer return type
}

interface OperatorOption {
  email: string
  nome: string
  display_name: string
}

interface HotelOption {
  hotel_id: number
  nome_hotel: string
  display_name: string
}

interface StatsData {
  total_quotes: number // Total quotes for all operators in the period
  operator_quotes: number // Quotes for the selected operator
  operator_percentage: number
  hotel_distribution: Array<{
    hotel_id: number
    quotes: number
    hotel_name: string
  }>
}

const COLORS = ["#3b82f6", "#ef4444", "#10b981", "#f59e0b", "#8b5cf6", "#06b6d4", "#84cc16", "#f97316"]

export function PerformanceOperatori() {
  const [startDate, setStartDate] = useState<Date>(subDays(new Date(), 30))
  const [endDate, setEndDate] = useState<Date>(new Date())
  const [selectedOperator, setSelectedOperator] = useState<string>("")
  const [selectedHotels, setSelectedHotels] = useState<number[]>([])
  const [operatorInput, setOperatorInput] = useState<string>("")
  const [selectAllHotels, setSelectAllHotels] = useState<boolean>(true)

  const [performanceData, setPerformanceData] = useState<PerformanceData[]>([])
  const [operators, setOperators] = useState<OperatorOption[]>([])
  const [hotels, setHotels] = useState<HotelOption[]>([])
  const [stats, setStats] = useState<StatsData | null>(null)
  const [loading, setLoading] = useState(false)
  const [initialLoading, setInitialLoading] = useState(true)

  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  )

  useEffect(() => {
    const loadInitialData = async () => {
      try {
        console.log("[v0] Caricamento operatori e hotel...")

        const [operatorsResult, hotelsResult] = await Promise.all([
          supabase.rpc("get_performance_operatori_travelbrain_operators"),
          supabase.rpc("get_performance_operatori_travelbrain_hotels"),
        ])

        console.log("[v0] Risultato operatori:", operatorsResult)
        console.log("[v0] Risultato hotel:", hotelsResult)

        if (operatorsResult.error) {
          console.error("[v0] Errore caricamento operatori:", operatorsResult.error)
        } else if (operatorsResult.data) {
          console.log("[v0] Operatori caricati:", operatorsResult.data.length)
          setOperators(operatorsResult.data)
        }

        if (hotelsResult.error) {
          console.error("[v0] Errore caricamento hotel:", hotelsResult.error)
        } else if (hotelsResult.data) {
          console.log("[v0] Hotel caricati:", hotelsResult.data.length)
          setHotels(hotelsResult.data)
          setSelectedHotels(hotelsResult.data.map((h) => h.hotel_id))
        }
      } catch (error) {
        console.error("[v0] Errore nel caricamento dati iniziali:", error)
      } finally {
        setInitialLoading(false)
      }
    }

    loadInitialData()
  }, [])

  const loadData = async () => {
    if (!selectedOperator || selectedHotels.length === 0) return

    setLoading(true)
    try {
      console.log("[v0] Caricamento dati performance con parametri:", {
        startDate: format(startDate, "yyyy-MM-dd"),
        endDate: format(endDate, "yyyy-MM-dd"),
        operator: selectedOperator,
        hotels: selectedHotels,
      })

      const dataPromises = selectedHotels.map((hotelId) =>
        supabase.rpc("get_performance_operatori_travelbrain_data", {
          p_start_date: format(startDate, "yyyy-MM-dd"),
          p_end_date: format(endDate, "yyyy-MM-dd"),
          p_operator_name: selectedOperator,
          p_hotel_id: hotelId,
        }),
      )

      const statsPromise = supabase.rpc("get_performance_operatori_travelbrain_stats", {
        p_start_date: format(startDate, "yyyy-MM-dd"),
        p_end_date: format(endDate, "yyyy-MM-dd"),
        p_operator_name: selectedOperator,
        p_hotel_id: selectedHotels[0], // Use first hotel for stats
      })

      const [dataResults, statsResult] = await Promise.all([Promise.all(dataPromises), statsPromise])

      console.log("[v0] Risultato dati:", dataResults)
      console.log("[v0] Risultato stats:", statsResult)

      const allData = dataResults.reduce((acc, result) => {
        if (result.error) {
          console.error("[v0] Errore caricamento dati:", result.error)
        } else if (result.data) {
          acc.push(...result.data)
        }
        return acc
      }, [] as PerformanceData[])

      console.log("[v0] Dati performance combinati:", allData.length)
      setPerformanceData(allData)

      if (statsResult.error) {
        console.error("[v0] Errore caricamento stats:", statsResult.error)
      } else if (statsResult.data && statsResult.data.length > 0) {
        console.log("[v0] Stats caricate:", statsResult.data[0])
        setStats(statsResult.data[0])
      }
    } catch (error) {
      console.error("[v0] Errore nel caricamento dati:", error)
    } finally {
      setLoading(false)
    }
  }

  const chartData = performanceData.reduce(
    (acc, item) => {
      const existingDay = acc.find((d) => d.day === item.day)
      if (existingDay) {
        existingDay.quotes += item.quotes
      } else {
        acc.push({
          day: item.day,
          quotes: item.quotes,
          formattedDay: format(new Date(item.day), "dd/MM", { locale: it }),
        })
      }
      return acc
    },
    [] as Array<{ day: string; quotes: number; formattedDay: string }>,
  )

  const pieData =
    stats?.hotel_distribution.map((item, index) => ({
      name: item.hotel_name, // Use hotel_name instead of hotel_id for cleaner display
      value: item.quotes,
      color: COLORS[index % COLORS.length],
    })) || []

  const filteredOperators = operators.filter(
    (op) => op.display_name && op.display_name.toLowerCase().includes(operatorInput.toLowerCase()),
  )

  const handleQuickDateSelection = (days: number | string) => {
    const today = new Date()
    if (days === "year") {
      setStartDate(startOfYear(today))
      setEndDate(today)
    } else if (days === "all") {
      setStartDate(new Date("2019-01-01")) // From beginning
      setEndDate(today)
    } else {
      setStartDate(subDays(today, days as number))
      setEndDate(today)
    }
  }

  const handleHotelSelectionToggle = (checked: boolean) => {
    setSelectAllHotels(checked)
    if (checked) {
      setSelectedHotels(hotels.map((h) => h.hotel_id))
    } else {
      setSelectedHotels([])
    }
  }

  if (initialLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Performance Operatori</CardTitle>
          <p className="text-sm text-gray-600">Analisi delle performance degli operatori sui preventivi elaborati</p>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center h-64">
            <Loader2 className="h-8 w-8 animate-spin" />
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Filtri Performance Operatori</CardTitle>
          <p className="text-sm text-gray-600">Seleziona i parametri per analizzare le performance degli operatori</p>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Date Picker Inizio */}
            <div className="space-y-2">
              <Label>Data Inizio</Label>
              <ElegantDatePicker
                date={startDate}
                onDateChange={(date) => date && setStartDate(date)}
                placeholder="Seleziona data inizio"
              />
              <div className="flex flex-wrap gap-1">
                <Button variant="outline" size="sm" onClick={() => handleQuickDateSelection(7)} className="text-xs">
                  7g
                </Button>
                <Button variant="outline" size="sm" onClick={() => handleQuickDateSelection(14)} className="text-xs">
                  14g
                </Button>
                <Button variant="outline" size="sm" onClick={() => handleQuickDateSelection(30)} className="text-xs">
                  30g
                </Button>
                <Button variant="outline" size="sm" onClick={() => handleQuickDateSelection(60)} className="text-xs">
                  60g
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleQuickDateSelection("year")}
                  className="text-xs"
                >
                  Anno
                </Button>
                <Button variant="outline" size="sm" onClick={() => handleQuickDateSelection("all")} className="text-xs">
                  Tutto
                </Button>
              </div>
            </div>

            {/* Date Picker Fine */}
            <div className="space-y-2">
              <Label>Data Fine</Label>
              <ElegantDatePicker
                date={endDate}
                onDateChange={(date) => date && setEndDate(date)}
                placeholder="Seleziona data fine"
              />
            </div>

            {/* Selettore Operatore */}
            <div className="space-y-2">
              <Label>Operatore</Label>
              <div className="space-y-2">
                <Input
                  placeholder="Cerca operatore..."
                  value={operatorInput}
                  onChange={(e) => setOperatorInput(e.target.value)}
                />
                <Select value={selectedOperator} onValueChange={setSelectedOperator}>
                  <SelectTrigger>
                    <SelectValue placeholder="Seleziona operatore" />
                  </SelectTrigger>
                  <SelectContent>
                    {filteredOperators.map((op) => (
                      <SelectItem key={op.email} value={op.email}>
                        {op.display_name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label>Hotel</Label>
              <div className="space-y-3">
                <div className="flex items-center space-x-2">
                  <Switch
                    id="select-all-hotels"
                    checked={selectAllHotels}
                    onCheckedChange={handleHotelSelectionToggle}
                  />
                  <Label htmlFor="select-all-hotels" className="text-sm">
                    {selectAllHotels ? "Tutti gli hotel selezionati" : "Selezione parziale"}
                  </Label>
                </div>

                {!selectAllHotels && (
                  <div className="space-y-2 max-h-48 overflow-y-auto border rounded-md p-2">
                    {hotels.map((hotel) => (
                      <div key={hotel.hotel_id} className="flex items-center space-x-2">
                        <input
                          type="checkbox"
                          id={`hotel-${hotel.hotel_id}`}
                          checked={selectedHotels.includes(hotel.hotel_id)}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setSelectedHotels([...selectedHotels, hotel.hotel_id])
                            } else {
                              setSelectedHotels(selectedHotels.filter((id) => id !== hotel.hotel_id))
                            }
                          }}
                        />
                        <label htmlFor={`hotel-${hotel.hotel_id}`} className="text-sm">
                          {hotel.nome_hotel}
                        </label>
                      </div>
                    ))}
                  </div>
                )}

                {selectAllHotels && (
                  <div className="text-sm text-gray-600 bg-gray-50 p-2 rounded">
                    Tutti i {hotels.length} hotel sono selezionati
                  </div>
                )}
              </div>
            </div>
          </div>

          <div className="mt-4">
            <Button
              onClick={loadData}
              disabled={!selectedOperator || selectedHotels.length === 0 || loading}
              className="w-full md:w-auto"
            >
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Caricamento...
                </>
              ) : (
                "Analizza Performance"
              )}
            </Button>
          </div>
        </CardContent>
      </Card>

      {(selectedOperator || selectedHotels.length > 0) && (
        <Card className="bg-blue-50">
          <CardContent className="pt-4">
            <div className="text-sm space-y-1">
              <p>
                <strong>Operatore selezionato:</strong> {selectedOperator || "Nessuno"}
              </p>
              <p>
                <strong>Hotel selezionati:</strong>{" "}
                {selectAllHotels
                  ? `Tutti (${selectedHotels.length})`
                  : selectedHotels.length > 0
                    ? selectedHotels.map((id) => hotels.find((h) => h.hotel_id === id)?.nome_hotel).join(", ")
                    : "Nessuno"}
              </p>
              <p>
                <strong>Periodo:</strong> {format(startDate, "dd/MM/yyyy")} - {format(endDate, "dd/MM/yyyy")}
              </p>
            </div>
          </CardContent>
        </Card>
      )}

      {stats && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Card Grafico a Linee - Più Grande */}
          <div className="lg:col-span-2">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <TrendingUp className="h-5 w-5" />
                  Andamento Quotes nel Tempo
                </CardTitle>
                <p className="text-sm text-gray-600">Numero di preventivi elaborati dall'operatore per giorno</p>
              </CardHeader>
              <CardContent>
                <div className="h-80">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={chartData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="formattedDay" tick={{ fontSize: 12 }} />
                      <YAxis />
                      <Tooltip
                        labelFormatter={(value, payload) => {
                          if (payload && payload[0]) {
                            const originalDay = payload[0].payload.day
                            return format(new Date(originalDay), "dd MMMM yyyy", { locale: it })
                          }
                          return value
                        }}
                      />
                      <Line
                        type="monotone"
                        dataKey="quotes"
                        stroke="#3b82f6"
                        strokeWidth={2}
                        dot={{ fill: "#3b82f6", strokeWidth: 2, r: 4 }}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Card Statistiche */}
          <div className="space-y-4">
            {/* Totale Quotes */}
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="flex items-center gap-2 text-lg">
                  <Users className="h-5 w-5" />
                  Totale Quotes
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-blue-600">
                  {(stats.operator_quotes || 0).toLocaleString("it-IT")}
                </div>
                <p className="text-sm text-gray-600 mt-1">Preventivi elaborati nel periodo</p>
              </CardContent>
            </Card>

            {/* Percentuale */}
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="flex items-center gap-2 text-lg">
                  <Percent className="h-5 w-5" />
                  Quota Operatore
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-green-600">{stats.operator_percentage || 0}%</div>
                <p className="text-sm text-gray-600 mt-1">
                  Sul totale hotel ({(stats.total_quotes || 0).toLocaleString("it-IT")} quotes)
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      )}

      {/* Grafico a Torta - Distribuzione Hotel */}
      {pieData.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Distribuzione Quotes per Hotel</CardTitle>
            <p className="text-sm text-gray-600">
              Come si distribuiscono i preventivi dell'operatore sui diversi hotel
            </p>
          </CardHeader>
          <CardContent>
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={pieData}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, percent }) => `${name} ${(percent * 100).toFixed(1)}%`}
                    outerRadius={100}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {pieData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(value) => [value, "Quotes"]} />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
