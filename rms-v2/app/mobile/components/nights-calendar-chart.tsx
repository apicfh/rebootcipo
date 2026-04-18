"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from "recharts"
import { Loader2 } from "lucide-react"

interface NightsCalendarChartProps {
  data: { data: string; dataFormattata: string; notti: number }[]
  loading: boolean
}

export function NightsCalendarChart({ data, loading }: NightsCalendarChartProps) {
  const [chartData, setChartData] = useState<{ data: string; dataFormattata: string; notti: number }[]>([])

  useEffect(() => {
    if (data && data.length > 0) {
      setChartData(data)
    }
  }, [data])

  if (loading) {
    return (
      <Card className="w-full">
        <CardHeader className="pb-2">
          <CardTitle className="text-lg">Distribuzione Notti nel Calendario</CardTitle>
        </CardHeader>
        <CardContent className="flex justify-center items-center h-64">
          <Loader2 className="h-8 w-8 animate-spin" />
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="w-full">
      <CardHeader className="pb-2">
        <CardTitle className="text-lg">Distribuzione Notti nel Calendario</CardTitle>
      </CardHeader>
      <CardContent>
        {chartData.length > 0 ? (
          <ResponsiveContainer width="100%" height={400}>
            <BarChart data={chartData} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
              <XAxis dataKey="dataFormattata" tick={{ fontSize: 10 }} interval={Math.ceil(chartData.length / 15)} />
              <YAxis />
              <Tooltip formatter={(value) => [`${value} notti`, ""]} labelFormatter={(label) => `Data: ${label}`} />
              <Bar dataKey="notti" name="Notti" fill="#8884d8" />
            </BarChart>
          </ResponsiveContainer>
        ) : (
          <div className="flex justify-center items-center h-64 text-muted-foreground">
            Nessun dato disponibile per il periodo selezionato
          </div>
        )}
      </CardContent>
    </Card>
  )
}
