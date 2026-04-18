"use client"

import { useState, useEffect } from "react"

interface PieChartProps {
  data: Array<{
    name: string
    value: number
    color?: string
  }>
  width?: number
  height?: number
  innerRadius?: number
  outerRadius?: number
  showLegend?: boolean
  showLabels?: boolean
}

export function PieChart({
  data,
  width = 400,
  height = 400,
  innerRadius = 0,
  outerRadius = 150,
  showLegend = true,
  showLabels = true,
}: PieChartProps) {
  const [isClient, setIsClient] = useState(false)
  const [RechartsComponents, setRechartsComponents] = useState<any>(null)

  useEffect(() => {
    setIsClient(true)

    const loadRecharts = async () => {
      try {
        const recharts = await import("recharts")
        setRechartsComponents(recharts)
      } catch (error) {
        console.error("Errore nel caricamento di Recharts:", error)
      }
    }

    loadRecharts()
  }, [])

  if (!isClient) {
    return (
      <div className="flex items-center justify-center" style={{ width, height }}>
        <p className="text-muted-foreground">Caricamento grafico...</p>
      </div>
    )
  }

  if (!RechartsComponents) {
    return (
      <div className="flex items-center justify-center" style={{ width, height }}>
        <p className="text-muted-foreground">Errore nel caricamento del grafico</p>
      </div>
    )
  }

  const { PieChart: RechartsPieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } = RechartsComponents

  // Colori predefiniti se non specificati
  const defaultColors = [
    "#8884d8",
    "#82ca9d",
    "#ffc658",
    "#ff7300",
    "#00ff00",
    "#ff00ff",
    "#00ffff",
    "#ff0000",
    "#0000ff",
    "#ffff00",
  ]

  // Prepara i dati con colori
  const dataWithColors = data.map((item, index) => ({
    ...item,
    color: item.color || defaultColors[index % defaultColors.length],
  }))

  const renderCustomLabel = (entry: any) => {
    if (!showLabels) return null
    const percent = ((entry.value / data.reduce((sum, item) => sum + item.value, 0)) * 100).toFixed(1)
    return `${percent}%`
  }

  return (
    <div className="w-full">
      <ResponsiveContainer width="100%" height={height}>
        <RechartsPieChart>
          <Pie
            data={dataWithColors}
            cx="50%"
            cy="50%"
            labelLine={false}
            label={renderCustomLabel}
            outerRadius={outerRadius}
            innerRadius={innerRadius}
            fill="#8884d8"
            dataKey="value"
          >
            {dataWithColors.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={entry.color} />
            ))}
          </Pie>
          <Tooltip formatter={(value: number, name: string) => [value, name]} labelFormatter={(label) => `${label}`} />
          {showLegend && <Legend />}
        </RechartsPieChart>
      </ResponsiveContainer>
    </div>
  )
}
