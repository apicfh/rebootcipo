import { supabase } from "@/lib/supabase/client"

export interface Hotel {
  id: string
  nome: string
  numero_camere: number
}

export async function getAllHotels(): Promise<Hotel[]> {
  try {
    const { data, error } = await supabase.from("hotel").select("id, nome, numero_camere").order("nome")

    if (error) {
      console.error("Errore nel recupero degli hotel:", error)
      return []
    }

    return data || []
  } catch (error) {
    console.error("Errore nel recupero degli hotel:", error)
    return []
  }
}
