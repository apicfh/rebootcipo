"use client"

import { useState, useEffect, useCallback } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { X, Plus, AlertTriangle } from "lucide-react"
import { FiltriAnalisiPrezzo } from "./filtri-analisi-prezzo"
import { GraficoAnalisiPrezzoV2 } from "./grafico-analisi-prezzo-v2"
import {
  getFiltriAnalisiPrezzo,
  getDatiAnalisiPrezzo,
  generaNomeDisplay,
  COLORI_SET,
  type FiltriAnalisiPrezzo as FiltriType,
  type DatiAnalisiPrezzo,
  type FiltroSelezionato,
} from "@/lib/services/analisi-prezzo-service"

export function AnalisiPrezzoContentV2() {
  const [filtriDisponibili, setFiltriDisponibili] = useState<FiltriType>({
    hotels: [],
    stagioni: [],
    settimane: [],
    tipi_camere: [],
  })
  const [filtriSelezionati, setFiltriSelezionati] = useState<FiltroSelezionato[]>([])
  const [datiSets, setDatiSets] = useState<Record<string, DatiAnalisiPrezzo>>({})
  const [loading, setLoading] = useState(true)
  const [loadingDati, setLoadingDati] = useState(false)
  const [includiStato8, setIncludiStato8] = useState(false)

  // Carica i filtri disponibili
  useEffect(() => {
    async function caricaFiltri() {
      try {
        setLoading(true)
        const filtri = await getFiltriAnalisiPrezzo()
        setFiltriDisponibili(filtri)
      } catch (error) {
        console.error("Errore nel caricamento dei filtri:", error)
      } finally {
        setLoading(false)
      }
    }

    caricaFiltri()
  }, [])

  // Ricarica i dati quando cambia includiStato8
  useEffect(() => {
    if (filtriSelezionati.length > 0) {
      ricaricaTuttiIDati()
    }
  }, [includiStato8])

  const ricaricaTuttiIDati = useCallback(async () => {
    if (filtriSelezionati.length === 0) return

    setLoadingDati(true)
    const nuoviDatiSets: Record<string, DatiAnalisiPrezzo> = {}

    try {
      for (const filtro of filtriSelezionati) {
        const dati = await getDatiAnalisiPrezzo(
          filtro.hotel_id,
          filtro.camera_id,
          filtro.settimana_id,
          filtro.stagione,
          includiStato8,
        )
        nuoviDatiSets[filtro.id] = dati
      }

      setDatiSets(nuoviDatiSets)
    } catch (error) {
      console.error("Errore nel caricamento dei dati:", error)
    } finally {
      setLoadingDati(false)
    }
  }, [filtriSelezionati, includiStato8])

  const handleFiltriChange = async (hotel_id: string, camera_id: string, settimana_id: string, stagione?: string) => {
    const id = `${hotel_id}_${camera_id}_${settimana_id}_${stagione || "no-stagione"}`

    // Verifica se il filtro esiste già
    if (filtriSelezionati.some((f) => f.id === id)) {
      return
    }

    // Trova i dettagli per il nome display
    const hotel = filtriDisponibili.hotels.find((h) => h.id === hotel_id)
    const camera = filtriDisponibili.tipi_camere.find((c) => c.id === camera_id)
    const settimana = filtriDisponibili.settimane.find((s) => s.id === settimana_id)
    const stagioneObj = filtriDisponibili.stagioni.find((s) => s.stagione === stagione)

    const nuovoFiltro: FiltroSelezionato = {
      id,
      hotel_id,
      camera_id,
      settimana_id,
      stagione,
      colore: COLORI_SET[filtriSelezionati.length % COLORI_SET.length].primario,
      nome_display: generaNomeDisplay(hotel, camera, settimana, stagioneObj),
    }

    setLoadingDati(true)
    try {
      // Carica i dati per il nuovo filtro
      const dati = await getDatiAnalisiPrezzo(hotel_id, camera_id, settimana_id, stagione, includiStato8)

      // Aggiorna gli stati
      setFiltriSelezionati((prev) => [...prev, nuovoFiltro])
      setDatiSets((prev) => ({ ...prev, [id]: dati }))
    } catch (error) {
      console.error("Errore nel caricamento dei dati:", error)
    } finally {
      setLoadingDati(false)
    }
  }

  const rimuoviFiltro = (id: string) => {
    setFiltriSelezionati((prev) => prev.filter((f) => f.id !== id))
    setDatiSets((prev) => {
      const nuovi = { ...prev }
      delete nuovi[id]
      return nuovi
    })
  }

  const pulisciTuttiFiltri = () => {
    setFiltriSelezionati([])
    setDatiSets({})
  }

  if (loading) {
    return (
      <Card>
        <CardContent className="p-8">
          <div className="flex items-center justify-center h-40">
            <p className="text-muted-foreground">Caricamento filtri...</p>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-6">
      {/* Sezione Filtri */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Analisi Prezzo - Confronto Multi-Serie</CardTitle>
              <CardDescription>
                Aggiungi hotel, camere e periodi da confrontare. Puoi sovrapporre più serie per analizzare pattern e
                differenze.
              </CardDescription>
            </div>
            {filtriSelezionati.length > 0 && (
              <Badge variant="secondary" className="text-sm">
                {filtriSelezionati.length} serie attive
              </Badge>
            )}
          </div>
        </CardHeader>
        <CardContent>
          <FiltriAnalisiPrezzo filtriDisponibili={filtriDisponibili} onFiltriChange={handleFiltriChange} />
        </CardContent>
      </Card>

      {/* Filtri Selezionati */}
      {filtriSelezionati.length > 0 && (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>Filtri Attivi ({filtriSelezionati.length})</CardTitle>
              <Button variant="outline" size="sm" onClick={pulisciTuttiFiltri}>
                Pulisci Tutti
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2">
              {filtriSelezionati.map((filtro) => (
                <Badge
                  key={filtro.id}
                  variant="secondary"
                  className="flex items-center gap-2 px-3 py-1"
                  style={{ backgroundColor: filtro.colore + "20", borderColor: filtro.colore }}
                >
                  <div className="w-3 h-3 rounded-full" style={{ backgroundColor: filtro.colore }} />
                  {filtro.nome_display}
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-4 w-4 p-0 hover:bg-transparent"
                    onClick={() => rimuoviFiltro(filtro.id)}
                  >
                    <X className="h-3 w-3" />
                  </Button>
                </Badge>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {filtriSelezionati.length > 1 &&
        (() => {
          const anniUnici = new Set()
          filtriSelezionati.forEach((filtro) => {
            const settimana = filtriDisponibili.settimane.find((s) => s.id === filtro.settimana_id)
            if (settimana) anniUnici.add(settimana.anno)
          })

          return anniUnici.size > 1 ? (
            <Card className="border-amber-200 bg-amber-50">
              <CardContent className="pt-4">
                <div className="flex items-center gap-2 text-amber-800">
                  <AlertTriangle className="h-4 w-4" />
                  <span className="text-sm font-medium">
                    Attenzione: Stai confrontando dati di anni diversi ({Array.from(anniUnici).sort().join(", ")})
                  </span>
                </div>
                <p className="text-xs text-amber-700 mt-1">
                  Le date sull'asse X potrebbero sovrapporsi. Il confronto è indicativo per analizzare pattern
                  stagionali.
                </p>
              </CardContent>
            </Card>
          ) : null
        })()}

      {/* Grafico */}
      {filtriSelezionati.length > 0 && (
        <>
          {loadingDati && (
            <Card>
              <CardContent className="p-8">
                <div className="flex items-center justify-center h-40">
                  <p className="text-muted-foreground">Caricamento dati...</p>
                </div>
              </CardContent>
            </Card>
          )}

          {!loadingDati && (
            <GraficoAnalisiPrezzoV2
              datiSets={datiSets}
              filtriSelezionati={filtriSelezionati}
              includiStato8={includiStato8}
              onIncludiStato8Change={setIncludiStato8}
            />
          )}
        </>
      )}

      {/* Messaggio quando non ci sono filtri */}
      {filtriSelezionati.length === 0 && (
        <Card>
          <CardContent className="p-8">
            <div className="text-center">
              <Plus className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-medium text-muted-foreground mb-2">Nessun filtro selezionato</h3>
              <p className="text-sm text-muted-foreground">
                Aggiungi un filtro per iniziare l'analisi dei prezzi e delle prenotazioni
              </p>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
