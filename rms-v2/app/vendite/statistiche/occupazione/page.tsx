"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Label } from "@/components/ui/label"
import { DatePicker } from "@/components/ui/date-picker"
import { Loader2, Info, BarChart3, Grid3x3 } from "lucide-react"
import { format, addDays, subYears, getDay, addYears } from "date-fns"
import { it } from "date-fns/locale"
import { supabase } from "@/lib/supabase/client"
import { XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, LineChart, Line } from "recharts"
import { Tooltip as UITooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { Switch } from "@/components/ui/switch"
import { Checkbox } from "@/components/ui/checkbox"
import { Button } from "@/components/ui/button"

// Tipi di dati
interface HotelType {
  id: string
  nome: string
}

interface OccupationData {
  date: string
  occupationRate: number
  availableRooms: number
  bookedRooms: number
  snapshotOccupationRate?: number
  snapshotBookedRooms?: number
  occupationRateLastYear?: number
  bookedRoomsLastYear?: number
  dayOfWeek?: string
  isLastDay?: boolean
}

function getLastSaturdayOfMay(year: number): Date {
  const lastDayOfMay = new Date(year, 4, 31) // 31 maggio
  const dayOfWeek = lastDayOfMay.getDay()
  const daysToSubtract = dayOfWeek === 6 ? 0 : dayOfWeek + 1
  return new Date(year, 4, 31 - daysToSubtract)
}

function getSecondSaturdayOfSeptember(year: number): Date {
  const firstDayOfSeptember = new Date(year, 8, 1)
  const firstDayOfWeek = firstDayOfSeptember.getDay()
  const daysUntilFirstSaturday = firstDayOfWeek === 0 ? 6 : 6 - firstDayOfWeek
  const firstSaturday = 1 + daysUntilFirstSaturday
  const secondSaturday = firstSaturday + 7
  return new Date(year, 8, secondSaturday)
}

function getAnnoRiferimento(): number {
  const now = new Date()
  const currentMonth = now.getMonth()
  return currentMonth >= 9 ? now.getFullYear() + 1 : now.getFullYear()
}

export default function OccupazionePage() {
  const annoRiferimento = getAnnoRiferimento()
  const defaultStartDate = getLastSaturdayOfMay(annoRiferimento)
  const defaultEndDate = getSecondSaturdayOfSeptember(annoRiferimento)

  const [viewMode, setViewMode] = useState<"single" | "grid">("single")
  const [allHotelsData, setAllHotelsData] = useState<
    Record<
      string,
      { hotel: HotelType; averageOccupation: string; averageOccupationLastYear: string; difference: number }
    >
  >({})

  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [hotels, setHotels] = useState<HotelType[]>([])
  const [selectedHotel, setSelectedHotel] = useState<string>("")
  const [startDate, setStartDate] = useState<Date>(defaultStartDate)
  const [endDate, setEndDate] = useState<Date>(defaultEndDate)
  const [snapshotDate, setSnapshotDate] = useState<Date | null>(null)
  const [useSnapshotDate, setUseSnapshotDate] = useState<boolean>(false)
  const [compareSnapshot, setCompareSnapshot] = useState<boolean>(false)
  const [occupationData, setOccupationData] = useState<OccupationData[]>([])
  const [selectedStatus, setSelectedStatus] = useState<string>("all")

  // Carica gli hotel all'avvio
  useEffect(() => {
    async function fetchHotels() {
      try {
        const { data, error } = await supabase.from("hotel").select("id, nome").order("nome")
        if (error) throw error
        setHotels(data || [])
        if (data && data.length > 0) {
          setSelectedHotel(data[0].id)
        }
      } catch (err: any) {
        console.error("Errore nel caricamento degli hotel:", err)
        setError(err.message)
      } finally {
        setLoading(false)
      }
    }

    fetchHotels()
  }, [])

  // Attiva automaticamente il confronto quando si attiva lo snapshot
  useEffect(() => {
    if (useSnapshotDate) {
      setCompareSnapshot(true)
    } else {
      setCompareSnapshot(false)
    }
  }, [useSnapshotDate])

  // Carica i dati di occupazione quando cambiano i filtri
  useEffect(() => {
    if (selectedHotel) {
      fetchYearOverYearData()
    }
  }, [selectedHotel, startDate, endDate, selectedStatus, snapshotDate, useSnapshotDate])

  useEffect(() => {
    if (viewMode === "grid" && hotels.length > 0) {
      fetchAllHotelsOccupationData()
    }
  }, [viewMode, startDate, endDate, selectedStatus, snapshotDate, useSnapshotDate, hotels])

  // Funzione per caricare i dati di occupazione standard
  async function fetchOccupationData() {
    try {
      setLoading(true)
      setError(null)

      // Ottieni il numero di camere dell'hotel selezionato
      const { data: hotelData, error: hotelError } = await supabase
        .from("hotel")
        .select("numero_camere")
        .eq("id", selectedHotel)
        .single()

      if (hotelError) throw hotelError
      const totalRooms = hotelData?.numero_camere || 0

      // Ottieni le prenotazioni per il periodo selezionato
      let query = supabase
        .from("prenotazioni")
        .select("*")
        .eq("id_hotel", selectedHotel)
        .lte("arrivo", format(endDate, "yyyy-MM-dd"))
        .gte("partenza", format(startDate, "yyyy-MM-dd"))
        .not("stato_prenotazione", "eq", "8") // Escludiamo sempre le prenotazioni con stato_prenotazione = "8"

      // Applica il filtro Snapshot Date se attivo
      if (useSnapshotDate && snapshotDate) {
        query = query.lte("data_prenotazione", format(snapshotDate, "yyyy-MM-dd"))
      }

      // Filtra per stato se necessario
      if (selectedStatus !== "all") {
        query = query.eq("stato_prenotazione", selectedStatus)
      } else {
        // Se "all" è selezionato, escludiamo comunque le prenotazioni cancellate e quelle con stato "8"
        query = query.not("stato_prenotazione", "eq", "cancellata").not("stato_prenotazione", "eq", "8")
      }

      const { data: bookings, error: bookingsError } = await query

      if (bookingsError) throw bookingsError

      // Prepara i dati per il grafico
      const occupationByDate: Record<string, { booked: number; available: number }> = {}

      // Inizializza tutti i giorni nel periodo con 0 prenotazioni
      let currentDate = new Date(startDate)
      while (currentDate <= endDate) {
        const dateKey = format(currentDate, "yyyy-MM-dd")
        occupationByDate[dateKey] = { booked: 0, available: totalRooms }
        currentDate = addDays(currentDate, 1)
      }

      // Conta le prenotazioni per ogni giorno
      bookings?.forEach((booking) => {
        const arrivalDate = new Date(booking.arrivo)
        const departureDate = new Date(booking.partenza)

        let currentDate = new Date(Math.max(arrivalDate.getTime(), startDate.getTime()))
        const endDateToUse = new Date(Math.min(departureDate.getTime(), endDate.getTime()))

        while (currentDate < endDateToUse) {
          const dateKey = format(currentDate, "yyyy-MM-dd")
          if (occupationByDate[dateKey]) {
            occupationByDate[dateKey].booked += 1
          }
          currentDate = addDays(currentDate, 1)
        }
      })

      // Converti in array per il grafico
      const chartData: OccupationData[] = Object.entries(occupationByDate).map(([date, data], index, array) => ({
        date: format(new Date(date), "dd/MM"),
        occupationRate: (data.booked / data.available) * 100,
        availableRooms: data.available,
        bookedRooms: data.booked,
        isLastDay: index === array.length - 1,
      }))

      setOccupationData(chartData)
    } catch (err: any) {
      console.error("Errore nel caricamento dei dati di occupazione:", err)
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  // Funzione per caricare i dati di confronto (attuale vs snapshot)
  async function fetchComparisonData() {
    try {
      setLoading(true)
      setError(null)

      // Ottieni il numero di camere dell'hotel selezionato
      const { data: hotelData, error: hotelError } = await supabase
        .from("hotel")
        .select("numero_camere")
        .eq("id", selectedHotel)
        .single()

      if (hotelError) throw hotelError
      const totalRooms = hotelData?.numero_camere || 0

      // 1. Query per le prenotazioni alla data di snapshot
      let snapshotQuery = supabase
        .from("prenotazioni")
        .select("*")
        .eq("id_hotel", selectedHotel)
        .lte("arrivo", format(endDate, "yyyy-MM-dd"))
        .gte("partenza", format(startDate, "yyyy-MM-dd"))
        .not("stato_prenotazione", "eq", "8")
        .lte("data_prenotazione", format(snapshotDate!, "yyyy-MM-dd"))

      if (selectedStatus !== "all") {
        snapshotQuery = snapshotQuery.eq("stato_prenotazione", selectedStatus)
      } else {
        snapshotQuery = snapshotQuery.not("stato_prenotazione", "eq", "cancellata")
      }

      // 2. Query per le prenotazioni attuali (senza filtro data_prenotazione)
      let currentQuery = supabase
        .from("prenotazioni")
        .select("*")
        .eq("id_hotel", selectedHotel)
        .lte("arrivo", format(endDate, "yyyy-MM-dd"))
        .gte("partenza", format(startDate, "yyyy-MM-dd"))
        .not("stato_prenotazione", "eq", "8")

      if (selectedStatus !== "all") {
        currentQuery = currentQuery.eq("stato_prenotazione", selectedStatus)
      } else {
        currentQuery = currentQuery.not("stato_prenotazione", "eq", "cancellata")
      }

      // Esegui entrambe le query
      const [snapshotResult, currentResult] = await Promise.all([snapshotQuery, currentQuery])

      if (snapshotResult.error) throw snapshotResult.error
      if (currentResult.error) throw currentResult.error

      const snapshotBookings = snapshotResult.data || []
      const currentBookings = currentResult.data || []

      // Prepara i dati per il grafico
      const occupationByDate: Record<
        string,
        {
          booked: number
          snapshotBooked: number
          available: number
        }
      > = {}

      // Inizializza tutti i giorni nel periodo
      let currentDate = new Date(startDate)
      while (currentDate <= endDate) {
        const dateKey = format(currentDate, "yyyy-MM-dd")
        occupationByDate[dateKey] = { booked: 0, snapshotBooked: 0, available: totalRooms }
        currentDate = addDays(currentDate, 1)
      }

      // Conta le prenotazioni attuali per ogni giorno
      currentBookings.forEach((booking) => {
        const arrivalDate = new Date(booking.arrivo)
        const departureDate = new Date(booking.partenza)

        let currentDate = new Date(Math.max(arrivalDate.getTime(), startDate.getTime()))
        const endDateToUse = new Date(Math.min(departureDate.getTime(), endDate.getTime()))

        while (currentDate < endDateToUse) {
          const dateKey = format(currentDate, "yyyy-MM-dd")
          if (occupationByDate[dateKey]) {
            occupationByDate[dateKey].booked += 1
          }
          currentDate = addDays(currentDate, 1)
        }
      })

      // Conta le prenotazioni alla data di snapshot per ogni giorno
      snapshotBookings.forEach((booking) => {
        const arrivalDate = new Date(booking.arrivo)
        const departureDate = new Date(booking.partenza)

        let currentDate = new Date(Math.max(arrivalDate.getTime(), startDate.getTime()))
        const endDateToUse = new Date(Math.min(departureDate.getTime(), endDate.getTime()))

        while (currentDate < endDateToUse) {
          const dateKey = format(currentDate, "yyyy-MM-dd")
          if (occupationByDate[dateKey]) {
            occupationByDate[dateKey].snapshotBooked += 1
          }
          currentDate = addDays(currentDate, 1)
        }
      })

      // Converti in array per il grafico
      const chartData: OccupationData[] = Object.entries(occupationByDate).map(([date, data], index, array) => {
        // Assicurati che i valori siano numeri validi, non undefined o NaN
        const currentRate = (data.booked / data.available) * 100
        const snapshotRate = (data.snapshotBooked / data.available) * 100

        return {
          date: format(new Date(date), "dd/MM"),
          occupationRate: isNaN(currentRate) ? 0 : currentRate,
          snapshotOccupationRate: isNaN(snapshotRate) ? 0 : snapshotRate,
          availableRooms: data.available,
          bookedRooms: data.booked,
          snapshotBookedRooms: data.snapshotBooked,
          isLastDay: index === array.length - 1,
        }
      })

      console.log("Dati di confronto generati:", chartData)
      setOccupationData(chartData)
    } catch (err: any) {
      console.error("Errore nel caricamento dei dati di confronto:", err)
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  function getCorrespondingDateLastYear(date: Date): Date {
    const dayOfWeek = getDay(date)
    const dateLastYear = subYears(date, 1)
    const dayOfWeekLastYear = getDay(dateLastYear)
    const diff = dayOfWeek - dayOfWeekLastYear
    return addDays(dateLastYear, diff)
  }

  async function fetchYearOverYearData() {
    try {
      setLoading(true)
      setError(null)

      // Ottieni il numero di camere dell'hotel selezionato
      const { data: hotelData, error: hotelError } = await supabase
        .from("hotel")
        .select("numero_camere")
        .eq("id", selectedHotel)
        .single()

      if (hotelError) throw hotelError
      const totalRooms = hotelData?.numero_camere || 0

      // Calcola le date corrispondenti dell'anno precedente allineate per day of week
      const startDateLastYear = getCorrespondingDateLastYear(startDate)
      const endDateLastYear = getCorrespondingDateLastYear(endDate)

      console.log("[v0] Year-over-year comparison:", {
        currentYear: { start: format(startDate, "yyyy-MM-dd"), end: format(endDate, "yyyy-MM-dd") },
        lastYear: { start: format(startDateLastYear, "yyyy-MM-dd"), end: format(endDateLastYear, "yyyy-MM-dd") },
      })

      // Query per l'anno corrente
      let currentYearQuery = supabase
        .from("prenotazioni")
        .select("*")
        .eq("id_hotel", selectedHotel)
        .lte("arrivo", format(endDate, "yyyy-MM-dd"))
        .gte("partenza", format(startDate, "yyyy-MM-dd"))
        .not("stato_prenotazione", "eq", "8")

      // Applica il filtro Snapshot Date se attivo
      if (useSnapshotDate && snapshotDate) {
        currentYearQuery = currentYearQuery.lte("data_prenotazione", format(snapshotDate, "yyyy-MM-dd"))
      }

      // Filtra per stato
      if (selectedStatus !== "all") {
        currentYearQuery = currentYearQuery.eq("stato_prenotazione", selectedStatus)
      } else {
        currentYearQuery = currentYearQuery.not("stato_prenotazione", "eq", "cancellata")
      }

      // Query per l'anno precedente (stessa logica)
      let lastYearQuery = supabase
        .from("prenotazioni")
        .select("*")
        .eq("id_hotel", selectedHotel)
        .lte("arrivo", format(endDateLastYear, "yyyy-MM-dd"))
        .gte("partenza", format(startDateLastYear, "yyyy-MM-dd"))
        .not("stato_prenotazione", "eq", "8")

      // Applica snapshot date anche per anno precedente (se attivo)
      if (useSnapshotDate && snapshotDate) {
        const snapshotDateLastYear = subYears(snapshotDate, 1)
        lastYearQuery = lastYearQuery.lte("data_prenotazione", format(snapshotDateLastYear, "yyyy-MM-dd"))
      }

      if (selectedStatus !== "all") {
        lastYearQuery = lastYearQuery.eq("stato_prenotazione", selectedStatus)
      } else {
        lastYearQuery = lastYearQuery.not("stato_prenotazione", "eq", "cancellata")
      }

      // Esegui entrambe le query in parallelo
      const [currentYearResult, lastYearResult] = await Promise.all([currentYearQuery, lastYearQuery])

      if (currentYearResult.error) throw currentYearResult.error
      if (lastYearResult.error) throw lastYearResult.error

      const currentYearBookings = currentYearResult.data || []
      const lastYearBookings = lastYearResult.data || []

      console.log("[v0] Bookings fetched:", {
        currentYear: currentYearBookings.length,
        lastYear: lastYearBookings.length,
      })

      // Prepara i dati per il grafico
      const occupationByDate: Record<
        string,
        {
          booked: number
          bookedLastYear: number
          available: number
          fullDate: Date
          dayOfWeek: string
        }
      > = {}

      // Inizializza tutti i giorni nel periodo corrente
      let currentDate = new Date(startDate)
      let currentDateLastYear = new Date(startDateLastYear)

      while (currentDate <= endDate) {
        const dateKey = format(currentDate, "dd/MM")
        occupationByDate[dateKey] = {
          booked: 0,
          bookedLastYear: 0,
          available: totalRooms,
          fullDate: new Date(currentDate),
          dayOfWeek: format(currentDate, "EEEE", { locale: it }),
        }
        currentDate = addDays(currentDate, 1)
        currentDateLastYear = addDays(currentDateLastYear, 1)
      }

      // Conta le prenotazioni dell'anno corrente
      currentYearBookings.forEach((booking) => {
        const arrivalDate = new Date(booking.arrivo)
        const departureDate = new Date(booking.partenza)

        let currentDate = new Date(Math.max(arrivalDate.getTime(), startDate.getTime()))
        const endDateToUse = new Date(Math.min(departureDate.getTime(), endDate.getTime()))

        while (currentDate < endDateToUse) {
          const dateKey = format(currentDate, "dd/MM")
          if (occupationByDate[dateKey]) {
            occupationByDate[dateKey].booked += 1
          }
          currentDate = addDays(currentDate, 1)
        }
      })

      // Conta le prenotazioni dell'anno precedente
      lastYearBookings.forEach((booking) => {
        const arrivalDate = new Date(booking.arrivo)
        const departureDate = new Date(booking.partenza)

        let currentDate = new Date(Math.max(arrivalDate.getTime(), startDateLastYear.getTime()))
        const endDateToUse = new Date(Math.min(departureDate.getTime(), endDateLastYear.getTime()))

        while (currentDate < endDateToUse) {
          // Trova la data corrispondente nell'anno corrente
          const correspondingCurrentDate = addYears(currentDate, 1)
          // Allinea per day of week
          const dayOfWeekCurrent = getDay(correspondingCurrentDate)
          const dayOfWeekThis = getDay(currentDate)
          const diff = dayOfWeekCurrent - dayOfWeekThis
          const alignedDate = addDays(correspondingCurrentDate, -diff)

          const dateKey = format(alignedDate, "dd/MM")
          if (occupationByDate[dateKey]) {
            occupationByDate[dateKey].bookedLastYear += 1
          }
          currentDate = addDays(currentDate, 1)
        }
      })

      // Converti in array per il grafico
      const chartData: OccupationData[] = Object.entries(occupationByDate).map(([date, data], index, array) => ({
        date,
        occupationRate: (data.booked / data.available) * 100,
        occupationRateLastYear: (data.bookedLastYear / data.available) * 100,
        availableRooms: data.available,
        bookedRooms: data.booked,
        bookedRoomsLastYear: data.bookedLastYear,
        dayOfWeek: data.dayOfWeek,
        isLastDay: index === array.length - 1,
      }))

      console.log("[v0] Chart data generated:", chartData.slice(0, 5))
      setOccupationData(chartData)
    } catch (err: any) {
      console.error("Errore nel caricamento dei dati year-over-year:", err)
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  async function fetchAllHotelsOccupationData() {
    try {
      setLoading(true)
      setError(null)

      const allData: Record<
        string,
        { hotel: HotelType; averageOccupation: string; averageOccupationLastYear: string; difference: number }
      > = {}

      for (const hotel of hotels) {
        // Ottieni il numero di camere dell'hotel
        const { data: hotelData, error: hotelError } = await supabase
          .from("hotel")
          .select("numero_camere")
          .eq("id", hotel.id)
          .single()

        if (hotelError) throw hotelError
        const totalRooms = hotelData?.numero_camere || 0

        // Query per l'anno corrente
        let currentYearQuery = supabase
          .from("prenotazioni")
          .select("*")
          .eq("id_hotel", hotel.id)
          .lte("arrivo", format(endDate, "yyyy-MM-dd"))
          .gte("partenza", format(startDate, "yyyy-MM-dd"))
          .not("stato_prenotazione", "eq", "8")

        if (useSnapshotDate && snapshotDate) {
          currentYearQuery = currentYearQuery.lte("data_prenotazione", format(snapshotDate, "yyyy-MM-dd"))
        }

        if (selectedStatus !== "all") {
          currentYearQuery = currentYearQuery.eq("stato_prenotazione", selectedStatus)
        } else {
          currentYearQuery = currentYearQuery.not("stato_prenotazione", "eq", "cancellata")
        }

        // Query per l'anno precedente
        const startDateLastYear = getCorrespondingDateLastYear(startDate)
        const endDateLastYear = getCorrespondingDateLastYear(endDate)

        let lastYearQuery = supabase
          .from("prenotazioni")
          .select("*")
          .eq("id_hotel", hotel.id)
          .lte("arrivo", format(endDateLastYear, "yyyy-MM-dd"))
          .gte("partenza", format(startDateLastYear, "yyyy-MM-dd"))
          .not("stato_prenotazione", "eq", "8")

        if (useSnapshotDate && snapshotDate) {
          const snapshotDateLastYear = subYears(snapshotDate, 1)
          lastYearQuery = lastYearQuery.lte("data_prenotazione", format(snapshotDateLastYear, "yyyy-MM-dd"))
        }

        if (selectedStatus !== "all") {
          lastYearQuery = lastYearQuery.eq("stato_prenotazione", selectedStatus)
        } else {
          lastYearQuery = lastYearQuery.not("stato_prenotazione", "eq", "cancellata")
        }

        // Esegui entrambe le query in parallelo
        const [currentYearResult, lastYearResult] = await Promise.all([currentYearQuery, lastYearQuery])

        if (currentYearResult.error) throw currentYearResult.error
        if (lastYearResult.error) throw lastYearResult.error

        const currentYearBookings = currentYearResult.data || []
        const lastYearBookings = lastYearResult.data || []

        // Prepara i dati per il calcolo
        const occupationByDate: Record<
          string,
          { booked: number; bookedLastYear: number; available: number; fullDate: Date }
        > = {}

        let currentDate = new Date(startDate)
        let currentDateLastYear = new Date(startDateLastYear)

        while (currentDate <= endDate) {
          const dateKey = format(currentDate, "dd/MM")
          occupationByDate[dateKey] = {
            booked: 0,
            bookedLastYear: 0,
            available: totalRooms,
            fullDate: new Date(currentDate),
          }
          currentDate = addDays(currentDate, 1)
          currentDateLastYear = addDays(currentDateLastYear, 1)
        }

        // Processa prenotazioni anno corrente
        for (const booking of currentYearBookings) {
          let bookingDate = new Date(booking.arrivo)
          const departureDate = new Date(booking.partenza)

          while (bookingDate < departureDate) {
            const dateKey = format(bookingDate, "dd/MM")
            if (occupationByDate[dateKey]) {
              occupationByDate[dateKey].booked += 1
            }
            bookingDate = addDays(bookingDate, 1)
          }
        }

        // Processa prenotazioni anno precedente
        for (const booking of lastYearBookings) {
          let bookingDate = new Date(booking.arrivo)
          const departureDate = new Date(booking.partenza)
          const dateShift = getDay(new Date(startDateLastYear))

          while (bookingDate < departureDate) {
            const dateKey = format(bookingDate, "dd/MM")
            if (occupationByDate[dateKey]) {
              occupationByDate[dateKey].bookedLastYear += 1
            }
            bookingDate = addDays(bookingDate, 1)
          }
        }

        // Calcola medie
        const occupationRates = Object.values(occupationByDate).map((item) => (item.booked / item.available) * 100)
        const occupationRatesLastYear = Object.values(occupationByDate).map(
          (item) => (item.bookedLastYear / item.available) * 100,
        )

        const avgCurrent =
          occupationRates.length > 0 ? occupationRates.reduce((a, b) => a + b, 0) / occupationRates.length : 0
        const avgLastYear =
          occupationRatesLastYear.length > 0
            ? occupationRatesLastYear.reduce((a, b) => a + b, 0) / occupationRatesLastYear.length
            : 0

        const difference = avgCurrent - avgLastYear

        allData[hotel.id] = {
          hotel,
          averageOccupation: `${avgCurrent.toFixed(1)}%`,
          averageOccupationLastYear: `${avgLastYear.toFixed(1)}%`,
          difference,
        }
      }

      setAllHotelsData(allData)
    } catch (err: any) {
      console.error("Errore nel caricamento dati griglia:", err)
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  // Formatta le percentuali
  const formatPercent = (value: number) => {
    return `${value.toFixed(1)}%`
  }

  // Calcola l'occupazione media escludendo l'ultimo giorno
  const calculateAverageOccupation = (data: OccupationData[]) => {
    if (data.length === 0) return "0%"

    // Filtra i dati escludendo l'ultimo giorno
    const filteredData = data.filter((item) => !item.isLastDay)

    // Se non ci sono dati dopo il filtraggio, restituisci 0%
    if (filteredData.length === 0) return "0%"

    // Calcola la media
    const average = filteredData.reduce((sum, item) => sum + item.occupationRate, 0) / filteredData.length

    return `${average.toFixed(1)}%`
  }

  // Calcola l'occupazione media dello snapshot escludendo l'ultimo giorno
  const calculateSnapshotAverageOccupation = (data: OccupationData[]) => {
    if (data.length === 0) return "0%"

    // Filtra i dati escludendo l'ultimo giorno
    const filteredData = data.filter((item) => !item.isLastDay)

    // Se non ci sono dati dopo il filtraggio, restituisci 0%
    if (filteredData.length === 0) return "0%"

    // Calcola la media
    const average =
      filteredData.reduce((sum, item) => sum + (item.snapshotOccupationRate || 0), 0) / filteredData.length

    return `${average.toFixed(1)}%`
  }

  const calculateAverageOccupationLastYear = (data: OccupationData[]) => {
    if (data.length === 0) return "0%"
    const filteredData = data.filter((item) => !item.isLastDay)
    if (filteredData.length === 0) return "0%"
    const average =
      filteredData.reduce((sum, item) => sum + (item.occupationRateLastYear || 0), 0) / filteredData.length
    return `${average.toFixed(1)}%`
  }

  // Trova il giorno con minore occupazione escludendo l'ultimo giorno
  const findMinOccupationDay = (data: OccupationData[]) => {
    if (data.length === 0) return { rate: "0%", date: "" }

    // Filtra i dati escludendo l'ultimo giorno
    const filteredData = data.filter((item) => !item.isLastDay)

    // Se non ci sono dati dopo il filtraggio, restituisci valori di default
    if (filteredData.length === 0) return { rate: "0%", date: "" }

    // Trova il giorno con occupazione minima
    const minDay = filteredData.reduce(
      (min, item) => (item.occupationRate < min.occupationRate ? item : min),
      filteredData[0],
    )

    return {
      rate: formatPercent(minDay.occupationRate),
      date: minDay.date,
    }
  }

  // Trova il giorno con minore occupazione dello snapshot escludendo l'ultimo giorno
  const findSnapshotMinOccupationDay = (data: OccupationData[]) => {
    if (data.length === 0) return "0%"

    // Filtra i dati escludendo l'ultimo giorno e assicurandosi che snapshotOccupationRate sia definito e > 0
    const filteredData = data.filter(
      (item) => !item.isLastDay && item.snapshotOccupationRate !== undefined && item.snapshotOccupationRate > 0,
    )

    // Se non ci sono dati dopo il filtraggio, restituisci 0%
    if (filteredData.length === 0) return "0%"

    // Trova il minimo
    const minRate = Math.min(...filteredData.map((item) => item.snapshotOccupationRate || 0))

    return formatPercent(minRate)
  }

  return (
    <div className="container py-6">
      <div className="mb-6">
        <h1 className="text-3xl font-bold tracking-tight">Tasso di Occupazione</h1>
        <p className="text-gray-500 mt-1 italic">utilizza questa sezione solo per range lunghi di minimo un mese</p>
      </div>

      <div className="mb-6 flex gap-2">
        <Button
          variant={viewMode === "single" ? "default" : "outline"}
          onClick={() => setViewMode("single")}
          className="flex items-center gap-2"
        >
          <BarChart3 className="h-4 w-4" />
          Vista Grafico
        </Button>
        <Button
          variant={viewMode === "grid" ? "default" : "outline"}
          onClick={() => setViewMode("grid")}
          className="flex items-center gap-2"
        >
          <Grid3x3 className="h-4 w-4" />
          Vista Griglia
        </Button>
      </div>

      {/* Filtri */}
      <Card className="mb-6 border-2 border-secondary-300 rounded-lg shadow-md hover:shadow-lg transition-shadow">
        <CardHeader className="border-b border-secondary-100 pb-3">
          <CardTitle className="text-primary font-bold">Filtri</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <div>
              <Label className="mb-2 block">Hotel</Label>
              <Select value={selectedHotel} onValueChange={setSelectedHotel} disabled={viewMode === "grid"}>
                <SelectTrigger className="border-2">
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

            <div>
              <Label className="mb-2 block">Data inizio</Label>
              <DatePicker date={startDate} setDate={setStartDate} />
            </div>

            <div>
              <Label className="mb-2 block">Data fine</Label>
              <DatePicker date={endDate} setDate={setEndDate} />
            </div>

            <div>
              <Label className="mb-2 block">Stato prenotazione</Label>
              <Select value={selectedStatus} onValueChange={setSelectedStatus}>
                <SelectTrigger className="border-2">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tutte (escluse cancellate)</SelectItem>
                  <SelectItem value="confermata">Solo confermate</SelectItem>
                  <SelectItem value="prenotata">Solo prenotate</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="flex flex-col">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <Label htmlFor="snapshot-switch">Usa Snapshot Date</Label>
                  <TooltipProvider>
                    <UITooltip>
                      <TooltipTrigger>
                        <Info className="h-4 w-4 text-muted-foreground" />
                      </TooltipTrigger>
                      <TooltipContent>
                        <p className="max-w-xs">Visualizza solo le prenotazioni inserite fino alla data specificata</p>
                      </TooltipContent>
                    </UITooltip>
                  </TooltipProvider>
                </div>
                <Switch id="snapshot-switch" checked={useSnapshotDate} onCheckedChange={setUseSnapshotDate} />
              </div>
              <DatePicker
                date={snapshotDate}
                setDate={setSnapshotDate}
                disabled={!useSnapshotDate}
                placeholder="Seleziona data snapshot"
              />
              <div className="flex items-center gap-2 mt-2">
                <Checkbox
                  id="compare-checkbox"
                  checked={compareSnapshot}
                  onCheckedChange={setCompareSnapshot}
                  disabled={!useSnapshotDate || !snapshotDate || true /* compareYearOverYear is always true now */}
                />
                <Label
                  htmlFor="compare-checkbox"
                  className={!useSnapshotDate || !snapshotDate || true ? "text-muted-foreground" : ""}
                >
                  Mostra confronto (attuale vs snapshot)
                </Label>
                <TooltipProvider>
                  <UITooltip>
                    <TooltipTrigger>
                      <Info className="h-4 w-4 text-muted-foreground" />
                    </TooltipTrigger>
                    <TooltipContent>
                      <p className="max-w-xs">
                        Visualizza contemporaneamente i dati attuali (blu) e i dati alla data di snapshot (arancione)
                        per evidenziare i differenziali
                      </p>
                    </TooltipContent>
                  </UITooltip>
                </TooltipProvider>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {viewMode === "single" ? (
        <>
          {/* Grafico occupazione */}
          <Card className="border-2 border-secondary-300 rounded-lg shadow-md hover:shadow-lg transition-shadow">
            <CardHeader className="border-b border-secondary-100 pb-3">
              <CardTitle className="text-primary font-bold flex items-center gap-2">
                Tasso di Occupazione Giornaliero
                <span className="text-sm font-normal text-muted-foreground">
                  (Confronto Year-over-Year allineato per giorno settimana)
                </span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="flex justify-center items-center h-64">
                  <Loader2 className="h-8 w-8 animate-spin" />
                </div>
              ) : error ? (
                <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-6">{error}</div>
              ) : (
                <div className="h-96">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={occupationData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="date" />
                      <YAxis tickFormatter={formatPercent} domain={[0, 100]} />
                      <Tooltip
                        formatter={(value: number, name: string) => {
                          if (name === "occupationRate") {
                            return [`${value.toFixed(1)}%`, "Anno corrente"]
                          }
                          if (name === "occupationRateLastYear") {
                            return [`${value.toFixed(1)}%`, "Anno precedente"]
                          }
                          return [value, name]
                        }}
                        labelFormatter={(label) => `Data: ${label}`}
                        contentStyle={{ backgroundColor: "rgba(255, 255, 255, 0.9)", border: "1px solid #ccc" }}
                      />
                      <Legend
                        formatter={(value) => {
                          if (value === "occupationRate") return "Anno corrente"
                          if (value === "occupationRateLastYear") return "Anno precedente"
                          return value
                        }}
                      />
                      <Line
                        type="monotone"
                        dataKey="occupationRate"
                        stroke="#0369A1"
                        strokeWidth={2}
                        dot={{ r: 3 }}
                        name="occupationRate"
                      />
                      <Line
                        type="monotone"
                        dataKey="occupationRateLastYear"
                        stroke="#F97316"
                        strokeWidth={2}
                        dot={{ r: 3 }}
                        name="occupationRateLastYear"
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Dettagli occupazione */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-6">
            <Card className="border-2 border-secondary-300 rounded-lg shadow-md hover:shadow-lg transition-shadow">
              <CardHeader className="border-b border-secondary-100 pb-3">
                <CardTitle className="text-primary font-bold">Occupazione Media</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold">{calculateAverageOccupation(occupationData)}</div>
                {occupationData.length > 0 && (
                  <>
                    <div className="text-lg text-orange-500 mt-2">
                      Anno precedente: {calculateAverageOccupationLastYear(occupationData)}
                    </div>
                    <div className="text-sm mt-1">
                      {(() => {
                        const current = Number.parseFloat(calculateAverageOccupation(occupationData))
                        const lastYear = Number.parseFloat(calculateAverageOccupationLastYear(occupationData))
                        const diff = current - lastYear
                        const color = diff > 0 ? "text-green-600" : diff < 0 ? "text-red-600" : "text-gray-500"
                        return (
                          <span className={color}>
                            {diff > 0 ? "+" : ""}
                            {diff.toFixed(1)}% rispetto all'anno precedente
                          </span>
                        )
                      })()}
                    </div>
                  </>
                )}
              </CardContent>
            </Card>

            <Card className="border-2 border-secondary-300 rounded-lg shadow-md hover:shadow-lg transition-shadow">
              <CardHeader className="border-b border-secondary-100 pb-3">
                <CardTitle className="text-primary font-bold">Giorno con Maggiore Occupazione</CardTitle>
              </CardHeader>
              <CardContent>
                {occupationData.length > 0 ? (
                  <>
                    <div className="text-3xl font-bold">
                      {formatPercent(Math.max(...occupationData.map((item) => item.occupationRate)))}
                    </div>
                    <div className="text-sm text-muted-foreground">
                      {
                        occupationData.reduce((max, item) => (item.occupationRate > max.occupationRate ? item : max))
                          .date
                      }
                    </div>
                  </>
                ) : (
                  <div className="text-3xl font-bold">0%</div>
                )}
              </CardContent>
            </Card>

            <Card className="border-2 border-secondary-300 rounded-lg shadow-md hover:shadow-lg transition-shadow">
              <CardHeader className="border-b border-secondary-100 pb-3">
                <CardTitle className="text-primary font-bold">Giorno con Minore Occupazione</CardTitle>
              </CardHeader>
              <CardContent>
                {occupationData.length > 0 ? (
                  <>
                    <div className="text-3xl font-bold">{findMinOccupationDay(occupationData).rate}</div>
                    <div className="text-sm text-muted-foreground">{findMinOccupationDay(occupationData).date}</div>
                  </>
                ) : (
                  <div className="text-3xl font-bold">0%</div>
                )}
              </CardContent>
            </Card>
          </div>
        </>
      ) : (
        <>
          {loading ? (
            <div className="flex justify-center items-center h-64">
              <Loader2 className="h-8 w-8 animate-spin" />
            </div>
          ) : error ? (
            <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-6">{error}</div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {Object.values(allHotelsData).map(
                ({ hotel, averageOccupation, averageOccupationLastYear, difference }) => (
                  <Card
                    key={hotel.id}
                    className="border-2 border-secondary-300 rounded-lg shadow-md hover:shadow-lg transition-shadow"
                  >
                    <CardHeader className="border-b border-secondary-100 pb-3">
                      <CardTitle className="text-primary font-bold text-lg">{hotel.nome}</CardTitle>
                    </CardHeader>
                    <CardContent className="pt-4">
                      <div className="text-3xl font-bold">{averageOccupation}</div>
                      <div className="text-lg text-orange-500 mt-2">Anno precedente: {averageOccupationLastYear}</div>
                      <div className="text-sm mt-1">
                        {(() => {
                          const color =
                            difference > 0 ? "text-green-600" : difference < 0 ? "text-red-600" : "text-gray-500"
                          return (
                            <span className={color}>
                              {difference > 0 ? "+" : ""}
                              {difference.toFixed(1)}% rispetto all'anno precedente
                            </span>
                          )
                        })()}
                      </div>
                    </CardContent>
                  </Card>
                ),
              )}
            </div>
          )}
        </>
      )}
    </div>
  )
}
