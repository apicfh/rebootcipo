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
  quotes_num: number
  quotes_num_up: number | null
  quotes_num_low: number | null
}

interface GraficoRichiesteProps {
  data: ChartData[]
  isLoading: boolean
}

export function GraficoRichieste({ data, isLoading }: GraficoRichiesteProps) {
  const chartRef = useRef<HTMLDivElement>(null)

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Andamento Richieste</CardTitle>
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
          <CardTitle>Andamento Richieste</CardTitle>
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
    y: item.quotes_num,
    up: item.quotes_num_up || 0,
    low: item.quotes_num_low || 0,
  }))

  const seriesData = [
    {
      name: "Richieste",
      color: "#10b981",
      data: chartData.map((item) => ({
        x: item.x,
        y: item.y,
      })),
    },
    {
      name: "Upper Band",
      color: "#34d399",
      data: chartData.map((item) => ({
        x: item.x,
        y: item.up,
      })),
    },
    {
      name: "Lower Band",
      color: "#6ee7b7",
      data: chartData.map((item) => ({
        x: item.x,
        y: item.low,
      })),
    },
  ]

  // Prepara i dati per l'export
  const exportData: ExportData[] = data.map((item) => ({
    week: item.week,
    richieste: item.quotes_num,
    upper_band: item.quotes_num_up,
    lower_band: item.quotes_num_low,
  }))

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle>Andamento Richieste nel Tempo</CardTitle>
        <ExportControls data={exportData} chartElementId="grafico-richieste" filename="andamento_richieste" />
      </CardHeader>
      <CardContent>
        <div id="grafico-richieste" ref={chartRef}>
          <LineChart
            data={seriesData}
            isSeriesData={true}
            height={350}
            showLegend={true}
            xAxisLabel="Settimana"
            yAxisLabel="Numero Richieste"
            dateFormat="dd MMM yyyy"
            dateLocale={it}
            tooltipFormat={(value) => value.toFixed(2)}
          />
        </div>
      </CardContent>
    </Card>
  )
}
