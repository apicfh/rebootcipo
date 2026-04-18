"use client"

import { useEffect, useState } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { FiltriScenariCrescita } from "../analisi/components/filtri-scenari-crescita"
import { GraficoScenariCrescita } from "../analisi/components/grafico-scenari-crescita"
import {
  getScenariCrescitaOccupazionale,
  calcolaProiezioniOccupazione,
  type ProiezioneOccupazione,
} from "@/lib/services/scenari-crescita-service"
import { getAllHotels, type Hotel } from "@/lib/services/hotel-service"

export default function ScenariPrevisionaliPage() {
  const [hotels, setHotels] = useState<Hotel[]>([])
  const [scenariCrescita, setScenariCrescita] = useState<ProiezioneOccupazione[]>([])
  const [loadingScenari, setLoadingScenari] = useState(false)
  const [filtriScenari, setFiltriScenari] = useState<{
    idHotel: string
    scenarioSelezionato: string
    velocitaSelezionata: string
  } | null>(null)

  useEffect(() => {
    async function fetchHotels() {
      try {
        const hotelsData = await getAllHotels()
        setHotels(hotelsData)
      } catch (error) {
        console.error("Errore nel caricamento degli hotel:", error)
      }
    }

    fetchHotels()
  }, [])

  const handleFiltriScenariChange = async (filtri: {
    idHotel: string
    scenarioSelezionato: string
    velocitaSelezionata: string
  }) => {
    setLoadingScenari(true)
    setFiltriScenari(filtri)

    try {
      const datiScenari = await getScenariCrescitaOccupazionale(filtri.idHotel)
      const proiezioni = calcolaProiezioniOccupazione(datiScenari)
      setScenariCrescita(proiezioni)
    } catch (error) {
      console.error("Errore nel caricamento degli scenari:", error)
    } finally {
      setLoadingScenari(false)
    }
  }

  return (
    <div className="container py-6">
      <div className="mb-8">
        <h1 className="text-3xl font-bold tracking-tight text-primary">Scenari Previsionali</h1>
        <p className="text-muted-foreground mt-2">
          Proiezioni di crescita occupazionale per gli hotel Club Family Hotel
        </p>
      </div>

      <div className="space-y-4">
        <FiltriScenariCrescita hotels={hotels} onFiltriChange={handleFiltriScenariChange} loading={loadingScenari} />

        {loadingScenari && (
          <Card>
            <CardContent className="p-8">
              <div className="flex items-center justify-center h-40">
                <p className="text-muted-foreground">Caricamento scenari di crescita...</p>
              </div>
            </CardContent>
          </Card>
        )}

        {!loadingScenari && scenariCrescita.length > 0 && (
          <GraficoScenariCrescita
            data={scenariCrescita}
            hotelNome={hotels.find((h) => h.id === filtriScenari?.idHotel)?.nome}
            scenarioSelezionato={filtriScenari?.scenarioSelezionato || "storico"}
            velocitaSelezionata={filtriScenari?.velocitaSelezionata || "costante"}
          />
        )}

        {!loadingScenari && scenariCrescita.length === 0 && filtriScenari && (
          <Card>
            <CardContent className="p-8">
              <div className="flex items-center justify-center h-40">
                <p className="text-muted-foreground">
                  Nessun dato disponibile per l'hotel selezionato. Prova con un altro hotel.
                </p>
              </div>
            </CardContent>
          </Card>
        )}

        {!filtriScenari && (
          <Card>
            <CardContent className="p-8">
              <div className="flex items-center justify-center h-40">
                <p className="text-muted-foreground">
                  Seleziona un hotel per visualizzare gli scenari di crescita occupazionale per il suo periodo
                  operativo.
                </p>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  )
}
