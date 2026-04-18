"use client"

import { useState, useEffect } from "react"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { DatePicker } from "@/components/ui/date-picker"
import { Switch } from "@/components/ui/switch"
import { Label } from "@/components/ui/label"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Loader2, BarChart3, Hotel, TrendingUp, Users, PieChart } from "lucide-react"
import { format, subMonths, startOfWeek, subYears, getDay, addDays, subDays } from "date-fns"
import { createBrowserClient } from "@supabase/ssr"
import { KpiCard } from "./components/kpi-card"
import { MobilePeriodSelector } from "./components/mobile-period-selector"
import { getPeriodDates, MobileService } from "@/lib/services/mobile-service"

function getLastSaturdayOfMay(year: number): Date {
  const lastDayOfMay = new Date(year, 4, 31) // Maggio è il mese 4 (0-indexed)
  const dayOfWeek = lastDayOfMay.getDay()
  const daysToSubtract = dayOfWeek === 6 ? 0 : dayOfWeek === 0 ? 1 : 7 - dayOfWeek + 6
  return subDays(lastDayOfMay, daysToSubtract)
}

function getSecondSaturdayOfSeptember(year: number): Date {
  const firstDayOfSeptember = new Date(year, 8, 1) // Settembre è il mese 8
  const dayOfWeek = firstDayOfSeptember.getDay()
  const daysToFirstSaturday = dayOfWeek === 6 ? 0 : dayOfWeek === 0 ? 6 : 6 - dayOfWeek
  const firstSaturday = addDays(firstDayOfSeptember, daysToFirstSaturday)
  return addDays(firstSaturday, 7) // Secondo sabato
}

function getSeasonYear(): number {
  const now = new Date()
  const currentMonth = now.getMonth()
  // Se siamo tra ottobre (9) e dicembre (11), usa anno successivo
  return currentMonth >= 9 ? now.getFullYear() + 1 : now.getFullYear()
}

function getSameDayLastYear(date: Date): Date {
  const lastYear = subYears(date, 1)
  const currentDayOfWeek = getDay(date)
  const lastYearDayOfWeek = getDay(lastYear)

  // Calcola la differenza di giorni per allineare al giorno della settimana
  let daysDiff = currentDayOfWeek - lastYearDayOfWeek
  if (daysDiff < 0) daysDiff += 7

  return addDays(lastYear, daysDiff)
}

