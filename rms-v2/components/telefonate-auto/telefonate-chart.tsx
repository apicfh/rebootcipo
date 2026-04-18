"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  LineChart,
  Line,
} from "recharts"
import type { ChiamateAggregato } from "@/lib/services/telefonate-auto-service"
import { TelefonateAutoService } from "@/lib/services/telefonate-auto-service"
import { format } from "date-fns"
import { it } from "date-fns/locale"

interface TelefonateChartProps {
  dati: ChiamateAggregato[]
}

export function TelefonateChart({ dati }: TelefonateChartProps) {
  const service = new TelefonateAutoService()
  const chartData = service.formatChartData(dati)

  // Prepara i dati per i grafici
  const dataFormatted = chartData.map((item) => ({
    ...item,
    dataFormatted: format(new Date(item.data), "dd/MM", { locale: it }),
    attesa_minuti: Math.round((item.attesa_media / 60) * 100) / 100,
    durata_minuti: Math.round((item.durata_media / 60) * 100) / 100,
  }))

  return (
    <Card>
      <CardHeader>
        <CardTitle>Analisi Telefonate nel Tempo</CardTitle>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="volume" className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="volume">Volume Chiamate</TabsTrigger>
            <TabsTrigger value="performance">Performance</TabsTrigger>
            <TabsTrigger value="tempi">Tempi</TabsTrigger>
          </TabsList>

          {/* Tab Volume Chiamate */}
          <TabsContent value="volume" className="space-y-4">
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={dataFormatted}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="dataFormatted" />
                  <YAxis />
                  <Tooltip
                    labelFormatter={(label) => `Data: ${label}`}
                    formatter={(value, name) => [
                      typeof value === "number" ? value.toLocaleString() : value,
                      name === "chiamate_ricevute"
                        ? "Chiamate Ricevute"
                        : name === "chiamate_risposte"
                          ? "Chiamate Risposte"
                          : name === "chiamate_non_risposte"
                            ? "Non Risposte"
                            : name,
                    ]}
                  />
                  <Legend />
                  <Bar dataKey="chiamate_ricevute" fill="#3b82f6" name="Ricevute" />
                  <Bar dataKey="chiamate_risposte" fill="#10b981" name="Risposte" />
                  <Bar dataKey="chiamate_non_risposte" fill="#ef4444" name="Non Risposte" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </TabsContent>

          {/* Tab Performance */}
          <TabsContent value="performance" className="space-y-4">
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={dataFormatted}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="dataFormatted" />
                  <YAxis />
                  <Tooltip
                    labelFormatter={(label) => `Data: ${label}`}
                    formatter={(value, name) => [
                      typeof value === "number" ? `${value.toFixed(1)}%` : value,
                      "Percentuale Risposta",
                    ]}
                  />
                  <Legend />
                  <Line
                    type="monotone"
                    dataKey="percentuale_risposta"
                    stroke="#3b82f6"
                    strokeWidth={2}
                    name="% Risposta"
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </TabsContent>

          {/* Tab Tempi */}
          <TabsContent value="tempi" className="space-y-4">
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={dataFormatted}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="dataFormatted" />
                  <YAxis />
                  <Tooltip
                    labelFormatter={(label) => `Data: ${label}`}
                    formatter={(value, name) => [
                      typeof value === "number" ? `${value.toFixed(1)} min` : value,
                      name === "attesa_minuti" ? "Attesa Media" : "Durata Media",
                    ]}
                  />
                  <Legend />
                  <Line type="monotone" dataKey="attesa_minuti" stroke="#f59e0b" strokeWidth={2} name="Attesa (min)" />
                  <Line type="monotone" dataKey="durata_minuti" stroke="#8b5cf6" strokeWidth={2} name="Durata (min)" />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  )
}
