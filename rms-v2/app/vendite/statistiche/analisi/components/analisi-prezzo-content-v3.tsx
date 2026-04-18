"use client"

import { useState, useEffect, useMemo } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Switch } from "@/components/ui/switch"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import { CalendarIcon, TrendingUp, TrendingDown, Minus, Plus, X } from "lucide-react"
import { FiltriAnalisiPrezzoV3 } from "./filtri-analisi-prezzo-v3"
import { GraficoAnalisiPrezzoV3 } from "./grafico-analisi-prezzo-v3"
import {
  getFiltriAnalisiPrezzo,
  getDatiAnalisiPrezzo,
  type FiltriAnalisiPrezzo as FiltriType,
  type DatiAnalisiPrezzo,
} from "@/lib/services/analisi-prezzo-service"
import { format, parseISO, isWithinInterval } from "date-fns"

interface KpiData {
  differenzialePrezzo: number
  nuovePrenotazioni: number
  variazioniPrezzo: number
  trendPrezzo: "up" | "down" | "stable"
}

interface CombinazioneConfronto {
  id: string
  hotel: string
  stagione: string
  settimana: string
  camera: string
  nomeDisplay: string
  colore: string
  dati?: DatiAnalisiPrezzo
}

export function AnalisiPrezzoContentV3() {
  const [filtriDisponibili, setFiltriDisponibili] = useState<FiltriType>({
    hotels: [],
    stagioni: [],
    settimane: [],
    tipi_camere: [],
  })

  // Stati per i filtri selezionati
  const [hotelSelezionato, setHotelSelezionato] = useState("")
  const [cameraSelezionata, setCameraSelezionata] = useState("")
  const [settimanaSelezionata, setSettimanaSelezionata] = useState("")
  const [stagioneSelezionata, setStagioneSelezionata] = useState("")

  const [mostraFiltriConfronto, setMostraFiltriConfronto] = useState(false)
  const [hotelConfrontoSelezionato, setHotelConfrontoSelezionato] = useState("")
  const [cameraConfrontoSelezionata, setCameraConfrontoSelezionata] = useState("")
  const [settimanaConfrontoSelezionata, setSettimanaConfrontoSelezionata] = useState("")
  const [stagioneConfrontoSelezionata, setStagioneConfrontoSelezionata] = useState("")

  const [combinazioniConfronto, setCombinazioniConfronto] = useState<CombinazioneConfronto[]>([])

  const [dataInizio, setDataInizio] = useState<Date>(new Date(2024, 9, 1)) // 1 ottobre 2024
  const [dataFine, setDataFine] = useState<Date>(new Date(2025, 8, 30)) // 30 settembre 2025

  // Dati e stati
  const [datiAnalisi, setDatiAnalisi] = useState<DatiAnalisiPrezzo | null>(null)
  const [loading, setLoading] = useState(true)
  const [loadingDati, setLoadingDati] = useState(false)

  // Controlli visualizzazione
  const [mostraPrezzi, setMostraPrezzi] = useState(true)
  const [mostraPrenotazioni, setMostraPrenotazioni] = useState(true)
  const [prenotazioniCumulative, setPrenotazioniCumulative] = useState(false)
  const [adattaAssi, setAdattaAssi] = useState(false)
  const [includiStato8, setIncludiStato8] = useState(false)

  const coloriDisponibili = [
    "#ef4444", // rosso
    "#f97316", // arancio
    "#8b5cf6", // viola
    "#06b6d4", // cyan
  ]

  const handleHotelChange = (value: string) => {
    setHotelSelezionato(value)
    setCameraSelezionata("")
    setStagioneSelezionata("")
    setSettimanaSelezionata("")
  }

  const handleStagioneChange = (value: string) => {
    setStagioneSelezionata(value)
    setSettimanaSelezionata("")
  }

  const handleHotelConfrontoChange = (value: string) => {
    setHotelConfrontoSelezionato(value)
    setCameraConfrontoSelezionata("")
    setStagioneConfrontoSelezionata("")
    setSettimanaConfrontoSelezionata("")
  }

  const handleStagioneConfrontoChange = (value: string) => {
    setStagioneConfrontoSelezionata(value)
    setSettimanaConfrontoSelezionata("")
  }

  const aggiungiAlConfronto = () => {
    if (
      !hotelConfrontoSelezionato ||
      !cameraConfrontoSelezionata ||
      !settimanaConfrontoSelezionata ||
      !stagioneConfrontoSelezionata
    )
      return

    const hotel = filtriDisponibili.hotels.find((h) => h.id === hotelConfrontoSelezionato)
    const camera = filtriDisponibili.tipi_camere.find((c) => c.id === cameraConfrontoSelezionata)
    const settimana = filtriDisponibili.settimane.find((s) => s.id === settimanaConfrontoSelezionata)
    const stagione = filtriDisponibili.stagioni.find((s) => s.stagione === stagioneConfrontoSelezionata)

    if (!hotel || !camera || !settimana || !stagione) return

    const nuovaCombinazione: CombinazioneConfronto = {
      id: `${hotelConfrontoSelezionato}-${stagioneConfrontoSelezionata}-${settimanaConfrontoSelezionata}-${cameraConfrontoSelezionata}`,
      hotel: hotelConfrontoSelezionato,
      stagione: stagioneConfrontoSelezionata,
      settimana: settimanaConfrontoSelezionata,
      camera: cameraConfrontoSelezionata,
      nomeDisplay: `${hotel.nome} - ${camera.nome} - ${settimana.nome} (${stagione.anno})`,
      colore: coloriDisponibili[combinazioniConfronto.length % coloriDisponibili.length],
    }

    // Evita duplicati
    if (!combinazioniConfronto.find((c) => c.id === nuovaCombinazione.id)) {
      setCombinazioniConfronto([...combinazioniConfronto, nuovaCombinazione])
      setHotelConfrontoSelezionato("")
      setCameraConfrontoSelezionata("")
      setSettimanaConfrontoSelezionata("")
      setStagioneConfrontoSelezionata("")
      setMostraFiltriConfronto(false)
    }
  }

  const rimuoviDalConfronto = (id: string) => {
    setCombinazioniConfronto(combinazioniConfronto.filter((c) => c.id !== id))
  }

  // Carica filtri disponibili
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

  // Carica dati quando cambiano i filtri
  useEffect(() => {
    if (hotelSelezionato && cameraSelezionata && settimanaSelezionata) {
      caricaDatiAnalisi()
    }
  }, [hotelSelezionato, cameraSelezionata, settimanaSelezionata, stagioneSelezionata, includiStato8])

  useEffect(() => {
    caricaDatiConfronti()
  }, [combinazioniConfronto.length, includiStato8])

  const caricaDatiAnalisi = async () => {
    if (!hotelSelezionato || !cameraSelezionata || !settimanaSelezionata) return

    try {
      setLoadingDati(true)
      const dati = await getDatiAnalisiPrezzo(
        hotelSelezionato,
        cameraSelezionata,
        settimanaSelezionata,
        stagioneSelezionata,
        includiStato8,
      )
      setDatiAnalisi(dati)
    } catch (error) {
      console.error("Errore nel caricamento dei dati:", error)
    } finally {
      setLoadingDati(false)
    }
  }

  const caricaDatiConfronti = async () => {
    const combinazioniAggiornate = await Promise.all(
      combinazioniConfronto.map(async (combinazione) => {
        if (combinazione.dati) return combinazione // Già caricati

        try {
          const dati = await getDatiAnalisiPrezzo(
            combinazione.hotel,
            combinazione.camera,
            combinazione.settimana,
            combinazione.stagione,
            includiStato8,
          )
          return { ...combinazione, dati }
        } catch (error) {
          console.error(`Errore nel caricamento dati per ${combinazione.nomeDisplay}:`, error)
          return combinazione
        }
      }),
    )

    setCombinazioniConfronto(combinazioniAggiornate)
  }

  const kpiData: KpiData = useMemo(() => {
    if (!datiAnalisi) {
      return {
        differenzialePrezzo: 0,
        nuovePrenotazioni: 0,
        variazioniPrezzo: 0,
        trendPrezzo: "stable",
      }
    }

    // Filtra prezzi nel range
    const prezziInRange = datiAnalisi.prezzi
      .filter((prezzo) => {
        const dataPrezzo = parseISO(prezzo.data)
        return isWithinInterval(dataPrezzo, { start: dataInizio, end: dataFine })
      })
      .sort((a, b) => new Date(a.data).getTime() - new Date(b.data).getTime())

    // Filtra prenotazioni nel range
    const prenotazioniInRange = datiAnalisi.prenotazioni.filter((prenotazione) => {
      if (!prenotazione.data_prenotazione) return false
      const dataPrenotazione = parseISO(prenotazione.data_prenotazione)
      return isWithinInterval(dataPrenotazione, { start: dataInizio, end: dataFine })
    })

    // Calcola differenziale prezzo
    const primoPrezzo = prezziInRange[0]?.prezzo || 0
    const ultimoPrezzo = prezziInRange[prezziInRange.length - 1]?.prezzo || 0
    const differenzialePrezzo = ultimoPrezzo - primoPrezzo

    // Calcola trend prezzo
    let trendPrezzo: "up" | "down" | "stable" = "stable"
    if (differenzialePrezzo > 5) trendPrezzo = "up"
    else if (differenzialePrezzo < -5) trendPrezzo = "down"

    // Conta variazioni prezzo (prezzi unici)
    const prezziUnici = new Set(prezziInRange.map((p) => p.prezzo))
    const variazioniPrezzo = Math.max(0, prezziUnici.size - 1)

    return {
      differenzialePrezzo,
      nuovePrenotazioni: prenotazioniInRange.length,
      variazioniPrezzo,
      trendPrezzo,
    }
  }, [datiAnalisi, dataInizio, dataFine])

  const datiGraficoFiltrati = useMemo(() => {
    if (!datiAnalisi) return null

    return {
      ...datiAnalisi,
      prezzi: datiAnalisi.prezzi.filter((prezzo) => {
        const dataPrezzo = parseISO(prezzo.data)
        return isWithinInterval(dataPrezzo, { start: dataInizio, end: dataFine })
      }),
      prenotazioni: datiAnalisi.prenotazioni.filter((prenotazione) => {
        if (!prenotazione.data_prenotazione) return false
        const dataPrenotazione = parseISO(prenotazione.data_prenotazione)
        return isWithinInterval(dataPrenotazione, { start: dataInizio, end: dataFine })
      }),
    }
  }, [datiAnalisi, dataInizio, dataFine])

  const datiConfrontoFiltrati = useMemo(() => {
    return combinazioniConfronto.map((combinazione) => {
      if (!combinazione.dati) return { ...combinazione, datiNormalizzati: null }

      return {
        ...combinazione,
        datiNormalizzati: {
          ...combinazione.dati,
          prezzi: combinazione.dati.prezzi.filter((prezzo) => {
            const dataPrezzo = parseISO(prezzo.data)
            return isWithinInterval(dataPrezzo, { start: dataInizio, end: dataFine })
          }),
          prenotazioni: combinazione.dati.prenotazioni.filter((prenotazione) => {
            if (!prenotazione.data_prenotazione) return false
            const dataPrenotazione = parseISO(prenotazione.data_prenotazione)
            return isWithinInterval(dataPrenotazione, { start: dataInizio, end: dataFine })
          }),
        },
      }
    })
  }, [combinazioniConfronto, dataInizio, dataFine])

  const nomeDisplay = useMemo(() => {
    const hotel = filtriDisponibili.hotels.find((h) => h.id === hotelSelezionato)
    const camera = filtriDisponibili.tipi_camere.find((c) => c.id === cameraSelezionata)
    const settimana = filtriDisponibili.settimane.find((s) => s.id === settimanaSelezionata)

    const parti = []
    if (hotel) parti.push(hotel.nome)
    if (camera) parti.push(camera.nome)
    if (settimana) parti.push(settimana.nome)

    return parti.join(" - ")
  }, [hotelSelezionato, cameraSelezionata, settimanaSelezionata, filtriDisponibili])

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
      {/* Header con filtri principali */}
      <Card>
        <CardHeader>
          <CardTitle>Filtri Analisi Prezzo</CardTitle>
          <CardDescription>Andamento e confronti prezzi nel tempo in funzione delle prenotazioni</CardDescription>
        </CardHeader>
        <CardContent>
          <FiltriAnalisiPrezzoV3
            filtriDisponibili={filtriDisponibili}
            hotelSelezionato={hotelSelezionato}
            cameraSelezionata={cameraSelezionata}
            settimanaSelezionata={settimanaSelezionata}
            stagioneSelezionata={stagioneSelezionata}
            onHotelChange={handleHotelChange}
            onCameraChange={setCameraSelezionata}
            onSettimanaChange={setSettimanaSelezionata}
            onStagioneChange={handleStagioneChange}
          />

          {hotelSelezionato && cameraSelezionata && settimanaSelezionata && stagioneSelezionata && (
            <div className="mt-4 pt-4 border-t">
              <Button
                onClick={() => setMostraFiltriConfronto(!mostraFiltriConfronto)}
                className="w-full"
                variant="outline"
              >
                <Plus className="h-4 w-4 mr-2" />
                {mostraFiltriConfronto ? "Annulla Confronto" : "Aggiungi Confronto"}
              </Button>
            </div>
          )}

          {mostraFiltriConfronto && (
            <div className="mt-4 p-4 border rounded-lg bg-gray-50">
              <Label className="text-sm font-medium mb-3 block">Seleziona combinazione da confrontare:</Label>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-4">
                <FiltriAnalisiPrezzoV3
                  filtriDisponibili={filtriDisponibili}
                  hotelSelezionato={hotelConfrontoSelezionato}
                  cameraSelezionata={cameraConfrontoSelezionata}
                  settimanaSelezionata={settimanaConfrontoSelezionata}
                  stagioneSelezionata={stagioneConfrontoSelezionata}
                  onHotelChange={handleHotelConfrontoChange}
                  onCameraChange={setCameraConfrontoSelezionata}
                  onSettimanaChange={setSettimanaConfrontoSelezionata}
                  onStagioneChange={handleStagioneConfrontoChange}
                />
              </div>

              <div className="flex gap-2">
                <Button
                  onClick={aggiungiAlConfronto}
                  disabled={
                    !hotelConfrontoSelezionato ||
                    !cameraConfrontoSelezionata ||
                    !settimanaConfrontoSelezionata ||
                    !stagioneConfrontoSelezionata
                  }
                  className="flex-1"
                >
                  Conferma Confronto
                </Button>
                <Button onClick={() => setMostraFiltriConfronto(false)} variant="outline" className="flex-1">
                  Annulla
                </Button>
              </div>
            </div>
          )}

          {combinazioniConfronto.length > 0 && (
            <div className="mt-4 pt-4 border-t">
              <Label className="text-sm font-medium mb-2 block">Confronti Attivi:</Label>
              <div className="space-y-2">
                {combinazioniConfronto.map((combinazione) => (
                  <div key={combinazione.id} className="flex items-center justify-between p-2 bg-gray-50 rounded-lg">
                    <div className="flex items-center space-x-2">
                      <div className="w-3 h-3 rounded-full" style={{ backgroundColor: combinazione.colore }} />
                      <span className="text-sm font-medium">{combinazione.nomeDisplay}</span>
                    </div>
                    <Button size="sm" variant="ghost" onClick={() => rimuoviDalConfronto(combinazione.id)}>
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {datiAnalisi && (
        <Card>
          <CardContent className="pt-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
              <div className="flex items-center space-x-2">
                <Switch id="prezzi" checked={mostraPrezzi} onCheckedChange={setMostraPrezzi} />
                <Label htmlFor="prezzi">Mostra Prezzi</Label>
              </div>

              <div className="flex items-center space-x-2">
                <Switch id="prenotazioni" checked={mostraPrenotazioni} onCheckedChange={setMostraPrenotazioni} />
                <Label htmlFor="prenotazioni">Mostra Prenotazioni</Label>
              </div>

              <div className="flex items-center space-x-2">
                <Switch
                  id="cumulative"
                  checked={prenotazioniCumulative}
                  onCheckedChange={setPrenotazioniCumulative}
                  disabled={!mostraPrenotazioni}
                />
                <Label htmlFor="cumulative">Prenotazioni Cumulative</Label>
              </div>

              <div className="flex items-center space-x-2">
                <Switch id="adattaAssi" checked={adattaAssi} onCheckedChange={setAdattaAssi} />
                <Label htmlFor="adattaAssi">Adatta Assi</Label>
              </div>

              <div className="flex items-center space-x-2">
                <Switch id="stato8" checked={includiStato8} onCheckedChange={setIncludiStato8} />
                <Label htmlFor="stato8">Includi Stato "8"</Label>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Layout principale: Grafico + KPI */}
      {datiGraficoFiltrati && (
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Grafico principale */}
          <div className="lg:col-span-3">
            <Card>
              <CardHeader>
                <CardTitle>
                  Andamento {nomeDisplay}
                  {combinazioniConfronto.length > 0 && ` + ${combinazioniConfronto.length} confronti`}
                </CardTitle>
                <CardDescription>
                  Periodo: {format(dataInizio, "dd/MM/yyyy")} - {format(dataFine, "dd/MM/yyyy")}
                </CardDescription>
              </CardHeader>
              <CardContent>
                {loadingDati ? (
                  <div className="flex items-center justify-center h-96">
                    <p className="text-muted-foreground">Caricamento dati...</p>
                  </div>
                ) : (
                  <GraficoAnalisiPrezzoV3
                    dati={datiGraficoFiltrati}
                    datiConfronto={datiConfrontoFiltrati}
                    mostraPrezzi={mostraPrezzi}
                    mostraPrenotazioni={mostraPrenotazioni}
                    prenotazioniCumulative={prenotazioniCumulative}
                    adattaAssi={adattaAssi}
                    nomeDisplay={nomeDisplay}
                  />
                )}
              </CardContent>
            </Card>
          </div>

          {/* Card KPI */}
          <div className="space-y-4">
            {/* Differenziale Prezzo */}
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Differenziale Prezzo</p>
                    <p className="text-2xl font-bold">
                      {kpiData.differenzialePrezzo > 0 ? "+" : ""}€{kpiData.differenzialePrezzo.toFixed(2)}
                    </p>
                  </div>
                  <div className="h-8 w-8 rounded-full bg-blue-100 flex items-center justify-center">
                    {kpiData.trendPrezzo === "up" && <TrendingUp className="h-4 w-4 text-green-600" />}
                    {kpiData.trendPrezzo === "down" && <TrendingDown className="h-4 w-4 text-red-600" />}
                    {kpiData.trendPrezzo === "stable" && <Minus className="h-4 w-4 text-gray-600" />}
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Nuove Prenotazioni */}
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Nuove Prenotazioni</p>
                    <p className="text-2xl font-bold">{kpiData.nuovePrenotazioni}</p>
                  </div>
                  <div className="h-8 w-8 rounded-full bg-green-100 flex items-center justify-center">
                    <CalendarIcon className="h-4 w-4 text-green-600" />
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Variazioni Prezzo */}
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Variazioni Prezzo</p>
                    <p className="text-2xl font-bold">{kpiData.variazioniPrezzo}</p>
                  </div>
                  <div className="h-8 w-8 rounded-full bg-orange-100 flex items-center justify-center">
                    <TrendingUp className="h-4 w-4 text-orange-600" />
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      )}

      {/* Messaggio quando non ci sono dati */}
      {!datiAnalisi && !loadingDati && (
        <Card>
          <CardContent className="p-8">
            <div className="text-center">
              <CalendarIcon className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-medium text-muted-foreground mb-2">Seleziona i filtri</h3>
              <p className="text-sm text-muted-foreground">
                Scegli hotel, stagione, settimana e tipo camera per iniziare l'analisi dei prezzi
              </p>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
