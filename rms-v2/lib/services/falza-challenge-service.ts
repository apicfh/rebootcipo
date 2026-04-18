import { supabase } from "@/lib/supabase/client"

export interface FalzaChallengeData {
  nome_hotel: string
  id_hotel: string
  mese: number
  giorno: number
  data_formato: string
  prenotazioni_2024: number
  prenotazioni_2025: number
  differenza: number
}

export async function getFalzaChallengeData(date?: string): Promise<FalzaChallengeData[]> {
  const formattedDate = date || new Date().toISOString().split("T")[0]

  const { data, error } = await supabase.rpc("get_falza_challenge", { p_date: formattedDate })

  if (error) {
    console.error("Errore nel recupero dei dati Falza Challenge:", error)
    return []
  }

  return data || []
}

export async function getFalzaChallengeDataByHotel(hotelId: string, date?: string): Promise<FalzaChallengeData[]> {
  const formattedDate = date || new Date().toISOString().split("T")[0]

  const { data, error } = await supabase.rpc("get_falza_challenge_by_hotel", {
    p_hotel_id: hotelId,
    p_date: formattedDate,
  })

  if (error) {
    console.error("Errore nel recupero dei dati Falza Challenge per hotel:", error)
    return []
  }

  return data || []
}

export async function getFalzaChallengeForCurrentDay(): Promise<FalzaChallengeData[]> {
  const today = new Date().toISOString().split("T")[0]

  return getFalzaChallengeData(today)
}
