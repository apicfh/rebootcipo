"use client"

import {
  BarChart as RechartsBarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts"

interface BarChartProps {
  data:
    | Array<{
        name: string
        value: number
        color: string
      }>
    | Array<Record<string, any>>
  height?: number
  bars?: Array<{
    dataKey: string
    name: string
    color: string
  }>
  layout?: "vertical" | "horizontal"
  stackId?: string
  xAxisKey?: string
}

export function BarChart({
  data,
  height = 300,
  bars,
  layout = "horizontal",
  stackId,
  xAxisKey = "name",
}: BarChartProps) {
  // Verifica se i dati sono validi
  if (!Array.isArray(data) || data.length === 0) {
    return (
      <div className="flex items-center justify-center h-full" style={{ height: `${height}px` }}>
        <p className="text-muted-foreground">Nessun dato disponibile</p>
      </div>
    )
  }

  // Se non sono specificati i bars, li generiamo automaticamente
  const chartBars =
    bars ||
    (() => {
      // Se i dati hanno una struttura semplice (name, value, color)
      if (data[0] && "name" in data[0] && "value" in data[0] && "color" in data[0]) {
        return [
          {
            dataKey: "value",
            name: "Valore",
            color: "currentColor",
          },
        ]
      }

      // Altrimenti, generiamo le barre dalle proprietà numeriche
      const firstItem = data[0]
      if (!firstItem) return []

      return Object.keys(firstItem)
        .filter((key) => {
          if (key === xAxisKey) return false
          const value = firstItem[key]
          return typeof value === "number" || !isNaN(Number(value))
        })
        .map((key) => ({
          dataKey: key,
          name: key,
          color: `hsl(${Math.floor(Math.random() * 360)}, 70%, 50%)`,
        }))
    })()

  // Se non ci sono barre da visualizzare, mostriamo un messaggio
  if (chartBars.length === 0) {
    return (
      <div className="flex items-center justify-center h-full" style={{ height: `${height}px` }}>
        <p className="text-muted-foreground">Nessuna serie di dati disponibile per il grafico</p>
      </div>
    )
  }

  return (
    <div style={{ height: `${height}px`, width: "100%" }}>
      <ResponsiveContainer width="100%" height="100%">
        <RechartsBarChart
          data={data}
          layout={layout}
          margin={{
            top: 20,
            right: 30,
            left: 20,
            bottom: 5,
          }}
        >
          <CartesianGrid strokeDasharray="3 3" />
          {layout === "horizontal" ? (
            <>
              <XAxis dataKey={xAxisKey} />
              <YAxis />
            </>
          ) : (
            <>
              <XAxis type="number" />
              <YAxis dataKey={xAxisKey} type="category" />
            </>
          )}
          <Tooltip />
          <Legend />
          {chartBars.map((bar) => (
            <Bar key={bar.dataKey} dataKey={bar.dataKey} name={bar.name} fill={bar.color} stackId={stackId} />
          ))}
        </RechartsBarChart>
      </ResponsiveContainer>
    </div>
  )
}
