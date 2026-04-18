import { supabase } from "@/lib/supabase/client"
import { format, addDays } from "date-fns"

export interface OccupationStats {
  avgOccupation: number
  minOccupation: number
  minDate: string
  maxOccupation: number
  maxDate: string
}

export async function getOccupationStats(hotelId: string): Promise<OccupationStats> {
  // Calcola le date di default (ultimo sabato di maggio - secondo sabato di settembre)
  const annoRiferimento = new Date().getMonth() >= 9 ? new Date().getFullYear() + 1 : new Date().getFullYear()

  const lastDayOfMay = new Date(annoRiferimento, 4, 31)
  const dayOfWeek = lastDayOfMay.getDay()
  const daysToSubtract = dayOfWeek === 6 ? 0 : dayOfWeek + 1
  const startDate = new Date(annoRiferimento, 4, 31 - daysToSubtract)

  const firstDayOfSeptember = new Date(annoRiferimento, 8, 1)
  const firstDayOfWeek = firstDayOfSeptember.getDay()
  const daysUntilFirstSaturday = firstDayOfWeek === 0 ? 6 : 6 - firstDayOfWeek
  const firstSaturday = 1 + daysUntilFirstSaturday
  const secondSaturday = firstSaturday + 7
  const endDate = new Date(annoRiferimento, 8, secondSaturday)

  // Ottieni il numero di camere dell'hotel
  const { data: hotelData, error: hotelError } = await supabase
    .from("hotel")
    .select("numero_camere")
    .eq("id", hotelId)
    .single()

  if (hotelError) throw hotelError
  const totalRooms = hotelData?.numero_camere || 0

  // Ottieni le prenotazioni
  const { data: bookings, error: bookingsError } = await supabase
    .from("prenotazioni")
    .select("*")
    .eq("id_hotel", hotelId)
    .lte("arrivo", format(endDate, "yyyy-MM-dd"))
    .gte("partenza", format(startDate, "yyyy-MM-dd"))
    .not("stato_prenotazione", "eq", "8")
    .not("stato_prenotazione", "eq", "cancellata")

  if (bookingsError) throw bookingsError

  // Calcola occupazione giornaliera
  const occupationByDate: Record<string, { booked: number; available: number; date: Date }> = {}

  let currentDate = new Date(startDate)
  while (currentDate <= endDate) {
    const dateKey = format(currentDate, "yyyy-MM-dd")
    occupationByDate[dateKey] = { booked: 0, available: totalRooms, date: new Date(currentDate) }
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

  // Calcola statistiche (escludendo l'ultimo giorno)
  const dailyRates = Object.entries(occupationByDate)
    .slice(0, -1) // Escludi ultimo giorno
    .map(([dateKey, data]) => ({
      rate: (data.booked / data.available) * 100,
      date: dateKey,
    }))

  if (dailyRates.length === 0) {
    return {
      avgOccupation: 0,
      minOccupation: 0,
      minDate: "",
      maxOccupation: 0,
      maxDate: "",
    }
  }

  const avgOccupation = dailyRates.reduce((sum, item) => sum + item.rate, 0) / dailyRates.length
  const minDay = dailyRates.reduce((min, item) => (item.rate < min.rate ? item : min))
  const maxDay = dailyRates.reduce((max, item) => (item.rate > max.rate ? item : max))

  return {
    avgOccupation: Number.parseFloat(avgOccupation.toFixed(1)),
    minOccupation: Number.parseFloat(minDay.rate.toFixed(1)),
    minDate: format(new Date(minDay.date), "dd MMMM", { locale: require("date-fns/locale/it").it }),
    maxOccupation: Number.parseFloat(maxDay.rate.toFixed(1)),
    maxDate: format(new Date(maxDay.date), "dd MMMM", { locale: require("date-fns/locale/it").it }),
  }
}
