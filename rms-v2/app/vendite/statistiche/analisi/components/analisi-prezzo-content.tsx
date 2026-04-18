"use client"

import { useState, useEffect, useCallback } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Plus, Trash2 } from "lucide-react"
import { FiltriAnalisiPrezzo } from "./filtri-analisi-prezzo"
import { GraficoAnalisiPrezzo } from "./grafico-analisi-prezzo"
import {
  getFiltriAnalisiPrezzo,
  getDatiAnalisiPrezzo,
  COLORI_SET,
  generaNomeDisplay,
  type FiltriAnalisiPrezzo as FiltriType,
  type FiltroSelezionato,
  type DatiAnalisiPrezzo,
} from "@/lib/services/analisi-prezzo-service"

export function AnalisiPrezzoContent() {
  const [filtriDisponibili, setFiltriDisponibili] = useState<FiltriType>({
    hotels: [],
    stagioni: [],
    settimane: [],
    tipi_camere: [],
  })
  const [filtriSelezionati, setFiltriSelezionati] = useState<FiltroSelezionato[]>([])
  const [datiGrafico, setDatiGrafico] = useState<Record<string, DatiAnalisiPrezzo>>({})
  const [loading, setLoading] = useState(true)
  const [loadingDati, setLoadingDati] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Funzione per aggiungere un nuovo set di filtri (memoizzata)
  const aggiungiNuovoFiltro = useCallback(() => {
    const nuovoId = `filtro_${Date.now()}`
    const coloreIndex = filtriSelezionati.length % COLORI_SET.length
    const colore = COLORI_SET[coloreIndex].primario

    const nuovoFiltro: FiltroSelezionato = {
      id: nuovoId,
      hotel_id: "",
      camera_id: "",
      settimana_id: "",
      stagione: "",
      colore: colore,
      nome_display: "Nuovo filtro",
    }

    console.log("➕ Aggiunto nuovo filtro:", nuovoFiltro)
    setFiltriSelezionati((prev) => [...prev, nuovoFiltro])
  }, [filtriSelezionati.length])

  // Funzione per rimuovere un set di filtri (memoizzata)
  const rimuoviFiltro = useCallback((id: string) => {
    console.log("🗑️ Rimosso filtro:", id)
    setFiltriSelezionati((prev) => prev.filter((f) => f.id !== id))
    setDatiGrafico((prev) => {
      const nuoviDati = { ...prev }
      delete nuoviDati[id]
      return nuoviDati
    })
  }, [])

  // Funzione per aggiornare un filtro (memoizzata) - ORA SOLO AGGIORNA, NON CARICA DATI
  const aggiorniaFiltro = useCallback(
    async (id: string, hotel_id: string, camera_id: string, settimana_id: string, stagione?: string) => {
      console.log("🔄 Aggiornamento filtro:", { id, hotel_id, camera_id, settimana_id, stagione })

      // Aggiorna il filtro selezionato
      setFiltriSelezionati((prev) =>
        prev.map((f) => {
          if (f.id === id) {
            const hotel = filtriDisponibili.hotels.find((h) => h.id === hotel_id)
            const camera = filtriDisponibili.tipi_camere.find((c) => c.id === camera_id)
            const settimana = filtriDisponibili.settimane.find((s) => s.id === settimana_id)
            const stagioneObj = filtriDisponibili.stagioni.find((s) => s.stagione === stagione)

            return {
              ...f,
              hotel_id,
              camera_id,
              settimana_id,
              stagione,
              nome_display: generaNomeDisplay(hotel, camera, settimana, stagioneObj),
            }
          }
          return f
        }),
      )

      // CARICA I DATI SOLO SE TUTTI I CAMPI SONO COMPILATI
      if (hotel_id && camera_id && settimana_id && hotel_id !== "" && camera_id !== "" && settimana_id !== "") {
        try {
          console.log("📊 Caricamento dati per filtro:", id)
          setLoadingDati(true)
          const dati = await getDatiAnalisiPrezzo(hotel_id, camera_id, settimana_id, stagione, false)
          console.log("✅ Dati caricati:", dati)

          // Verifica se ci sono dati di prezzo
          if (!dati.prezzi || dati.prezzi.length === 0) {
            console.warn("⚠️ Nessun dato di prezzo trovato!")
          }

          setDatiGrafico((prev) => ({
            ...prev,
            [id]: dati,
          }))
        } catch (err) {
          console.error("❌ Errore nel caricamento dei dati:", err)
          setError("Errore nel caricamento dei dati del grafico")
        } finally {
          setLoadingDati(false)
        }
      } else {
        console.log("⏸️ Non tutti i filtri sono compilati, non carico i dati")
        // Rimuovi i dati se il filtro non è completo
        setDatiGrafico((prev) => {
          const nuoviDati = { ...prev }
          delete nuoviDati[id]
          return nuoviDati
        })
      }
    },
    [filtriDisponibili],
  )

  // Carica i filtri disponibili all'avvio (solo una volta)
  useEffect(() => {
    let isMounted = true

    async function caricaFiltri() {
      try {
        console.log("🔄 Caricamento filtri disponibili...")
        setLoading(true)
        const filtri = await getFiltriAnalisiPrezzo()
        console.log("✅ Filtri caricati:", filtri)

        if (isMounted) {
          setFiltriDisponibili(filtri)
        }
      } catch (err) {
        console.error("❌ Errore nel caricamento dei filtri:", err)
        if (isMounted) {
          setError("Errore nel caricamento dei filtri")
        }
      } finally {
        if (isMounted) {
          setLoading(false)
        }
      }
    }

    caricaFiltri()

    return () => {
      isMounted = false
    }
  }, [])

  // Aggiungi il primo filtro solo quando i filtri sono caricati e non ci sono filtri selezionati
  useEffect(() => {
    if (!loading && filtriDisponibili.hotels.length > 0 && filtriSelezionati.length === 0) {
      console.log("🎯 Aggiunta del primo filtro automatico")
      aggiungiNuovoFiltro()
    }
  }, [loading, filtriDisponibili.hotels.length, filtriSelezionati.length, aggiungiNuovoFiltro])

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

  if (error) {
    return (
      <Card>
        <CardContent className="p-8">
          <div className="flex items-center justify-center h-40">
            <p className="text-red-500">{error}</p>
          </div>
        </CardContent>
      </Card>
    )
  }

  const numeroDatiCaricati = Object.keys(datiGrafico).length
  console.log("📈 Stato grafico - Dati caricati:", numeroDatiCaricati, "Loading:", loadingDati)

  return (
    <div className="space-y-6">
      {/* Header */}
      <Card>
        <CardHeader>
          <CardTitle>Analisi Prezzo</CardTitle>
          <CardDescription>Analizza l'evoluzione dei prezzi e la loro correlazione con le prenotazioni</CardDescription>
        </CardHeader>
      </Card>

      {/* Filtri */}
      <div className="space-y-4">
        {filtriSelezionati.map((filtro, index) => (
          <Card key={filtro.id}>
            <CardHeader className="pb-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-4 h-4 rounded-full" style={{ backgroundColor: filtro.colore }} />
                  <CardTitle className="text-lg">
                    Set {index + 1}: {filtro.nome_display}
                  </CardTitle>
                </div>
                {filtriSelezionati.length > 1 && (
                  <Button variant="outline" size="sm" onClick={() => rimuoviFiltro(filtro.id)}>
                    <Trash2 className="h-4 w-4" />
                  </Button>
                )}
              </div>
            </CardHeader>
            <CardContent>
              <FiltriAnalisiPrezzo
                filtriDisponibili={filtriDisponibili}
                onFiltriChange={(hotel_id, camera_id, settimana_id, stagione) =>
                  aggiorniaFiltro(filtro.id, hotel_id, camera_id, settimana_id, stagione)
                }
                valoriIniziali={{
                  hotel_id: filtro.hotel_id,
                  camera_id: filtro.camera_id,
                  settimana_id: filtro.settimana_id,
                  stagione: filtro.stagione,
                }}
              />
            </CardContent>
          </Card>
        ))}

        {/* Pulsante per aggiungere nuovo filtro */}
        <Card>
          <CardContent className="p-4">
            <Button
              variant="outline"
              onClick={aggiungiNuovoFiltro}
              className="w-full bg-transparent"
              disabled={filtriSelezionati.length >= COLORI_SET.length}
            >
              <Plus className="h-4 w-4 mr-2" />
              Aggiungi Comparazione
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* Debug Info */}
      <Card>
        <CardContent className="p-4">
          <div className="text-sm space-y-2">
            <div>
              <strong>Debug Stato:</strong>
            </div>
            <div>Filtri selezionati: {filtriSelezionati.length}</div>
            <div>Dati caricati: {numeroDatiCaricati}</div>
            <div>Loading dati: {loadingDati ? "SÌ" : "NO"}</div>
            <div>
              Filtri disponibili: Hotels({filtriDisponibili.hotels.length}), Settimane(
              {filtriDisponibili.settimane.length})
            </div>
            {Object.entries(datiGrafico).map(([id, dati]) => (
              <div key={id}>
                Filtro {id}: {dati.prezzi?.length || 0} prezzi, {dati.prenotazioni?.length || 0} prenotazioni
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Grafico */}
      {numeroDatiCaricati > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Andamento Prezzi e Prenotazioni</CardTitle>
            <CardDescription>Evoluzione temporale dei prezzi (linee) e numero di prenotazioni (barre)</CardDescription>
          </CardHeader>
          <CardContent>
            <GraficoAnalisiPrezzo datiSets={datiGrafico} filtriSelezionati={filtriSelezionati} loading={loadingDati} />
          </CardContent>
        </Card>
      )}

      {/* Messaggio se non ci sono dati */}
      {numeroDatiCaricati === 0 && !loadingDati && (
        <Card>
          <CardContent className="p-8">
            <div className="flex items-center justify-center h-40">
              <p className="text-muted-foreground">
                Seleziona i filtri e clicca "Filtra Dati" per visualizzare l'analisi dei prezzi
              </p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Stato di caricamento */}
      {loadingDati && (
        <Card>
          <CardContent className="p-8">
            <div className="flex items-center justify-center h-40">
              <p className="text-muted-foreground">Caricamento dati del grafico...</p>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
