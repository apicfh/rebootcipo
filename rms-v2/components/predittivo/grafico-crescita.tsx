"use client"

import { useRef } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { LineChart } from "@/components/charts/line-chart"
import { it } from "date-fns/locale"
import { ExportControls } from "@/components/predittivo/export-controls"
import type { ExportData } from "@/lib/utils/export-utils"
import type { GrowthRpcOutput, GrowthCombinedRpcOutput } from "@/lib/services/predittivo-service"

interface GraficoCrescitaProps {
  data: GrowthRpcOutput[] | GrowthCombinedRpcOutput[]
  metricType: 'quotes' | 'bookings' | 'combined'
  mode: 'incremental' | 'cumulative'
  includeForecast: boolean
  isLoading: boolean
}

export function GraficoCrescita({
  data,
  metricType,
  mode,
  includeForecast,
  isLoading,
}: GraficoCrescitaProps) {
  const chartRef = useRef<HTMLDivElement>(null)

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Andamento Crescita</CardTitle>
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
          <CardTitle>Andamento Crescita</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex h-[300px] items-center justify-center text-muted-foreground">Nessun dato disponibile</div>
        </CardContent>
      </Card>
    )
  }

  // Funzione helper per estrarre i valori e gestire low/up nulli
  const buildSeriesData = (
    data: any[],
    metricPrefix: string,
    seriesName: string,
    color: string,
    includeUncertainty: boolean
  ) => {
    const valueKey = `${metricPrefix}_value`
    const lowKey = `${metricPrefix}_low`
    const upKey = `${metricPrefix}_up`

    const mainSeries = {
      name: seriesName,
      color: color,
      data: data.map((item) => ({
        x: item.request_week_start,
        y: item[valueKey] || 0,
      })),
    }

    if (!includeUncertainty) {
      return [mainSeries]
    }

    // Controlla se ci sono low/up non-null
    const hasLow = data.some((item) => item[lowKey] !== null && item[lowKey] !== undefined)
    const hasUp = data.some((item) => item[upKey] !== null && item[upKey] !== undefined)

    const series = [mainSeries]

    if (hasUp) {
      series.push({
        name: `${seriesName} - Upper Band`,
        color: getHexColor(color, 0.4),
        data: data.map((item) => ({
          x: item.request_week_start,
          y: item[upKey] || 0,
        })),
      })
    }

    if (hasLow) {
      series.push({
        name: `${seriesName} - Lower Band`,
        color: getHexColor(color, 0.6),
        data: data.map((item) => ({
          x: item.request_week_start,
          y: item[lowKey] || 0,
        })),
      })
    }

    return series
  }

  // Helper per variare tonalità colore
  const getHexColor = (hexColor: string, opacity: number) => {
    return hexColor + Math.round(opacity * 255).toString(16).padStart(2, '0')
  }

  // Costruisci serie in base a metricType
  let seriesData: any[] = []
  let exportData: ExportData[] = []

  if (metricType === 'quotes') {
    seriesData = buildSeriesData(data, 'actual', 'Richieste Actual', '#10b981', true)
    if (includeForecast) {
      seriesData.push(...buildSeriesData(data, 'forecast', 'Richieste Forecast', '#3b82f6', true))
    }
    exportData = data.map((item: any) => ({
      week: item.request_week_start,
      actual_value: item.actual_value,
      actual_low: item.actual_low,
      actual_up: item.actual_up,
      forecast_value: includeForecast ? item.forecast_value : null,
      forecast_low: includeForecast ? item.forecast_low : null,
      forecast_up: includeForecast ? item.forecast_up : null,
    }))
  } else if (metricType === 'bookings') {
    seriesData = buildSeriesData(data, 'actual', 'Conversioni Actual', '#3b82f6', true)
    if (includeForecast) {
      seriesData.push(...buildSeriesData(data, 'forecast', 'Conversioni Forecast', '#f59e0b', true))
    }
    exportData = data.map((item: any) => ({
      week: item.request_week_start,
      actual_value: item.actual_value,
      actual_low: item.actual_low,
      actual_up: item.actual_up,
      forecast_value: includeForecast ? item.forecast_value : null,
      forecast_low: includeForecast ? item.forecast_low : null,
      forecast_up: includeForecast ? item.forecast_up : null,
    }))
  } else {
    // combined
    seriesData = buildSeriesData(data, 'quotes_actual', 'Richieste Actual', '#10b981', true)
    seriesData.push(...buildSeriesData(data, 'bookings_actual', 'Conversioni Actual', '#3b82f6', true))
    if (includeForecast) {
      seriesData.push(...buildSeriesData(data, 'quotes_forecast', 'Richieste Forecast', '#34d399', true))
      seriesData.push(...buildSeriesData(data, 'bookings_forecast', 'Conversioni Forecast', '#60a5fa', true))
    }
    exportData = data.map((item: any) => ({
      week: item.request_week_start,
      quotes_actual_value: (item as any).quotes_actual_value,
      quotes_actual_low: (item as any).quotes_actual_low,
      quotes_actual_up: (item as any).quotes_actual_up,
      bookings_actual_value: (item as any).bookings_actual_value,
      bookings_actual_low: (item as any).bookings_actual_low,
      bookings_actual_up: (item as any).bookings_actual_up,
      quotes_forecast_value: includeForecast ? (item as any).quotes_forecast_value : null,
      quotes_forecast_low: includeForecast ? (item as any).quotes_forecast_low : null,
      quotes_forecast_up: includeForecast ? (item as any).quotes_forecast_up : null,
      bookings_forecast_value: includeForecast ? (item as any).bookings_forecast_value : null,
      bookings_forecast_low: includeForecast ? (item as any).bookings_forecast_low : null,
      bookings_forecast_up: includeForecast ? (item as any).bookings_forecast_up : null,
    }))
  }

  const modeLabel = mode === 'incremental' ? 'Incrementale' : 'Cumulato'
  const metricLabel =
    metricType === 'quotes' ? 'Richieste' : metricType === 'bookings' ? 'Conversioni' : 'Richieste & Conversioni'

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle>Andamento Crescita - {metricLabel} ({modeLabel})</CardTitle>
        <ExportControls
          data={exportData}
          chartElementId="grafico-crescita"
          filename={`crescita_${metricType}_${mode}`}
        />
      </CardHeader>
      <CardContent>
        <div id="grafico-crescita" ref={chartRef}>
          <LineChart
            data={seriesData}
            isSeriesData={true}
            height={400}
            showLegend={true}
            xAxisLabel="Settimana di Richiesta"
            yAxisLabel="Volumi"
            dateFormat="dd MMM yyyy"
            dateLocale={it}
            tooltipFormat={(value) => value.toFixed(2)}
          />
        </div>
      </CardContent>
    </Card>
  )
}
