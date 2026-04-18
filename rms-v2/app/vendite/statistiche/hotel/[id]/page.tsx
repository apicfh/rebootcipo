"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import {
  format,
  subDays,
  isSameDay,
  parseISO,
  isWithinInterval,
  addDays,
  isBefore,
  subYears,
  addYears,
  isAfter,
} from "date-fns"
import { it } from "date-fns/locale"
import { Loader2, TrendingUp, TrendingDown } from "lucide-react"
import { supabase } from "@/lib/supabase/client"
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend,
  ReferenceLine,
} from "recharts"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { CompactDatePicker } from "@/components/ui/compact-date-picker"
import { Switch } from "@/components/ui/switch"
import { Label } from "@/components/ui/label"

// Tipi di dati
interface Prenotazione {
  id: string
  arrivo: string
  partenza: string
  totale_soggiorno: number
  stato_prenotazione: string
  id_hotel: string
  tipo_camera: string
  notti: number
  data_prenotazione: string
  adr_soggiorno: number
}

interface HotelType {
  id: string
  nome: string
}

// Colori per i grafici
const COLORS = ["#0088FE", "#00C49F", "#FFBB28", "#FF8042", "#8884d8", "#82ca9d", "#ffc658", "#8dd1e1"]

// Colori standardizzati per i grafici temporali
const COLORE_ANNO_CORRENTE = "#4caf50" // Verde
const COLORE_ANNO_PRECEDENTE = "#ff9800" // Arancione
const COLORE_CAPACITA_TOTALE = "#000000" // Nero
const COLORE_CANCELLAZIONI = "#f44336" // Rosso per le cancellazioni

// Costanti per le date stagionali
const MESE_INIZIO_STAGIONE = 4 // Maggio (0-based)
const GIORNO_INIZIO_STAGIONE = 17 // 17 maggio
const MESE_INIZIO_PRENOTAZIONI = 9 // Ottobre (0-based)
const GIORNO_INIZIO_PRENOTAZIONI = 1 // 1 ottobre

// Funzione per calcolare la settimana del mese di una data
const getWeekOfMonth = (date: Date) => {
  const firstDayOfMonth = new Date(date.getFullYear(), date.getMonth(), 1)
  return Math.ceil((date.getDate() + firstDayOfMonth.getDay()) / 7)
}

// Funzione per trovare la data corrispondente nell'anno precedente con lo stesso giorno della settimana e settimana del mese
const findCorrespondingDateInPreviousYear = (date: Date) => {
  const dayOfWeek = date.getDay()
  const weekOfMonth = getWeekOfMonth(date)
  const month = date.getMonth()
  const year = date.getFullYear() - 1

  // Trova il primo giorno del mese nell'anno precedente
  const firstDayOfMonth = new Date(year, month, 1)

  // Calcola il primo giorno della settimana nel mese
  const firstDayOfWeekInMonth = new Date(firstDayOfMonth)
  while (firstDayOfWeekInMonth.getDay() !== dayOfWeek) {
    firstDayOfWeekInMonth.setDate(firstDayOfWeekInMonth.getDate() + 1)
  }

  // Calcola la data nella settimana del mese specificata
  const correspondingDate = new Date(firstDayOfWeekInMonth)
  correspondingDate.setDate(correspondingDate.getDate() + (weekOfMonth - 1) * 7)

  // Se la data calcolata è oltre la fine del mese, torna all'ultima occorrenza di quel giorno della settimana nel mese
  if (correspondingDate.getMonth() !== month) {
    correspondingDate.setDate(correspondingDate.getDate() - 7)
  }

  return correspondingDate
}

// Aggiungi questa funzione di utilità dopo le costanti e prima del componente principale
// Questa funzione calcola i tick dell'asse Y in modo che siano multipli di 5 o 20 in base al valore massimo

function calcolaTicks(valoreMax: number): number[] {
  // Determina l'incremento in base al valore massimo
  let incremento = 5
  if (valoreMax > 200) incremento = 20
  else if (valoreMax > 100) incremento = 10

  // Calcola il valore massimo arrotondato per eccesso al multiplo dell'incremento
  const maxArrotondato = Math.ceil(valoreMax / incremento) * incremento

  // Aggiungi almeno 10 unità (o più se l'incremento è maggiore)
  const maxTick = maxArrotondato + Math.max(10, incremento)

  // Genera i tick
  const ticks: number[] = []
  for (let i = 0; i <= maxTick; i += incremento) {
    ticks.push(i)
  }

  return ticks
}

