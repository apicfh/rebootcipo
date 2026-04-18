import { supabase } from "@/lib/supabase/client"
import { format, subDays } from "date-fns"

export interface BookingsStats {
  yesterday: number
  lastWeek: number
  lastMonth: number
}

export async function getBookingsStats(): Promise<BookingsStats> {
  const today = new Date()
  const yesterday = format(subDays(today, 1), "yyyy-MM-dd")
  const lastWeek = format(subDays(today, 7), "yyyy-MM-dd")
  const lastMonth = format(subDays(today, 30), "yyyy-MM-dd")

  console.log("[v0] Fetching bookings stats:", { yesterday, lastWeek, lastMonth })

  // Query per ieri
  const { count: yesterdayCount, error: yesterdayError } = await supabase
    .from("prenotazioni")
    .select("*", { count: "exact", head: true })
    .eq("data_prenotazione", yesterday)

  if (yesterdayError) {
    console.error("[v0] Error fetching yesterday bookings:", yesterdayError)
    throw yesterdayError
  }

  // Query per ultima settimana
  const { count: weekCount, error: weekError } = await supabase
    .from("prenotazioni")
    .select("*", { count: "exact", head: true })
    .gte("data_prenotazione", lastWeek)

  if (weekError) {
    console.error("[v0] Error fetching week bookings:", weekError)
    throw weekError
  }

  // Query per ultimo mese
  const { count: monthCount, error: monthError } = await supabase
    .from("prenotazioni")
    .select("*", { count: "exact", head: true })
    .gte("data_prenotazione", lastMonth)

  if (monthError) {
    console.error("[v0] Error fetching month bookings:", monthError)
    throw monthError
  }

  const stats = {
    yesterday: yesterdayCount || 0,
    lastWeek: weekCount || 0,
    lastMonth: monthCount || 0,
  }

  console.log("[v0] Bookings stats:", stats)

  return stats
}
