"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { DateRangePicker } from "@/components/ui/date-range-picker"
import { PieChart } from "@/components/charts/pie-chart"
import { BarChart } from "@/components/charts/bar-chart"

interface Hotel {
  id: string
  nome: string
}

interface AnagraficaData {
  nazione: string
  citta: string
  totale_richieste: number
  percentuale: number
}

interface AnagraficaProps {
  hotels: Hotel[]
}

export function Anagrafica({ hotels }: AnagraficaProps) {
  const [selectedHotel, setSelectedHotel] = useState<string>("")
  const [dateRange, setDateRange] = useState<{ from: Date; to: Date } | undefined>()
  const [data, setData] = useState<AnagraficaData[]>([])
  const [loading, setLoading] = useState(false)
  const [viewType, setViewType] = useState<"nazione" | "citta">("nazione")

  const loadData = async () => {
    if (!selectedHotel || !dateRange?.from || !dateRange?.to) return

    setLoading(true)
    try {
      // TODO: Implementare la logica per caricare i dati anagrafica
      console.log("Caricamento dati anagrafica per:", { selectedHotel, dateRange, viewType })
      setData([])
    } catch (error) {
      console.error("Errore caricamento dati anagrafica:", error)
    } finally {
      setLoading(false)
    }
  }

  // Prepara dati per il grafico a torta
  const pieData = data.slice(0, 10).map((item, index) => ({
    name: viewType === "nazione" ? item.nazione : item.citta,
    value: item.totale_richieste,
    color: `hsl(${(index * 360) / 10}, 70%, 50%)`,
  }))

  // Prepara dati per il grafico a barre
  const barData = data.slice(0, 15).map((item) => ({
    name: viewType === "nazione" ? item.nazione : item.citta,
    value: item.totale_richieste,
    percentage: item.percentuale,
  }))

  return (
    <div className="space-y-6">
      {/* Filtri */}
      <Card>
        <CardHeader>
          <CardTitle>Filtri Anagrafica</CardTitle>
          <CardDescription>Analizza la provenienza geografica delle richieste</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <label className="text-sm font-medium mb-2 block">Hotel</label>
              <Select value={selectedHotel} onValueChange={setSelectedHotel}>
                <SelectTrigger>
                  <SelectValue placeholder="Seleziona hotel" />
                </SelectTrigger>
                <SelectContent>
                  {hotels.map((hotel) => (
                    <SelectItem key={hotel.id} value={hotel.id}>
                      {hotel.nome}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <label className="text-sm font-medium mb-2 block">Periodo</label>
              <DateRangePicker value={dateRange} onChange={setDateRange} placeholder="Seleziona periodo" />
            </div>

            <div>
              <label className="text-sm font-medium mb-2 block">Vista</label>
              <Select value={viewType} onValueChange={(value: "nazione" | "citta") => setViewType(value)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="nazione">Per Nazione</SelectItem>
                  <SelectItem value="citta">Per Città</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="flex items-end">
              <Button
                onClick={loadData}
                disabled={!selectedHotel || !dateRange?.from || !dateRange?.to || loading}
                className="w-full"
              >
                {loading ? "Caricamento..." : "Carica Dati"}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Grafici */}
      {data.length > 0 && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Grafico a Torta */}
          <Card>
            <CardHeader>
              <CardTitle>Distribuzione per {viewType === "nazione" ? "Nazione" : "Città"}</CardTitle>
              <CardDescription>
                Top 10 {viewType === "nazione" ? "nazioni" : "città"} per numero di richieste
              </CardDescription>
            </CardHeader>
            <CardContent>
              <PieChart data={pieData} height={300} showLegend={true} showLabels={true} />
            </CardContent>
          </Card>

          {/* Grafico a Barre */}
          <Card>
            <CardHeader>
              <CardTitle>Classifica Dettagliata</CardTitle>
              <CardDescription>Top 15 {viewType === "nazione" ? "nazioni" : "città"} con percentuali</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-80">
                <BarChart data={barData} xAxisKey="name" yAxisKey="value" color="#3b82f6" />
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Tabella Dettagliata */}
      {data.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Dettaglio Completo</CardTitle>
            <CardDescription>Tutti i dati di provenienza geografica</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full border-collapse">
                <thead>
                  <tr className="border-b">
                    <th className="text-left p-2 font-medium">{viewType === "nazione" ? "Nazione" : "Città"}</th>
                    <th className="text-right p-2 font-medium">Richieste</th>
                    <th className="text-right p-2 font-medium">Percentuale</th>
                  </tr>
                </thead>
                <tbody>
                  {data.map((item, index) => (
                    <tr key={index} className="border-b hover:bg-gray-50">
                      <td className="p-2">{viewType === "nazione" ? item.nazione : item.citta}</td>
                      <td className="text-right p-2">{item.totale_richieste}</td>
                      <td className="text-right p-2">{item.percentuale.toFixed(1)}%</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Statistiche Riassuntive */}
      {data.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="p-6">
              <div className="text-2xl font-bold">{data.reduce((sum, item) => sum + item.totale_richieste, 0)}</div>
              <p className="text-xs text-muted-foreground">Richieste Totali</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-6">
              <div className="text-2xl font-bold">{data.length}</div>
              <p className="text-xs text-muted-foreground">{viewType === "nazione" ? "Nazioni" : "Città"} Diverse</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-6">
              <div className="text-2xl font-bold">{data.length > 0 ? data[0].percentuale.toFixed(1) : 0}%</div>
              <p className="text-xs text-muted-foreground">Prima Posizione</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-6">
              <div className="text-2xl font-bold">
                {Math.round(data.reduce((sum, item) => sum + item.totale_richieste, 0) / data.length)}
              </div>
              <p className="text-xs text-muted-foreground">Media per {viewType === "nazione" ? "Nazione" : "Città"}</p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Messaggio vuoto */}
      {!loading && data.length === 0 && selectedHotel && dateRange && (
        <Card>
          <CardContent className="p-8">
            <div className="text-center">
              <p className="text-muted-foreground">Nessun dato anagrafico disponibile per il periodo selezionato</p>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
