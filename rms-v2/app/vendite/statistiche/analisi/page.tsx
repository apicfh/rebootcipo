"use client"

import { useEffect } from "react"

import { useState } from "react"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { BookingPaceChart } from "./components/booking-pace-chart"
import { OccupazioneHotelChart } from "./components/occupazione-hotel-chart"
import { KpiCards } from "./components/kpi-cards"
import { OccupazionePeriodoChart } from "./components/occupazione-periodo-chart"
import { BuchiPlanningTable } from "./components/buchi-planning-table"
import { VelocitaRiempimentoChart } from "./components/velocita-riempimento-chart"
import { StrategiePricing } from "./components/strategie-pricing"
import {
  getPrenotazioniPerAnalisi,
  getCapienzaHotel,
  calcolaBookingPace,
  calcolaOccupazioneHotel,
  calcolaOccupazionePeriodo,
  identificaBuchiPlanning,
  generaScenariPrevisionali,
  calcolaVelocitaRiempimento,
  type PrenotazioneAnalisi,
  type HotelCapienza,
  type BookingPace,
  type OccupazioneHotel as OccupazioneHotelType,
  type OccupazionePeriodo,
  type BucoPlanning,
  type ScenarioPrevisionale,
} from "@/lib/services/analisi-predittiva-service"
import { FiltriScenariCrescita } from "./components/filtri-scenari-crescita"
import { GraficoScenariCrescita } from "./components/grafico-scenari-crescita"
import {
  getScenariCrescitaOccupazionale,
  calcolaProiezioniOccupazione,
  type ProiezioneOccupazione,
} from "@/lib/services/scenari-crescita-service"
import { getAllHotels, type Hotel } from "@/lib/services/hotel-service"
import { Table, TableHead, TableRow, TableCell, TableBody } from "@/components/ui/table"
import { AnalisiPrezzoContentV3 } from "./components/analisi-prezzo-content-v3"