export default function HotelDetailPage({ params }: { params: { id: string } }) {
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [hotel, setHotel] = useState<HotelType | null>(null)
  const [visualizzazioneGrafico, setVisualizzazioneGrafico] = useState("giornaliera")
  const [snapshotDate, setSnapshotDate] = useState<Date>(new Date())
  const [numeroCamere, setNumeroCamere] = useState<number>(0)
  const [includiCancellazioni, setIncludiCancellazioni] = useState(false)

  // Se snapshot è tra ottobre-dicembre: mostra anno successivo
  // Se snapshot è tra gennaio-settembre: mostra anno corrente
  const meseSnapshot = snapshotDate.getMonth()
  const annoSnapshot = snapshotDate.getFullYear()
  const annoRiferimento = meseSnapshot >= 9 ? annoSnapshot + 1 : annoSnapshot

  // Dati per le sezioni
  const [prenotazioniOggi, setPrenotazioniOggi] = useState(0)
  const [prenotazioniOggiAnnoScorso, setPrenotazioniOggiAnnoScorso] = useState(0)
  const [prenotazioniIeri, setPrenotazioniIeri] = useState(0)
  const [prenotazioniIeriAnnoScorso, setPrenotazioniIeriAnnoScorso] = useState(0)
  const [prenotazioniTotali, setPrenotazioniTotali] = useState(0)
  const [prenotazioniTotaliAnnoScorso, setPrenotazioniTotaliAnnoScorso] = useState(0)

  const [distribuzioneNotti, setDistribuzioneNotti] = useState<any[]>([])
  const [distribuzioneNottiAnnoPrec, setDistribuzioneNottiPrec] = useState<any[]>([])
  const [distribuzionePerCamera, setDistribuzionePerCamera] = useState<any[]>([])
  const [adrPerCamera, setAdrPerCamera] = useState<any[]>([])

  const [andamentoPrenotazioni, setAndamentoPrenotazioni] = useState<any[]>([])
  const [andamentoTipologiaCamera, setAndamentoTipologiaCamera] = useState<any[]>([])
  const [tipoCamera, setTipoCamera] = useState<string>("tutte")
  const [tipiCameraDisponibili, setTipiCameraDisponibili] = useState<string[]>([])
  const [periodoAndamento, setPeriodoAndamento] = useState("30") // giorni
  const [mostraSDLY, setMostraSDLY] = useState(false)
  const [mostraCumulativo, setMostraCumulativo] = useState(false)
  const [prenotazioniArray, setPrenotazioniArray] = useState<Prenotazione[]>([])

  // State per il periodo di soggiorno - MODIFICATO COME RICHIESTO
  const [periodoSoggiornoInizio, setPeriodoSoggiornoInizio] = useState<Date>(
    new Date(annoRiferimento, 4, 24), // 24 maggio annoRiferimento
  )
  const [periodoSoggiornoFine, setPeriodoSoggiornoFine] = useState<Date>(
    new Date(annoRiferimento, 8, 12), // 12 settembre annoRiferimento
  )
  const [andamentoPeriodo, setAndamentoPeriodo] = useState<any[]>([])

  // Aggiungi questi nuovi stati temporanei dopo gli stati esistenti (circa riga 125)
  const [tempPeriodoAndamento, setTempPeriodoAndamento] = useState(periodoAndamento)
  const [tempMostraSDLY, setTempMostraSDLY] = useState(mostraSDLY)
  const [tempMostraCumulativo, setTempMostraCumulativo] = useState(mostraCumulativo)
  const [tempTipoCamera, setTempTipoCamera] = useState(tipoCamera)
  const [tempPeriodoSoggiornoInizio, setTempPeriodoSoggiornoInizio] = useState(periodoSoggiornoInizio)
  const [tempPeriodoSoggiornoFine, setTempPeriodoSoggiornoFine] = useState(periodoSoggiornoFine)
  const [applicaFiltri, setApplicaFiltri] = useState(0) // Contatore per triggerare il caricamento

  useEffect(() => {
    setPeriodoSoggiornoInizio(new Date(annoRiferimento, 4, 24))
    setPeriodoSoggiornoFine(new Date(annoRiferimento, 8, 12))
    setTempPeriodoSoggiornoInizio(new Date(annoRiferimento, 4, 24))
    setTempPeriodoSoggiornoFine(new Date(annoRiferimento, 8, 12))
  }, [annoRiferimento])

  // Carica i dati
  useEffect(() => {
    async function fetchData() {
      setLoading(true)
      setError(null)

      try {
        // Carica i dettagli dell'hotel
        const { data: hotelData, error: hotelError } = await supabase
          .from("hotel")
          .select("id, nome, numero_camere")
          .eq("id", params.id)
          .single()

        if (hotelError) throw hotelError
        setHotel(hotelData)
        // Assicurati che il valore sia un numero, con fallback a 0 se è null o undefined
        setNumeroCamere(hotelData?.numero_camere ? Number(hotelData.numero_camere) : 0)
        console.log("Numero camere recuperato:", hotelData?.numero_camere)

        // Date di riferimento basate sullo snapshot date
        const oggi = new Date(snapshotDate)
        const ieri = subDays(oggi, 1)
        const oggiAnnoScorso = subYears(oggi, 1)
        const ieriAnnoScorso = subYears(ieri, 1)

        // Carica tutte le prenotazioni per questo hotel
        const { data: prenotazioni, error: prenotazioniError } = await supabase
          .from("prenotazioni")
          .select(
            "id, arrivo, partenza, totale_soggiorno, stato_prenotazione, tipo_camera, notti, data_prenotazione, adr_soggiorno, id_hotel",
          )
          .eq("id_hotel", params.id)

        if (prenotazioniError) throw prenotazioniError

        // Filtra le prenotazioni per data (solo quelle inserite fino allo snapshot date)
        const prenotazioniArray = (prenotazioni || []).filter((p) => {
          if (!p.data_prenotazione) return false

          try {
            const dataPrenotazione = parseISO(p.data_prenotazione)
            return isBefore(dataPrenotazione, addDays(snapshotDate, 1)) // Include lo snapshot date
          } catch (err) {
            console.error("Errore nel parsing della data di prenotazione:", err)
            return false
          }
        })

        setPrenotazioniArray(prenotazioniArray)

        // Conteggio prenotazioni per oggi, ieri e totali (relativi allo snapshot date)
        const prenotazioniOggiCount = prenotazioniArray.filter((p) => {
          const dataPrenotazione = parseISO(p.data_prenotazione)
          return isSameDay(dataPrenotazione, oggi)
        }).length

        const prenotazioniIeriCount = prenotazioniArray.filter((p) => {
          const dataPrenotazione = parseISO(p.data_prenotazione)
          return isSameDay(dataPrenotazione, ieri)
        }).length

        const prenotazioniOggiAnnoScorsoCount = prenotazioniArray.filter((p) => {
          const dataPrenotazione = parseISO(p.data_prenotazione)
          return isSameDay(dataPrenotazione, oggiAnnoScorso)
        }).length

        const prenotazioniIeriAnnoScorsoCount = prenotazioniArray.filter((p) => {
          const dataPrenotazione = parseISO(p.data_prenotazione)
          return isSameDay(dataPrenotazione, ieriAnnoScorso)
        }).length

        const annoScorso = annoRiferimento - 1
        const annoPrecedente = annoScorso - 1

        // Data di inizio della stagione estiva corrente (17 maggio annoRiferimento)
        const inizioStagioneCorrente = new Date(annoRiferimento, MESE_INIZIO_STAGIONE, GIORNO_INIZIO_STAGIONE)

        // Data di inizio delle prenotazioni per la stagione corrente (1 ottobre anno precedente)
        const inizioPrenotazioniCorrente = new Date(annoScorso, MESE_INIZIO_PRENOTAZIONI, GIORNO_INIZIO_PRENOTAZIONI)

        // Date corrispondenti per l'anno precedente
        const inizioStagionePrecedente = new Date(annoScorso, MESE_INIZIO_STAGIONE, GIORNO_INIZIO_STAGIONE)
        const inizioPrenotazioniPrecedente = new Date(
          annoPrecedente,
          MESE_INIZIO_PRENOTAZIONI,
          GIORNO_INIZIO_PRENOTAZIONI,
        )

        // Prenotazioni stagionali: conta le prenotazioni per la stagione estiva corrente
        const prenotazioniTotaliCount = prenotazioniArray.filter((p) => {
          if (!p.data_prenotazione || !p.arrivo) return false

          // Escludi le prenotazioni cancellate (stato_prenotazione = "8")
          if (p.stato_prenotazione === "8" && !includiCancellazioni) return false

          try {
            const dataPrenotazione = parseISO(p.data_prenotazione)
            const dataArrivo = parseISO(p.arrivo)

            // Conta solo le prenotazioni che:
            // 1. Hanno una data di arrivo nella stagione estiva corrente o successiva
            // 2. Sono state effettuate dal periodo di inizio prenotazioni fino allo snapshot date
            return (
              isBefore(inizioStagioneCorrente, dataArrivo) && // Arrivo dopo l'inizio della stagione
              isWithinInterval(dataPrenotazione, {
                start: inizioPrenotazioniCorrente,
                end: oggi,
              }) // Prenotazione effettuata nel periodo corretto
            )
          } catch (err) {
            console.error("Errore nel parsing delle date:", err)
            return false
          }
        }).length

        // Prenotazioni stagionali anno scorso: conta le prenotazioni per la stagione estiva precedente
        const prenotazioniTotaliAnnoScorsoCount = prenotazioniArray.filter((p) => {
          if (!p.data_prenotazione || !p.arrivo) return false

          // Escludi le prenotazioni cancellate (stato_prenotazione = "8")
          if (p.stato_prenotazione === "8" && !includiCancellazioni) return false

          try {
            const dataPrenotazione = parseISO(p.data_prenotazione)
            const dataArrivo = parseISO(p.arrivo)

            // Conta solo le prenotazioni che:
            // 1. Hanno una data di arrivo nella stagione estiva precedente
            // 2. Sono state effettuate dal periodo di inizio prenotazioni precedente fino alla stessa data dell'anno scorso
            return (
              isBefore(inizioStagionePrecedente, dataArrivo) && // Arrivo dopo l'inizio della stagione precedente
              isBefore(dataArrivo, inizioStagioneCorrente) && // Ma prima dell'inizio della stagione corrente
              isWithinInterval(dataPrenotazione, {
                start: inizioPrenotazioniPrecedente,
                end: oggiAnnoScorso,
              }) // Prenotazione effettuata nel periodo corretto dell'anno precedente
            )
          } catch (err) {
            console.error("Errore nel parsing delle date per l'anno precedente:", err)
            return false
          }
        }).length

        setPrenotazioniOggi(prenotazioniOggiCount)
        setPrenotazioniOggiAnnoScorso(prenotazioniOggiAnnoScorsoCount)
        setPrenotazioniIeri(prenotazioniIeriCount)
        setPrenotazioniIeriAnnoScorso(prenotazioniIeriAnnoScorsoCount)
        setPrenotazioniTotali(prenotazioniTotaliCount)
        setPrenotazioniTotaliAnnoScorso(prenotazioniTotaliAnnoScorsoCount)

        const inizioPeriodo = new Date(annoRiferimento, 4, 17) // 17 maggio annoRiferimento
        const finePeriodo = new Date(annoRiferimento, 8, 12) // 12 settembre annoRiferimento

        // Date corrispondenti per l'anno precedente
        const inizioPeriodoAnnoPrec = subYears(inizioPeriodo, 1)
        const finePeriodoAnnoPrec = subYears(finePeriodo, 1)

        // Crea un oggetto per tenere traccia delle notti per data
        const distribuzionePerData: Record<string, number> = {}
        const distribuzionePerDataAnnoPrec: Record<string, number> = {}
        const distribuzionePerDataCancellate: Record<string, number> = {}
        const distribuzionePerDataAnnoPrecCancellate: Record<string, number> = {}

        // Inizializza tutte le date nel periodo per l'anno corrente
        const currentDate = new Date(inizioPeriodo)
        while (currentDate <= finePeriodo) {
          const dateKey = format(currentDate, "yyyy-MM-dd")
          distribuzionePerData[dateKey] = 0
          distribuzionePerDataCancellate[dateKey] = 0
          currentDate.setDate(currentDate.getDate() + 1)
        }

        // Inizializza tutte le date nel periodo per l'anno precedente
        const currentDateAnnoPrec = new Date(inizioPeriodoAnnoPrec)
        while (currentDateAnnoPrec <= finePeriodoAnnoPrec) {
          const dateKey = format(currentDateAnnoPrec, "yyyy-MM-dd")
          distribuzionePerDataAnnoPrec[dateKey] = 0
          distribuzionePerDataAnnoPrecCancellate[dateKey] = 0
          currentDateAnnoPrec.setDate(currentDateAnnoPrec.getDate() + 1)
        }

        // Conta le notti per ogni data nel periodo per l'anno corrente
        prenotazioniArray.forEach((p) => {
          if (!p.arrivo || !p.partenza) return

          // Verifica che le date siano valide prima di usarle
          try {
            const dataArrivo = parseISO(p.arrivo)
            const dataPartenza = parseISO(p.partenza)

            if (isNaN(dataArrivo.getTime()) || isNaN(dataPartenza.getTime())) {
              console.warn("Data non valida trovata:", p.arrivo, p.partenza)
              return
            }

            // Determina se la prenotazione è cancellata
            const isCancellata = p.stato_prenotazione === "8"

            // Per ogni giorno tra arrivo e partenza (escluso)
            let currentDay = new Date(dataArrivo)
            while (currentDay < dataPartenza) {
              // Se il giorno è nel periodo di interesse
              if (isWithinInterval(currentDay, { start: inizioPeriodo, end: finePeriodo })) {
                const dateKey = format(currentDay, "yyyy-MM-dd")

                // Se la prenotazione è cancellata, aggiorna il conteggio delle cancellazioni
                if (isCancellata) {
                  distribuzionePerDataCancellate[dateKey] = (distribuzionePerDataCancellate[dateKey] || 0) + 1
                } else {
                  // Altrimenti, aggiorna il conteggio delle prenotazioni normali
                  distribuzionePerData[dateKey] = (distribuzionePerData[dateKey] || 0) + 1
                }
              }
              currentDay = addDays(currentDay, 1)
            }
          } catch (err) {
            console.error("Errore nell'elaborazione delle date:", err)
          }
        })

        // Conta le notti per ogni data nel periodo per l'anno precedente
        prenotazioniArray.forEach((p) => {
          if (!p.arrivo || !p.partenza) return

          try {
            const dataArrivo = parseISO(p.arrivo)
            const dataPartenza = parseISO(p.partenza)

            if (isNaN(dataArrivo.getTime()) || isNaN(dataPartenza.getTime())) {
              return
            }

            // Determina se la prenotazione è cancellata
            const isCancellata = p.stato_prenotazione === "8"

            // Per ogni giorno tra arrivo e partenza (escluso)
            let currentDay = new Date(dataArrivo)
            while (currentDay < dataPartenza) {
              // Se il giorno è nel periodo di interesse dell'anno precedente
              if (isWithinInterval(currentDay, { start: inizioPeriodoAnnoPrec, end: finePeriodoAnnoPrec })) {
                const dateKey = format(currentDay, "yyyy-MM-dd")

                // Se la prenotazione è cancellata, aggiorna il conteggio delle cancellazioni
                if (isCancellata) {
                  distribuzionePerDataAnnoPrecCancellate[dateKey] =
                    (distribuzionePerDataAnnoPrecCancellate[dateKey] || 0) + 1
                } else {
                  // Altrimenti, aggiorna il conteggio delle prenotazioni normali
                  distribuzionePerDataAnnoPrec[dateKey] = (distribuzionePerDataAnnoPrec[dateKey] || 0) + 1
                }
              }
              currentDay = addDays(currentDay, 1)
            }
          } catch (err) {
            console.error("Errore nell'elaborazione delle date per l'anno precedente:", err)
          }
        })

        // Converti in array per il grafico - anno corrente
        const distribuzioneArray = Object.entries(distribuzionePerData).map(([data, notti]) => {
          const dataObj = parseISO(data)
          const nottiCancellate = distribuzionePerDataCancellate[data] || 0

          return {
            data: format(dataObj, "dd/MM"),
            notti: notti,
            nottiCancellate: nottiCancellate,
            nottiTotali: includiCancellazioni ? notti + nottiCancellate : notti,
            giorno: format(dataObj, "EEEE", { locale: it }),
            dataCompleta: data,
          }
        })

        // Allinea i dati dell'anno precedente per giorno della settimana e settimana del mese
        const distribuzioneAllineata = distribuzioneArray.map((item) => {
          const dataCorrente = parseISO(item.dataCompleta)

          // Trova la data corrispondente nell'anno precedente con lo stesso giorno della settimana e settimana del mese
          const dataCorrispondenteAnnoPrec = findCorrespondingDateInPreviousYear(dataCorrente)
          const dataCorrispondenteKey = format(dataCorrispondenteAnnoPrec, "yyyy-MM-dd")

          // Cerca i dati dell'anno precedente per questa data
          const nottiAnnoPrecedente = distribuzionePerDataAnnoPrec[dataCorrispondenteKey] || 0
          const nottiAnnoPrecedenteCancellate = distribuzionePerDataAnnoPrecCancellate[dataCorrispondenteKey] || 0

          return {
            ...item,
            nottiAnnoPrecedente,
            nottiAnnoPrecedenteCancellate,
            nottiAnnoPrecedenteTotali: includiCancellazioni
              ? nottiAnnoPrecedente + nottiAnnoPrecedenteCancellate
              : nottiAnnoPrecedente,
            dataCorrispondente: format(dataCorrispondenteAnnoPrec, "dd/MM"), // Per debug
          }
        })

        setDistribuzioneNotti(distribuzioneAllineata)

        // Distribuzione prenotazioni per tipo di camera
        const distribuzioneCamera: Record<string, number> = {}
        const adrCamera: Record<string, { totale: number; count: number }> = {}

        prenotazioniArray.forEach((p) => {
          const tipoCamera = p.tipo_camera || "Non specificato"

          // Conteggio per tipo camera
          distribuzioneCamera[tipoCamera] = (distribuzioneCamera[tipoCamera] || 0) + 1

          // Somma ADR per tipo camera
          if (!adrCamera[tipoCamera]) {
            adrCamera[tipoCamera] = { totale: 0, count: 0 }
          }

          if (p.adr_soggiorno) {
            adrCamera[tipoCamera].totale += p.adr_soggiorno
            adrCamera[tipoCamera].count += 1
          }
        })

        // Converti in array per il grafico a torta
        const distribuzioneCameraArray = Object.entries(distribuzioneCamera).map(([tipo, count]) => ({
          tipo,
          count,
          percentuale: (count / prenotazioniArray.length) * 100,
        }))

        // Ordina l'array in base al conteggio (dal più alto al più basso)
        distribuzioneCameraArray.sort((a, b) => b.count - a.count)

        // Se ci sono più di 3 tipologie, raggruppa le rimanenti in "Altri"
        let distribuzioneCameraFiltrata = distribuzioneCameraArray
        if (distribuzioneCameraArray.length > 3) {
          const top3 = distribuzioneCameraArray.slice(0, 3)
          const altri = distribuzioneCameraArray.slice(3)

          // Calcola il totale per "Altri"
          const totaleAltri = altri.reduce((acc, curr) => acc + curr.count, 0)
          const percentualeAltri = (totaleAltri / prenotazioniArray.length) * 100

          // Aggiungi la categoria "Altri"
          distribuzioneCameraFiltrata = [
            ...top3,
            {
              tipo: "Altri",
              count: totaleAltri,
              percentuale: percentualeAltri,
            },
          ]
        }

        setDistribuzionePerCamera(distribuzioneCameraFiltrata)

        // Calcola ADR medio per tipo camera
        const adrCameraArray = Object.entries(adrCamera).map(([tipo, { totale, count }]) => ({
          tipo,
          adr_medio: count > 0 ? totale / count : 0,
        }))

        setAdrPerCamera(adrCameraArray)

        // Elabora i dati per l'andamento prenotazioni
        const andamentoPrenotazioniData = elaboraAndamentoPrenotazioni(prenotazioniArray, periodoAndamento, mostraSDLY)
        setAndamentoPrenotazioni(andamentoPrenotazioniData)

        // Estrai i tipi di camera disponibili dalle prenotazioni
        const tipiCamera = Array.from(new Set(prenotazioniArray.map((p) => p.tipo_camera || "Non specificato")))
        setTipiCameraDisponibili(tipiCamera)

        // Elabora i dati per l'andamento tipologia camera
        const andamentoTipologiaCameraData = elaboraAndamentoTipologiaCamera(
          prenotazioniArray,
          periodoAndamento,
          mostraSDLY,
          tipoCamera,
          mostraCumulativo,
        )
        setAndamentoTipologiaCamera(andamentoTipologiaCameraData)

        // Aggiungi questa riga dopo la chiamata a elaboraAndamentoTipologiaCamera
        const andamentoPeriodoData = elaboraAndamentoPeriodo(
          prenotazioniArray,
          periodoSoggiornoInizio,
          periodoSoggiornoFine,
          mostraCumulativo,
        )
        setAndamentoPeriodo(andamentoPeriodoData)
      } catch (err: any) {
        console.error("Errore nel caricamento dei dati:", err)
        setError(err.message || "Errore nel caricamento dei dati")
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [
    params.id,
    snapshotDate,
    includiCancellazioni, // Aggiungi questa dipendenza
    applicaFiltri, // Sostituisce le dipendenze individuali
    annoRiferimento, // Aggiunta dipendenza annoRiferimento
  ])

  // Formatta il numero come valuta
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("it-IT", { style: "currency", currency: "EUR" }).format(value)
  }

  // Calcola la variazione percentuale
  const calcolaVariazione = (attuale: number, precedente: number) => {
    if (precedente === 0) return attuale > 0 ? 100 : 0
    return ((attuale - precedente) / precedente) * 100
  }

  // Funzione per raggruppare i dati per settimana
  const raggruppaPerSettimana = (dati) => {
    const dattiRaggruppati = {}

    dati.forEach((item) => {
      // Verifica che item.data esista prima di usare split
      if (!item.data) return

      // Estrai la settimana dalla data (formato dd/MM)
      const parts = item.data.split("/")
      if (parts.length < 2) return // Verifica che lo split abbia prodotto almeno 2 parti

      const giorno = parts[0]
      const mese = parts[1]

      // Crea una data completa per poter calcolare la settimana
      const data = new Date(new Date().getFullYear(), Number.parseInt(mese) - 1, Number.parseInt(giorno))
      // Ottieni l'inizio della settimana
      const inizioSettimana = new Date(data)
      inizioSettimana.setDate(data.getDate() - data.getDay())
      const chiaveSettimana = format(inizioSettimana, "dd/MM")

      if (!dattiRaggruppati[chiaveSettimana]) {
        dattiRaggruppati[chiaveSettimana] = {
          data: `Sett. ${chiaveSettimana}`,
          notti: 0,
          nottiCancellate: 0,
          nottiTotali: 0,
          nottiAnnoPrecedente: 0,
          nottiAnnoPrecedenteCancellate: 0,
          nottiAnnoPrecedenteTotali: 0,
        }
      }

      dattiRaggruppati[chiaveSettimana].notti += item.notti || 0
      dattiRaggruppati[chiaveSettimana].nottiCancellate += item.nottiCancellate || 0
      dattiRaggruppati[chiaveSettimana].nottiTotali += item.nottiTotali || 0

      if (item.nottiAnnoPrecedente) {
        dattiRaggruppati[chiaveSettimana].nottiAnnoPrecedente += item.nottiAnnoPrecedente
      }

      if (item.nottiAnnoPrecedenteCancellate) {
        dattiRaggruppati[chiaveSettimana].nottiAnnoPrecedenteCancellate += item.nottiAnnoPrecedenteCancellate
      }

      if (item.nottiAnnoPrecedenteTotali) {
        dattiRaggruppati[chiaveSettimana].nottiAnnoPrecedenteTotali += item.nottiAnnoPrecedenteTotali
      }
    })

    return Object.values(dattiRaggruppati)
  }

  // Funzione per elaborare i dati dell'andamento prenotazioni
  const elaboraAndamentoPrenotazioni = (prenotazioni: Prenotazione[], periodo: string, mostraSDLY: boolean) => {
    // Crea un array di date per il periodo selezionato
    const dataFine = new Date(snapshotDate)
    let dataInizio: Date

    // Gestisci il caso speciale "stagione" (dal 1 ottobre)
    if (periodo === "stagione") {
      const annoCorrente = dataFine.getFullYear()
      const meseCorrente = dataFine.getMonth()

      // Se siamo prima di ottobre, usa il 1 ottobre dell'anno precedente
      if (meseCorrente < MESE_INIZIO_PRENOTAZIONI) {
        dataInizio = new Date(annoCorrente - 1, MESE_INIZIO_PRENOTAZIONI, GIORNO_INIZIO_PRENOTAZIONI)
      } else {
        dataInizio = new Date(annoCorrente, MESE_INIZIO_PRENOTAZIONI, GIORNO_INIZIO_PRENOTAZIONI)
      }
    } else {
      // Altrimenti usa il numero di giorni specificato
      dataInizio = subDays(dataFine, Number.parseInt(periodo) - 1)
    }

    // Crea un oggetto per tenere traccia delle prenotazioni per data
    const prenotazioniPerData: Record<string, { count: number; countSDLY: number }> = {}

    // Inizializza tutte le date nel periodo con 0 prenotazioni
    let currentDate = new Date(dataInizio)
    while (currentDate <= dataFine) {
      const dateKey = format(currentDate, "yyyy-MM-dd")
      prenotazioniPerData[dateKey] = { count: 0, countSDLY: 0 }
      currentDate = addDays(currentDate, 1)
    }

    // Conta le prenotazioni per ogni data nel periodo corrente
    prenotazioni.forEach((p) => {
      if (!p.data_prenotazione) return

      try {
        const dataPrenotazione = parseISO(p.data_prenotazione)

        // Se la data di prenotazione è nel periodo selezionato
        if (isWithinInterval(dataPrenotazione, { start: dataInizio, end: dataFine })) {
          const dateKey = format(dataPrenotazione, "yyyy-MM-dd")
          if (prenotazioniPerData[dateKey]) {
            prenotazioniPerData[dateKey].count += 1
          }
        }
      } catch (err) {
        console.error("Errore nel parsing della data di prenotazione:", err)
      }
    })

    // Se mostraSDLY è true, conta le prenotazioni dell'anno precedente
    if (mostraSDLY) {
      // Calcola le date per la stagione precedente
      const dataInizioAnnoPrec = subYears(dataInizio, 1)
      const dataFineAnnoPrec = subYears(dataFine, 1)

      // Conta le prenotazioni per ogni data nella stagione precedente
      prenotazioni.forEach((p) => {
        if (!p.data_prenotazione) return

        try {
          const dataPrenotazione = parseISO(p.data_prenotazione)

          // Se la data di prenotazione è nel periodo dell'anno precedente
          if (isWithinInterval(dataPrenotazione, { start: dataInizioAnnoPrec, end: dataFineAnnoPrec })) {
            // Calcola la data corrispondente nell'anno corrente
            const dataCorrispondente = addYears(dataPrenotazione, 1)
            const dateKeyCorrispondente = format(dataCorrispondente, "yyyy-MM-dd")

            // Aggiungi al conteggio SDLY se la data corrispondente è nel periodo corrente
            if (prenotazioniPerData[dateKeyCorrispondente]) {
              prenotazioniPerData[dateKeyCorrispondente].countSDLY += 1
            }
          }
        } catch (err) {
          console.error("Errore nel parsing della data di prenotazione per SDLY:", err)
        }
      })
    }

    // Converti in array per il grafico
    return Object.entries(prenotazioniPerData)
      .map(([data, { count, countSDLY }]) => {
        const dataObj = parseISO(data)
        return {
          data: format(dataObj, "dd/MM"),
          count,
          countSDLY,
          giorno: format(dataObj, "EEEE", { locale: it }),
          dataCompleta: data,
        }
      })
      .sort((a, b) => parseISO(a.dataCompleta).getTime() - parseISO(b.dataCompleta).getTime())
  }

  // Funzione per elaborare i dati dell'andamento per tipologia di camera
  const elaboraAndamentoTipologiaCamera = (
    prenotazioni: Prenotazione[],
    periodo: string,
    mostraSDLY: boolean,
    tipoCamera: string,
    mostraCumulativo: boolean,
  ) => {
    // Crea un array di date per il periodo selezionato
    const dataFine = new Date(snapshotDate)
    let dataInizio: Date

    // Gestisci il caso speciale "stagione" (dal 1 ottobre)
    if (periodo === "stagione") {
      const annoCorrente = dataFine.getFullYear()
      const meseCorrente = dataFine.getMonth()

      // Se siamo prima di ottobre, usa il 1 ottobre dell'anno precedente
      if (meseCorrente < MESE_INIZIO_PRENOTAZIONI) {
        dataInizio = new Date(annoCorrente - 1, MESE_INIZIO_PRENOTAZIONI, GIORNO_INIZIO_PRENOTAZIONI)
      } else {
        dataInizio = new Date(annoCorrente, MESE_INIZIO_PRENOTAZIONI, GIORNO_INIZIO_PRENOTAZIONI)
      }
    } else {
      // Altrimenti usa il numero di giorni specificato
      dataInizio = subDays(dataFine, Number.parseInt(periodo) - 1)
    }

    // Crea un oggetto per tenere traccia delle prenotazioni per data
    const prenotazioniPerData: Record<string, { count: number; countSDLY: number }> = {}

    // Inizializza tutte le date nel periodo con 0 prenotazioni
    let currentDate = new Date(dataInizio)
    while (currentDate <= dataFine) {
      const dateKey = format(currentDate, "yyyy-MM-dd")
      prenotazioniPerData[dateKey] = { count: 0, countSDLY: 0 }
      currentDate = addDays(currentDate, 1)
    }

    // Filtra le prenotazioni per tipo di camera se necessario
    const prenotazioniFiltrate =
      tipoCamera === "tutte" ? prenotazioni : prenotazioni.filter((p) => p.tipo_camera === tipoCamera)

    // Conta le prenotazioni per ogni data nel periodo corrente
    prenotazioniFiltrate.forEach((p) => {
      if (!p.data_prenotazione) return

      try {
        const dataPrenotazione = parseISO(p.data_prenotazione)

        // Se la data di prenotazione è nel periodo selezionato
        if (isWithinInterval(dataPrenotazione, { start: dataInizio, end: dataFine })) {
          const dateKey = format(dataPrenotazione, "yyyy-MM-dd")
          if (prenotazioniPerData[dateKey]) {
            prenotazioniPerData[dateKey].count += 1
          }
        }
      } catch (err) {
        console.error("Errore nel parsing della data di prenotazione:", err)
      }
    })

    // Se mostraSDLY è true, conta le prenotazioni dell'anno precedente
    if (mostraSDLY) {
      // Calcola le date per la stagione precedente
      const dataInizioAnnoPrec = subYears(dataInizio, 1)
      const dataFineAnnoPrec = subYears(dataFine, 1)

      // Filtra le prenotazioni per tipo di camera se necessario
      const prenotazioniFiltrateSDLY =
        tipoCamera === "tutte" ? prenotazioni : prenotazioni.filter((p) => p.tipo_camera === tipoCamera)

      // Conta le prenotazioni per ogni data nella stagione precedente
      prenotazioniFiltrateSDLY.forEach((p) => {
        if (!p.data_prenotazione) return

        try {
          const dataPrenotazione = parseISO(p.data_prenotazione)

          // Se la data di prenotazione è nel periodo dell'anno precedente
          if (isWithinInterval(dataPrenotazione, { start: dataInizioAnnoPrec, end: dataFineAnnoPrec })) {
            // Calcola la data corrispondente nell'anno corrente
            const dataCorrispondente = addYears(dataPrenotazione, 1)
            const dateKeyCorrispondente = format(dataCorrispondente, "yyyy-MM-dd")

            // Aggiungi al conteggio SDLY se la data corrispondente è nel periodo corrente
            if (prenotazioniPerData[dateKeyCorrispondente]) {
              prenotazioniPerData[dateKeyCorrispondente].countSDLY += 1
            }
          }
        } catch (err) {
          console.error("Errore nel parsing della data di prenotazione per SDLY:", err)
        }
      })
    }

    // Converti in array per il grafico
    let risultato = Object.entries(prenotazioniPerData)
      .map(([data, { count, countSDLY }]) => {
        const dataObj = parseISO(data)
        return {
          data: format(dataObj, "dd/MM"),
          count,
          countSDLY,
          giorno: format(dataObj, "EEEE", { locale: it }),
          dataCompleta: data,
        }
      })
      .sort((a, b) => parseISO(a.dataCompleta).getTime() - parseISO(b.dataCompleta).getTime())

    // Se richiesto, calcola i valori cumulativi
    if (mostraCumulativo) {
      let cumulativoCount = 0
      let cumulativoCountSDLY = 0

      risultato = risultato.map((item) => {
        cumulativoCount += item.count
        cumulativoCountSDLY += item.countSDLY

        return {
          ...item,
          count: cumulativoCount,
          countSDLY: cumulativoCountSDLY,
        }
      })
    }

    return risultato
  }

  // Funzione per elaborare i dati dell'andamento per periodo di soggiorno
  const elaboraAndamentoPeriodo = (
    prenotazioni: Prenotazione[],
    dataInizioSoggiorno: Date,
    dataFineSoggiorno: Date,
    mostraCumulativo: boolean,
  ) => {
    console.log("Elaborazione andamento periodo:", {
      dataInizioSoggiorno: format(dataInizioSoggiorno, "yyyy-MM-dd"),
      dataFineSoggiorno: format(dataFineSoggiorno, "yyyy-MM-dd"),
      totalePrenotazioni: prenotazioni.length,
    })

    // Crea un array di date per il periodo selezionato
    const dataFine = new Date(snapshotDate)
    let dataInizio: Date

    // Gestisci il caso speciale "stagione" (dal 1 ottobre)
    if (periodoAndamento === "stagione") {
      const annoCorrente = dataFine.getFullYear()
      const meseCorrente = dataFine.getMonth()

      // Se siamo prima di ottobre, usa il 1 ottobre dell'anno precedente
      if (meseCorrente < MESE_INIZIO_PRENOTAZIONI) {
        dataInizio = new Date(annoCorrente - 1, MESE_INIZIO_PRENOTAZIONI, GIORNO_INIZIO_PRENOTAZIONI)
      } else {
        dataInizio = new Date(annoCorrente, MESE_INIZIO_PRENOTAZIONI, GIORNO_INIZIO_PRENOTAZIONI)
      }
    } else {
      // Altrimenti usa il numero di giorni specificato
      dataInizio = subDays(dataFine, Number.parseInt(periodoAndamento) - 1)
    }

    console.log("Periodo di analisi:", {
      dataInizio: format(dataInizio, "yyyy-MM-dd"),
      dataFine: format(dataFine, "yyyy-MM-dd"),
    })

    // Crea un oggetto per tenere traccia delle prenotazioni per data
    const prenotazioniPerData: Record<string, { count: number }> = {}

    // Inizializza tutte le date nel periodo con 0 prenotazioni
    let currentDate = new Date(dataInizio)
    while (currentDate <= dataFine) {
      const dateKey = format(currentDate, "yyyy-MM-dd")
      prenotazioniPerData[dateKey] = { count: 0 }
      currentDate = addDays(currentDate, 1)
    }

    // Filtra le prenotazioni per il periodo di soggiorno selezionato e stato confermato
    const prenotazioniFiltrate = prenotazioni.filter((p) => {
      if (!p.arrivo || !p.partenza || !p.data_prenotazione) return false

      // Considera tutte le prenotazioni, non solo quelle confermate per debug
      // if (p.stato_prenotazione !== "confermata") return false;

      try {
        const dataArrivo = parseISO(p.arrivo)
        const dataPartenza = parseISO(p.partenza)

        // Verifica se la prenotazione si sovrappone con il periodo di soggiorno selezionato
        const overlap =
          // La data di arrivo è all'interno del periodo selezionato
          isWithinInterval(dataArrivo, { start: dataInizioSoggiorno, end: dataFineSoggiorno }) ||
          // La data di partenza (meno un giorno) è all'interno del periodo selezionato
          isWithinInterval(addDays(dataPartenza, -1), { start: dataInizioSoggiorno, end: dataFineSoggiorno }) ||
          // Il periodo selezionato è completamente contenuto nel periodo della prenotazione
          (isBefore(dataArrivo, dataInizioSoggiorno) && isAfter(dataPartenza, dataFineSoggiorno))

        return overlap
      } catch (err) {
        console.error("Errore nel parsing delle date:", err)
        return false
      }
    })

    console.log("Prenotazioni filtrate per periodo di soggiorno:", prenotazioniFiltrate.length)

    // Log delle prime 5 prenotazioni filtrate per debug
    if (prenotazioniFiltrate.length > 0) {
      console.log(
        "Esempi di prenotazioni filtrate:",
        prenotazioniFiltrate.slice(0, 5).map((p) => ({
          id: p.id,
          arrivo: p.arrivo,
          partenza: p.partenza,
          data_prenotazione: p.data_prenotazione,
          stato: p.stato_prenotazione,
        })),
      )
    }

    // Conta le prenotazioni per ogni data di prenotazione
    prenotazioniFiltrate.forEach((p) => {
      if (!p.data_prenotazione) return

      try {
        const dataPrenotazione = parseISO(p.data_prenotazione)

        // Se la data di prenotazione è nel periodo selezionato
        if (isWithinInterval(dataPrenotazione, { start: dataInizio, end: dataFine })) {
          const dateKey = format(dataPrenotazione, "yyyy-MM-dd")
          if (prenotazioniPerData[dateKey]) {
            prenotazioniPerData[dateKey].count += 1
          }
        }
      } catch (err) {
        console.error("Errore nel parsing della data di prenotazione:", err)
      }
    })

    // Converti in array per il grafico
    let risultato = Object.entries(prenotazioniPerData)
      .map(([data, { count }]) => {
        const dataObj = parseISO(data)
        return {
          data: format(dataObj, "dd/MM"),
          count,
          giorno: format(dataObj, "EEEE", { locale: it }),
          dataCompleta: data,
        }
      })
      .sort((a, b) => parseISO(a.dataCompleta).getTime() - parseISO(b.dataCompleta).getTime())

    // Se richiesto, calcola i valori cumulativi
    if (mostraCumulativo) {
      let cumulativoCount = 0

      risultato = risultato.map((item) => {
        cumulativoCount += item.count

        return {
          ...item,
          count: cumulativoCount,
        }
      })
    }

    // Verifica se ci sono dati non-zero nel risultato
    const hasDati = risultato.some((item) => item.count > 0)
    console.log("Risultato ha dati:", hasDati)
    console.log("Primi 5 elementi del risultato:", risultato.slice(0, 5))

    return risultato
  }

  // Formatta la data dello snapshot
  const formatSnapshotDate = (date: Date) => {
    return format(date, "dd MMMM yyyy", { locale: it })
  }

  // Aggiungi questa funzione dopo le altre funzioni
  const handleApplicaFiltri = () => {
    // Applica tutti i filtri temporanei agli stati reali
    setPeriodoAndamento(tempPeriodoAndamento)
    setMostraSDLY(tempMostraSDLY)
    setMostraCumulativo(tempMostraCumulativo)
    setTipoCamera(tempTipoCamera)
    setPeriodoSoggiornoInizio(tempPeriodoSoggiornoInizio)
    setPeriodoSoggiornoFine(tempPeriodoSoggiornoFine)

    // Incrementa il contatore per triggerare il caricamento
    setApplicaFiltri((prev) => prev + 1)
  }

  return (
    <div className="container py-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6">
        <h1 className="text-3xl font-bold text-primary">
          {loading ? "Caricamento..." : error ? "Errore" : `Andamento ${hotel?.nome || ""}`}
        </h1>

        <div className="mt-4 md:mt-0 flex items-center gap-4">
          <span className="text-sm font-medium text-muted-foreground">
            Anno Soggiorno: <span className="text-primary font-bold">{annoRiferimento}</span>
          </span>
          <div className="flex items-center">
            <span className="mr-2 text-sm font-medium">Snapshot Date:</span>
            <CompactDatePicker
              date={snapshotDate}
              setDate={(date) => setSnapshotDate(date || new Date())}
              className="w-[200px]"
            />
          </div>
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center items-center h-64">
          <Loader2 className="h-8 w-8 animate-spin" />
        </div>
      ) : error ? (
        <div className="text-red-500 text-center">{error}</div>
      ) : (
        <div className="space-y-8">
          {/* Sezione Box Preno */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card className="border-2 border-secondary-300 rounded-lg shadow-md hover:shadow-lg transition-shadow">
              <CardHeader className="border-b border-secondary-100 pb-3">
                <CardTitle className="text-primary font-bold">Prenotazioni Oggi</CardTitle>
                {calcolaVariazione(prenotazioniOggi, prenotazioniOggiAnnoScorso) >= 0 ? (
                  <TrendingUp className="h-4 w-4 text-green-500" />
                ) : (
                  <TrendingDown className="h-4 w-4 text-red-500" />
                )}
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{prenotazioniOggi}</div>
                <p
                  className={`text-xs ${calcolaVariazione(prenotazioniOggi, prenotazioniOggiAnnoScorso) >= 0 ? "text-green-500" : "text-red-500"}`}
                >
                  {calcolaVariazione(prenotazioniOggi, prenotazioniOggiAnnoScorso) >= 0 ? "+" : ""}
                  {calcolaVariazione(prenotazioniOggi, prenotazioniOggiAnnoScorso).toFixed(1)}% rispetto all'anno scorso
                </p>
              </CardContent>
            </Card>

            <Card className="border-2 border-secondary-300 rounded-lg shadow-md hover:shadow-lg transition-shadow">
              <CardHeader className="border-b border-secondary-100 pb-3">
                <CardTitle className="text-primary font-bold">Prenotazioni Ieri</CardTitle>
                {calcolaVariazione(prenotazioniIeri, prenotazioniIeriAnnoScorso) >= 0 ? (
                  <TrendingUp className="h-4 w-4 text-green-500" />
                ) : (
                  <TrendingDown className="h-4 w-4 text-red-500" />
                )}
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{prenotazioniIeri}</div>
                <p
                  className={`text-xs ${calcolaVariazione(prenotazioniIeri, prenotazioniIeriAnnoScorso) >= 0 ? "text-green-500" : "text-red-500"}`}
                >
                  {calcolaVariazione(prenotazioniIeri, prenotazioniIeriAnnoScorso) >= 0 ? "+" : ""}
                  {calcolaVariazione(prenotazioniIeri, prenotazioniIeriAnnoScorso).toFixed(1)}% rispetto all'anno scorso
                </p>
              </CardContent>
            </Card>

            <Card className="border-2 border-secondary-300 rounded-lg shadow-md hover:shadow-lg transition-shadow">
              <CardHeader className="border-b border-secondary-100 pb-3">
                <CardTitle className="text-primary font-bold">Prenotazioni Stagionali</CardTitle>
                {calcolaVariazione(prenotazioniTotali, prenotazioniTotaliAnnoScorso) >= 0 ? (
                  <TrendingUp className="h-4 w-4 text-green-500" />
                ) : (
                  <TrendingDown className="h-4 w-4 text-red-500" />
                )}
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{prenotazioniTotali}</div>
                <p
                  className={`text-xs ${calcolaVariazione(prenotazioniTotali, prenotazioniTotaliAnnoScorso) >= 0 ? "text-green-500" : "text-red-500"}`}
                >
                  {calcolaVariazione(prenotazioniTotali, prenotazioniTotaliAnnoScorso) >= 0 ? "+" : ""}
                  {calcolaVariazione(prenotazioniTotali, prenotazioniTotaliAnnoScorso).toFixed(1)}% rispetto all'anno
                  scorso
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Sezione Box Grafico */}
          <Card className="border-2 border-secondary-300 rounded-lg shadow-md hover:shadow-lg transition-shadow">
            <CardHeader className="border-b border-secondary-100 pb-3 flex flex-row items-center justify-between">
              <div>
                <CardTitle className="text-primary font-bold">
                  Distribuzione notti soggiorno attuali VS Notti Finali Anno precedente
                </CardTitle>
                <CardDescription>Numero di camere occupate per ogni giorno</CardDescription>
              </div>
              <div className="flex flex-col sm:flex-row gap-4 items-end sm:items-center">
                <div className="flex items-center space-x-2">
                  <Switch
                    id="cancellazioni-switch"
                    checked={includiCancellazioni}
                    onCheckedChange={setIncludiCancellazioni}
                  />
                  <Label htmlFor="cancellazioni-switch" className="text-sm">
                    Includi Cancellazioni
                  </Label>
                </div>
                <Select value={visualizzazioneGrafico} onValueChange={setVisualizzazioneGrafico} className="w-40">
                  <SelectTrigger>
                    <SelectValue placeholder="Visualizzazione" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="giornaliera">Giornaliera</SelectItem>
                    <SelectItem value="settimanale">Settimanale</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardHeader>
            <CardContent className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart
                  data={
                    visualizzazioneGrafico === "settimanale"
                      ? raggruppaPerSettimana(distribuzioneNotti)
                      : distribuzioneNotti
                  }
                  margin={{ top: 10, right: 30, left: 0, bottom: 0 }}
                >
                  <defs>
                    <linearGradient id="colorNotti" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor={COLORE_ANNO_CORRENTE} stopOpacity={0.8} />
                      <stop offset="95%" stopColor={COLORE_ANNO_CORRENTE} stopOpacity={0.2} />
                    </linearGradient>
                    <linearGradient id="colorNottiPrec" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor={COLORE_ANNO_PRECEDENTE} stopOpacity={0.8} />
                      <stop offset="95%" stopColor={COLORE_ANNO_PRECEDENTE} stopOpacity={0.2} />
                    </linearGradient>
                    <linearGradient id="colorCancellazioni" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor={COLORE_CANCELLAZIONI} stopOpacity={0.8} />
                      <stop offset="95%" stopColor={COLORE_CANCELLAZIONI} stopOpacity={0.2} />
                    </linearGradient>
                  </defs>
                  <XAxis
                    dataKey="data"
                    tickFormatter={(tick) => tick}
                    interval={visualizzazioneGrafico === "settimanale" ? 0 : 12} // Mostra meno etichette sull'asse X
                    tick={{ fontSize: 10 }} // Etichette più piccole
                    angle={-45} // Ruota le etichette
                    textAnchor="end" // Allinea le etichette
                    height={50} // Aumenta lo spazio per le etichette
                  />
                  <YAxis
                    ticks={calcolaTicks(
                      Math.max(
                        ...distribuzioneNotti.map((item) =>
                          Math.max(
                            includiCancellazioni ? item.nottiTotali || 0 : item.notti || 0,
                            includiCancellazioni ? item.nottiAnnoPrecedenteTotali || 0 : item.nottiAnnoPrecedente || 0,
                          ),
                        ),
                        numeroCamere,
                      ),
                    )}
                    domain={[0, "dataMax + 10"]}
                  />
                  <CartesianGrid strokeDasharray="3 3" />
                  <Tooltip
                    formatter={(value, name) => [
                      value,
                      name === "notti"
                        ? "Camere Occupate"
                        : name === "capacità"
                          ? "Capacità Totale"
                          : name === "nottiCancellate"
                            ? "Camere Cancellate"
                            : name === "nottiAnnoPrecedenteCancellate"
                              ? "Camere Cancellate (Anno Prec.)"
                              : "Camere Occupate (Anno Prec.)",
                    ]}
                    labelFormatter={(label) => `Data: ${label}`}
                  />
                  <Legend />
                  <ReferenceLine
                    y={numeroCamere}
                    label={{
                      value: `Capacità Totale (${numeroCamere})`,
                      position: "insideTopRight",
                      fill: COLORE_CAPACITA_TOTALE,
                      fontSize: 12,
                    }}
                    stroke={COLORE_CAPACITA_TOTALE}
                    strokeDasharray="3 3"
                    strokeWidth={2}
                    name="capacità"
                  />
                  <Area
                    type="basis" // Curva più morbida
                    dataKey="notti"
                    name="Anno Corrente"
                    stroke={COLORE_ANNO_CORRENTE}
                    strokeWidth={2} // Aumentato lo spessore della linea
                    fillOpacity={1}
                    fill="url(#colorNotti)"
                  />
                  {includiCancellazioni && (
                    <Area
                      type="basis"
                      dataKey="nottiCancellate"
                      name="Cancellazioni"
                      stroke={COLORE_CANCELLAZIONI}
                      strokeWidth={2}
                      fillOpacity={0.5}
                      fill="url(#colorCancellazioni)"
                    />
                  )}
                  <Area
                    type="basis" // Curva più morbida
                    dataKey="nottiAnnoPrecedente"
                    name="Anno Precedente"
                    stroke={COLORE_ANNO_PRECEDENTE}
                    strokeWidth={2} // Aumentato lo spessore della linea
                    fillOpacity={0.5}
                    fill="url(#colorNottiPrec)"
                  />
                  {includiCancellazioni && (
                    <Area
                      type="basis"
                      dataKey="nottiAnnoPrecedenteCancellate"
                      name="Cancellazioni (Anno Prec.)"
                      stroke={COLORE_CANCELLAZIONI}
                      strokeWidth={1}
                      strokeDasharray="5 5"
                      fillOpacity={0.3}
                      fill="url(#colorCancellazioni)"
                    />
                  )}
                </AreaChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          {/* Sezione Controlli Comuni */}
          <Card className="border-2 border-secondary-300 rounded-lg shadow-md hover:shadow-lg transition-shadow mb-6">
            <CardHeader className="border-b border-secondary-100 pb-3">
              <CardTitle className="text-primary font-bold">Controlli Andamenti</CardTitle>
              <CardDescription>
                Configura i parametri di visualizzazione per tutti i grafici di andamento
              </CardDescription>
            </CardHeader>
            <CardContent className="pt-4">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-4">
                <div className="space-y-2">
                  <Label htmlFor="periodo-andamento">Periodo di Analisi</Label>
                  <Select value={tempPeriodoAndamento} onValueChange={setTempPeriodoAndamento}>
                    <SelectTrigger id="periodo-andamento">
                      <SelectValue placeholder="Periodo" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="7">Ultimi 7 giorni</SelectItem>
                      <SelectItem value="30">Ultimi 30 giorni</SelectItem>
                      <SelectItem value="90">Ultimi 90 giorni</SelectItem>
                      <SelectItem value="stagione">Da 1 ottobre</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="tipo-camera">Tipologia Camera</Label>
                  <Select value={tempTipoCamera} onValueChange={setTempTipoCamera}>
                    <SelectTrigger id="tipo-camera">
                      <SelectValue placeholder="Tipologia Camera" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="tutte">Tutte le tipologie</SelectItem>
                      {tipiCameraDisponibili.map((tipo) => (
                        <SelectItem key={tipo} value={tipo}>
                          {tipo}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>Periodo di Soggiorno</Label>
                  <div className="flex items-center gap-2">
                    <CompactDatePicker
                      date={tempPeriodoSoggiornoInizio}
                      setDate={(date) => setTempPeriodoSoggiornoInizio(date || new Date())}
                      className="w-[120px]"
                    />
                    <span>-</span>
                    <CompactDatePicker
                      date={tempPeriodoSoggiornoFine}
                      setDate={(date) => setTempPeriodoSoggiornoFine(date || new Date())}
                      className="w-[120px]"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>Opzioni di Visualizzazione</Label>
                  <div className="flex items-center gap-4">
                    <div className="flex items-center space-x-2">
                      <Switch
                        id="cumulativo-switch-comune"
                        checked={tempMostraCumulativo}
                        onCheckedChange={setTempMostraCumulativo}
                      />
                      <Label htmlFor="cumulativo-switch-comune" className="text-sm">
                        Cumulativo
                      </Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Switch id="sdly-switch-comune" checked={tempMostraSDLY} onCheckedChange={setTempMostraSDLY} />
                      <Label htmlFor="sdly-switch-comune" className="text-sm">
                        Mostra SDLY
                      </Label>
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex justify-end">
                <button
                  onClick={handleApplicaFiltri}
                  className="bg-primary text-white px-4 py-2 rounded-md hover:bg-primary/90 transition-colors"
                >
                  Applica Filtri
                </button>
              </div>
            </CardContent>
          </Card>

          {/* Sezione Andamento Prenotazioni */}
          <Card className="border-2 border-secondary-300 rounded-lg shadow-md hover:shadow-lg transition-shadow">
            <CardHeader className="border-b border-secondary-100 pb-3 flex flex-row items-center justify-between">
              <div>
                <CardTitle className="text-primary font-bold">Andamento Prenotazioni</CardTitle>
                <CardDescription>Numero di prenotazioni inserite giornalmente</CardDescription>
              </div>
              <div>{/* I controlli sono stati spostati nella sezione comune */}</div>
            </CardHeader>
            <CardContent className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={andamentoPrenotazioni} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                  <defs>
                    <linearGradient id="colorPrenotazioni" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor={COLORE_ANNO_CORRENTE} stopOpacity={0.8} />
                      <stop offset="95%" stopColor={COLORE_ANNO_CORRENTE} stopOpacity={0.2} />
                    </linearGradient>
                    <linearGradient id="colorPrenotazioniSDLY" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor={COLORE_ANNO_PRECEDENTE} stopOpacity={0.8} />
                      <stop offset="95%" stopColor={COLORE_ANNO_PRECEDENTE} stopOpacity={0.2} />
                    </linearGradient>
                  </defs>
                  <XAxis
                    dataKey="data"
                    tickFormatter={(tick) => tick}
                    interval={andamentoPrenotazioni.length > 30 ? Math.floor(andamentoPrenotazioni.length / 15) : 0}
                    tick={{ fontSize: 10 }}
                    angle={-45}
                    textAnchor="end"
                    height={50}
                  />
                  <YAxis
                    ticks={calcolaTicks(
                      Math.max(...andamentoPrenotazioni.map((item) => Math.max(item.count || 0, item.countSDLY || 0))),
                    )}
                    domain={[0, "dataMax + 10"]}
                  />
                  <CartesianGrid strokeDasharray="3 3" />
                  <Tooltip
                    formatter={(value, name) => [
                      value,
                      name === "count" ? "Prenotazioni" : "Prenotazioni (Anno Prec.)",
                    ]}
                    labelFormatter={(label) => `Data: ${label}`}
                  />
                  <Legend />
                  <Area
                    type="monotone"
                    dataKey="count"
                    name="Prenotazioni"
                    stroke={COLORE_ANNO_CORRENTE}
                    strokeWidth={2}
                    fillOpacity={1}
                    fill="url(#colorPrenotazioni)"
                  />
                  {mostraSDLY && (
                    <Area
                      type="monotone"
                      dataKey="countSDLY"
                      name="Prenotazioni (Anno Prec.)"
                      stroke={COLORE_ANNO_PRECEDENTE}
                      strokeWidth={2}
                      fillOpacity={0.5}
                      fill="url(#colorPrenotazioniSDLY)"
                    />
                  )}
                </AreaChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          {/* Sezione Andamento Tipologia Camera */}
          <Card className="border-2 border-secondary-300 rounded-lg shadow-md hover:shadow-lg transition-shadow">
            <CardHeader className="border-b border-secondary-100 pb-3 flex flex-row items-center justify-between">
              <div>
                <CardTitle className="text-primary font-bold">Andamento Tipologia Camera</CardTitle>
                <CardDescription>Numero di prenotazioni per tipologia di camera</CardDescription>
              </div>
              <div>{/* I controlli sono stati spostati nella sezione comune */}</div>
            </CardHeader>
            <CardContent className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={andamentoTipologiaCamera} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                  <defs>
                    <linearGradient id="colorPrenotazioniCamera" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor={COLORE_ANNO_CORRENTE} stopOpacity={0.8} />
                      <stop offset="95%" stopColor={COLORE_ANNO_CORRENTE} stopOpacity={0.2} />
                    </linearGradient>
                    <linearGradient id="colorPrenotazioniCameraSDLY" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor={COLORE_ANNO_PRECEDENTE} stopOpacity={0.8} />
                      <stop offset="95%" stopColor={COLORE_ANNO_PRECEDENTE} stopOpacity={0.2} />
                    </linearGradient>
                  </defs>
                  <XAxis
                    dataKey="data"
                    tickFormatter={(tick) => tick}
                    interval={
                      andamentoTipologiaCamera.length > 30 ? Math.floor(andamentoTipologiaCamera.length / 15) : 0
                    }
                    tick={{ fontSize: 10 }}
                    angle={-45}
                    textAnchor="end"
                    height={50}
                  />
                  <YAxis
                    ticks={calcolaTicks(
                      Math.max(
                        ...andamentoTipologiaCamera.map((item) => Math.max(item.count || 0, item.countSDLY || 0)),
                      ),
                    )}
                    domain={[0, "dataMax + 10"]}
                  />
                  <CartesianGrid strokeDasharray="3 3" />
                  <Tooltip
                    formatter={(value, name) => [
                      value,
                      name === "count"
                        ? `${mostraCumulativo ? "Prenotazioni Cumulative" : "Prenotazioni"}`
                        : `${mostraCumulativo ? "Prenotazioni Cumulative" : "Prenotazioni"} (Anno Prec.)`,
                    ]}
                    labelFormatter={(label) => `Data: ${label}`}
                  />
                  <Legend />
                  <Area
                    type="monotone"
                    dataKey="count"
                    name={`${mostraCumulativo ? "Prenotazioni Cumulative" : "Prenotazioni"} ${tipoCamera !== "tutte" ? tipoCamera : "Tutte"}`}
                    stroke={COLORE_ANNO_CORRENTE}
                    strokeWidth={2}
                    fillOpacity={1}
                    fill="url(#colorPrenotazioniCamera)"
                  />
                  {mostraSDLY && (
                    <Area
                      type="monotone"
                      dataKey="countSDLY"
                      name={`${mostraCumulativo ? "Prenotazioni Cumulative" : "Prenotazioni"} ${tipoCamera !== "tutte" ? tipoCamera : "Tutte"} (Anno Prec.)`}
                      stroke={COLORE_ANNO_PRECEDENTE}
                      strokeWidth={2}
                      fillOpacity={0.5}
                      fill="url(#colorPrenotazioniCameraSDLY)"
                    />
                  )}
                </AreaChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          {/* Sezione Andamento Periodo */}
          <Card className="border-2 border-secondary-300 rounded-lg shadow-md hover:shadow-lg transition-shadow">
            <CardHeader className="border-b border-secondary-100 pb-3 flex flex-row items-center justify-between">
              <div>
                <CardTitle className="text-primary font-bold">Andamento Periodo</CardTitle>
                <CardDescription>
                  Prenotazioni per il periodo di soggiorno {format(periodoSoggiornoInizio, "dd/MM/yyyy")} -{" "}
                  {format(periodoSoggiornoFine, "dd/MM/yyyy")}
                </CardDescription>
              </div>
              <div>{/* I controlli sono stati spostati nella sezione comune */}</div>
            </CardHeader>
            <CardContent className="h-80">
              {andamentoPeriodo.length > 0 && andamentoPeriodo.some((item) => item.count > 0) ? (
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={andamentoPeriodo} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                    <defs>
                      <linearGradient id="colorPrenotazioniPeriodo" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#8884d8" stopOpacity={0.8} />
                        <stop offset="95%" stopColor="#8884d8" stopOpacity={0.2} />
                      </linearGradient>
                    </defs>
                    <XAxis
                      dataKey="data"
                      tickFormatter={(tick) => tick}
                      interval={andamentoPeriodo.length > 30 ? Math.floor(andamentoPeriodo.length / 15) : 0}
                      tick={{ fontSize: 10 }}
                      angle={-45}
                      textAnchor="end"
                      height={50}
                    />
                    <YAxis
                      ticks={calcolaTicks(Math.max(...andamentoPeriodo.map((item) => item.count || 0)))}
                      domain={[0, "dataMax + 5"]}
                    />
                    <CartesianGrid strokeDasharray="3 3" />
                    <Tooltip
                      formatter={(value, name) => [
                        value,
                        `${mostraCumulativo ? "Prenotazioni Cumulative" : "Prenotazioni"}`,
                      ]}
                      labelFormatter={(label) => `Data: ${label}`}
                    />
                    <Legend />
                    <Area
                      type="monotone"
                      dataKey="count"
                      name={`${mostraCumulativo ? "Prenotazioni Cumulative" : "Prenotazioni"} per ${format(periodoSoggiornoInizio, "dd/MM")} - ${format(periodoSoggiornoFine, "dd/MM")}`}
                      stroke="#8884d8"
                      strokeWidth={2}
                      fillOpacity={1}
                      fill="url(#colorPrenotazioniPeriodo)"
                    />
                  </AreaChart>
                </ResponsiveContainer>
              ) : (
                <div className="flex flex-col items-center justify-center h-full">
                  <p className="text-lg text-gray-500 mb-4">Nessun dato disponibile per il periodo selezionato</p>
                  <p className="text-sm text-gray-400">
                    Dati totali: {andamentoPeriodo.length}, Prenotazioni filtrate:{" "}
                    {
                      prenotazioniArray.filter(
                        (p) =>
                          p.arrivo &&
                          p.partenza &&
                          isWithinInterval(parseISO(p.arrivo), {
                            start: periodoSoggiornoInizio,
                            end: periodoSoggiornoFine,
                          }),
                      ).length
                    }
                  </p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Sezione Box Torte */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card className="border-2 border-secondary-300 rounded-lg shadow-md hover:shadow-lg transition-shadow">
              <CardHeader className="border-b border-secondary-100 pb-3">
                <CardTitle className="text-primary font-bold">Distribuzione per Tipologia di Camera</CardTitle>
                <CardDescription>Percentuale di prenotazioni per tipo di camera</CardDescription>
              </CardHeader>
              <CardContent className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={distribuzionePerCamera}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="count"
                      nameKey="tipo"
                    >
                      {distribuzionePerCamera.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip formatter={(value) => [value, "Prenotazioni"]} />
                  </PieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card className="border-2 border-secondary-300 rounded-lg shadow-md hover:shadow-lg transition-shadow">
              <CardHeader className="border-b border-secondary-100 pb-3">
                <CardTitle className="text-primary font-bold">ADR Medio per Tipologia di Camera</CardTitle>
                <CardDescription>Average Daily Rate per tipo di camera</CardDescription>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Tipologia Camera</TableHead>
                      <TableHead className="text-right">ADR Medio</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {adrPerCamera.map((item, index) => (
                      <TableRow key={index}>
                        <TableCell>{item.tipo}</TableCell>
                        <TableCell className="text-right">{formatCurrency(item.adr_medio)}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </div>
        </div>
      )}
    </div>
  )
}
