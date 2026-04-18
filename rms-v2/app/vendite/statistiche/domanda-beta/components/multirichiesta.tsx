"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import {
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  BarChart,
  Bar,
} from "recharts"
import { Loader2 } from "lucide-react"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"

interface HotelInfo {
  nome: string
  id: string
}

interface HotelMap {
  [key: string]: HotelInfo
}

interface MultirichiestaProps {
  data: {
    preventivi: any[]
    hotelMap: HotelMap
  }
  loading: boolean
}

const COLORS = ["#0088FE", "#00C49F", "#FFBB28", "#FF8042", "#8884d8", "#82ca9d", "#ffc658", "#ff7300", "#a4de6c"]

export function Multirichiesta({ data, loading }: MultirichiestaProps) {
  const [pieData, setPieData] = useState<any[]>([])
  const [hotelAlternativiData, setHotelAlternativiData] = useState<any[]>([])
  const [selectedHotelDoorId, setSelectedHotelDoorId] = useState<string | null>(null)

  useEffect(() => {
    if (data && data.preventivi && data.preventivi.length > 0 && data.hotelMap) {
      // Analizza i dati per il grafico a torta (singole vs multiple)
      const singoleVsMultiple = analizzaSingoleVsMultiple(data.preventivi)
      setPieData(singoleVsMultiple)

      // Analizza i dati per gli hotel alternativi
      const hotelAlternativi = analizzaHotelAlternativi(data.preventivi, data.hotelMap)
      setHotelAlternativiData(hotelAlternativi)
    }
  }, [data])

  // Funzione per analizzare richieste singole vs multiple
  const analizzaSingoleVsMultiple = (preventivi: any[]) => {
    let singole = 0
    let multiple = 0

    preventivi.forEach((item) => {
      const hotelCount = Array.isArray(item.hotels_richiesti) ? item.hotels_richiesti.length : 0
      if (hotelCount <= 1) {
        singole++
      } else {
        multiple++
      }
    })

    return [
      { name: "Richieste singole", value: singole },
      { name: "Richieste multiple", value: multiple },
    ]
  }

  // Funzione per analizzare gli hotel alternativi più richiesti
  const analizzaHotelAlternativi = (preventivi: any[], hotelMap: HotelMap) => {
    // Conta le occorrenze di ciascun hotel nelle richieste multiple
    const hotelOccorrenze: { [key: string]: number } = {}

    // Conta solo le richieste multiple
    const richiesteMultiple = preventivi.filter(
      (item) => Array.isArray(item.hotels_richiesti) && item.hotels_richiesti.length > 1,
    )

    // Per ogni richiesta multipla, conta gli hotel richiesti
    richiesteMultiple.forEach((item) => {
      if (Array.isArray(item.hotels_richiesti)) {
        item.hotels_richiesti.forEach((hotelId: string) => {
          if (!hotelOccorrenze[hotelId]) {
            hotelOccorrenze[hotelId] = 0
          }
          hotelOccorrenze[hotelId]++
        })
      }
    })

    // Converti in array e ordina per numero di occorrenze
    const hotelArray = Object.entries(hotelOccorrenze).map(([hotelId, count]) => ({
      id: hotelId,
      nome: hotelMap[hotelId]?.nome || `Hotel ID ${hotelId}`,
      count,
    }))

    // Ordina per conteggio decrescente
    return hotelArray.sort((a, b) => b.count - a.count).slice(0, 10) // Prendi i primi 10
  }

  // Funzione per analizzare gli hotel alternativi per un hotel specifico
  const analizzaHotelAlternativiPerHotel = (hotelDoorId: string) => {
    if (!data || !data.preventivi || !data.hotelMap) return []

    // Trova tutte le richieste che includono l'hotel selezionato
    const richiesteConHotelSelezionato = data.preventivi.filter(
      (item) =>
        Array.isArray(item.hotels_richiesti) &&
        item.hotels_richiesti.includes(hotelDoorId) &&
        item.hotels_richiesti.length > 1, // Solo richieste multiple
    )

    // Conta le occorrenze di altri hotel in queste richieste
    const hotelAlternativiOccorrenze: { [key: string]: number } = {}

    richiesteConHotelSelezionato.forEach((item) => {
      if (Array.isArray(item.hotels_richiesti)) {
        item.hotels_richiesti.forEach((altroHotelId: string) => {
          if (altroHotelId !== hotelDoorId) {
            // Esclude l'hotel selezionato
            if (!hotelAlternativiOccorrenze[altroHotelId]) {
              hotelAlternativiOccorrenze[altroHotelId] = 0
            }
            hotelAlternativiOccorrenze[altroHotelId]++
          }
        })
      }
    })

    // Converti in array e ordina
    const hotelAlternativiArray = Object.entries(hotelAlternativiOccorrenze).map(([hotelId, count]) => ({
      id: hotelId,
      nome: data.hotelMap[hotelId]?.nome || `Hotel ID ${hotelId}`,
      count,
      percentuale: (count / richiesteConHotelSelezionato.length) * 100,
    }))

    // Ordina per conteggio decrescente
    return hotelAlternativiArray.sort((a, b) => b.count - a.count).slice(0, 10) // Prendi i primi 10
  }

  // Gestisce il click su un hotel nel grafico
  const handleHotelClick = (hotelId: string) => {
    setSelectedHotelDoorId(hotelId === selectedHotelDoorId ? null : hotelId)
  }

  if (loading) {
    return (
      <div className="flex justify-center items-center h-80">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Distribuzione Richieste</CardTitle>
        </CardHeader>
        <CardContent className="h-80">
          {pieData.length > 0 ? (
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={pieData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {pieData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip formatter={(value) => [`${value} preventivi`, "Quantità"]} />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <div className="flex justify-center items-center h-full">
              <p className="text-muted-foreground">Nessun dato disponibile</p>
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Hotel Alternativi Più Richiesti</CardTitle>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="generale">
            <TabsList className="mb-4">
              <TabsTrigger value="generale">Generale</TabsTrigger>
              <TabsTrigger value="specifico" disabled={!selectedHotelDoorId}>
                {selectedHotelDoorId
                  ? `Hotel ${data.hotelMap[selectedHotelDoorId]?.nome || selectedHotelDoorId}`
                  : "Seleziona un hotel"}
              </TabsTrigger>
            </TabsList>

            <TabsContent value="generale" className="h-80">
              {hotelAlternativiData.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={hotelAlternativiData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="nome" angle={-45} textAnchor="end" height={80} />
                    <YAxis />
                    <Tooltip
                      formatter={(value, name, props) => [`${value} richieste`, "Frequenza"]}
                      labelFormatter={(label) => `Hotel: ${label}`}
                    />
                    <Legend />
                    <Bar
                      dataKey="count"
                      name="Frequenza nelle richieste multiple"
                      fill="#8884d8"
                      onClick={(data) => handleHotelClick(data.id)}
                      cursor="pointer"
                    />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <div className="flex justify-center items-center h-full">
                  <p className="text-muted-foreground">Nessun dato disponibile</p>
                </div>
              )}
            </TabsContent>

            <TabsContent value="specifico" className="h-80">
              {selectedHotelDoorId && (
                <>
                  <h3 className="text-lg font-medium mb-4">
                    Hotel alternativi richiesti insieme a{" "}
                    {data.hotelMap[selectedHotelDoorId]?.nome || selectedHotelDoorId}
                  </h3>

                  {analizzaHotelAlternativiPerHotel(selectedHotelDoorId).length > 0 ? (
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={analizzaHotelAlternativiPerHotel(selectedHotelDoorId)}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="nome" angle={-45} textAnchor="end" height={80} />
                        <YAxis yAxisId="left" orientation="left" stroke="#8884d8" />
                        <YAxis yAxisId="right" orientation="right" stroke="#82ca9d" />
                        <Tooltip
                          formatter={(value, name, props) => {
                            if (name === "count") return [`${value} richieste`, "Frequenza"]
                            if (name === "percentuale") return [`${value.toFixed(1)}%`, "% delle richieste"]
                            return [value, name]
                          }}
                          labelFormatter={(label) => `Hotel: ${label}`}
                        />
                        <Legend />
                        <Bar yAxisId="left" dataKey="count" name="Frequenza" fill="#8884d8" />
                        <Bar yAxisId="right" dataKey="percentuale" name="% delle richieste" fill="#82ca9d" />
                      </BarChart>
                    </ResponsiveContainer>
                  ) : (
                    <div className="flex justify-center items-center h-full">
                      <p className="text-muted-foreground">Nessun dato disponibile</p>
                    </div>
                  )}
                </>
              )}
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  )
}
