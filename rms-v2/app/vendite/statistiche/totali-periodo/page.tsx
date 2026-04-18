"use client"

import { useState, useEffect } from "react"
import { Loader2 } from "lucide-react"
import { format } from "date-fns"
import { supabase } from "@/lib/supabase/client"
import type { HotelType, PrenotazioneType, RisultatoType, RisultatoPerHotelType, RisultatoPerPeriodoType } from "./types"
import {
  getUltimoSabatoMaggio, getSecondoSabatoSettembre, getAnnoRiferimento,
  calcolaRisultatoTotale, calcolaRisultatiPerHotel, calcolaRisultatiPerPeriodo,
  calcolaDistribuzionePerPeriodo,
} from "./utils"
import { SezioneFiltri } from "./components/SezioneFiltri"
import { SezioneRisultatiTotale } from "./components/SezioneRisultatiTotale"
import { SezioneRisultatiHotel } from "./components/SezioneRisultatiHotel"
import { SezioneRisultatiPeriodo } from "./components/SezioneRisultatiPeriodo"
import { DialogDistribuzione } from "./components/DialogDistribuzione"

export default function TotaliPeriodoPage() {
  const annoRiferimento = getAnnoRiferimento()
  const dataInizioDefault = getUltimoSabatoMaggio(annoRiferimento)
  const dataFineDefault = getSecondoSabatoSettembre(annoRiferimento)

  const [dataInizio, setDataInizio] = useState<Date>(dataInizioDefault)
  const [dataFine, setDataFine] = useState<Date>(dataFineDefault)
  const [selectedHotels, setSelectedHotels] = useState<string[]>([])
  const [confrontoSDLY, setConfrontoSDLY] = useState(false)
  const [confrontoLY, setConfrontoLY] = useState(false)
  const [soloConfermate, setSoloConfermate] = useState(false)
  const [visualizzazione, setVisualizzazione] = useState<"totale" | "per-hotel" | "per-periodo">("totale")
  const [visualizzazioneDati, setVisualizzazioneDati] = useState<"tabella" | "grafico">("tabella")

  const [hotels, setHotels] = useState<HotelType[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [prenotazioni, setPrenotazioni] = useState<PrenotazioneType[]>([])
  const [risultato, setRisultato] = useState<RisultatoType | null>(null)
  const [risultatoSDLY, setRisultatoSDLY] = useState<RisultatoType | null>(null)
  const [risultatoLY, setRisultatoLY] = useState<RisultatoType | null>(null)
  const [risultatiPerHotel, setRisultatiPerHotel] = useState<RisultatoPerHotelType[]>([])
  const [risultatiPerPeriodo, setRisultatiPerPeriodo] = useState<RisultatoPerPeriodoType[]>([])
  const [risultatiPerPeriodoSDLY, setRisultatiPerPeriodoSDLY] = useState<RisultatoPerPeriodoType[]>([])
  const [risultatiPerPeriodoLY, setRisultatoPerPeriodoLY] = useState<RisultatoPerPeriodoType[]>([])

  const [showDistribuzioneDialog, setShowDistribuzioneDialog] = useState(false)
  const [distribuzioneNotti, setDistribuzioneNotti] = useState<{ tipo_camera: string; notti: number }[]>([])
  const [distribuzioneSDLY, setDistribuzioneSDLY] = useState<{ tipo_camera: string; notti: number }[]>([])
  const [distribuzioneLY, setDistribuzioneLY] = useState<{ tipo_camera: string; notti: number }[]>([])
  const [loadingDistribuzione, setLoadingDistribuzione] = useState(false)
  const [indicatoreSelezionato, setIndicatoreSelezionato] = useState<string>("")

  useEffect(() => {
    async function fetchHotels() {
      try {
        const { data, error } = await supabase.from("hotel").select("id, nome, numero_camere").order("nome")
        if (error) throw error
        setHotels(data || [])
      } catch (err: any) {
        console.error("Errore nel caricamento degli hotel:", err)
        setError(err.message)
      }
    }
    fetchHotels()
  }, [])

  const calcolaRisultati = async () => {
    if (!dataInizio || !dataFine) {
      setError("Seleziona un intervallo di date valido")
      return
    }
    if (selectedHotels.length === 0) {
      setError("Seleziona almeno un hotel")
      return
    }

    setLoading(true)
    setError(null)

    try {
      let query = supabase
        .from("prenotazioni")
        .select("id, id_hotel, arrivo, partenza, notti, totale_soggiorno, stato_prenotazione, adr_soggiorno, data_prenotazione, tipo_camera")
        .in("id_hotel", selectedHotels)
        .not("stato_prenotazione", "eq", "cancellata")
        .or(`arrivo.lte.${format(dataFine, "yyyy-MM-dd")},partenza.gte.${format(dataInizio, "yyyy-MM-dd")}`)

      if (soloConfermate) {
        query = query.in("stato_prenotazione", ["1", "3", "6", "7", "Confermato", "Confermata"])
      }

      const { data: prenotazioniData, error: prenotazioniError } = await query
      if (prenotazioniError) throw prenotazioniError

      setPrenotazioni(prenotazioniData || [])
      setRisultato(calcolaRisultatoTotale(prenotazioniData || [], dataInizio, dataFine, hotels, selectedHotels))
      setRisultatiPerHotel(calcolaRisultatiPerHotel(prenotazioniData || [], dataInizio, dataFine, hotels, selectedHotels))
      setRisultatiPerPeriodo(calcolaRisultatiPerPeriodo(prenotazioniData || [], dataInizio, dataFine, hotels, selectedHotels))

      if (confrontoSDLY) {
        const dataOggi = new Date()
        const dataOggiSDLY = new Date(dataOggi)
        dataOggiSDLY.setFullYear(dataOggiSDLY.getFullYear() - 1)

        const dataInizioSDLY = new Date(dataInizio)
        dataInizioSDLY.setFullYear(dataInizioSDLY.getFullYear() - 1)
        const dataFineSDLY = new Date(dataFine)
        dataFineSDLY.setFullYear(dataFineSDLY.getFullYear() - 1)

        let querySDLY = supabase
          .from("prenotazioni")
          .select("id, id_hotel, arrivo, partenza, notti, totale_soggiorno, stato_prenotazione, adr_soggiorno, data_prenotazione")
          .in("id_hotel", selectedHotels)
          .not("stato_prenotazione", "eq", "cancellata")
          .lte("data_prenotazione", format(dataOggiSDLY, "yyyy-MM-dd"))
          .or(`arrivo.lte.${format(dataFineSDLY, "yyyy-MM-dd")},partenza.gte.${format(dataInizioSDLY, "yyyy-MM-dd")}`)

        if (soloConfermate) {
          querySDLY = querySDLY.in("stato_prenotazione", ["1", "3", "6", "7", "Confermato", "Confermata"])
        }

        const { data: prenotazioniSDLY, error: prenotazioniSDLYError } = await querySDLY
        if (prenotazioniSDLYError) throw prenotazioniSDLYError

        setRisultatoSDLY(calcolaRisultatoTotale(prenotazioniSDLY || [], dataInizioSDLY, dataFineSDLY, hotels, selectedHotels))
        setRisultatiPerPeriodoSDLY(calcolaRisultatiPerPeriodo(prenotazioniSDLY || [], dataInizioSDLY, dataFineSDLY, hotels, selectedHotels))
      }

      if (confrontoLY) {
        const annoCorrente = new Date().getFullYear()
        const dataLY = new Date(annoCorrente - 1, 8, 7)
        const giorniPeriodo = Math.abs(dataFine.getTime() - dataInizio.getTime()) / (1000 * 60 * 60 * 24) + 1
        const dataInizioLY = new Date(dataLY)
        dataInizioLY.setDate(dataInizioLY.getDate() - giorniPeriodo + 1)
        const dataFineLY = dataLY

        let queryLY = supabase
          .from("prenotazioni")
          .select("id, id_hotel, arrivo, partenza, notti, totale_soggiorno, stato_prenotazione, adr_soggiorno")
          .in("id_hotel", selectedHotels)
          .not("stato_prenotazione", "eq", "cancellata")
          .or(`arrivo.lte.${format(dataFineLY, "yyyy-MM-dd")},partenza.gte.${format(dataInizioLY, "yyyy-MM-dd")}`)

        if (soloConfermate) {
          queryLY = queryLY.in("stato_prenotazione", ["1", "3", "6", "7", "Confermato", "Confermata"])
        }

        const { data: prenotazioniLY, error: prenotazioniLYError } = await queryLY
        if (prenotazioniLYError) throw prenotazioniLYError

        setRisultatoLY(calcolaRisultatoTotale(prenotazioniLY || [], dataInizioLY, dataFineLY, hotels, selectedHotels))
        setRisultatoPerPeriodoLY(calcolaRisultatiPerPeriodo(prenotazioniLY || [], dataInizioLY, dataFineLY, hotels, selectedHotels))
      }
    } catch (err: any) {
      console.error("Errore nel calcolo dei risultati:", err)
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  const calcolaDistribuzione = (indicatore: string) => {
    if (!prenotazioni || prenotazioni.length === 0) return

    setLoadingDistribuzione(true)
    setIndicatoreSelezionato(indicatore)

    try {
      setDistribuzioneNotti(calcolaDistribuzionePerPeriodo(prenotazioni, dataInizio, dataFine, indicatore))

      if (confrontoSDLY && risultatoSDLY) {
        const dataOggi = new Date()
        const dataOggiSDLY = new Date(dataOggi)
        dataOggiSDLY.setFullYear(dataOggiSDLY.getFullYear() - 1)

        const dataInizioSDLY = new Date(dataInizio)
        dataInizioSDLY.setFullYear(dataInizioSDLY.getFullYear() - 1)
        const dataFineSDLY = new Date(dataFine)
        dataFineSDLY.setFullYear(dataFineSDLY.getFullYear() - 1)

        supabase
          .from("prenotazioni")
          .select("id, id_hotel, arrivo, partenza, notti, totale_soggiorno, stato_prenotazione, adr_soggiorno, tipo_camera")
          .in("id_hotel", selectedHotels)
          .not("stato_prenotazione", "eq", "cancellata")
          .lte("data_prenotazione", format(dataOggiSDLY, "yyyy-MM-dd"))
          .or(`arrivo.lte.${format(dataFineSDLY, "yyyy-MM-dd")},partenza.gte.${format(dataInizioSDLY, "yyyy-MM-dd")}`)
          .then(({ data: prenotazioniSDLY, error }) => {
            if (!error && prenotazioniSDLY) {
              setDistribuzioneSDLY(calcolaDistribuzionePerPeriodo(prenotazioniSDLY, dataInizioSDLY, dataFineSDLY, indicatore))
            }
          })
      } else {
        setDistribuzioneSDLY([])
      }

      if (confrontoLY && risultatoLY) {
        const annoCorrente = new Date().getFullYear()
        const dataLY = new Date(annoCorrente - 1, 8, 7)
        const giorniPeriodo = Math.abs(dataFine.getTime() - dataInizio.getTime()) / (1000 * 60 * 60 * 24) + 1
        const dataInizioLY = new Date(dataLY)
        dataInizioLY.setDate(dataInizioLY.getDate() - giorniPeriodo + 1)
        const dataFineLY = dataLY

        supabase
          .from("prenotazioni")
          .select("id, id_hotel, arrivo, partenza, notti, totale_soggiorno, stato_prenotazione, adr_soggiorno, tipo_camera")
          .in("id_hotel", selectedHotels)
          .not("stato_prenotazione", "eq", "cancellata")
          .or(`arrivo.lte.${format(dataFineLY, "yyyy-MM-dd")},partenza.gte.${format(dataInizioLY, "yyyy-MM-dd")}`)
          .then(({ data: prenotazioniLY, error }) => {
            if (!error && prenotazioniLY) {
              setDistribuzioneLY(calcolaDistribuzionePerPeriodo(prenotazioniLY, dataInizioLY, dataFineLY, indicatore))
            }
          })
      } else {
        setDistribuzioneLY([])
      }
    } catch (err: any) {
      console.error(`Errore nel calcolo della distribuzione ${indicatore}:`, err)
    } finally {
      setLoadingDistribuzione(false)
    }
  }

  return (
    <div className="container py-6">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-primary">Totali Periodo</h1>
        <p className="text-gray-600 mt-1 italic">
          In questa sezione non sono presenti sia per SDLY sia per LY tutti gli amici di facebook. Il dato SDLY va
          quindi visto al rialzo.
        </p>
      </div>

      <SezioneFiltri
        hotels={hotels}
        dataInizio={dataInizio}
        setDataInizio={setDataInizio}
        dataFine={dataFine}
        setDataFine={setDataFine}
        selectedHotels={selectedHotels}
        setSelectedHotels={setSelectedHotels}
        confrontoSDLY={confrontoSDLY}
        setConfrontoSDLY={setConfrontoSDLY}
        confrontoLY={confrontoLY}
        setConfrontoLY={setConfrontoLY}
        soloConfermate={soloConfermate}
        setSoloConfermate={setSoloConfermate}
        visualizzazione={visualizzazione}
        setVisualizzazione={setVisualizzazione}
        visualizzazioneDati={visualizzazioneDati}
        setVisualizzazioneDati={setVisualizzazioneDati}
        loading={loading}
        calcolaRisultati={calcolaRisultati}
      />

      {error && (
        <div className="bg-red-100 border-2 border-red-400 text-red-700 px-4 py-3 rounded mb-6 shadow-md">{error}</div>
      )}

      {!loading && !error && risultato && (
        <>
          {visualizzazione === "totale" && (
            <SezioneRisultatiTotale
              risultato={risultato}
              risultatoSDLY={risultatoSDLY}
              risultatoLY={risultatoLY}
              confrontoSDLY={confrontoSDLY}
              confrontoLY={confrontoLY}
              visualizzazioneDati={visualizzazioneDati}
              risultatiPerPeriodo={risultatiPerPeriodo}
              risultatiPerPeriodoSDLY={risultatiPerPeriodoSDLY}
              risultatiPerPeriodoLY={risultatiPerPeriodoLY}
              calcolaDistribuzione={calcolaDistribuzione}
              setShowDistribuzioneDialog={setShowDistribuzioneDialog}
            />
          )}

          {visualizzazione === "per-hotel" && (
            <SezioneRisultatiHotel risultatiPerHotel={risultatiPerHotel} />
          )}

          {visualizzazione === "per-periodo" && risultatiPerPeriodo.length > 0 && (
            <SezioneRisultatiPeriodo
              risultatiPerPeriodo={risultatiPerPeriodo}
              risultatiPerPeriodoSDLY={risultatiPerPeriodoSDLY}
              risultatiPerPeriodoLY={risultatiPerPeriodoLY}
              confrontoSDLY={confrontoSDLY}
              confrontoLY={confrontoLY}
              visualizzazioneDati={visualizzazioneDati}
            />
          )}
        </>
      )}

      <DialogDistribuzione
        open={showDistribuzioneDialog}
        onOpenChange={setShowDistribuzioneDialog}
        indicatoreSelezionato={indicatoreSelezionato}
        loadingDistribuzione={loadingDistribuzione}
        distribuzioneNotti={distribuzioneNotti}
        distribuzioneSDLY={distribuzioneSDLY}
        distribuzioneLY={distribuzioneLY}
        confrontoSDLY={confrontoSDLY}
        confrontoLY={confrontoLY}
      />
    </div>
  )
}