export default function AnalisiPage() {
  // Stati per i dati
  const [prenotazioni, setPrenotazioni] = useState<PrenotazioneAnalisi[]>([])
  const [hotel, setHotel] = useState<HotelCapienza[]>([])
  const [bookingPace, setBookingPace] = useState<BookingPace[]>([])
  const [occupazioneHotel, setOccupazioneHotel] = useState<OccupazioneHotelType[]>([])
  const [occupazionePeriodo, setOccupazionePeriodo] = useState<OccupazionePeriodo[]>([])
  const [buchiPlanning, setBuchiPlanning] = useState<BucoPlanning[]>([])
  const [scenariPrevisionali, setScenariPrevisionali] = useState<Record<string, ScenarioPrevisionale[]>>({})
  const [velocitaRiempimento, setVelocitaRiempimento] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Mappa degli hotel per nome
  const [hotelNames, setHotelNames] = useState<Record<string, string>>({})

  const [hotels, setHotels] = useState<Hotel[]>([])
  const [scenariCrescita, setScenariCrescita] = useState<ProiezioneOccupazione[]>([])
  const [loadingScenari, setLoadingScenari] = useState(false)
  const [filtriScenari, setFiltriScenari] = useState<{
    idHotel: string
    scenarioSelezionato: string
    velocitaSelezionata: string
  } | null>(null)

  useEffect(() => {
    async function fetchData() {
      try {
        setLoading(true)

        // Recupera i dati
        const prenotazioniData = await getPrenotazioniPerAnalisi()
        const hotelData = await getCapienzaHotel()

        // Imposta i dati di base
        setPrenotazioni(prenotazioniData)
        setHotel(hotelData)

        // Crea la mappa degli hotel
        const hotelMap: Record<string, string> = {}
        hotelData.forEach((h) => {
          hotelMap[h.id] = h.nome
        })
        setHotelNames(hotelMap)

        // Carica la lista degli hotel per i filtri
        const hotelsData = await getAllHotels()
        setHotels(hotelsData)

        // Calcola le analisi
        const bookingPaceData = calcolaBookingPace(prenotazioniData)
        const occupazioneHotelData = calcolaOccupazioneHotel(prenotazioniData, hotelData)
        const occupazionePeriodoData = calcolaOccupazionePeriodo(prenotazioniData, hotelData)
        const buchiPlanningData = identificaBuchiPlanning(prenotazioniData, hotelData)
        const scenariPrevisionaliData = generaScenariPrevisionali(occupazioneHotelData)
        const velocitaRiempimentoData = calcolaVelocitaRiempimento(prenotazioniData)

        // Imposta i risultati delle analisi
        setBookingPace(bookingPaceData)
        setOccupazioneHotel(occupazioneHotelData)
        setOccupazionePeriodo(occupazionePeriodoData)
        setBuchiPlanning(buchiPlanningData)
        setScenariPrevisionali(scenariPrevisionaliData)
        setVelocitaRiempimento(velocitaRiempimentoData)
      } catch (err) {
        console.error("Errore nel caricamento dei dati:", err)
        setError("Si è verificato un errore nel caricamento dei dati. Riprova più tardi.")
      } finally {
        setLoading(false)
      }
    }

    fetchData()
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

  // Gestione dello stato di caricamento
  if (loading) {
    return (
      <div className="container py-6">
        <h1 className="text-3xl font-bold tracking-tight mb-6 text-primary">Analisi Predittiva</h1>
        <div className="grid gap-4">
          <Card>
            <CardContent className="p-8">
              <div className="flex items-center justify-center h-40">
                <p className="text-muted-foreground">Caricamento dati in corso...</p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    )
  }

  // Gestione degli errori
  if (error) {
    return (
      <div className="container py-6">
        <h1 className="text-3xl font-bold tracking-tight mb-6 text-primary">Analisi Predittiva</h1>
        <div className="grid gap-4">
          <Card>
            <CardContent className="p-8">
              <div className="flex items-center justify-center h-40">
                <p className="text-red-500">{error}</p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    )
  }

  return (
    <div className="container py-6">
      <h1 className="text-3xl font-bold tracking-tight mb-6 text-primary">Analisi Predittiva</h1>

      <Tabs defaultValue="panoramica">
        <TabsList className="grid w-full grid-cols-5 mb-8">
          <TabsTrigger value="panoramica">Panoramica</TabsTrigger>
          <TabsTrigger value="analisi-temporale">Analisi Temporale</TabsTrigger>
          <TabsTrigger value="analisi-hotel">Analisi per Hotel</TabsTrigger>
          <TabsTrigger value="analisi-finanziaria">Analisi Prezzo</TabsTrigger>
          <TabsTrigger value="scenari">Scenari Previsionali</TabsTrigger>
        </TabsList>

        {/* Panoramica */}
        <TabsContent value="panoramica" className="space-y-4">
          <div className="grid grid-cols-4 gap-4">
            <KpiCards prenotazioni={prenotazioni} occupazioneHotel={occupazioneHotel} />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <BookingPaceChart data={bookingPace} />
            <OccupazioneHotelChart data={occupazioneHotel} />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <BuchiPlanningTable data={buchiPlanning.slice(0, 5)} />
            <Card>
              <CardHeader>
                <CardTitle>Riepilogo Analisi</CardTitle>
                <CardDescription>Sintesi dell'analisi predittiva per la stagione estiva 2025</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <h3 className="font-medium">Stato Attuale</h3>
                  <p className="text-sm text-muted-foreground">
                    L'analisi delle prenotazioni dal 1° ottobre 2024 ad oggi mostra un tasso di occupazione medio del{" "}
                    {occupazioneHotel.length > 0
                      ? (
                          occupazioneHotel.reduce((sum, h) => sum + h.percentuale_occupazione, 0) /
                          occupazioneHotel.length
                        ).toFixed(1)
                      : 0}
                    % per la stagione estiva 2025.
                  </p>
                </div>

                <div className="space-y-2">
                  <h3 className="font-medium">Periodi Critici</h3>
                  <p className="text-sm text-muted-foreground">
                    Sono stati identificati {buchiPlanning.length} periodi critici con potenziali "buchi" di 3-4 notti
                    che potrebbero essere difficili da riempire. Si consiglia di concentrare le strategie di marketing
                    su questi periodi.
                  </p>
                </div>

                <div className="space-y-2">
                  <h3 className="font-medium">Previsioni</h3>
                  <p className="text-sm text-muted-foreground">
                    Mantenendo il ritmo di prenotazioni attuale, si prevede di raggiungere un'occupazione finale del
                    85-90% con un fatturato stimato di circa{" "}
                    {occupazioneHotel.length > 0
                      ? formatCurrency(occupazioneHotel.reduce((sum, h) => sum + h.fatturato_previsto, 0))
                      : 0}
                    .
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Analisi Temporale */}
        <TabsContent value="analisi-temporale" className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <OccupazionePeriodoChart data={occupazionePeriodo} />
            <VelocitaRiempimentoChart data={velocitaRiempimento} />
          </div>

          <div className="grid grid-cols-1 gap-4">
            <BuchiPlanningTable data={buchiPlanning} />
          </div>
        </TabsContent>

        {/* Analisi per Hotel */}
        <TabsContent value="analisi-hotel" className="space-y-4">
          <div className="grid grid-cols-1 gap-4">
            <OccupazioneHotelChart data={occupazioneHotel} />
          </div>

          <div className="grid grid-cols-1 gap-4">
            <Card>
              <CardHeader>
                <CardTitle>Dettaglio per Hotel</CardTitle>
                <CardDescription>Analisi dettagliata per ciascun hotel</CardDescription>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHead>
                    <TableRow>
                      <TableCell className="font-medium">Hotel</TableCell>
                      <TableCell className="font-medium">Occupazione</TableCell>
                      <TableCell className="font-medium">ADR Medio</TableCell>
                      <TableCell className="font-medium">Fatturato Confermato</TableCell>
                      <TableCell className="font-medium">Fatturato Previsto</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {occupazioneHotel.map((hotel, index) => (
                      <TableRow key={index}>
                        <TableCell className="font-medium">{hotel.hotel_nome}</TableCell>
                        <TableCell>{hotel.percentuale_occupazione.toFixed(1)}%</TableCell>
                        <TableCell>{formatCurrency(hotel.adr_medio)}</TableCell>
                        <TableCell>{formatCurrency(hotel.fatturato_confermato)}</TableCell>
                        <TableCell>{formatCurrency(hotel.fatturato_previsto)}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </div>

          <div className="grid grid-cols-1 gap-4">
            <StrategiePricing data={occupazionePeriodo} />
          </div>
        </TabsContent>

        {/* Analisi Prezzo - NUOVA VERSIONE CON FILTRI A CASCATA */}
        <TabsContent value="analisi-finanziaria" className="space-y-4">
          <AnalisiPrezzoContentV3 />
        </TabsContent>

        {/* Scenari Previsionali */}
        <TabsContent value="scenari" className="space-y-4">
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
        </TabsContent>
      </Tabs>
    </div>
  )
}

// Funzione di utilità per formattare valori monetari
function formatCurrency(value: number): string {
  return new Intl.NumberFormat("it-IT", {
    style: "currency",
    currency: "EUR",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value)
}
