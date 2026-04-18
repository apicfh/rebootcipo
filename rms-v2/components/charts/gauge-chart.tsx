"use client"

import { useState, useEffect } from "react"
import { ResponsiveContainer, PieChart, Pie, Cell } from "recharts"

interface GaugeChartProps {
  value: number
  min?: number
  max?: number
  label?: string
  colors?: string[]
  size?: number
  thickness?: number
}

export function GaugeChart({
  value,
  min = 0,
  max = 100,
  label,
  colors = ["#f87171", "#fbbf24", "#34d399"],
  size = 200,
  thickness = 40,
}: GaugeChartProps) {
  const [chartValue, setChartValue] = useState(0)

  // Animazione del valore
  useEffect(() => {
    const timer = setTimeout(() => {
      setChartValue(value)
    }, 500)
    return () => clearTimeout(timer)
  }, [value])

  // Assicurarsi che il valore sia nel range
  const normalizedValue = Math.min(Math.max(chartValue, min), max)

  // Calcola la percentuale per il grafico
  const percentage = ((normalizedValue - min) / (max - min)) * 100

  // Dati per il grafico semicircolare
  const data = [
    { name: "value", value: percentage },
    { name: "empty", value: 100 - percentage },
  ]

  // Determina il colore in base al valore
  const getColor = (value: number) => {
    if (value < 33) return colors[0]
    if (value < 66) return colors[1]
    return colors[2]
  }

  const color = getColor(percentage)

  // Formatta il valore da visualizzare
  const displayValue = normalizedValue.toFixed(1)

  return (
    <div className="relative" style={{ width: size, height: size / 2 }}>
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <Pie
            data={data}
            cx="50%"
            cy="100%"
            startAngle={180}
            endAngle={0}
            innerRadius={size / 2 - thickness}
            outerRadius={size / 2}
            paddingAngle={0}
            dataKey="value"
            stroke="none"
          >
            <Cell key="cell-0" fill={color} />
            <Cell key="cell-1" fill="#e5e7eb" />
          </Pie>
        </PieChart>
      </ResponsiveContainer>
      <div className="absolute inset-0 flex flex-col items-center justify-end pb-2" style={{ height: size / 2 }}>
        <div className="text-3xl font-bold">{displayValue}%</div>
        {label && <div className="text-sm text-gray-500">{label}</div>}
      </div>
    </div>
  )
}
