"use client"

import { useRef } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { LineChart } from "@/components/charts/line-chart"
import { format, parseISO } from "date-fns"
import { it } from "date-fns/locale"
import { ExportControls } from "@/components/predittivo/export-controls"
import type { ExportData } from "@/lib/utils/export-utils"

interface ChartData {
  week: string
  reservation_num: number
  reservation_num_up: number | null
  reservation_num_low: number | null
}

interface GraficoConversioniProps {
  data: ChartData[]
  isLoading: boolean
}

export function GraficoConversioni({ data, isLoading }: GraficoConversioniProps) {
  const chartRef = useRef<HTMLDivElement>(null)

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Andamento Conversioni</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex h-[300px] items-center justify-center">Caricamento dati...</div>
        </CardContent>
      </Card>
    )
  }

  if (!data || data.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Andamento Conversioni</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex h-[300px] items-center justify-center text-muted-foreground">Nessun dato disponibile</div>
        </CardContent>
      </Card>
    )
  }

  // Trasforma i dati per il LineChart con serie multiple
  const chartData = data.map((item) => ({
    x: item.week,
    y: item.reservation_num,
    up: item.reservation_num_up || 0,
    low: item.reservation_num_low || 0,
  }))

  const seriesData = [
    {
      name: "Conversioni",
      color: "#3b82f6",
      data: chartData.map((item) => ({
        x: item.x,
        y: item.y,
      })),
    },
    {
      name: "Upper Band",
      color: "#60a5fa",
      data: chartData.map((item) => ({
        x: item.x,
        y: item.up,
      })),
    },
    {
      name: "Lower Band",
      color: "#93c5fd",
      data: chartData.map((item) => ({
        x: item.x,
        y: item.low,
      })),
    },
  ]

  // Prepara i dati per l'export
  const exportData: ExportData[] = data.map((item) => ({
    week: item.week,
    conversioni: item.reservation_num,
    upper_band: item.reservation_num_up,
    lower_band: item.reservation_num_low,
  }))

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle>Andamento Conversioni nel Tempo</CardTitle>
        <ExportControls data={exportData} chartElementId="grafico-conversioni" filename="andamento_conversioni" />
      </CardHeader>
      <CardContent>
        <div id="grafico-conversioni" ref={chartRef}>
          <LineChart
            data={seriesData}
            isSeriesData={true}
            height={350}
            showLegend={true}
            xAxisLabel="Settimana"
            yAxisLabel="Numero Conversioni"
            dateFormat="dd MMM yyyy"
            dateLocale={it}
            tooltipFormat={(value) => value.toFixed(2)}
          />
        </div>
      </CardContent>
    </Card>
  )
}
