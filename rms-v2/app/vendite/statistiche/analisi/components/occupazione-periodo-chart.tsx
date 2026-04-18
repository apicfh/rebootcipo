"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { BarChart } from "@/components/charts/bar-chart"
import type { OccupazionePeriodo } from "@/lib/services/analisi-predittiva-service"
import { format, parseISO } from "date-fns"
import { it } from "date-fns/locale"

interface OccupazionePeriodoChartProps {
  data: OccupazionePeriodo[]
}

export function OccupazionePeriodoChart({ data }: OccupazionePeriodoChartProps) {
  // Formatta i dati per il grafico
  const chartData = data.map((item) => {
    const dataInizio = parseISO(item.periodo_inizio)
    const dataFine = parseISO(item.periodo_fine)

    return {
      name: `${format(dataInizio, "dd/MM", { locale: it })} - ${format(dataFine, "dd/MM", { locale: it })}`,
      occupazione: Number.parseFloat(item.percentuale_occupazione.toFixed(1)),
      previsione: 100 - Number.parseFloat(item.percentuale_occupazione.toFixed(1)),
      adr: Number.parseFloat(item.adr_medio.toFixed(0)),
    }
  })

  const bars = [
    {
      dataKey: "occupazione",
      name: "Occupazione Attuale (%)",
      color: "#0ea5e9",
    },
    {
      dataKey: "previsione",
      name: "Disponibilità (%)",
      color: "#d1d5db",
    },
  ]

  return (
    <Card className="col-span-2">
      <CardHeader>
        <CardTitle>Occupazione per Periodo</CardTitle>
        <CardDescription>Percentuale di occupazione per periodi di soggiorno</CardDescription>
      </CardHeader>
      <CardContent>
        <BarChart data={chartData} bars={bars} height={300} stackId="occupazione" />
      </CardContent>
    </Card>
  )
}
