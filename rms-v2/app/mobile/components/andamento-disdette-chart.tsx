"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { LineChart } from "@/components/charts/line-chart"
import { format, parseISO } from "date-fns"
import { it } from "date-fns/locale"

interface AndamentoDisdette {
  data: string
  disdette: number
}

interface AndamentoDisdettechartProps {
  data: AndamentoDisdette[]
  isLoading?: boolean
}

export function AndamentoDisdettechart({ data, isLoading }: AndamentoDisdettechartProps) {
  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <div className="w-4 h-4 bg-red-500 rounded-full"></div>
            Andamento Disdette
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-[200px] flex items-center justify-center">
            <div className="text-sm text-gray-500">Caricamento...</div>
          </div>
        </CardContent>
      </Card>
    )
  }

  if (!data || data.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <div className="w-4 h-4 bg-red-500 rounded-full"></div>
            Andamento Disdette
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-[200px] flex items-center justify-center">
            <div className="text-sm text-gray-500">Nessun dato disponibile</div>
          </div>
        </CardContent>
      </Card>
    )
  }

  // Prepara i dati per il grafico
  const chartData = data.map((item) => ({
    data: format(parseISO(item.data), "dd/MM", { locale: it }),
    disdette: item.disdette,
    fullDate: item.data,
  }))

  // Calcola il totale delle disdette
  const totaleDisdette = data.reduce((sum, item) => sum + item.disdette, 0)

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <div className="w-4 h-4 bg-red-500 rounded-full"></div>
          Andamento Disdette
        </CardTitle>
        <div className="text-sm text-gray-600">
          Totale periodo: <span className="font-semibold text-red-600">{totaleDisdette}</span> disdette
        </div>
      </CardHeader>
      <CardContent>
        <div className="h-[200px]">
          <LineChart
            data={chartData}
            lines={[
              {
                dataKey: "disdette",
                name: "Disdette",
                color: "#ef4444", // Rosso per le disdette
              },
            ]}
            xAxisKey="data"
            height={200}
            showGrid={true}
            tooltipFormat={(value) => `${value} disdette`}
          />
        </div>
      </CardContent>
    </Card>
  )
}
