"use client"

import { useMemo } from "react"

interface MiniBarChartProps {
  data: number[]
  height?: number
  color?: string
  showChart?: boolean
}

export function MiniBarChart({ data, height = 40, color = "#3b82f6", showChart = true }: MiniBarChartProps) {
  // Normalizza i valori per il grafico
  const normalizedData = useMemo(() => {
    if (!showChart || !data || data.length === 0) {
      return []
    }
    const max = Math.max(...data)
    const min = Math.min(...data)
    const range = max - min || 1
    return data.map((value) => ((value - min) / range) * 100)
  }, [data, showChart])

  // Se non ci sono dati o non dobbiamo mostrare il grafico, restituiamo un div vuoto
  if (!showChart || !data || data.length === 0) {
    return <div className="h-full w-12" style={{ height: `${height}px` }} />
  }

  return (
    <div className="flex items-end h-full space-x-[2px]" style={{ height: `${height}px` }}>
      {normalizedData.map((height, index) => (
        <div
          key={index}
          className="w-[3px] rounded-t-sm"
          style={{
            height: `${Math.max(5, height)}%`,
            backgroundColor: color,
          }}
        />
      ))}
    </div>
  )
}
