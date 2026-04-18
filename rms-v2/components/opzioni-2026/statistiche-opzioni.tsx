"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { LineChart } from "@/components/charts/line-chart"
import { format, parseISO } from "date-fns"
import { it } from "date-fns/locale"
import type { Statistica2026 } from "@/lib/services/opzioni-2026-service"

interface StatisticheOpzioniProps {
  statistiche: Statistica2026[]
}

export function StatisticheOpzioni({ statistiche }: StatisticheOpzioniProps) {
  console.log("Statistiche ricevute:", statistiche) // Debug

  // Raggruppa i dati per hotel
  const hotelData = statistiche.reduce(
    (acc, stat) => {
      if (!acc[stat.nome_hotel]) {
        acc[stat.nome_hotel] = []
      }
      acc[stat.nome_hotel].push({
        x: stat.data,
        y: stat.totale_opzioni,
        hotel: stat.nome_hotel, // Aggiungo il nome hotel per il tooltip
      })
      return acc
    },
    {} as Record<string, Array<{ x: string; y: number; hotel: string }>>,
  )

  // Prepara i dati per il grafico a linee
  const seriesData = Object.entries(hotelData).map(([hotelName, data], index) => ({
    name: hotelName,
    color: `hsl(${(index * 45) % 360}, 70%, 50%)`,
    data: data.sort((a, b) => new Date(a.x).getTime() - new Date(b.x).getTime()),
  }))

  console.log("Dati per il grafico:", seriesData) // Debug

  // Calcola statistiche generali
  const totalOpzioni = statistiche.reduce((sum, stat) => sum + stat.totale_opzioni, 0)
  const hotelCount = Object.keys(hotelData).length
  const giorni = new Set(statistiche.map((s) => s.data)).size

  return (
    <div className="space-y-6">
      {/* Header con periodo di analisi */}
      <Card className="bg-primary-50 border-primary-200">
        <CardContent className="p-6">
          <div className="text-center">
            <h2 className="text-2xl font-bold text-primary-700 mb-2">Analisi Opzioni 2026</h2>
            <p className="text-primary-600 font-medium">Periodo di Analisi: 24 Maggio - 12 Settembre 2025</p>
          </div>
        </CardContent>
      </Card>

      {/* Card con statistiche generali */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="text-2xl font-bold text-primary-600">{totalOpzioni}</div>
            <p className="text-sm text-gray-600">Opzioni Totali Registrate</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="text-2xl font-bold text-primary-600">{hotelCount}</div>
            <p className="text-sm text-gray-600">Hotel Coinvolti</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="text-2xl font-bold text-primary-600">{giorni}</div>
            <p className="text-sm text-gray-600">Giorni con Registrazioni</p>
          </CardContent>
        </Card>
      </div>

      {/* Grafico temporale */}
      <Card>
        <CardHeader>
          <CardTitle className="text-xl text-primary-700">
            Andamento Registrazioni Opzioni per Hotel nel Tempo
          </CardTitle>
          <p className="text-sm text-gray-600">
            Visualizzazione giornaliera delle opzioni registrate per ciascun hotel
          </p>
        </CardHeader>
        <CardContent>
          {seriesData.length > 0 ? (
            <div className="h-[500px] w-full">
              <LineChart
                data={seriesData}
                isSeriesData={true}
                height={500}
                showLegend={true}
                yAxisLabel="Numero Opzioni Registrate"
                xAxisLabel="Data Registrazione (Maggio - Settembre 2025)"
                dateFormat="dd/MM"
                dateLocale={it}
                tooltipFormat={(value, dataPoint) => {
                  const hotel = dataPoint?.hotel || "Hotel"
                  return `${hotel}: ${value} opzioni`
                }}
              />
            </div>
          ) : (
            <div className="flex h-[500px] w-full items-center justify-center text-gray-500">
              <div className="text-center">
                <p className="text-lg mb-2">Nessun dato disponibile per il grafico</p>
                <p className="text-sm">
                  Le opzioni registrate nel periodo 24 Maggio - 12 Settembre 2025 appariranno qui
                </p>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Tabella riepilogativa per hotel */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg text-primary-700">Riepilogo Dettagliato per Hotel</CardTitle>
          <p className="text-sm text-gray-600">Statistiche aggregate per ogni struttura nel periodo di analisi</p>
        </CardHeader>
        <CardContent>
          {Object.keys(hotelData).length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {Object.entries(hotelData).map(([hotelName, data]) => {
                const totalHotel = data.reduce((sum, d) => sum + d.y, 0)
                const ultimaData = data.sort((a, b) => new Date(b.x).getTime() - new Date(a.x).getTime())[0]
                const primaData = data.sort((a, b) => new Date(a.x).getTime() - new Date(b.x).getTime())[0]

                return (
                  <Card key={hotelName} className="border-l-4 border-l-primary-500">
                    <CardContent className="p-4">
                      <h4 className="font-semibold text-primary-700 mb-3">{hotelName}</h4>
                      <div className="space-y-2 text-sm">
                        <div className="flex justify-between">
                          <span>Totale opzioni:</span>
                          <span className="font-medium text-primary-600">{totalHotel}</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Giorni attivi:</span>
                          <span className="font-medium">{data.length}</span>
                        </div>
                        {primaData && (
                          <div className="flex justify-between">
                            <span>Prima registrazione:</span>
                            <span className="font-medium">
                              {format(parseISO(primaData.x), "dd/MM/yyyy", { locale: it })}
                            </span>
                          </div>
                        )}
                        {ultimaData && (
                          <div className="flex justify-between">
                            <span>Ultima registrazione:</span>
                            <span className="font-medium">
                              {format(parseISO(ultimaData.x), "dd/MM/yyyy", { locale: it })}
                            </span>
                          </div>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                )
              })}
            </div>
          ) : (
            <div className="text-center py-8 text-gray-500">
              <p>Nessun hotel ha registrato opzioni nel periodo selezionato</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
