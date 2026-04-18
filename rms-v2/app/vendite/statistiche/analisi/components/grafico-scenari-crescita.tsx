"use client"

import { useState, useCallback } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts"
import type { ProiezioneOccupazione } from "@/lib/services/scenari-crescita-service"
import { format, parseISO } from "date-fns"
import { it } from "date-fns/locale"

interface GraficoScenariCrescitaProps {
  data: ProiezioneOccupazione[]
  hotelNome?: string
  scenarioSelezionato: string
  velocitaSelezionata: string
}

interface PuntoSelezionato {
  data: string
  occupazioneAttuale: number
  proiezione: number
  scenario: string
  velocita: string
}

export function GraficoScenariCrescita({
  data,
  hotelNome,
  scenarioSelezionato,
  velocitaSelezionata,
}: GraficoScenariCrescitaProps) {
  const [puntoSelezionato, setPuntoSelezionato] = useState<PuntoSelezionato | null>(null)

  // Prepara i dati per il grafico
  const chartData = data.map((item) => ({
    ...item,
    dataFormatted: format(parseISO(item.data), "dd MMM", { locale: it }),
  }))

  // Determina quale linea di proiezione mostrare
  const getProiezioneKey = useCallback(() => {
    return `${scenarioSelezionato}_${velocitaSelezionata}`
  }, [scenarioSelezionato, velocitaSelezionata])

  const getProiezioneName = useCallback(() => {
    const scenarioNames: Record<string, string> = {
      storico: "Storico",
      recente: "Recente",
      attuale: "Attuale",
    }
    const velocitaNames: Record<string, string> = {
      pessimistico: "Lenta (-20%)",
      costante: "Costante",
      ottimistico: "Accelerata (+20%)",
    }
    return `${scenarioNames[scenarioSelezionato]} ${velocitaNames[velocitaSelezionata]}`
  }, [scenarioSelezionato, velocitaSelezionata])

  const getProiezioneColor = useCallback(() => {
    const colors: Record<string, string> = {
      storico: "#10b981",
      recente: "#3b82f6",
      attuale: "#f59e0b",
    }
    return colors[scenarioSelezionato]
  }, [scenarioSelezionato])

  const proiezioneKey = getProiezioneKey()

  // Configurazione delle linee del grafico (solo occupazione attuale + proiezione selezionata)
  const lineConfigs = [
    {
      key: "occupazione_attuale",
      name: "Occupazione Attuale",
      color: "#dc2626",
      strokeDasharray: "0",
      strokeWidth: 3,
    },
    {
      key: proiezioneKey,
      name: getProiezioneName(),
      color: getProiezioneColor(),
      strokeDasharray: "5 5",
      strokeWidth: 2,
    },
  ]

  // Tooltip ottimizzato per evitare re-render
  const CustomTooltip = useCallback(
    ({ active, payload, label }: any) => {
      if (active && payload && payload.length) {
        const data = payload[0].payload
        const occupazioneAttuale = data.occupazione_attuale
        const proiezione = data[proiezioneKey]

        return (
          <div className="bg-white p-4 border border-gray-200 rounded-lg shadow-lg">
            <p className="font-semibold text-gray-900 mb-2">{label}</p>
            {payload.map((entry: any, index: number) => (
              <p key={index} style={{ color: entry.color }} className="text-sm">
                {entry.name}: {entry.value.toFixed(1)}%
              </p>
            ))}
          </div>
        )
      }
      return null
    },
    [proiezioneKey],
  )

  // Handler per il click sul grafico
  const handleChartClick = useCallback(
    (data: any) => {
      if (data && data.activePayload && data.activePayload.length > 0) {
        const payload = data.activePayload[0].payload
        setPuntoSelezionato({
          data: payload.dataFormatted,
          occupazioneAttuale: payload.occupazione_attuale,
          proiezione: payload[proiezioneKey],
          scenario: scenarioSelezionato,
          velocita: velocitaSelezionata,
        })
      }
    },
    [proiezioneKey, scenarioSelezionato, velocitaSelezionata],
  )

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle className="text-xl font-bold text-primary">Scenari di Crescita Occupazionale</CardTitle>
          <CardDescription>
            {hotelNome && `Hotel: ${hotelNome} • `}
            Proiezione: {getProiezioneName()}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="h-[500px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart
                data={chartData}
                margin={{ top: 20, right: 30, left: 20, bottom: 60 }}
                onClick={handleChartClick}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis dataKey="dataFormatted" stroke="#666" fontSize={12} angle={-45} textAnchor="end" height={80} />
                <YAxis stroke="#666" fontSize={12} domain={[0, 100]} tickFormatter={(value) => `${value}%`} />
                <Tooltip content={CustomTooltip} />
                <Legend wrapperStyle={{ paddingTop: "20px" }} iconType="line" />

                {lineConfigs.map((config) => (
                  <Line
                    key={config.key}
                    type="monotone"
                    dataKey={config.key}
                    stroke={config.color}
                    strokeWidth={config.strokeWidth}
                    strokeDasharray={config.strokeDasharray}
                    name={config.name}
                    dot={false}
                    activeDot={{ r: 6, fill: config.color }}
                  />
                ))}
              </LineChart>
            </ResponsiveContainer>
          </div>

          {/* Legenda migliorata */}
          <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="p-3 bg-red-50 rounded-lg border-l-4 border-red-500">
              <h3 className="font-semibold text-red-800 mb-1">🔴 Occupazione Attuale</h3>
              <p className="text-sm text-red-700">Camere già prenotate per ogni data</p>
            </div>
            <div className="p-3 bg-blue-50 rounded-lg border-l-4 border-blue-500">
              <h3 className="font-semibold text-blue-800 mb-1">📈 Proiezione Selezionata</h3>
              <p className="text-sm text-blue-700">{getProiezioneName()}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Card dettaglio punto selezionato */}
      {puntoSelezionato && (
        <Card className="border-2 border-blue-200 bg-blue-50">
          <CardHeader className="pb-3">
            <CardTitle className="text-lg text-blue-900">📊 Dettaglio Data Selezionata</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="text-center">
                <p className="text-sm text-gray-600">Data</p>
                <p className="text-lg font-bold text-gray-900">{puntoSelezionato.data}</p>
              </div>
              <div className="text-center">
                <p className="text-sm text-gray-600">Occupazione Attuale</p>
                <p className="text-lg font-bold text-red-600">{puntoSelezionato.occupazioneAttuale.toFixed(1)}%</p>
              </div>
              <div className="text-center">
                <p className="text-sm text-gray-600">Proiezione</p>
                <p className="text-lg font-bold text-blue-600">{puntoSelezionato.proiezione.toFixed(1)}%</p>
              </div>
              <div className="text-center">
                <p className="text-sm text-gray-600">Crescita Prevista</p>
                <p className="text-lg font-bold text-green-600">
                  +{(puntoSelezionato.proiezione - puntoSelezionato.occupazioneAttuale).toFixed(1)}%
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
