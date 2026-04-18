import { supabase } from "@/lib/supabase/client"

// Growth RPC Types
export type GrowthRpcParams = {
  p_hotel_id: string
  p_stay_week_start: string
  p_room_type_ids: string[] | null
  p_mode: 'incremental' | 'cumulative'
  p_include_forecast: boolean
}

export interface GrowthRpcOutput {
  request_week_start: string
  weeks_to_arrival: number
  actual_value: number
  actual_low: number | null
  actual_up: number | null
  forecast_value: number
  forecast_low: number | null
  forecast_up: number | null
}

export interface GrowthCombinedRpcOutput {
  request_week_start: string
  weeks_to_arrival: number
  quotes_actual_value: number
  quotes_actual_low: number | null
  quotes_actual_up: number | null
  quotes_forecast_value: number
  quotes_forecast_low: number | null
  quotes_forecast_up: number | null
  bookings_actual_value: number
  bookings_actual_low: number | null
  bookings_actual_up: number | null
  bookings_forecast_value: number
  bookings_forecast_low: number | null
  bookings_forecast_up: number | null
}

// Forecast Tables Types
export interface ForecastQuote {
  room_type_id: string
  request_week_start: string
  stay_week_start: string
  quotes_num: number
  quotes_num_up: number | null
  quotes_num_low: number | null
}

export interface ForecastBooking {
  room_type_id: string
  request_week_start: string
  stay_week_start: string
  reservation_num: number
  reservation_num_up: number | null
  reservation_num_low: number | null
  price_of_forecast: number | null
}

export async function getRoomTypeIds(): Promise<string[]> {
  const { data, error } = await supabase
    .from("forecast_quotes_travelbrain")
    .select("room_type_id")
    .order("room_type_id", { ascending: true })

  if (error) {
    console.error("[v0] Error fetching room types:", error)
    return []
  }

  const distinctIds = Array.from(new Set((data as { room_type_id: string }[]).map((d) => d.room_type_id)))
  return distinctIds
}

export async function getStayWeekStarts(): Promise<string[]> {
  const { data, error } = await supabase
    .from("forecast_quotes_travelbrain")
    .select("stay_week_start")
    .order("stay_week_start", { ascending: true })

  if (error) {
    console.error("[v0] Error fetching stay weeks:", error)
    return []
  }

  const distinctWeeks = Array.from(new Set((data as { stay_week_start: string }[]).map((d) => d.stay_week_start)))
  return distinctWeeks
}

export async function getRequestWeekStarts(): Promise<string[]> {
  const { data, error } = await supabase
    .from("forecast_quotes_travelbrain")
    .select("request_week_start")
    .order("request_week_start", { ascending: true })

  if (error) {
    console.error("[v0] Error fetching request weeks:", error)
    return []
  }

  const distinctWeeks = Array.from(new Set((data as { request_week_start: string }[]).map((d) => d.request_week_start)))
  return distinctWeeks
}

export async function getStayWeekStartsBookings(): Promise<string[]> {
  const { data, error } = await supabase
    .from("forecast_bookings_travelbrain")
    .select("stay_week_start")
    .order("stay_week_start", { ascending: true })

  if (error) {
    console.error("[v0] Error fetching stay weeks (bookings):", error)
    return []
  }

  const distinctWeeks = Array.from(new Set((data as { stay_week_start: string }[]).map((d) => d.stay_week_start)))
  return distinctWeeks
}

export async function getRequestWeekStartsBookings(): Promise<string[]> {
  const { data, error } = await supabase
    .from("forecast_bookings_travelbrain")
    .select("request_week_start")
    .order("request_week_start", { ascending: true })

  if (error) {
    console.error("[v0] Error fetching request weeks (bookings):", error)
    return []
  }

  const distinctWeeks = Array.from(new Set((data as { request_week_start: string }[]).map((d) => d.request_week_start)))
  return distinctWeeks
}

