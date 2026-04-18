"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { format, subDays, isSameDay, parseISO, isWithinInterval, addDays, isBefore, getDay, subYears } from "date-fns"
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
} from "recharts"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { CompactDatePicker } from "@/components/ui/compact-date-picker"

// ID dell'hotel SERE
const HOTEL_ID = "8e15c216-36d7-471f-b3fe-308cdcff26db"

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

export default function SerePage() {
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [hotel, setHotel] = useState<HotelType | null>(null)
  const [visualizzazioneGrafico, setVisualizzazioneGrafico] = useState("giornaliera")
  const [snapshotDate, setSnapshotDate] = useState<Date>(new Date())

  // Dati per le sezioni
  const [prenotazioniOggi, setPrenotazioniOggi] = useState(0)
  const [prenotazioniOggiAnnoScorso, setPrenotazioniOggiAnnoScorso] = useState(0)
  const [prenotazioniIeri, setPrenotazioniIeri] = useState(0)
  const [prenotazioniIeriAnnoScorso, setPrenotazioniIeriAnnoScorso] = useState(0)
  const [prenotazioniTotali, setPrenotazioniTotali] = useState(0)
  const [prenotazioniTotaliAnnoScorso, setPrenotazioniTotaliAnnoScorso] = useState(0)

  const [distribuzioneNotti, setDistribuzioneNotti] = useState<any[]>([])
  const [distribuzioneNottiAnnoPrec, setDistribuzioneNottiAnnoPrec] = useState<any[]>([])
  const [distribuzionePerCamera, setDistribuzionePerCamera] = useState<any[]>([])
  const [adrPerCamera, setAdrPerCamera] = useState<any[]>([])

  // Carica i dati
  useEffect(() => {
    async function fetchData() {
      setLoading(true)
      setError(null)

      try {
        // Carica i dettagli dell'hotel
        const { data: hotelData, error: hotelError } = await supabase
          .from("hotel")
          .select("id, nome")
          .eq("id", HOTEL_ID)
          .single()

        if (hotelError) throw hotelError
        setHotel(hotelData)

        // Date di riferimento basate sullo snapshot date
        const oggi = new Date(snapshotDate)
        const ieri = subDays(oggi, 1)
        const oggiAnnoScorso = subYears(oggi, 1)
        const ieriAnnoScorso = subYears(ieri, 1)

        // Carica tutte le prenotazioni per questo hotel
        const { data: prenotazioni, error: prenotazioniError } = await supabase
          .from("prenotazioni")
          .select(
            "id, arrivo, partenza, totale_soggiorno, stato_prenotazione, tipo_camera, notti, data_prenotazione, adr_soggiorno",
          )
          .eq("id_hotel", HOTEL_ID)

        if (prenotazioniError) throw prenotazioniError

        // Aggiungi controlli per la data di prenotazione
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

        // Prenotazioni totali anno corrente e anno scorso (relativi allo snapshot date)
        const annoCorrente = oggi.getFullYear()
        const annoScorso = annoCorrente - 1

        const prenotazioniTotaliCount = prenotazioniArray.filter((p) => {
          const dataPrenotazione = parseISO(p.data_prenotazione)
          return dataPrenotazione.getFullYear() === annoCorrente
        }).length

        const prenotazioniTotaliAnnoScorsoCount = prenotazioniArray.filter((p) => {
          const dataPrenotazione = parseISO(p.data_prenotazione)
          return dataPrenotazione.getFullYear() === annoScorso
        }).length

        setPrenotazioniOggi(prenotazioniOggiCount)
        setPrenotazioniOggiAnnoScorso(prenotazioniOggiAnnoScorsoCount)
        setPrenotazioniIeri(prenotazioniIeriCount)
        setPrenotazioniIeriAnnoScorso(prenotazioniIeriAnnoScorsoCount)
        setPrenotazioniTotali(prenotazioniTotaliCount)
        setPrenotazioniTotaliAnnoScorso(prenotazioniTotaliAnnoScorsoCount)

        // Distribuzione notti per data soggiorno (17 maggio - 12 settembre anno corrente)
        const inizioPeriodo = new Date(annoCorrente, 4, 17) // 17 maggio
        const finePeriodo = new Date(annoCorrente, 8, 12) // 12 settembre

        // Date corrispondenti per l'anno precedente
        const inizioPeriodoAnnoPrec = subYears(inizioPeriodo, 1)
        const finePeriodoAnnoPrec = subYears(finePeriodo, 1)

        // Crea un oggetto per tenere traccia delle notti per data
        const distribuzionePerData: Record<string, number> = {}
        const distribuzionePerDataAnnoPrec: Record<string, number> = {}

        // Inizializza tutte le date nel periodo per l'anno corrente
        const currentDate = new Date(inizioPeriodo)
        while (currentDate <= finePeriodo) {
          const dateKey = format(currentDate, "yyyy-MM-dd")
          distribuzionePerData[dateKey] = 0
          currentDate.setDate(currentDate.getDate() + 1)
        }

        // Inizializza tutte le date nel periodo per l'anno precedente
        const currentDateAnnoPrec = new Date(inizioPeriodoAnnoPrec)
        while (currentDateAnnoPrec <= finePeriodoAnnoPrec) {
          const dateKey = format(currentDateAnnoPrec, "yyyy-MM-dd")
          distribuzionePerDataAnnoPrec[dateKey] = 0
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

            // Per ogni giorno tra arrivo e partenza (escluso)
            let currentDay = new Date(dataArrivo)
            while (currentDay < dataPartenza) {
              // Se il giorno è nel periodo di interesse
              if (isWithinInterval(currentDay, { start: inizioPeriodo, end: finePeriodo })) {
                const dateKey = format(currentDay, "yyyy-MM-dd")
                distribuzionePerData[dateKey] = (distribuzionePerData[dateKey] || 0) + 1
              }
              currentDay = addDays(currentDay, 1)
            }
          } catch (err) {
            console.error("Errore nell'elaborazione delle date:", err)
          }
        })

        // Aggiungi controlli anche per l'anno precedente
        prenotazioniArray.forEach((p) => {
          if (!p.arrivo || !p.partenza) return

          try {
            const dataArrivo = parseISO(p.arrivo)
            const dataPartenza = parseISO(p.partenza)

            if (isNaN(dataArrivo.getTime()) || isNaN(dataPartenza.getTime())) {
              return
            }

            // Se la prenotazione è dell'anno precedente
            if (dataArrivo.getFullYear() === annoScorso) {
              // Per ogni giorno tra arrivo e partenza (escluso)
              let currentDay = new Date(dataArrivo)
              while (currentDay < dataPartenza) {
                // Se il giorno è nel periodo di interesse dell'anno precedente
                if (isWithinInterval(currentDay, { start: inizioPeriodoAnnoPrec, end: finePeriodoAnnoPrec })) {
                  const dateKey = format(currentDay, "yyyy-MM-dd")
                  distribuzionePerDataAnnoPrec[dateKey] = (distribuzionePerDataAnnoPrec[dateKey] || 0) + 1
                }
                currentDay = addDays(currentDay, 1)
              }
            }
          } catch (err) {
            console.error("Errore nell'elaborazione delle date per l'anno precedente:", err)
          }
        })

        // Converti in array per il grafico - anno corrente
        const distribuzioneArray = Object.entries(distribuzionePerData).map(([data, notti]) => {
          const dataObj = parseISO(data)
          return {
            data: format(dataObj, "dd/MM"),
            notti: notti,
            giorno: format(dataObj, "EEEE", { locale: it }),
            dataCompleta: data,
          }
        })

        // Converti in array per il grafico - anno precedente
        const distribuzioneArrayAnnoPrec = Object.entries(distribuzionePerDataAnnoPrec).map(([data, notti]) => {
          const dataObj = parseISO(data)
          return {
            data: format(dataObj, "dd/MM"),
            notti: notti,
            giorno: format(dataObj, "EEEE", { locale: it }),
            dataCompleta: data,
          }
        })

        // Allinea i dati dell'anno precedente per giorno della settimana
        const distribuzioneAllineata = distribuzioneArray.map((item) => {
          const dataCorrente = parseISO(item.dataCompleta)
          const giornoSettimana = getDay(dataCorrente)

          // Trova la data corrispondente dell'anno precedente con lo stesso giorno della settimana
          const dataAnnoPrec = subYears(dataCorrente, 1)

          // Cerca nei dati dell'anno precedente
          const itemAnnoPrec = distribuzioneArrayAnnoPrec.find((prevItem) => {
            const dataPrev = parseISO(prevItem.dataCompleta)
            return getDay(dataPrev) === giornoSettimana
          })

          return {
            ...item,
            nottiAnnoPrecedente: itemAnnoPrec ? itemAnnoPrec.notti : 0,
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

        // Calcola ADR medio per tipo camera
        const adrCameraArray = Object.entries(adrCamera).map(([tipo, { totale, count }]) => ({
          tipo,
          adr_medio: count > 0 ? totale / count : 0,
        }))

        setDistribuzionePerCamera(distribuzioneCameraArray)
        setAdrPerCamera(adrCameraArray)
      } catch (err: any) {
        console.error("Errore nel caricamento dei dati:", err)
        setError(err.message || "Errore nel caricamento dei dati")
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [snapshotDate])

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
          nottiAnnoPrecedente: 0,
        }
      }

      dattiRaggruppati[chiaveSettimana].notti += item.notti || 0
      if (item.nottiAnnoPrecedente) {
        dattiRaggruppati[chiaveSettimana].nottiAnnoPrecedente += item.nottiAnnoPrecedente
      }
    })

    return Object.values(dattiRaggruppati)
  }

  // Formatta la data dello snapshot
  const formatSnapshotDate = (date: Date) => {
    return format(date, "dd MMMM yyyy", { locale: it })
  }

  return (
    <div className="container py-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6">
        <h1 className="text-3xl font-bold text-primary">
          {loading ? "Caricamento..." : error ? "Errore" : `Andamento SERE - ${hotel?.nome || ""}`}
        </h1>

        <div className="mt-4 md:mt-0 flex items-center">
          <span className="mr-2 text-sm font-medium">Snapshot Date:</span>
          <CompactDatePicker
            date={snapshotDate}
            setDate={(date) => setSnapshotDate(date || new Date())}
            className="w-[200px]"
          />
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
                <CardTitle className="text-primary font-bold">Prenotazioni Totali</CardTitle>
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
            <CardHeader className="border-b border-secondary-100 pb-3">
              <div>
                <CardTitle className="text-primary font-bold">
                  Distribuzione Notti di Soggiorno (17 Maggio - 12 Settembre)
                </CardTitle>
                <CardDescription>Numero di camere occupate per ogni giorno</CardDescription>
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
                      <stop offset="5%" stopColor="#82ca9d" stopOpacity={0.8} />
                      <stop offset="95%" stopColor="#82ca9d" stopOpacity={0.2} />
                    </linearGradient>
                    <linearGradient id="colorNottiPrec" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#8884d8" stopOpacity={0.8} />
                      <stop offset="95%" stopColor="#8884d8" stopOpacity={0.2} />
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
                  <YAxis />
                  <CartesianGrid strokeDasharray="3 3" />
                  <Tooltip
                    formatter={(value, name) => [
                      value,
                      name === "notti" ? "Camere Occupate" : "Camere Occupate (Anno Prec.)",
                    ]}
                    labelFormatter={(label) => `Data: ${label}`}
                  />
                  <Legend />
                  <Area
                    type="basis" // Curva più morbida
                    dataKey="notti"
                    name="Anno Corrente"
                    stroke="#82ca9d"
                    strokeWidth={2} // Aumentato lo spessore della linea
                    fillOpacity={1}
                    fill="url(#colorNotti)"
                  />
                  <Area
                    type="basis" // Curva più morbida
                    dataKey="nottiAnnoPrecedente"
                    name="Anno Precedente"
                    stroke="#8884d8"
                    strokeWidth={2} // Aumentato lo spessore della linea
                    fillOpacity={0.5}
                    fill="url(#colorNottiPrec)"
                  />
                </AreaChart>
              </ResponsiveContainer>
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
