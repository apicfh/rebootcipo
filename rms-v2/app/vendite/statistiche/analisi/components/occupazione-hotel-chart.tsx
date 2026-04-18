"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { BarChart } from "@/components/charts/bar-chart"
import type { OccupazioneHotel } from "@/lib/services/analisi-predittiva-service"

interface OccupazioneHotelChartProps {
  data: OccupazioneHotel[]
}

export function OccupazioneHotelChart({ data }: OccupazioneHotelChartProps) {
  // Ordina i dati per percentuale di occupazione decrescente
  const sortedData = [...data].sort((a, b) => b.percentuale_occupazione - a.percentuale_occupazione)

  // Formatta i dati per il grafico
  const chartData = sortedData.map((item) => ({
    name: item.hotel_nome,
    occupazione: Number.parseFloat(item.percentuale_occupazione.toFixed(1)),
    previsione: Number.parseFloat((100).toFixed(1)), // Capacità massima per confronto
    camere_notti: item.camere_notti_prenotate,
    capacita: item.capacita_totale,
    color: "#0ea5e9",
  }))

  const bars = [
    {
      dataKey: "occupazione",
      name: "Occupazione Attuale (%)",
      color: "#0ea5e9",
    },
    {
      dataKey: "previsione",
      name: "Capacità Totale (%)",
      color: "#d1d5db",
    },
  ]

  return (
    <Card className="col-span-2">
      <CardHeader>
        <CardTitle>Occupazione per Hotel</CardTitle>
        <CardDescription>Percentuale di camere-notti prenotate rispetto alla capacità totale</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="h-[300px]">
          <BarChart
            data={chartData}
            bars={bars}
            height={300}
            layout="horizontal"
            xAxisLabel="Hotel"
            yAxisLabel="Occupazione (%)"
            tooltipFormatter={(value, name, props) => {
              if (name === "occupazione") {
                return [
                  `${value}%`,
                  `Occupazione (${props.payload.camere_notti} camere-notti su ${props.payload.capacita})`,
                ]
              }
              return [value, name]
            }}
          />
        </div>
      </CardContent>
    </Card>
  )
}