export async function getForecastQuotesByFilters(
  roomTypeId?: string,
  weekValue?: string,
  useStayWeek: boolean = false,
): Promise<ForecastQuote[]> {
  let query = supabase
    .from("forecast_quotes_travelbrain")
    .select("room_type_id, request_week_start, stay_week_start, quotes_num, quotes_num_up, quotes_num_low")

  if (roomTypeId && roomTypeId !== "all") {
    query = query.eq("room_type_id", roomTypeId)
  }

  if (weekValue && weekValue !== "all") {
    if (useStayWeek) {
      query = query.eq("stay_week_start", weekValue)
    } else {
      query = query.eq("request_week_start", weekValue)
    }
  }

  const { data, error } = await query.order("request_week_start", { ascending: true })

  if (error) {
    console.error("[v0] Error fetching forecast quotes:", error)
    return []
  }

  return (data as ForecastQuote[]) || []
}

export async function getForecastQuotesGrouped(
  roomTypeId?: string,
  weekValue?: string,
  useStayWeek: boolean = false,
): Promise<
  {
    week: string
    quotes_num: number
    quotes_num_up: number | null
    quotes_num_low: number | null
  }[]
> {
  const quotes = await getForecastQuotesByFilters(roomTypeId, weekValue, useStayWeek)

  const grouped = quotes.reduce(
    (acc, quote) => {
      const weekKey = useStayWeek ? quote.stay_week_start : quote.request_week_start
      const existing = acc.find((item) => item.week === weekKey)
      if (existing) {
        existing.quotes_num += quote.quotes_num
        if (quote.quotes_num_up) existing.quotes_num_up = (existing.quotes_num_up || 0) + quote.quotes_num_up
        if (quote.quotes_num_low) existing.quotes_num_low = (existing.quotes_num_low || 0) + quote.quotes_num_low
      } else {
        acc.push({
          week: weekKey,
          quotes_num: quote.quotes_num,
          quotes_num_up: quote.quotes_num_up,
          quotes_num_low: quote.quotes_num_low,
        })
      }
      return acc
    },
    [] as {
      week: string
      quotes_num: number
      quotes_num_up: number | null
      quotes_num_low: number | null
    }[],
  )

  return grouped.sort((a, b) => new Date(a.week).getTime() - new Date(b.week).getTime())
}

// Nuova funzione: quando vogliamo filtrare per una settimana specifica e vedere l'altra dimensione
export async function getForecastQuotesForSpecificWeek(
  roomTypeIds?: string[],
  filterWeekValue?: string,
  visualizeByStayWeek: boolean = false,
): Promise<
  {
    week: string
    quotes_num: number
    quotes_num_up: number | null
    quotes_num_low: number | null
  }[]
> {
  let query = supabase
    .from("forecast_quotes_travelbrain")
    .select("room_type_id, request_week_start, stay_week_start, quotes_num, quotes_num_up, quotes_num_low")

  // Filtra per room_type_id(s) - supporta array
  if (roomTypeIds && roomTypeIds.length > 0 && !roomTypeIds.includes("all")) {
    query = query.in("room_type_id", roomTypeIds)
  }

  // Filtra per la settimana OPPOSTA a quella che vogliamo visualizzare
  if (filterWeekValue && filterWeekValue !== "all") {
    if (visualizeByStayWeek) {
      // Se visualizziamo per stay_week_start, filtriamo per request_week_start
      query = query.eq("request_week_start", filterWeekValue)
    } else {
      // Se visualizziamo per request_week_start, filtriamo per stay_week_start
      query = query.eq("stay_week_start", filterWeekValue)
    }
  }

  const { data, error } = await query.order(visualizeByStayWeek ? "stay_week_start" : "request_week_start", { ascending: true })

  if (error) {
    console.error("[v0] Error fetching specific week quotes:", error)
    return []
  }

  // Raggruppa per la dimensione che vogliamo visualizzare sull'asse X
  const grouped = (data as ForecastQuote[]).reduce(
    (acc, quote) => {
      const weekKey = visualizeByStayWeek ? quote.stay_week_start : quote.request_week_start
      const existing = acc.find((item) => item.week === weekKey)
      if (existing) {
        existing.quotes_num += quote.quotes_num
        if (quote.quotes_num_up) existing.quotes_num_up = (existing.quotes_num_up || 0) + quote.quotes_num_up
        if (quote.quotes_num_low) existing.quotes_num_low = (existing.quotes_num_low || 0) + quote.quotes_num_low
      } else {
        acc.push({
          week: weekKey,
          quotes_num: quote.quotes_num,
          quotes_num_up: quote.quotes_num_up,
          quotes_num_low: quote.quotes_num_low,
        })
      }
      return acc
    },
    [] as {
      week: string
      quotes_num: number
      quotes_num_up: number | null
      quotes_num_low: number | null
    }[],
  )

  return grouped.sort((a, b) => new Date(a.week).getTime() - new Date(b.week).getTime())
}

