"use client"

import {
  Line,
  LineChart as RechartsLineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
  CartesianGrid,
  Legend,
} from "recharts"
import { format, parseISO } from "date-fns"
import { it } from "date-fns/locale"
import type { Locale } from "date-fns"

interface SeriesData {
  name: string
  color?: string
  data: { x: string | number; y: number }[]
}

interface LineChartProps {
  data: any[] | SeriesData[]
  lines?: {
    dataKey: string
    name: string
    color: string
  }[]
  xAxisKey?: string
  yAxisLabel?: string
  xAxisLabel?: string
  height?: number
  showGrid?: boolean
  showLegend?: boolean
  tooltipFormat?: (value: number) => string
  dateFormat?: string
  dateLocale?: Locale
  isSeriesData?: boolean
}

export function LineChart({
  data,
  lines,
  xAxisKey,
  yAxisLabel,
  xAxisLabel,
  height = 300,
  showGrid = false,
  showLegend = false,
  tooltipFormat,
  dateFormat,
  dateLocale,
  isSeriesData = false,
}: LineChartProps) {
  if (!Array.isArray(data) || data.length === 0) {
    return <div className="flex h-[300px] w-full items-center justify-center">Nessun dato disponibile</div>
  }

  // Gestione del nuovo formato dei dati (serie multiple)
  if (isSeriesData) {
    // Prepara i dati per Recharts
    const seriesData = data as SeriesData[]

    // Genera colori per le serie che non ne hanno uno specificato
    const seriesWithColors = seriesData.map((series, index) => ({
      ...series,
      color: series.color || `hsl(${(index * 30) % 360}, 70%, 50%)`,
    }))

    // Calcola il valore massimo dell'asse Y con un margine del 10%
    const maxY = Math.max(...seriesWithColors.flatMap((series) => series.data.map((point) => point.y))) * 1.1

    // Formatta le date per l'asse X
    const formatXAxis = (value: string) => {
      if (isSeriesData && dateFormat) {
        try {
          return format(new Date(value), dateFormat, { locale: dateLocale })
        } catch (e) {
          return value
        }
      }
      return value
    }

    // Determina quali date mostrare sull'asse X (una per settimana)
    const allDates = Array.from(
      new Set(seriesWithColors.flatMap((series) => series.data.map((point) => point.x))),
    ).sort()

    // Mostra circa 8-10 tick sull'asse X
    const tickInterval = Math.max(1, Math.floor(allDates.length / 8))
    const tickValues = allDates.filter((_, i) => i % tickInterval === 0)

    return (
      <div className="w-full">
        <ResponsiveContainer width="100%" height={height}>
          <RechartsLineChart margin={{ top: 10, right: 30, left: 20, bottom: 30 }}>
            <CartesianGrid strokeDasharray="3 3" vertical={false} />
            <XAxis
              dataKey="x"
              type="category"
              allowDuplicatedCategory={false}
              tickFormatter={formatXAxis}
              ticks={tickValues}
              label={{ value: xAxisLabel || "", position: "insideBottom", offset: -15 }}
              height={50}
            />
            <YAxis
              domain={[0, maxY]}
              label={yAxisLabel ? { value: yAxisLabel, angle: -90, position: "insideLeft", offset: -5 } : undefined}
            />
            <Tooltip
              formatter={(value: number) => [tooltipFormat ? tooltipFormat(value) : value, "Prezzo"]}
              labelFormatter={(label) => {
                try {
                  const date = parseISO(String(label))
                  return format(date, "dd MMMM yyyy", { locale: it })
                } catch (e) {
                  return label
                }
              }}
            />
            {showLegend !== false && (
              <Legend verticalAlign="top" height={36} formatter={(value) => <span className="text-sm">{value}</span>} />
            )}
            {seriesWithColors.map((series) => (
              <Line
                key={series.name}
                data={series.data}
                type="monotone"
                dataKey="y"
                name={series.name}
                stroke={series.color}
                activeDot={{ r: 6 }}
                isAnimationActive={true}
                dot={{ r: 3 }}
                strokeWidth={2}
              />
            ))}
          </RechartsLineChart>
        </ResponsiveContainer>
      </div>
    )
  }

  // Formato originale dei dati
  return (
    <div className="w-full">
      <ResponsiveContainer width="100%" height={height}>
        <RechartsLineChart data={data} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
          <XAxis
            dataKey={xAxisKey}
            label={xAxisLabel ? { value: xAxisLabel, position: "insideBottom", offset: -5 } : undefined}
          />
          <YAxis label={yAxisLabel ? { value: yAxisLabel, angle: -90, position: "insideLeft" } : undefined} />
          <Tooltip />
          {lines &&
            lines.map((line) => (
              <Line
                key={line.dataKey}
                type="monotone"
                dataKey={line.dataKey}
                name={line.name}
                stroke={line.color}
                activeDot={{ r: 8 }}
              />
            ))}
        </RechartsLineChart>
      </ResponsiveContainer>
    </div>
  )
}
