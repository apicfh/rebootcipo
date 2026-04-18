"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { LineChart } from "@/components/charts/line-chart"
import type { BookingPace } from "@/lib/services/analisi-predittiva-service"
import { format } from "date-fns"
import { it } from "date-fns/locale"

interface BookingPaceChartProps {
  data: BookingPace[]
}

export function BookingPaceChart({ data }: BookingPaceChartProps) {
  // Formatta i dati per il grafico
  const chartData = data.map((item) => {
    // Estrai anno e settimana
    const [anno, settimana] = item.settimana.split("-")

    // Crea una data approssimativa per la settimana
    // Nota: questa è una semplificazione, per un calcolo preciso servirebbe una libreria specifica
    const dataSettimana = new Date(Number.parseInt(anno), 0, 1)
    dataSettimana.setDate(dataSettimana.getDate() + (Number.parseInt(settimana) - 1) * 7)

    return {
      x: format(dataSettimana, "dd MMM yyyy", { locale: it }),
      y: item.numero_prenotazioni,
    }
  })

  const seriesData = [
    {
      name: "Prenotazioni settimanali",
      color: "#0ea5e9",
      data: chartData,
    },
  ]

  return (
    <Card className="col-span-2">
      <CardHeader>
        <CardTitle>Ritmo di Prenotazioni Settimanali</CardTitle>
        <CardDescription>Andamento delle prenotazioni dal 1° ottobre 2024 ad oggi</CardDescription>
      </CardHeader>
      <CardContent>
        <LineChart
          data={seriesData}
          height={300}
          isSeriesData={true}
          dateFormat="dd MMM"
          dateLocale={it}
          showLegend={true}
          yAxisLabel="Prenotazioni"
          tooltipFormat={(value) => `${value} prenotazioni`}
        />
      </CardContent>
    </Card>
  )
}
