"use client"

import { useEffect, useRef } from "react"

interface DataPoint {
  data: string
  valore: number
}

interface MobileAreaChartProps {
  data: DataPoint[]
  height: number
}

export function MobileAreaChart({ data, height }: MobileAreaChartProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    if (!canvasRef.current || !data || data.length === 0) return

    const canvas = canvasRef.current
    const ctx = canvas.getContext("2d")
    if (!ctx) return

    // Pulisci il canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height)

    // Estrai i valori e le etichette
    const values = data.map((item) => item.valore)
    const labels = data.map((item) => item.data)

    // Trova il valore massimo e minimo
    const maxValue = Math.max(...values) * 1.1 // Aggiungi un po' di spazio sopra
    const minValue = Math.min(0, Math.min(...values) * 0.9) // Assicurati che 0 sia incluso

    // Dimensioni del grafico
    const chartWidth = canvas.width - 60 // Spazio per le etichette Y
    const chartHeight = canvas.height - 40 // Spazio per le etichette X
    const chartTop = 20
    const chartLeft = 50

    // Disegna l'asse Y
    ctx.beginPath()
    ctx.strokeStyle = "#e5e7eb" // Colore grigio chiaro
    ctx.lineWidth = 1
    ctx.moveTo(chartLeft, chartTop)
    ctx.lineTo(chartLeft, chartTop + chartHeight)
    ctx.stroke()

    // Disegna le linee orizzontali e le etichette Y
    const ySteps = 5
    for (let i = 0; i <= ySteps; i++) {
      const y = chartTop + chartHeight - (i / ySteps) * chartHeight
      const value = minValue + (i / ySteps) * (maxValue - minValue)

      // Linea orizzontale
      ctx.beginPath()
      ctx.strokeStyle = "#f3f4f6" // Colore grigio molto chiaro
      ctx.moveTo(chartLeft, y)
      ctx.lineTo(chartLeft + chartWidth, y)
      ctx.stroke()

      // Etichetta Y
      ctx.fillStyle = "#6b7280" // Colore grigio medio
      ctx.font = "10px sans-serif"
      ctx.textAlign = "right"
      ctx.fillText(value.toFixed(0) + "%", chartLeft - 5, y + 3)
    }

    // Calcola le coordinate dei punti
    const points = values.map((value, index) => {
      const x = chartLeft + (index / (values.length - 1)) * chartWidth
      const y = chartTop + chartHeight - ((value - minValue) / (maxValue - minValue)) * chartHeight
      return { x, y }
    })

    // Disegna l'area sotto la curva
    ctx.beginPath()
    ctx.moveTo(points[0].x, chartTop + chartHeight) // Inizia dal punto in basso a sinistra
    points.forEach((point) => {
      ctx.lineTo(point.x, point.y)
    })
    ctx.lineTo(points[points.length - 1].x, chartTop + chartHeight) // Termina al punto in basso a destra
    ctx.closePath()

    // Riempimento con gradiente
    const gradient = ctx.createLinearGradient(0, chartTop, 0, chartTop + chartHeight)
    gradient.addColorStop(0, "rgba(59, 130, 246, 0.5)") // Blu con opacità
    gradient.addColorStop(1, "rgba(59, 130, 246, 0.1)")
    ctx.fillStyle = gradient
    ctx.fill()

    // Disegna la linea
    ctx.beginPath()
    ctx.moveTo(points[0].x, points[0].y)
    points.forEach((point) => {
      ctx.lineTo(point.x, point.y)
    })
    ctx.strokeStyle = "rgb(37, 99, 235)" // Blu più scuro
    ctx.lineWidth = 2
    ctx.stroke()

    // Disegna i punti
    points.forEach((point, index) => {
      ctx.beginPath()
      ctx.arc(point.x, point.y, 4, 0, Math.PI * 2)
      ctx.fillStyle = "white"
      ctx.fill()
      ctx.strokeStyle = "rgb(37, 99, 235)"
      ctx.lineWidth = 2
      ctx.stroke()

      // Etichette X (mostra solo alcune etichette per evitare sovrapposizioni)
      if (index % Math.ceil(labels.length / 5) === 0 || index === labels.length - 1) {
        ctx.fillStyle = "#6b7280"
        ctx.font = "10px sans-serif"
        ctx.textAlign = "center"
        ctx.fillText(labels[index], point.x, chartTop + chartHeight + 15)
      }
    })
  }, [data])

  return (
    <div className="bg-white p-4 rounded-lg border border-gray-200">
      <canvas ref={canvasRef} width={400} height={height} className="w-full" />
    </div>
  )
}
