"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Loader2 } from "lucide-react"
import type { Hotel } from "@/lib/services/hotel-service"

interface FiltriScenariCrescitaProps {
  hotels: Hotel[]
  onFiltriChange: (filtri: {
    idHotel: string
    scenarioSelezionato: string
    velocitaSelezionata: string
  }) => void
  loading: boolean
}

export function FiltriScenariCrescita({ hotels, onFiltriChange, loading }: FiltriScenariCrescitaProps) {
  const [idHotel, setIdHotel] = useState<string>("")
  const [scenarioSelezionato, setScenarioSelezionato] = useState<string>("storico")
  const [velocitaSelezionata, setVelocitaSelezionata] = useState<string>("costante")

  const handleApplicaFiltri = () => {
    if (!idHotel) {
      return
    }

    onFiltriChange({
      idHotel,
      scenarioSelezionato,
      velocitaSelezionata,
    })
  }

  const isFormValid = idHotel

  const hotelSelezionato = hotels.find((h) => h.id === idHotel)

  return (
    <Card>
      <CardHeader>
        <CardTitle>Scenari di Crescita Occupazionale</CardTitle>
        <p className="text-sm text-muted-foreground">
          Analisi predittiva basata sul periodo operativo dell'hotel selezionato
        </p>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-4">
          {/* Hotel */}
          <div className="space-y-2">
            <label className="text-sm font-medium">Hotel</label>
            <Select value={idHotel} onValueChange={setIdHotel}>
              <SelectTrigger>
                <SelectValue placeholder="Seleziona hotel" />
              </SelectTrigger>
              <SelectContent>
                {hotels.map((hotel) => (
                  <SelectItem key={hotel.id} value={hotel.id}>
                    {hotel.nome}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Scenario Temporale */}
          <div className="space-y-2">
            <label className="text-sm font-medium">Scenario Temporale</label>
            <Select value={scenarioSelezionato} onValueChange={setScenarioSelezionato}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="storico">📊 Storico (da Nov 2024)</SelectItem>
                <SelectItem value="recente">📈 Recente (da Gen 2025)</SelectItem>
                <SelectItem value="attuale">⚡ Attuale (da Mag 2025)</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Velocità di Crescita */}
          <div className="space-y-2">
            <label className="text-sm font-medium">Velocità di Crescita</label>
            <Select value={velocitaSelezionata} onValueChange={setVelocitaSelezionata}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="pessimistico">🐌 Lenta (-20%)</SelectItem>
                <SelectItem value="costante">📊 Costante</SelectItem>
                <SelectItem value="ottimistico">🚀 Accelerata (+20%)</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Pulsante Applica */}
          <div className="flex items-end">
            <Button onClick={handleApplicaFiltri} disabled={!isFormValid || loading} className="w-full">
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Caricamento...
                </>
              ) : (
                "Applica Filtri"
              )}
            </Button>
          </div>
        </div>

        {/* Info sui filtri applicati */}
        {hotelSelezionato && (
          <div className="mt-4 p-3 bg-blue-50 rounded-lg">
            <p className="text-sm text-blue-800">
              <strong>Analisi per:</strong> {hotelSelezionato.nome} • Periodo operativo automatico • Scenario{" "}
              {scenarioSelezionato} • Crescita {velocitaSelezionata}
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
