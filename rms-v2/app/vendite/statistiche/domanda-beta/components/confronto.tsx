"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  BarChart,
  Bar,
} from "recharts"
import { Loader2 } from "lucide-react"

interface ConfrontoProps {
  data: {
    corrente: any[]
    precedente: any[]
  }
  loading: boolean
  confrontoAnnoPrec: boolean
}

export function Confronto({ data, loading, confrontoAnnoPrec }: ConfrontoProps) {
  const [prenotazioniData, setPrenotazioniData] = useState<any[]>([])
  const [fatturatoData, setFatturatoData] = useState<any[]>([])

  useEffect(() => {
    if (data.corrente && data.corrente.length > 0) {
      // Prepara i dati per il grafico dell'andamento prenotazioni
      const groupedByDate = data.corrente.reduce((acc, item) => {
        const creationDate = new Date(item.data_creazione).toISOString().split("T")[0]

        if (!acc[creationDate]) {
          acc[creationDate] = {
            date: creationDate,
            prenotazioni: 0,
            prenotazioniPrevYear: 0,
          }
        }

        acc[creationDate].prenotazioni += 1

        return acc
      }, {})

      // Aggiungi i dati dell'anno precedente se disponibili
      if (confrontoAnnoPrec && data.precedente && data.precedente.length > 0) {
        data.precedente.forEach((item) => {
          const creationDate = new Date(item.data_creazione)
          // Sposta la data all'anno corrente per il confronto
          creationDate.setFullYear(creationDate.getFullYear() + 1)
          const dateKey = creationDate.toISOString().split("T")[0]

          if (!groupedByDate[dateKey]) {
            groupedByDate[dateKey] = {
              date: dateKey,
              prenotazioni: 0,
              prenotazioniPrevYear: 0,
            }
          }

          groupedByDate[dateKey].prenotazioniPrevYear += 1
        })
      }

      const sortedPrenotazioniData = Object.values(groupedByDate).sort((a: any, b: any) => a.date.localeCompare(b.date))
      setPrenotazioniData(sortedPrenotazioniData)

      // Prepara i dati per il grafico del fatturato
      const groupedByMonth = data.corrente.reduce((acc, item) => {
        const creationDate = new Date(item.data_creazione)
        const monthKey = `${creationDate.getFullYear()}-${creationDate.getMonth() + 1}`
        const monthName = creationDate.toLocaleDateString("it-IT", { month: "long", year: "numeric" })

        if (!acc[monthKey]) {
          acc[monthKey] = {
            month: monthName,
            fatturato: 0,
            fatturatoPrevYear: 0,
          }
        }

        acc[monthKey].fatturato += item.importo_totale || 0

        return acc
      }, {})

      // Aggiungi i dati dell'anno precedente se disponibili
      if (confrontoAnnoPrec && data.precedente && data.precedente.length > 0) {
        data.precedente.forEach((item) => {
          const creationDate = new Date(item.data_creazione)
          // Sposta la data all'anno corrente per il confronto
          const monthKey = `${creationDate.getFullYear() + 1}-${creationDate.getMonth() + 1}`

          if (groupedByMonth[monthKey]) {
            groupedByMonth[monthKey].fatturatoPrevYear += item.importo_totale || 0
          }
        })
      }

      const sortedFatturatoData = Object.values(groupedByMonth).sort((a: any, b: any) => {
        const [monthA, yearA] = a.month.split(" ")
        const [monthB, yearB] = b.month.split(" ")

        if (yearA !== yearB) {
          return Number.parseInt(yearA) - Number.parseInt(yearB)
        }

        const months = [
          "gennaio",
          "febbraio",
          "marzo",
          "aprile",
          "maggio",
          "giugno",
          "luglio",
          "agosto",
          "settembre",
          "ottobre",
          "novembre",
          "dicembre",
        ]
        return months.indexOf(monthA.toLowerCase()) - months.indexOf(monthB.toLowerCase())
      })

      setFatturatoData(sortedFatturatoData)
    }
  }, [data, confrontoAnnoPrec])

  if (loading) {
    return (
      <div className="flex justify-center items-center h-80">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Confronto Andamento Prenotazioni</CardTitle>
        </CardHeader>
        <CardContent className="h-80">
          {prenotazioniData.length > 0 ? (
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={prenotazioniData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis
                  dataKey="date"
                  tickFormatter={(date) => {
                    const d = new Date(date)
                    return `${d.getDate()}/${d.getMonth() + 1}`
                  }}
                />
                <YAxis />
                <Tooltip
                  formatter={(value) => [value, "Prenotazioni"]}
                  labelFormatter={(label) => {
                    const d = new Date(label)
                    return `${d.getDate()}/${d.getMonth() + 1}/${d.getFullYear()}`
                  }}
                />
                <Legend />
                <Line
                  type="monotone"
                  dataKey="prenotazioni"
                  name="Anno Corrente"
                  stroke="#8884d8"
                  activeDot={{ r: 8 }}
                />
                {confrontoAnnoPrec && (
                  <Line
                    type="monotone"
                    dataKey="prenotazioniPrevYear"
                    name="Anno Precedente"
                    stroke="#82ca9d"
                    strokeDasharray="5 5"
                  />
                )}
              </LineChart>
            </ResponsiveContainer>
          ) : (
            <div className="flex justify-center items-center h-full">
              <p className="text-muted-foreground">Nessun dato disponibile</p>
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Confronto Fatturato</CardTitle>
        </CardHeader>
        <CardContent className="h-80">
          {fatturatoData.length > 0 ? (
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={fatturatoData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" />
                <YAxis />
                <Tooltip
                  formatter={(value) => [
                    `€ ${value.toLocaleString("it-IT", { minimumFractionDigits: 2 })}`,
                    "Fatturato",
                  ]}
                />
                <Legend />
                <Bar dataKey="fatturato" name="Anno Corrente" fill="#8884d8" />
                {confrontoAnnoPrec && <Bar dataKey="fatturatoPrevYear" name="Anno Precedente" fill="#82ca9d" />}
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="flex justify-center items-center h-full">
              <p className="text-muted-foreground">Nessun dato disponibile</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
