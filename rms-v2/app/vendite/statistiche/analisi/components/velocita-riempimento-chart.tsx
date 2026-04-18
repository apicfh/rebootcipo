"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { BarChart } from "@/components/charts/bar-chart"
import { format, parseISO } from "date-fns"
import { it } from "date-fns/locale"

interface VelocitaRiempimentoChartProps {
  data: any[]
}

export function VelocitaRiempimentoChart({ data }: VelocitaRiempimentoChartProps) {
  // Formatta i dati per il grafico
  const chartData = data.map((item) => {
    const dataInizio = parseISO(item.periodo_inizio)
    const dataFine = parseISO(item.periodo_fine)

    return {
      name: `${format(dataInizio, "dd/MM", { locale: it })} - ${format(dataFine, "dd/MM", { locale: it })}`,
      prenotazioni: item.prenotazioni_totali,
      velocita: item.velocita_riempimento,
    }
  })

  const bars = [
    {
      dataKey: "prenotazioni",
      name: "Prenotazioni Totali",
      color: "#0ea5e9",
    },
    {
      dataKey: "velocita",
      name: "Velocità di Riempimento",
      color: "#f59e0b",
    },
  ]

  return (
    <Card className="col-span-2">
      <CardHeader>
        <CardTitle>Velocità di Riempimento</CardTitle>
        <CardDescription>Analisi della velocità di acquisizione prenotazioni per periodo</CardDescription>
      </CardHeader>
      <CardContent>
        <BarChart data={chartData} bars={bars} height={300} />
      </CardContent>
    </Card>
  )
}
