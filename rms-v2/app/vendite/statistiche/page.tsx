"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Loader2, BarChart3, Hotel, Calendar, LineChart, TrendingUp, Users } from "lucide-react"
import { format, subMonths, subWeeks, subDays } from "date-fns"
import { supabase } from "@/lib/supabase/client"
import Link from "next/link"
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts"
// Aggiungi l'import per il Select
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { DatePicker } from "@/components/ui/date-picker"
// Aggiungi l'import per lo Switch e Label se non sono già presenti
import { Switch } from "@/components/ui/switch"
import { Label } from "@/components/ui/label"
import CountUp from "react-countup"

// Tipi di dati
interface StatisticheGenerali {
  totalePrenotazioni: number
  prenotazioniAttive: number
  prenotazioniCancellate: number
  fatturato: number
  nottiTotali: number
  adr: number
  tassoOccupazione: number
}

interface HotelType {
  id: string
  nome: string
  numero_camere: number
}

interface HotelOccupancy {
  [key: string]: {
    occupationRate: number
    nightsBooked: number
    availableNights: number
  }
}

interface StagioneType {
  hotel_id: string
  apertura: string
  chiusura: string
  giorni_di_attività: number
}

export default function StatistichePage() {
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [statistiche, setStatistiche] = useState<StatisticheGenerali>({
    totalePrenotazioni: 0,
    prenotazioniAttive: 0,
    prenotazioniCancellate: 0,
    fatturato: 0,
    nottiTotali: 0,
    adr: 0,
    tassoOccupazione: 0,
  })
  const [hotels, setHotels] = useState<HotelType[]>([])
  const [andamentoPrenotazioni, setAndamentoPrenotazioni] = useState<any[]>([])
  const [andamentoDisdette, setAndamentoDisdette] = useState<any[]>([])
  // Aggiungi un nuovo stato per il periodo selezionato dopo la dichiarazione degli altri stati
  const [periodoSelezionato, setPeriodoSelezionato] = useState<"ieri" | "settimana" | "mese" | "personalizzato">("mese")
  const [dataInizio, setDataInizio] = useState<Date>(subMonths(new Date(), 1))
  const [dataFine, setDataFine] = useState<Date>(new Date())
  // Aggiungi lo stato per il filtro stagionale dopo gli altri stati
  const [filtraStagione, setFiltraStagione] = useState<boolean>(false)
  const [hotelOccupancy, setHotelOccupancy] = useState<HotelOccupancy>({})

  // Funzione aggiornata per caricare i dati di occupazione degli hotel basata su stagioni
  async function fetchHotelOccupancy() {
    try {
      if (!supabase) {
        console.error("Client Supabase non disponibile per il caricamento dei dati di occupazione")
        return {}
      }

      const now = new Date()
      const currentMonth = now.getMonth() + 1 // getMonth() restituisce 0-11, quindi aggiungiamo 1
      const currentYear = now.getFullYear()

      // Se siamo tra ottobre (10) e dicembre (12), mostra l'anno successivo
      // Altrimenti mostra l'anno corrente
      const stagioneAnno = currentMonth >= 10 ? currentYear + 1 : currentYear

      // Carica gli hotel
      const { data: hotelData, error: hotelError } = await supabase
        .from("hotel")
        .select("id, nome, numero_camere")
        .order("nome")

      if (hotelError) throw hotelError

      // Carica le stagioni per l'anno calcolato
      const { data: stagioniData, error: stagioniError } = await supabase
        .from("stagioni")
        .select("hotel_id, apertura, chiusura, giorni_di_attività")
        .eq("anno", stagioneAnno)

      if (stagioniError) throw stagioniError

      // Log di debug per le stagioni
      console.log(`Mese corrente: ${currentMonth}`)
      console.log(`Anno stagione visualizzato: ${stagioneAnno}`)
      console.log(`Stagioni trovate:`, stagioniData?.length)
      console.log(`Stagioni per anno ${stagioneAnno}:`, stagioniData)

      // Crea una mappa delle stagioni per hotel_id
      const stagioniMap: Record<string, StagioneType> = {}
      stagioniData?.forEach((stagione) => {
        stagioniMap[stagione.hotel_id] = stagione
      })

      // Calcola il tasso di occupazione per ogni hotel
      const hotelOccupancyData: HotelOccupancy = {}

      for (const hotel of hotelData || []) {
        const stagione = stagioniMap[hotel.id]

        if (!stagione) {
          // Hotel senza stagione (dovrebbe essere solo "Tutti")
          hotelOccupancyData[hotel.id] = {
            occupationRate: 0,
            nightsBooked: 0,
            availableNights: 0,
          }
          continue
        }

        // Log di debug per le prenotazioni
        console.log(`Query prenotazioni per hotel ${hotel.nome}:`)
        console.log(`- Hotel ID: ${hotel.id}`)
        console.log(`- Stagione apertura: ${stagione.apertura}`)
        console.log(`- Stagione chiusura: ${stagione.chiusura}`)
        console.log(`- Stati cercati: ["1", "3", "6", "7", "Confermato", "Confermata"]`)

        // Query per le prenotazioni confermate nel periodo stagionale
        const { data: prenotazioni, error: prenotazioniError } = await supabase
          .from("prenotazioni")
          .select("arrivo, partenza, notti, stato_prenotazione")
          .eq("id_hotel", hotel.id)
          .in("stato_prenotazione", ["1", "3", "6", "7", "Confermato", "Confermata"])
          .lte("arrivo", stagione.chiusura) // Prenotazioni che iniziano prima o alla fine della stagione
          .gte("partenza", stagione.apertura) // Prenotazioni che finiscono dopo o all'inizio della stagione

        console.log(`- Prenotazioni trovate: ${prenotazioni?.length}`)
        if (prenotazioni && prenotazioni.length > 0) {
          console.log(`- Prime 3 prenotazioni:`, prenotazioni.slice(0, 3))
          console.log(`- Stati trovati:`, [...new Set(prenotazioni.map((p) => p.stato_prenotazione))])
        }

        if (prenotazioniError) {
          console.error(`Errore nel recupero prenotazioni per hotel ${hotel.nome}:`, prenotazioniError)
          continue
        }

        // Calcola le notti vendute nel periodo stagionale
        let nottiVendute = 0
        const aperturaDate = new Date(stagione.apertura)
        const chiusuraDate = new Date(stagione.chiusura)

        prenotazioni?.forEach((prenotazione) => {
          const arrivoDate = new Date(prenotazione.arrivo)
          const partenzaDate = new Date(prenotazione.partenza)

          // Verifica se c'è sovrapposizione con il periodo stagionale
          const hasSovrapposizione = arrivoDate <= chiusuraDate && partenzaDate >= aperturaDate

          if (hasSovrapposizione) {
            // Aggiungi tutte le notti della prenotazione
            nottiVendute += prenotazione.notti || 0
          }
        })

        // Calcola il vendibile totale
        const nottiDisponibili = stagione.giorni_di_attività
        const tassoOccupazione = nottiDisponibili > 0 ? (nottiVendute / nottiDisponibili) * 100 : 0

        // Log di debug aggiornato
        console.log(
          `Hotel: ${hotel.nome}, Camere: ${hotel.numero_camere}, Giorni attività: ${stagione.giorni_di_attività}, Stagione: ${stagione.apertura} - ${stagione.chiusura}, Prenotazioni trovate: ${prenotazioni?.length}, Notti disponibili: ${nottiDisponibili}, Notti vendute: ${nottiVendute}, Tasso: ${tassoOccupazione.toFixed(2)}%`,
        )

        hotelOccupancyData[hotel.id] = {
          occupationRate: tassoOccupazione,
          nightsBooked: nottiVendute,
          availableNights: nottiDisponibili,
        }
      }

      return hotelOccupancyData
    } catch (err) {
      console.error("Errore nel caricamento dei dati di occupazione:", err)
      return {}
    }
  }

  // Modifica la funzione fetchData per considerare il periodo selezionato
  async function fetchData() {
    try {
      setLoading(true)

      if (!supabase) {
        throw new Error(
          "Client Supabase non disponibile. Verifica che le variabili d'ambiente NEXT_PUBLIC_SUPABASE_URL e NEXT_PUBLIC_SUPABASE_ANON_KEY siano configurate correttamente.",
        )
      }

      // Carica gli hotel
      const { data: hotelData, error: hotelError } = await supabase
        .from("hotel")
        .select("id, nome, numero_camere")
        .order("nome")

      if (hotelError) throw hotelError
      setHotels(hotelData || [])

      // Calcola il periodo in base alla selezione
      // const dataFine = new Date()
      // let dataInizio: Date
      let giorniPeriodo: number

      switch (periodoSelezionato) {
        case "ieri":
          // dataInizio = subDays(dataFine, 1)
          giorniPeriodo = 1
          break
        case "settimana":
          // dataInizio = subWeeks(dataFine, 1)
          giorniPeriodo = 7
          break
        case "mese":
        default:
          // dataInizio = subMonths(dataFine, 1)
          giorniPeriodo = 30
          break
        case "personalizzato":
          giorniPeriodo = Math.ceil((dataFine.getTime() - dataInizio.getTime()) / (1000 * 3600 * 24))
          break
      }

      // Prima otteniamo il conteggio esatto delle prenotazioni
      let countQuery = supabase
        .from("prenotazioni")
        .select("id", { count: "exact" })
        .gte("data_prenotazione", format(dataInizio, "yyyy-MM-dd"))
        .lte("data_prenotazione", format(dataFine, "yyyy-MM-dd"))

      // Applica il filtro stagionale se attivo
      if (filtraStagione) {
        const currentYear = new Date().getFullYear()
        countQuery = countQuery.gte("arrivo", `${currentYear}-05-17`).lte("partenza", `${currentYear}-09-12`)
      }

      const { count, error: countError } = await countQuery

      if (countError) {
        console.error("Errore nel conteggio delle prenotazioni:", countError)
        setError(countError.message)
        setLoading(false)
        return
      }

      // Ora procediamo con la query per ottenere i dati delle prenotazioni
      let query = supabase
        .from("prenotazioni")
        .select("id, arrivo, partenza, totale_soggiorno, stato_prenotazione, notti, data_prenotazione, id_hotel")
        .gte("data_prenotazione", format(dataInizio, "yyyy-MM-dd"))
        .lte("data_prenotazione", format(dataFine, "yyyy-MM-dd"))

      // Applica il filtro stagionale se attivo
      if (filtraStagione) {
        const currentYear = new Date().getFullYear()
        query = query
          .gte("arrivo", `${currentYear}-05-17`) // Modifica l'anno in base all'anno corrente
          .lte("partenza", `${currentYear}-09-12`) // Modifica l'anno in base all'anno corrente
      }

      const { data: prenotazioni, error: prenotazioniError } = await query

      if (prenotazioniError) throw prenotazioniError

      // Calcola le statistiche generali
      const prenotazioniArray = prenotazioni || []
      const attive = prenotazioniArray.filter((p) => p.stato_prenotazione === "confermata").length
      const cancellate = prenotazioniArray.filter((p) => p.stato_prenotazione === "cancellata").length
      const fatturato = prenotazioniArray.reduce((sum, p) => sum + (p.totale_soggiorno || 0), 0)
      const nottiTotali = prenotazioniArray.reduce((sum, p) => sum + (p.notti || 0), 0)
      const adr = nottiTotali > 0 ? fatturato / nottiTotali : 0

      // Calcola il tasso di occupazione
      const camereTotali = hotelData?.reduce((sum, h) => sum + h.numero_camere, 0) || 0

      const nottiDisponibili = camereTotali * giorniPeriodo
      const tassoOccupazione = nottiDisponibili > 0 ? (nottiTotali / nottiDisponibili) * 100 : 0

      setStatistiche({
        totalePrenotazioni: count || 0,
        prenotazioniAttive: attive,
        prenotazioniCancellate: cancellate,
        fatturato,
        nottiTotali,
        adr,
        tassoOccupazione,
      })

      // Prepara i dati per il grafico di andamento
      const andamento: Record<string, { data: string; prenotazioni: number }> = {}

      // Inizializza tutti i giorni del periodo
      const currentDate = new Date(dataInizio)
      while (currentDate <= dataFine) {
        const dateKey = format(currentDate, "yyyy-MM-dd")
        andamento[dateKey] = {
          data: format(currentDate, "dd/MM"),
          prenotazioni: 0,
        }
        currentDate.setDate(currentDate.getDate() + 1)
      }

      // Conta le prenotazioni per giorno
      prenotazioniArray.forEach((p) => {
        if (!p.data_prenotazione) return

        const dataPrenotazione = p.data_prenotazione.split("T")[0]
        if (andamento[dataPrenotazione]) {
          andamento[dataPrenotazione].prenotazioni += 1
        }
      })

      // Converti in array per il grafico
      setAndamentoPrenotazioni(Object.values(andamento))

      // Prepara i dati per il grafico di andamento disdette
      const andamentoDisdette: Record<string, { data: string; disdette: number }> = {}

      // Inizializza tutti i giorni del periodo per le disdette
      const currentDateDisdette = new Date(dataInizio)
      while (currentDateDisdette <= dataFine) {
        const dateKey = format(currentDateDisdette, "yyyy-MM-dd")
        andamentoDisdette[dateKey] = {
          data: format(currentDateDisdette, "dd/MM"),
          disdette: 0,
        }
        currentDateDisdette.setDate(currentDateDisdette.getDate() + 1)
      }

      // Query per le disdette (stato_prenotazione = "8")
      let queryDisdette = supabase
        .from("prenotazioni")
        .select("data_prenotazione")
        .eq("stato_prenotazione", "8")
        .gte("data_prenotazione", format(dataInizio, "yyyy-MM-dd"))
        .lte("data_prenotazione", format(dataFine, "yyyy-MM-dd"))

      // Applica il filtro stagionale se attivo
      if (filtraStagione) {
        const currentYear = new Date().getFullYear()
        queryDisdette = queryDisdette.gte("arrivo", `${currentYear}-05-17`).lte("partenza", `${currentYear}-09-12`)
      }

      const { data: disdette, error: disdetteError } = await queryDisdette

      if (disdetteError) {
        console.error("Errore nel caricamento delle disdette:", disdetteError)
      } else {
        // Conta le disdette per giorno
        disdette?.forEach((d) => {
          if (!d.data_prenotazione) return

          const dataPrenotazione = d.data_prenotazione.split("T")[0]
          if (andamentoDisdette[dataPrenotazione]) {
            andamentoDisdette[dataPrenotazione].disdette += 1
          }
        })
      }

      // Converti in array per il grafico
      setAndamentoDisdette(Object.values(andamentoDisdette))
    } catch (err: any) {
      console.error("Errore nel caricamento dei dati:", err)
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  // Modifica l'useEffect per dipendere dal periodoSelezionato
  useEffect(() => {
    fetchData()
  }, [periodoSelezionato, dataInizio, dataFine, filtraStagione])

  // Aggiungi un useEffect separato per caricare i dati di occupazione degli hotel
  useEffect(() => {
    const loadHotelOccupancy = async () => {
      const occupancyData = await fetchHotelOccupancy()
      setHotelOccupancy(occupancyData)
    }

    loadHotelOccupancy()
  }, []) // Esegui solo all'avvio del componente

  // Formatta il numero come valuta
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("it-IT", { style: "currency", currency: "EUR" }).format(value)
  }

  // Formatta il numero con separatore di migliaia
  const formatNumber = (value: number) => {
    return new Intl.NumberFormat("it-IT").format(Math.round(value))
  }

  // Formatta le percentuali
  const formatPercent = (value: number) => {
    return `${value.toFixed(2)}%`
  }

  // Aggiungi il selettore di periodo dopo l'h1 nella sezione di return
  return (
    <div className="container py-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6">
        <h1 className="text-3xl font-bold text-primary">Dashboard Statistiche</h1>

        <div className="mt-4 md:mt-0 w-full md:w-auto flex flex-col md:flex-row gap-2">
          <Select
            value={periodoSelezionato}
            onValueChange={(value: "ieri" | "settimana" | "mese" | "personalizzato") => {
              setPeriodoSelezionato(value)

              // Imposta le date in base alla selezione
              if (value === "ieri") {
                const ieri = subDays(new Date(), 1)
                setDataInizio(ieri)
                setDataFine(ieri)
              } else if (value === "settimana") {
                setDataInizio(subWeeks(new Date(), 1))
                setDataFine(new Date())
              } else if (value === "mese") {
                setDataInizio(subMonths(new Date(), 1))
                setDataFine(new Date())
              }
              // Per "personalizzato" non modifichiamo le date, l'utente le selezionerà
            }}
          >
            <SelectTrigger className="w-full md:w-[180px] border-2">
              <SelectValue placeholder="Seleziona periodo" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ieri">Ieri</SelectItem>
              <SelectItem value="settimana">Ultima settimana</SelectItem>
              <SelectItem value="mese">Ultimo mese</SelectItem>
              <SelectItem value="personalizzato">Date personalizzate</SelectItem>
            </SelectContent>
          </Select>

          {periodoSelezionato === "personalizzato" && (
            <>
              <DatePicker
                date={dataInizio}
                setDate={setDataInizio}
                className="w-full md:w-auto"
                placeholder="Data inizio"
              />
              <DatePicker date={dataFine} setDate={setDataFine} className="w-full md:w-auto" placeholder="Data fine" />
            </>
          )}

          {/* Aggiungi qui lo switch per il filtro stagionale */}
          <div className="flex items-center space-x-2">
            <Switch id="filtro-stagione" checked={filtraStagione} onCheckedChange={setFiltraStagione} />
            <Label htmlFor="filtro-stagione" className="text-sm">
              Solo alta stagione (17/05-12/09)
            </Label>
          </div>
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center items-center h-64">
          <Loader2 className="h-8 w-8 animate-spin" />
        </div>
      ) : error ? (
        <div className="bg-red-100 border-2 border-red-400 text-red-700 px-4 py-3 rounded mb-6">{error}</div>
      ) : (
        <div className="space-y-6">
          {/* KPI Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <Card className="border-2 border-secondary-300 shadow-md hover:shadow-lg transition-shadow">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-primary">Prenotazioni</CardTitle>
                <Users className="h-4 w-4 text-accent-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{formatNumber(statistiche.totalePrenotazioni)}</div>
                <p className="text-xs text-accent-600">
                  {statistiche.prenotazioniAttive} attive, {statistiche.prenotazioniCancellate} cancellate
                </p>
              </CardContent>
            </Card>

            <Card className="border-2 border-secondary-300 shadow-md hover:shadow-lg transition-shadow">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-primary">Fatturato</CardTitle>
                <TrendingUp className="h-4 w-4 text-accent-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{formatCurrency(statistiche.fatturato)}</div>
                <p className="text-xs text-accent-600">
                  {periodoSelezionato === "ieri"
                    ? "Ieri"
                    : periodoSelezionato === "settimana"
                      ? "Ultima settimana"
                      : periodoSelezionato === "mese"
                        ? "Ultimo mese"
                        : "Periodo selezionato"}
                </p>
              </CardContent>
            </Card>

            <Card className="border-2 border-secondary-300 shadow-md hover:shadow-lg transition-shadow">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-primary">ADR</CardTitle>
                <BarChart3 className="h-4 w-4 text-accent-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{formatCurrency(statistiche.adr)}</div>
                <p className="text-xs text-accent-600">Tariffa media giornaliera</p>
              </CardContent>
            </Card>

            <Card className="border-2 border-secondary-300 shadow-md hover:shadow-lg transition-shadow">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-primary">Tasso Occupazione</CardTitle>
                <Hotel className="h-4 w-4 text-accent-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{formatPercent(statistiche.tassoOccupazione)}</div>
                <p className="text-xs text-accent-600">
                  {periodoSelezionato === "ieri"
                    ? "Ieri"
                    : periodoSelezionato === "settimana"
                      ? "Ultima settimana"
                      : periodoSelezionato === "mese"
                        ? "Ultimo mese"
                        : "Periodo selezionato"}
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Grafico andamento prenotazioni */}
          {/* Aggiorna il titolo del grafico */}
          <Card className="border-2 border-secondary-300 shadow-md hover:shadow-lg transition-shadow">
            <CardHeader className="border-b border-secondary-200">
              <CardTitle className="text-primary">Andamento Prenotazioni</CardTitle>
              <CardDescription className="text-accent-600">
                Prenotazioni giornaliere
                {periodoSelezionato === "ieri"
                  ? " di ieri"
                  : periodoSelezionato === "settimana"
                    ? " nell'ultima settimana"
                    : periodoSelezionato === "mese"
                      ? " nell'ultimo mese"
                      : " nel periodo selezionato"}
              </CardDescription>
            </CardHeader>
            <CardContent className="h-80 pt-4">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={andamentoPrenotazioni} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                  <defs>
                    <linearGradient id="colorPrenotazioni" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#0369A1" stopOpacity={0.8} />
                      <stop offset="95%" stopColor="#0369A1" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="data" />
                  <YAxis />
                  <Tooltip formatter={(value) => [value, "Prenotazioni"]} />
                  <Area
                    type="monotone"
                    dataKey="prenotazioni"
                    stroke="#0369A1"
                    fillOpacity={1}
                    fill="url(#colorPrenotazioni)"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          {/* Grafico andamento disdette */}
          <Card className="border-2 border-secondary-300 shadow-md hover:shadow-lg transition-shadow">
            <CardHeader className="border-b border-secondary-200">
              <CardTitle className="text-primary">Andamento Disdette</CardTitle>
              <CardDescription className="text-accent-600">
                La data disdetta è in funzione della data di creazione della prenotazione: 1 prenotazione inserita il 1
                aprile che viene disdetta il 1 maggio verrà contata per il 1 di aprile
              </CardDescription>
            </CardHeader>
            <CardContent className="h-80 pt-4">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={andamentoDisdette} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                  <defs>
                    <linearGradient id="colorDisdette" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#DC2626" stopOpacity={0.8} />
                      <stop offset="95%" stopColor="#DC2626" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="data" />
                  <YAxis />
                  <Tooltip formatter={(value) => [value, "Disdette"]} />
                  <Area
                    type="monotone"
                    dataKey="disdette"
                    stroke="#DC2626"
                    fillOpacity={1}
                    fill="url(#colorDisdette)"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          {/* Sezioni statistiche */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card className="border-2 border-secondary-300 shadow-md hover:shadow-lg transition-shadow">
              <CardHeader className="border-b border-secondary-200">
                <CardTitle className="text-primary">Totali Periodo</CardTitle>
                <CardDescription className="text-accent-600">Analisi dei dati per periodo</CardDescription>
              </CardHeader>
              <CardContent className="pt-4">
                <p className="text-sm text-muted-foreground mb-4">
                  Visualizza statistiche dettagliate su notti disponibili, notti prenotate, fatturato, ADR e tasso di
                  occupazione per periodi specifici.
                </p>
              </CardContent>
              <CardFooter className="pt-0">
                <Link href="/vendite/statistiche/totali-periodo" className="w-full">
                  <Button
                    variant="outline"
                    className="w-full border-2 hover:bg-secondary-100 transition-colors bg-transparent"
                  >
                    <Calendar className="mr-2 h-4 w-4 text-accent-500" />
                    Vai ai Totali Periodo
                  </Button>
                </Link>
              </CardFooter>
            </Card>

            <Card className="border-2 border-secondary-300 shadow-md hover:shadow-lg transition-shadow">
              <CardHeader className="border-b border-secondary-200">
                <CardTitle className="text-primary">Tasso di Occupazione</CardTitle>
                <CardDescription className="text-accent-600">Analisi dell'occupazione</CardDescription>
              </CardHeader>
              <CardContent className="pt-4">
                <p className="text-sm text-muted-foreground mb-4">
                  Visualizza il tasso di occupazione per hotel, tipologia di camera e giorno, con filtri avanzati per
                  stato prenotazione.
                </p>
              </CardContent>
              <CardFooter className="pt-0">
                <Link href="/vendite/statistiche/occupazione" className="w-full">
                  <Button
                    variant="outline"
                    className="w-full border-2 hover:bg-secondary-100 transition-colors bg-transparent"
                  >
                    <Hotel className="mr-2 h-4 w-4 text-accent-500" />
                    Vai all'Occupazione
                  </Button>
                </Link>
              </CardFooter>
            </Card>

            <Card className="border-2 border-secondary-300 shadow-md hover:shadow-lg transition-shadow">
              <CardHeader className="border-b border-secondary-200">
                <CardTitle className="text-primary">Pressione Domanda</CardTitle>
                <CardDescription className="text-accent-600">Analisi delle richieste</CardDescription>
              </CardHeader>
              <CardContent className="pt-4">
                <p className="text-sm text-muted-foreground mb-4">
                  Visualizza l'andamento delle richieste, il trend della domanda e la distribuzione per hotel e periodo.
                </p>
              </CardContent>
              <CardFooter className="pt-0">
                <Link href="/vendite/statistiche/pressione-domanda" className="w-full">
                  <Button
                    variant="outline"
                    className="w-full border-2 hover:bg-secondary-100 transition-colors bg-transparent"
                  >
                    <LineChart className="mr-2 h-4 w-4 text-accent-500" />
                    Vai alla Pressione Domanda
                  </Button>
                </Link>
              </CardFooter>
            </Card>
          </div>

          {/* Hotel */}
          <Card className="border-2 border-secondary-300 shadow-md hover:shadow-lg transition-shadow">
            <CardHeader className="border-b border-secondary-200">
              <CardTitle className="text-primary">Hotel</CardTitle>
              <CardDescription className="text-accent-600">
                Seleziona un hotel per visualizzare le statistiche specifiche
              </CardDescription>
            </CardHeader>
            <CardContent className="pt-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                {hotels
                  .filter((hotel) => hotel.nome !== "Tutti") // Rimuovi l'hotel con nome "Tutti"
                  .map((hotel) => {
                    const occupancy = hotelOccupancy[hotel.id] || { occupationRate: 0 }
                    const occupationRate = occupancy.occupationRate || 0

                    // Determina il colore in base al tasso di occupazione
                    let occupationColor = "text-green-500"
                    if (occupationRate > 80) {
                      occupationColor = "text-red-500"
                    } else if (occupationRate > 50) {
                      occupationColor = "text-yellow-500"
                    }

                    return (
                      <Link key={hotel.id} href={`/vendite/statistiche/hotel/${hotel.id}`}>
                        <Button
                          variant="outline"
                          className="w-full h-auto py-4 flex flex-col items-center justify-center border-2 hover:bg-secondary-100 transition-colors bg-transparent"
                        >
                          <div className="mb-2 h-5 w-5 flex items-center justify-center">
                            <img
                              src="/icons/hotel.png"
                              alt="Hotel"
                              className="h-5 w-5"
                              onError={(e) => {
                                console.error("Errore nel caricamento dell'immagine hotel.png")
                                e.currentTarget.onerror = null
                                e.currentTarget.style.display = "none"
                                e.currentTarget.nextElementSibling.style.display = "block"
                              }}
                            />
                            <Hotel className="h-5 w-5 text-accent-500 hidden" />
                          </div>
                          <span className="text-sm font-medium">{hotel.nome}</span>
                          <span className="text-xs text-muted-foreground mt-1">{hotel.numero_camere} camere</span>

                          {/* Contatore tipo contachilometri */}
                          <div className="mt-3 flex flex-col items-center justify-center">
                            <div className="bg-secondary-100 rounded-md px-2 py-1 flex items-center">
                              <span className={`text-lg font-mono font-bold ${occupationColor}`}>
                                <CountUp
                                  end={occupationRate}
                                  duration={2.5}
                                  decimals={1}
                                  suffix="%"
                                  preserveValue={true}
                                />
                              </span>
                            </div>
                            <span className="text-xs mt-1">Occupazione</span>
                            <span className="text-[10px] text-gray-500">
                              Stagione {(() => {
                                const now = new Date()
                                const currentMonth = now.getMonth() + 1
                                const currentYear = now.getFullYear()
                                return currentMonth >= 10 ? currentYear + 1 : currentYear
                              })()}
                            </span>
                          </div>
                        </Button>
                      </Link>
                    )
                  })}
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  )
}
