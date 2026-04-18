"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { SimpleDatePicker } from "@/components/ui/simple-date-picker"
import { Loader2, TrendingUp, Calendar, BarChart3, ArrowUpRight, ArrowDownRight } from "lucide-react"
import { format } from "date-fns"
import { supabase } from "@/lib/supabase/client"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from "recharts"

// Tipi di dati
interface HotelType {
  id: string
  nome: string
}

interface PreventivoType {
  id: string
  nome: string
  cognome: string
  email: string
  telefono: string
  nazione: string
  citta: string
  data_arrivo: string
  data_partenza: string
  adulti: number
  bambini: number
  eta_bambini: number[]
  note: string
  stato: string
  canale_acquisizione: string
  culle: number
  animali: number
  hotels_richiesti: string[]
  importo: number
  data_creazione: string
  id_hotel: string
  nome_hotel: string
  num_hotels_richiesti: number
}

// Colori per i grafici
const COLORS = ["#0088FE", "#00C49F", "#FFBB28", "#FF8042", "#8884d8", "#82ca9d", "#ffc658", "#8dd1e1"]

export default function DomandaPage() {
  // Stati per i filtri
  const [hotels, setHotels] = useState<HotelType[]>([])
  const [selectedHotels, setSelectedHotels] = useState<string[]>([])

  // Stati per le date di soggiorno
  const [soggiornoInizio, setSoggiornoInizio] = useState<Date>(() => {
    const currentYear = new Date().getFullYear()
    return new Date(currentYear, 4, 24) // 24 maggio anno corrente (mese è 0-based, quindi 4 = maggio)
  })
  const [soggiornoFine, setSoggiornoFine] = useState<Date>(() => {
    const currentYear = new Date().getFullYear()
    return new Date(currentYear, 8, 12) // 12 settembre anno corrente (mese è 0-based, quindi 8 = settembre)
  })

  const [snapshotDate, setSnapshotDate] = useState<Date>(new Date())
  const [confrontoAnnoPrec, setConfrontoAnnoPrec] = useState<boolean>(false)

  // Stati per le date di richiesta
  const [richiesteInizio, setRichiesteInizio] = useState<Date | undefined>(undefined)
  const [richiesteFine, setRichiesteFine] = useState<Date | undefined>(undefined)

  // Stati per i dati
  const [preventivi, setPreventivi] = useState<PreventivoType[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Stati per le statistiche
  const [statsGenerali, setStatsGenerali] = useState<{
    totale_preventivi: number
    media_giornaliera: number
    durata_media_soggiorno: number
    variazione_perc?: number
    trend?: "up" | "down" | "stable"
  }>({
    totale_preventivi: 0,
    media_giornaliera: 0,
    durata_media_soggiorno: 0,
  })

  // Stati per i grafici
  const [distribuzioneGiornaliera, setDistribuzioneGiornaliera] = useState<any[]>([])
  const [distribuzioneHotel, setDistribuzioneHotel] = useState<any[]>([])
  const [distribuzioneMultirichiesta, setDistribuzioneMultirichiesta] = useState<{
    dettaglio: any[]
    riepilogo: any[]
  }>({
    dettaglio: [],
    riepilogo: [],
  })

  // Carica gli hotel all'avvio
  useEffect(() => {
    async function fetchHotels() {
      try {
        const { data, error } = await supabase.from("hotel").select("id, nome").order("nome")

        if (error) throw error
        setHotels(data || [])
      } catch (err: any) {
        console.error("Errore nel caricamento degli hotel:", err)
        setError(err.message)
      }
    }

    fetchHotels()
    caricaPreventivi() // Carica i dati iniziali
  }, [])

  // Funzione per caricare i dati utilizzando la nuova RPC
  const caricaPreventivi = async () => {
    if (!soggiornoInizio || !soggiornoFine || !snapshotDate) {
      setError("Seleziona tutte le date richieste")
      return
    }

    setLoading(true)
    setError(null)

    try {
      // Prepara i parametri per la chiamata RPC
      const params = {
        p_data_inizio: format(soggiornoInizio, "yyyy-MM-dd"),
        p_data_fine: format(soggiornoFine, "yyyy-MM-dd"),
        p_snapshot_date: format(snapshotDate, "yyyy-MM-dd"),
        p_hotel_id: selectedHotels.length === 1 ? selectedHotels[0] : null,
        p_confronto_anno_prec: confrontoAnnoPrec,
      }

      // Chiama la funzione RPC
      const { data, error } = await supabase.rpc("get_domanda_stats", params)

      if (error) throw error

      if (!data) {
        setError("Nessun dato ricevuto dal server")
        return
      }

      console.log("Dati ricevuti:", data)

      // Estrai i dati dalla risposta
      const {
        stats_generali,
        stats_anno_prec,
        distribuzione_giornaliera,
        distribuzione_hotel,
        distribuzione_multirichiesta,
        riepilogo_multirichiesta,
      } = data

      // Aggiorna le statistiche generali
      if (stats_generali) {
        const statsGen = {
          totale_preventivi: stats_generali.totale_preventivi || 0,
          media_giornaliera: stats_generali.media_giornaliera || 0,
          durata_media_soggiorno: stats_generali.durata_media_soggiorno || 0,
        }

        // Aggiungi la variazione percentuale se richiesto il confronto con l'anno precedente
        if (confrontoAnnoPrec && stats_anno_prec && stats_anno_prec.totale_preventivi_anno_prec > 0) {
          const variazione =
            ((statsGen.totale_preventivi - stats_anno_prec.totale_preventivi_anno_prec) /
              stats_anno_prec.totale_preventivi_anno_prec) *
            100

          statsGen.variazione_perc = variazione
          statsGen.trend = variazione > 0 ? "up" : variazione < 0 ? "down" : "stable"
        }

        setStatsGenerali(statsGen)
      }

      // Prepara i dati per la distribuzione giornaliera
      if (Array.isArray(distribuzione_giornaliera)) {
        // Raggruppa i dati per data
        const dataMap = new Map()

        distribuzione_giornaliera.forEach((item) => {
          const dateKey = item.data
          const formattedDate = format(new Date(dateKey), "dd/MM")

          if (!dataMap.has(dateKey)) {
            dataMap.set(dateKey, {
              data: formattedDate,
              date: dateKey,
              totale: 0,
            })
          }

          // Aggiungi il conteggio per questo hotel
          dataMap.get(dateKey)[item.id_hotel] = item.conteggio

          // Aggiorna il totale
          dataMap.get(dateKey).totale += item.conteggio
        })

        // Converti la mappa in array e ordina per data
        const distribuzioneArray = Array.from(dataMap.values()).sort((a, b) => a.date.localeCompare(b.date))

        setDistribuzioneGiornaliera(distribuzioneArray)
      }

      // Aggiorna la distribuzione per hotel
      if (Array.isArray(distribuzione_hotel)) {
        setDistribuzioneHotel(distribuzione_hotel)
      }

      // Aggiorna la distribuzione multirichiesta
      if (Array.isArray(distribuzione_multirichiesta) && Array.isArray(riepilogo_multirichiesta)) {
        setDistribuzioneMultirichiesta({
          dettaglio: distribuzione_multirichiesta,
          riepilogo: riepilogo_multirichiesta,
        })
      }

      // Carica i preventivi per la tabella dettagliata
      let query = supabase
        .from("preventivi_ricevuti")
        .select("*, nome_hotel:hotel(nome)")
        .lte("data_creazione", format(snapshotDate, "yyyy-MM-dd"))

      // Applica il filtro per il periodo di soggiorno
      query = query
        .filter("data_arrivo", "lte", format(soggiornoFine, "yyyy-MM-dd"))
        .filter("data_partenza", "gte", format(soggiornoInizio, "yyyy-MM-dd"))

      // Applica il filtro per hotel se sono selezionati
      if (selectedHotels.length > 0) {
        query = query.in("id_hotel", selectedHotels)
      }

      // Applica i filtri per le date di richiesta, se specificate
      if (richiesteInizio) {
        // Cerca preventivi creati o modificati dopo la data di inizio richieste
        query = query.or(
          `data_ultima_modifica.gte.${format(richiesteInizio, "yyyy-MM-dd")},data_ultima_modifica.is.null,data_creazione.gte.${format(richiesteInizio, "yyyy-MM-dd")}`,
        )
      }

      if (richiesteFine) {
        // Cerca preventivi creati o modificati prima della data di fine richieste
        query = query.or(
          `data_ultima_modifica.lte.${format(richiesteFine, "yyyy-MM-dd")},data_ultima_modifica.is.null,data_creazione.lte.${format(richiesteFine, "yyyy-MM-dd")}`,
        )
      }

      const { data: preventiviData, error: preventiviError } = await query
        .order("data_creazione", { ascending: false })
        .limit(100) // Limita a 100 record per migliorare le prestazioni

      if (preventiviError) throw preventiviError

      setPreventivi(preventiviData || [])

      if ((preventiviData || []).length === 0) {
        setError("Nessun preventivo trovato per i criteri selezionati")
      }
    } catch (err: any) {
      console.error("Errore nel caricamento dei dati:", err)
      // Aggiungi un messaggio più specifico per l'errore di tipo UUID
      if (err.message && err.message.includes("uuid")) {
        setError("Errore nel formato dell'ID hotel. Riprova con un altro hotel o contatta l'amministratore.")
      } else {
        setError(err.message)
      }
    } finally {
      setLoading(false)
    }
  }

  // Formatta la data
  const formatDate = (dateString: string | null) => {
    if (!dateString) return "-"
    try {
      return format(new Date(dateString), "dd/MM/yyyy")
    } catch (e) {
      return dateString
    }
  }

  return (
    <div className="container py-6">
      <h1 className="text-3xl font-bold tracking-tight mb-6">Analisi Domanda</h1>

      {/* Box Filtri */}
      <Card className="mb-6 border-2 border-secondary-300 rounded-lg shadow-md hover:shadow-lg transition-shadow">
        <CardHeader className="border-b border-secondary-100 pb-3">
          <CardTitle className="text-primary font-bold">Filtri</CardTitle>
          <CardDescription>Seleziona i parametri per filtrare i dati</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
            <div>
              <label htmlFor="hotel-select" className="block text-sm font-medium mb-2">
                Hotel
              </label>
              <div>
                <label className="block text-sm font-medium mb-2">Hotel (seleziona multipli)</label>
                <div className="border rounded-md p-2 max-h-40 overflow-y-auto">
                  {hotels.map((hotel) => (
                    <div key={hotel.id} className="flex items-center space-x-2 mb-2">
                      <input
                        type="checkbox"
                        id={`hotel-${hotel.id}`}
                        checked={selectedHotels.includes(hotel.id)}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setSelectedHotels([...selectedHotels, hotel.id])
                          } else {
                            setSelectedHotels(selectedHotels.filter((id) => id !== hotel.id))
                          }
                        }}
                        className="rounded border-gray-300 text-primary focus:ring-primary"
                      />
                      <label htmlFor={`hotel-${hotel.id}`} className="text-sm">
                        {hotel.nome}
                      </label>
                    </div>
                  ))}
                  {hotels.length > 0 && (
                    <div className="mt-2 pt-2 border-t flex justify-between">
                      <button
                        type="button"
                        onClick={() => setSelectedHotels(hotels.map((h) => h.id))}
                        className="text-xs text-blue-600 hover:underline"
                      >
                        Seleziona tutti
                      </button>
                      <button
                        type="button"
                        onClick={() => setSelectedHotels([])}
                        className="text-xs text-blue-600 hover:underline"
                      >
                        Deseleziona tutti
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">Soggiorno dal</label>
              <SimpleDatePicker date={soggiornoInizio} setDate={setSoggiornoInizio} />
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">Soggiorno al</label>
              <SimpleDatePicker date={soggiornoFine} setDate={setSoggiornoFine} />
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">Snapshot Date</label>
              <SimpleDatePicker date={snapshotDate} setDate={setSnapshotDate} />
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">Richieste dal</label>
              <SimpleDatePicker
                date={richiesteInizio}
                setDate={setRichiesteInizio}
                placeholder="Seleziona data inizio"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">Richieste al</label>
              <SimpleDatePicker date={richiesteFine} setDate={setRichiesteFine} placeholder="Seleziona data fine" />
            </div>

            <div className="flex items-center space-x-2">
              <input
                type="checkbox"
                id="confronto-anno-prec"
                checked={confrontoAnnoPrec}
                onChange={(e) => setConfrontoAnnoPrec(e.target.checked)}
                className="rounded border-gray-300 text-primary focus:ring-primary"
              />
              <label htmlFor="confronto-anno-prec" className="text-sm font-medium">
                Confronta con anno precedente
              </label>
            </div>
          </div>

          <div className="flex justify-end">
            <Button onClick={caricaPreventivi} disabled={loading}>
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Caricamento...
                </>
              ) : (
                "Cerca"
              )}
            </Button>
          </div>
        </CardContent>
      </Card>

      {error && <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-6">{error}</div>}

      {/* Dashboard KPI */}
      {!loading && !error && statsGenerali.totale_preventivi > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <Card className="border-2 border-secondary-300 rounded-lg shadow-md hover:shadow-lg transition-shadow">
            <CardHeader className="border-b border-secondary-100 pb-3">
              <CardTitle className="text-primary font-bold">Totale Preventivi</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{statsGenerali.totale_preventivi}</div>
              {confrontoAnnoPrec && statsGenerali.variazione_perc !== undefined && (
                <p
                  className={`text-xs ${statsGenerali.trend === "up" ? "text-green-600" : statsGenerali.trend === "down" ? "text-red-600" : "text-gray-500"}`}
                >
                  {statsGenerali.trend === "up" ? (
                    <ArrowUpRight className="inline h-3 w-3 mr-1" />
                  ) : statsGenerali.trend === "down" ? (
                    <ArrowDownRight className="inline h-3 w-3 mr-1" />
                  ) : null}
                  {statsGenerali.variazione_perc.toFixed(1)}% rispetto all'anno precedente
                </p>
              )}
            </CardContent>
          </Card>

          <Card className="border-2 border-secondary-300 rounded-lg shadow-md hover:shadow-lg transition-shadow">
            <CardHeader className="border-b border-secondary-100 pb-3">
              <CardTitle className="text-primary font-bold">Media Giornaliera</CardTitle>
              <BarChart3 className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{statsGenerali.media_giornaliera.toFixed(1)}</div>
              <p className="text-xs text-muted-foreground">Preventivi al giorno</p>
            </CardContent>
          </Card>

          <Card className="border-2 border-secondary-300 rounded-lg shadow-md hover:shadow-lg transition-shadow">
            <CardHeader className="border-b border-secondary-100 pb-3">
              <CardTitle className="text-primary font-bold">Periodo Medio</CardTitle>
              <Calendar className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{Math.round(statsGenerali.durata_media_soggiorno)} giorni</div>
              <p className="text-xs text-muted-foreground">Durata media soggiorno</p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Tabs per i grafici */}
      {!loading && !error && statsGenerali.totale_preventivi > 0 && (
        <Tabs defaultValue="distribuzione" className="mb-6">
          <TabsList className="grid grid-cols-3 mb-4">
            <TabsTrigger value="distribuzione">Distribuzione Giornaliera</TabsTrigger>
            <TabsTrigger value="hotel">Distribuzione Hotel</TabsTrigger>
            <TabsTrigger value="multirichiesta">Multirichiesta</TabsTrigger>
          </TabsList>

          {/* Tab Distribuzione Giornaliera */}
          <TabsContent value="distribuzione">
            <Card className="border-2 border-secondary-300 rounded-lg shadow-md hover:shadow-lg transition-shadow">
              <CardHeader className="border-b border-secondary-100 pb-3">
                <CardTitle className="text-primary font-bold">Distribuzione Giornaliera</CardTitle>
                <CardDescription>Numero di preventivi per data di arrivo</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-6">
                  {/* Grafico per il totale */}
                  <div className="h-64">
                    <h3 className="text-lg font-medium mb-2">Totale preventivi</h3>
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={distribuzioneGiornaliera}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="data" />
                        <YAxis />
                        <Tooltip />
                        <Legend />
                        <Line
                          type="monotone"
                          dataKey="totale"
                          name="Totale"
                          stroke="#000000"
                          strokeWidth={2}
                          dot={{ r: 3 }}
                        />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>

                  {/* Grafico per i singoli hotel */}
                  <div className="h-64">
                    <h3 className="text-lg font-medium mb-2">Dettaglio per hotel</h3>
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={distribuzioneGiornaliera}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="data" />
                        <YAxis />
                        <Tooltip />
                        <Legend />
                        {selectedHotels.map((hotelId, index) => {
                          const hotel = hotels.find((h) => h.id === hotelId)
                          return (
                            <Line
                              key={hotelId}
                              type="monotone"
                              dataKey={hotelId}
                              name={hotel?.nome || `Hotel ${index + 1}`}
                              stroke={COLORS[index % COLORS.length]}
                              activeDot={{ r: 8 }}
                            />
                          )
                        })}
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Tab Distribuzione Hotel */}
          <TabsContent value="hotel">
            <Card className="border-2 border-secondary-300 rounded-lg shadow-md hover:shadow-lg transition-shadow">
              <CardHeader className="border-b border-secondary-100 pb-3">
                <CardTitle className="text-primary font-bold">Distribuzione per Hotel</CardTitle>
                <CardDescription>Numero di preventivi ricevuti per hotel</CardDescription>
              </CardHeader>
              <CardContent className="h-96">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={distribuzioneHotel}
                    layout="vertical"
                    margin={{ top: 5, right: 30, left: 100, bottom: 5 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis type="number" />
                    <YAxis type="category" dataKey="nome_hotel" width={100} tick={{ fontSize: 12 }} />
                    <Tooltip formatter={(value) => [`${value} preventivi`, "Quantità"]} />
                    <Legend />
                    <Bar dataKey="conteggio" name="Preventivi" fill="#8884d8" />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Tab Multirichiesta */}
          <TabsContent value="multirichiesta">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Grafico a torta per multirichiesta */}
              <Card className="border-2 border-secondary-300 rounded-lg shadow-md hover:shadow-lg transition-shadow">
                <CardHeader className="border-b border-secondary-100 pb-3">
                  <CardTitle className="text-primary font-bold">Distribuzione Multirichiesta</CardTitle>
                  <CardDescription>Percentuale di preventivi per numero di hotel richiesti</CardDescription>
                </CardHeader>
                <CardContent className="h-80">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={distribuzioneMultirichiesta.riepilogo}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        label={({ name, percentuale }) => `${name}: ${percentuale}%`}
                        outerRadius={80}
                        fill="#8884d8"
                        dataKey="conteggio"
                        nameKey="categoria"
                      >
                        {distribuzioneMultirichiesta.riepilogo.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip formatter={(value) => [`${value} preventivi`, "Quantità"]} />
                      <Legend />
                    </PieChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>

              {/* Tabella dettaglio multirichiesta */}
              <Card className="border-2 border-secondary-300 rounded-lg shadow-md hover:shadow-lg transition-shadow">
                <CardHeader className="border-b border-secondary-100 pb-3">
                  <CardTitle className="text-primary font-bold">Dettaglio Multirichiesta</CardTitle>
                  <CardDescription>Numero di preventivi per numero di hotel richiesti</CardDescription>
                </CardHeader>
                <CardContent>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Numero di Hotel</TableHead>
                        <TableHead className="text-right">Preventivi</TableHead>
                        <TableHead className="text-right">Percentuale</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {distribuzioneMultirichiesta.dettaglio.map((item, index) => (
                        <TableRow key={index}>
                          <TableCell>{item.num_hotels === 0 ? "Non specificato" : item.num_hotels}</TableCell>
                          <TableCell className="text-right">{item.conteggio}</TableCell>
                          <TableCell className="text-right">{item.percentuale}%</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      )}
    </div>
  )
}