export default function MobileDashboard() {
  const [supabase] = useState(() =>
    createBrowserClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!),
  )

  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [activeTab, setActiveTab] = useState("kpi")

  const [statistiche, setStatistiche] = useState({
    totalePrenotazioni: 0,
    prenotazioniAttive: 0,
    prenotazioniCancellate: 0,
    fatturato: 0,
    nottiTotali: 0,
    adr: 0,
    tassoOccupazione: 0,
  })

  const [statisticheSdly, setStatisticheSdly] = useState({
    totalePrenotazioni: 0,
    prenotazioniAttive: 0,
    prenotazioniCancellate: 0,
    fatturato: 0,
    nottiTotali: 0,
    adr: 0,
    tassoOccupazione: 0,
  })

  const [hotels, setHotels] = useState<{ id: string; nome: string; numero_camere: number }[]>([])
  const [andamentoPrenotazioni, setAndamentoPrenotazioni] = useState<any[]>([])
  const [periodoSelezionato, setPeriodoSelezionato] = useState<string>("mese")
  const [dataInizio, setDataInizio] = useState<Date>(subMonths(new Date(), 1))
  const [dataFine, setDataFine] = useState<Date>(new Date())
  const [filtraStagione, setFiltraStagione] = useState<boolean>(true) // Attivo di default
  const [hotelSelezionato, setHotelSelezionato] = useState<string>("tutti")
  const [trendPrenotazioni, setTrendPrenotazioni] = useState<number[]>([])
  const [trendFatturato, setTrendFatturato] = useState<number[]>([])
  const [trendAdr, setTrendAdr] = useState<number[]>([])
  const [trendOccupazione, setTrendOccupazione] = useState<number[]>([])

  const [distribuzioneHotel, setDistribuzioneHotel] = useState<{ hotel: string; prenotazioni: number }[]>([])
  const [distribuzionePerMese, setDistribuzionePerMese] = useState<
    { mese: number; nome_mese: string; numero_prenotazioni: number }[]
  >([])
  const [loadingDistribuzione, setLoadingDistribuzione] = useState(false)

  async function fetchData() {
    try {
      setLoading(true)
      setError(null)

      // Carica gli hotel
      const { data: hotelData, error: hotelError } = await supabase
        .from("hotel")
        .select("id, nome, numero_camere")
        .order("nome")

      if (hotelError) throw hotelError
      setHotels([{ id: "tutti", nome: "Tutti gli hotel", numero_camere: 0 }, ...(hotelData || [])])

      // Calcola il periodo in base alla selezione
      const period = getPeriodDates(periodoSelezionato)
      setDataInizio(period.startDate)
      setDataFine(period.endDate)

      const seasonYear = getSeasonYear()
      const seasonStart = getLastSaturdayOfMay(seasonYear)
      const seasonEnd = getSecondSaturdayOfSeptember(seasonYear)

      const sdlyEndDate = getSameDayLastYear(period.endDate)
      const daysDiff = Math.ceil((period.endDate.getTime() - period.startDate.getTime()) / (1000 * 3600 * 24))
      const sdlyStartDate = subDays(sdlyEndDate, daysDiff)

      const sdlySeasonYear = seasonYear - 1
      const sdlySeasonStart = getLastSaturdayOfMay(sdlySeasonYear)
      const sdlySeasonEnd = getSecondSaturdayOfSeptember(sdlySeasonYear)

      console.log(
        "[v0] Anno corrente:",
        seasonYear,
        "Stagione:",
        format(seasonStart, "dd/MM/yyyy"),
        "-",
        format(seasonEnd, "dd/MM/yyyy"),
      )
      console.log(
        "[v0] Anno SDLY:",
        sdlySeasonYear,
        "Stagione:",
        format(sdlySeasonStart, "dd/MM/yyyy"),
        "-",
        format(sdlySeasonEnd, "dd/MM/yyyy"),
      )
      console.log(
        "[v0] Periodo corrente:",
        format(period.startDate, "dd/MM/yyyy"),
        "-",
        format(period.endDate, "dd/MM/yyyy"),
      )
      console.log("[v0] Periodo SDLY:", format(sdlyStartDate, "dd/MM/yyyy"), "-", format(sdlyEndDate, "dd/MM/yyyy"))

      const giorniPeriodo = daysDiff + 1

      let query = supabase
        .from("prenotazioni")
        .select("id, arrivo, partenza, totale_soggiorno, stato_prenotazione, notti, data_prenotazione, id_hotel")
        .gte("data_prenotazione", format(period.startDate, "yyyy-MM-dd"))
        .lte("data_prenotazione", format(period.endDate, "yyyy-MM-dd"))
        .limit(1000000)

      if (hotelSelezionato !== "tutti") {
        query = query.eq("id_hotel", hotelSelezionato)
      }

      if (filtraStagione) {
        query = query.gte("arrivo", format(seasonStart, "yyyy-MM-dd")).lte("partenza", format(seasonEnd, "yyyy-MM-dd"))
      }

      const { data: prenotazioni, error: prenotazioniError } = await query

      if (prenotazioniError) throw prenotazioniError

      let querySdly = supabase
        .from("prenotazioni")
        .select("id, arrivo, partenza, totale_soggiorno, stato_prenotazione, notti, data_prenotazione, id_hotel")
        .gte("data_prenotazione", format(sdlyStartDate, "yyyy-MM-dd"))
        .lte("data_prenotazione", format(sdlyEndDate, "yyyy-MM-dd"))
        .limit(1000000)

      if (hotelSelezionato !== "tutti") {
        querySdly = querySdly.eq("id_hotel", hotelSelezionato)
      }

      if (filtraStagione) {
        querySdly = querySdly
          .gte("arrivo", format(sdlySeasonStart, "yyyy-MM-dd"))
          .lte("partenza", format(sdlySeasonEnd, "yyyy-MM-dd"))
      }

      const { data: prenotazioniSdly, error: prenotazioniSdlyError } = await querySdly

      if (prenotazioniSdlyError) throw prenotazioniSdlyError

      const prenotazioniArray = prenotazioni || []
      const attive = prenotazioniArray.filter((p) => p.stato_prenotazione === "confermata").length
      const cancellate = prenotazioniArray.filter((p) => p.stato_prenotazione === "cancellata").length
      const fatturato = prenotazioniArray.reduce((sum, p) => sum + (p.totale_soggiorno || 0), 0)
      const nottiTotali = prenotazioniArray.reduce((sum, p) => sum + (p.notti || 0), 0)
      const adr = nottiTotali > 0 ? fatturato / nottiTotali : 0

      const hotelCorrente = hotelSelezionato !== "tutti" ? hotels.find((h) => h.id === hotelSelezionato) : null
      const camereTotali = hotelCorrente
        ? hotelCorrente.numero_camere
        : hotelData?.reduce((sum, h) => sum + h.numero_camere, 0) || 0

      const nottiDisponibili = camereTotali * giorniPeriodo
      const tassoOccupazione = nottiDisponibili > 0 ? (nottiTotali / nottiDisponibili) * 100 : 0

      setStatistiche({
        totalePrenotazioni: prenotazioniArray.length,
        prenotazioniAttive: attive,
        prenotazioniCancellate: cancellate,
        fatturato,
        nottiTotali,
        adr,
        tassoOccupazione,
      })

      const prenotazioniSdlyArray = prenotazioniSdly || []
      const attiveSdly = prenotazioniSdlyArray.filter((p) => p.stato_prenotazione === "confermata").length
      const cancellateSdly = prenotazioniSdlyArray.filter((p) => p.stato_prenotazione === "cancellata").length
      const fatturatoSdly = prenotazioniSdlyArray.reduce((sum, p) => sum + (p.totale_soggiorno || 0), 0)
      const nottiTotaliSdly = prenotazioniSdlyArray.reduce((sum, p) => sum + (p.notti || 0), 0)
      const adrSdly = nottiTotaliSdly > 0 ? fatturatoSdly / nottiTotaliSdly : 0
      const tassoOccupazioneSdly = nottiDisponibili > 0 ? (nottiTotaliSdly / nottiDisponibili) * 100 : 0

      setStatisticheSdly({
        totalePrenotazioni: prenotazioniSdlyArray.length,
        prenotazioniAttive: attiveSdly,
        prenotazioniCancellate: cancellateSdly,
        fatturato: fatturatoSdly,
        nottiTotali: nottiTotaliSdly,
        adr: adrSdly,
        tassoOccupazione: tassoOccupazioneSdly,
      })

      if (periodoSelezionato === "da_inizio") {
        const weeklyData: Record<
          string,
          {
            prenotazioni: number
            fatturato: number
            notti: number
            settimana: Date
          }
        > = {}

        prenotazioniArray.forEach((p) => {
          if (!p.data_prenotazione) return

          const dataPrenotazione = new Date(p.data_prenotazione)
          const inizioSettimana = startOfWeek(dataPrenotazione, { weekStartsOn: 1 })
          const weekKey = format(inizioSettimana, "yyyy-MM-dd")

          if (!weeklyData[weekKey]) {
            weeklyData[weekKey] = {
              prenotazioni: 0,
              fatturato: 0,
              notti: 0,
              settimana: inizioSettimana,
            }
          }

          weeklyData[weekKey].prenotazioni += 1
          weeklyData[weekKey].fatturato += p.totale_soggiorno || 0
          weeklyData[weekKey].notti += p.notti || 0
        })

        const weeklyArray = Object.entries(weeklyData)
          .map(([key, data]) => ({
            settimana: data.settimana,
            prenotazioni: data.prenotazioni,
            fatturato: data.fatturato,
            adr: data.notti > 0 ? data.fatturato / data.notti : 0,
            occupazione: camereTotali > 0 ? (data.notti / (camereTotali * 7)) * 100 : 0,
          }))
          .sort((a, b) => a.settimana.getTime() - b.settimana.getTime())

        setTrendPrenotazioni(weeklyArray.map((w) => w.prenotazioni))
        setTrendFatturato(weeklyArray.map((w) => w.fatturato))
        setTrendAdr(weeklyArray.map((w) => w.adr))
        setTrendOccupazione(weeklyArray.map((w) => w.occupazione))
      } else {
        setTrendPrenotazioni([])
        setTrendFatturato([])
        setTrendAdr([])
        setTrendOccupazione([])
      }

      const andamento: Record<
        string,
        {
          data: string
          prenotazioni: number
          fatturato: number
          notti: number
          adr: number
          occupazione: number
        }
      > = {}

      const currentDate = new Date(period.startDate)
      while (currentDate <= period.endDate) {
        const dateKey = format(currentDate, "yyyy-MM-dd")
        andamento[dateKey] = {
          data: format(currentDate, "dd/MM"),
          prenotazioni: 0,
          fatturato: 0,
          notti: 0,
          adr: 0,
          occupazione: 0,
        }
        currentDate.setDate(currentDate.getDate() + 1)
      }

      prenotazioniArray.forEach((p) => {
        if (!p.data_prenotazione) return

        const dataPrenotazione = p.data_prenotazione.split("T")[0]
        if (andamento[dataPrenotazione]) {
          andamento[dataPrenotazione].prenotazioni += 1
          andamento[dataPrenotazione].fatturato += p.totale_soggiorno || 0
          andamento[dataPrenotazione].notti += p.notti || 0

          if (camereTotali > 0) {
            andamento[dataPrenotazione].occupazione = (andamento[dataPrenotazione].notti / camereTotali) * 100
          }
        }
      })

      Object.keys(andamento).forEach((key) => {
        const giorno = andamento[key]
        if (giorno.notti > 0) {
          giorno.adr = giorno.fatturato / giorno.notti
        }
      })

      setAndamentoPrenotazioni(Object.values(andamento))
    } catch (err: any) {
      console.error("Errore nel caricamento dei dati:", err)
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  async function fetchDistributionData() {
    if (activeTab === "kpi") return

    try {
      setLoadingDistribuzione(true)
      const period = getPeriodDates(periodoSelezionato)

      if (activeTab === "hotel") {
        const seasonYear = getSeasonYear()
        const seasonStart = getLastSaturdayOfMay(seasonYear)
        const seasonEnd = getSecondSaturdayOfSeptember(seasonYear)

        let query = supabase
          .from("prenotazioni")
          .select("id, id_hotel, arrivo, partenza, data_prenotazione")
          .gte("data_prenotazione", format(period.startDate, "yyyy-MM-dd"))
          .lte("data_prenotazione", format(period.endDate, "yyyy-MM-dd"))
          .limit(1000000)

        if (hotelSelezionato !== "tutti") {
          query = query.eq("id_hotel", hotelSelezionato)
        }

        if (filtraStagione) {
          query = query
            .gte("arrivo", format(seasonStart, "yyyy-MM-dd"))
            .lte("partenza", format(seasonEnd, "yyyy-MM-dd"))
        }

        const { data: prenotazioni, error: prenotazioniError } = await query

        if (prenotazioniError) throw prenotazioniError

        // Raggruppa per hotel in JavaScript
        const hotelMap = new Map<string, number>()
        prenotazioni?.forEach((p) => {
          const count = hotelMap.get(p.id_hotel) || 0
          hotelMap.set(p.id_hotel, count + 1)
        })

        const distribuzioneData = Array.from(hotelMap.entries()).map(([hotelId, count]) => {
          const hotel = hotels.find((h) => h.id === hotelId)
          return {
            hotel: hotel?.nome || hotelId, // Usa il nome se trovato, altrimenti l'ID
            prenotazioni: count,
          }
        })

        setDistribuzioneHotel(distribuzioneData)
      } else if (activeTab === "calendar") {
        const result = await MobileService.getPrenotazioniPerMese(period, hotelSelezionato, filtraStagione)
        setDistribuzionePerMese(result)
      }
    } catch (err: any) {
      console.error("Errore nel caricamento dei dati di distribuzione:", err)
      setError(err.message)
    } finally {
      setLoadingDistribuzione(false)
    }
  }

  const handlePeriodChange = (period: string) => {
    setPeriodoSelezionato(period)
  }

  const handleTabChange = (value: string) => {
    setActiveTab(value)
  }

  useEffect(() => {
    fetchData()
  }, [periodoSelezionato, filtraStagione, hotelSelezionato])

  useEffect(() => {
    fetchDistributionData()
  }, [activeTab, periodoSelezionato, filtraStagione, hotelSelezionato])

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("it-IT", { style: "currency", currency: "EUR" }).format(value)
  }

  const formatNumber = (value: number) => {
    return new Intl.NumberFormat("it-IT").format(Math.round(value))
  }

  const formatPercent = (value: number) => {
    return `${value.toFixed(2)}%`
  }

  const getPeriodSubtitle = () => {
    switch (periodoSelezionato) {
      case "oggi":
        return "Oggi"
      case "ieri":
        return "Ieri"
      case "settimana":
        return "Ultima settimana"
      case "mese":
        return "Ultimo mese"
      case "1_gennaio":
        return "Dal 1 gennaio"
      case "da_inizio":
        return "Da inizio stagione"
      default:
        return "Periodo selezionato"
    }
  }

  const showTrends = periodoSelezionato === "da_inizio"

  const seasonYear = getSeasonYear()

  return (
    <div className="p-4">
      <div className="flex flex-col space-y-2 mb-4">
        <h1 className="text-xl font-bold text-center">Dashboard Club Family Hotel</h1>

        <Tabs value={activeTab} onValueChange={handleTabChange} className="w-full">
          <TabsList className="grid grid-cols-2 mb-2">
            <TabsTrigger value="kpi" className="text-xs sm:text-sm">
              <Users className="w-4 h-4 mr-1" />
              KPI
            </TabsTrigger>
            <TabsTrigger value="hotel" className="text-xs sm:text-sm">
              <PieChart className="w-4 h-4 mr-1" />
              Hotel
            </TabsTrigger>
          </TabsList>
        </Tabs>
      </div>

      <div className="space-y-4 mb-6">
        <div className="mb-4">
          <MobilePeriodSelector selectedPeriod={periodoSelezionato} onSelectPeriod={handlePeriodChange} />
        </div>

        {periodoSelezionato === "personalizzato" && (
          <div className="flex flex-col space-y-2">
            <DatePicker date={dataInizio} setDate={setDataInizio} className="w-full" placeholder="Data inizio" />
            <DatePicker date={dataFine} setDate={setDataFine} className="w-full" placeholder="Data fine" />
          </div>
        )}

        <div>
          <Select value={hotelSelezionato} onValueChange={setHotelSelezionato}>
            <SelectTrigger className="w-full border-2">
              <SelectValue placeholder="Seleziona hotel" />
            </SelectTrigger>
            <SelectContent>
              {hotels.map((hotel) => (
                <SelectItem key={hotel.id} value={hotel.id}>
                  {hotel.nome}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="flex items-center space-x-2">
          <Switch id="filtro-stagione" checked={filtraStagione} onCheckedChange={setFiltraStagione} />
          <Label htmlFor="filtro-stagione" className="text-sm">
            Solo alta stagione {seasonYear}
          </Label>
        </div>
      </div>

      {loading && activeTab === "kpi" ? (
        <div className="flex justify-center items-center h-40">
          <Loader2 className="h-8 w-8 animate-spin" />
        </div>
      ) : error ? (
        <div className="bg-red-100 border-2 border-red-400 text-red-700 px-4 py-3 rounded mb-6">{error}</div>
      ) : (
        <div className="space-y-4">
          {activeTab === "kpi" && (
            <>
              <KpiCard
                title="Prenotazioni"
                value={formatNumber(statistiche.totalePrenotazioni)}
                subtitle={`${statistiche.prenotazioniAttive} attive, ${statistiche.prenotazioniCancellate} cancellate`}
                icon={Users}
                trendData={trendPrenotazioni}
                showTrend={showTrends}
                sdlyValue={statisticheSdly.totalePrenotazioni}
              />

              <KpiCard
                title="Fatturato"
                value={formatCurrency(statistiche.fatturato)}
                subtitle={getPeriodSubtitle()}
                icon={TrendingUp}
                trendData={trendFatturato}
                showTrend={showTrends}
                sdlyValue={statisticheSdly.fatturato}
                formatValue={formatCurrency}
              />

              <KpiCard
                title="ADR"
                value={formatCurrency(statistiche.adr)}
                subtitle="Tariffa media giornaliera"
                icon={BarChart3}
                trendData={trendAdr}
                showTrend={showTrends}
                sdlyValue={statisticheSdly.adr}
                formatValue={formatCurrency}
              />

              <KpiCard
                title="Tasso Occupazione"
                value={formatPercent(statistiche.tassoOccupazione)}
                subtitle={getPeriodSubtitle()}
                icon={Hotel}
                trendData={trendOccupazione}
                showTrend={showTrends}
                sdlyValue={statisticheSdly.tassoOccupazione}
                formatValue={formatPercent}
              />
            </>
          )}
        </div>
      )}
    </div>
  )
}