export async function getForecastBookingsByFilters(
  roomTypeId?: string,
  weekValue?: string,
  useStayWeek: boolean = false,
): Promise<ForecastBooking[]> {
  let query = supabase
    .from("forecast_bookings_travelbrain")
    .select("room_type_id, request_week_start, stay_week_start, reservation_num, reservation_num_up, reservation_num_low, price_of_forecast")

  if (roomTypeId && roomTypeId !== "all") {
    query = query.eq("room_type_id", roomTypeId)
  }

  if (weekValue && weekValue !== "all") {
    if (useStayWeek) {
      query = query.eq("stay_week_start", weekValue)
    } else {
      query = query.eq("request_week_start", weekValue)
    }
  }

  const { data, error } = await query.order("request_week_start", { ascending: true })

  if (error) {
    console.error("[v0] Error fetching forecast bookings:", error)
    return []
  }

  return (data as ForecastBooking[]) || []
}

export async function getForecastBookingsGrouped(
  roomTypeId?: string,
  weekValue?: string,
  useStayWeek: boolean = false,
): Promise<
  {
    week: string
    reservation_num: number
    reservation_num_up: number | null
    reservation_num_low: number | null
  }[]
> {
  const bookings = await getForecastBookingsByFilters(roomTypeId, weekValue, useStayWeek)

  const grouped = bookings.reduce(
    (acc, booking) => {
      const weekKey = useStayWeek ? booking.stay_week_start : booking.request_week_start
      const existing = acc.find((item) => item.week === weekKey)
      if (existing) {
        existing.reservation_num += booking.reservation_num
        if (booking.reservation_num_up) existing.reservation_num_up = (existing.reservation_num_up || 0) + booking.reservation_num_up
        if (booking.reservation_num_low) existing.reservation_num_low = (existing.reservation_num_low || 0) + booking.reservation_num_low
      } else {
        acc.push({
          week: weekKey,
          reservation_num: booking.reservation_num,
          reservation_num_up: booking.reservation_num_up,
          reservation_num_low: booking.reservation_num_low,
        })
      }
      return acc
    },
    [] as {
      week: string
      reservation_num: number
      reservation_num_up: number | null
      reservation_num_low: number | null
    }[],
  )

  return grouped.sort((a, b) => new Date(a.week).getTime() - new Date(b.week).getTime())
}

// Nuova funzione: quando vogliamo filtrare per una settimana specifica e vedere l'altra dimensione
export async function getForecastBookingsForSpecificWeek(
  roomTypeIds?: string[],
  filterWeekValue?: string,
  visualizeByStayWeek: boolean = false,
): Promise<
  {
    week: string
    reservation_num: number
    reservation_num_up: number | null
    reservation_num_low: number | null
  }[]
> {
  console.log("[v0] getForecastBookingsForSpecificWeek called with:", { roomTypeIds, filterWeekValue, visualizeByStayWeek })
  
  let query = supabase
    .from("forecast_bookings_travelbrain")
    .select("room_type_id, request_week_start, stay_week_start, reservation_num, reservation_num_up, reservation_num_low, price_of_forecast")

  // Filtra per room_type_id(s) - supporta array
  if (roomTypeIds && roomTypeIds.length > 0 && !roomTypeIds.includes("all")) {
    console.log("[v0] Applying room filter:", roomTypeIds)
    query = query.in("room_type_id", roomTypeIds)
  }

  // Filtra per la settimana OPPOSTA a quella che vogliamo visualizzare
  if (filterWeekValue && filterWeekValue !== "all") {
    if (visualizeByStayWeek) {
      // Se visualizziamo per stay_week_start, filtriamo per request_week_start
      console.log("[v0] Visualizing by stay_week_start, filtering by request_week_start:", filterWeekValue)
      query = query.eq("request_week_start", filterWeekValue)
    } else {
      // Se visualizziamo per request_week_start, filtriamo per stay_week_start
      console.log("[v0] Visualizing by request_week_start, filtering by stay_week_start:", filterWeekValue)
      query = query.eq("stay_week_start", filterWeekValue)
    }
  }

  const { data, error } = await query.order(visualizeByStayWeek ? "stay_week_start" : "request_week_start", { ascending: true })

  if (error) {
    console.error("[v0] Error fetching specific week bookings:", error)
    return []
  }

  console.log("[v0] Raw data from query - count:", data?.length, "first item:", data?.[0])

  // Raggruppa per la dimensione che vogliamo visualizzare sull'asse X
  const grouped = (data as ForecastBooking[]).reduce(
    (acc, booking) => {
      const weekKey = visualizeByStayWeek ? booking.stay_week_start : booking.request_week_start
      const existing = acc.find((item) => item.week === weekKey)
      if (existing) {
        existing.reservation_num += booking.reservation_num
        if (booking.reservation_num_up) existing.reservation_num_up = (existing.reservation_num_up || 0) + booking.reservation_num_up
        if (booking.reservation_num_low) existing.reservation_num_low = (existing.reservation_num_low || 0) + booking.reservation_num_low
      } else {
        acc.push({
          week: weekKey,
          reservation_num: booking.reservation_num,
          reservation_num_up: booking.reservation_num_up,
          reservation_num_low: booking.reservation_num_low,
        })
      }
      return acc
    },
    [] as {
      week: string
      reservation_num: number
      reservation_num_up: number | null
      reservation_num_low: number | null
    }[],
  )

  console.log("[v0] Grouped data - count:", grouped.length, "first item:", grouped[0])

  return grouped.sort((a, b) => new Date(a.week).getTime() - new Date(b.week).getTime())
}

// Growth RPC Functions
export async function getGrowthQuotesPace(params: GrowthRpcParams): Promise<GrowthRpcOutput[]> {
  console.log("[v0] getGrowthQuotesPace called with:", params)
  
  const { data, error } = await supabase.rpc("rpc_growth_quotes_pace_v2", {
    p_hotel_id: params.p_hotel_id,
    p_stay_week_start: params.p_stay_week_start,
    p_room_type_ids: params.p_room_type_ids,
    p_mode: params.p_mode,
    p_include_forecast: params.p_include_forecast,
  })

  if (error) {
    console.error("[v0] Error calling rpc_growth_quotes_pace_v2:", error)
    return []
  }

  console.log("[v0] getGrowthQuotesPace result - count:", data?.length, "first item:", data?.[0])
  return (data as GrowthRpcOutput[]) || []
}

export async function getGrowthBookingsPace(params: GrowthRpcParams): Promise<GrowthRpcOutput[]> {
  console.log("[v0] getGrowthBookingsPace called with:", params)
  
  const { data, error } = await supabase.rpc("rpc_growth_bookings_pace_v2", {
    p_hotel_id: params.p_hotel_id,
    p_stay_week_start: params.p_stay_week_start,
    p_room_type_ids: params.p_room_type_ids,
    p_mode: params.p_mode,
    p_include_forecast: params.p_include_forecast,
  })

  if (error) {
    console.error("[v0] Error calling rpc_growth_bookings_pace_v2:", error)
    return []
  }

  console.log("[v0] getGrowthBookingsPace result - count:", data?.length, "first item:", data?.[0])
  return (data as GrowthRpcOutput[]) || []
}

export async function getGrowthPaceCombined(params: GrowthRpcParams): Promise<GrowthCombinedRpcOutput[]> {
  console.log("[v0] getGrowthPaceCombined called with:", params)
  
  const { data, error } = await supabase.rpc("rpc_growth_combined_v2", {
    p_hotel_id: params.p_hotel_id,
    p_stay_week_start: params.p_stay_week_start,
    p_room_type_ids: params.p_room_type_ids,
    p_mode: params.p_mode,
    p_include_forecast: params.p_include_forecast,
  })

  if (error) {
    console.error("[v0] Error calling rpc_growth_combined_v2:", error)
    return []
  }

  console.log("[v0] getGrowthPaceCombined result - count:", data?.length, "first item:", data?.[0])
  return (data as GrowthCombinedRpcOutput[]) || []
}
