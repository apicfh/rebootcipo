import { supabase } from "@/lib/supabase/client"

export interface Opzione2026 {
  id: number
  created_at: string
  id_hotel: string
  nome_hotel: string
  nome: string
  cellulare: string
  email: string
  note: string
}

export interface Statistica2026 {
  data: string
  id_hotel: string
  nome_hotel: string
  totale_opzioni: number
}

export async function getOpzioni2026Lista(): Promise<Opzione2026[]> {
  try {
    const { data, error } = await supabase.rpc("get_opzioni_2026_lista")

    if (error) {
      console.error("Errore nel recupero delle opzioni 2026:", error)
      return []
    }

    return data || []
  } catch (error) {
    console.error("Errore nel recupero delle opzioni 2026:", error)
    return []
  }
}

export async function getOpzioni2026Statistiche(): Promise<Statistica2026[]> {
  try {
    const { data, error } = await supabase.rpc("get_opzioni_2026_statistiche")

    if (error) {
      console.error("Errore nel recupero delle statistiche opzioni 2026:", error)
      return []
    }

    console.log("Dati statistiche dal database:", data) // Debug

    return data || []
  } catch (error) {
    console.error("Errore nel recupero delle statistiche opzioni 2026:", error)
    return []
  }
}

export async function updateOpzione2026(
  id: number,
  data: {
    id_hotel: string
    nome: string
    cellulare: string
    email: string
    note: string
  },
): Promise<boolean> {
  try {
    const { data: result, error } = await supabase.rpc("update_opzione_2026", {
      p_id: id,
      p_id_hotel: data.id_hotel,
      p_nome: data.nome,
      p_cellulare: data.cellulare,
      p_email: data.email,
      p_note: data.note,
    })

    if (error) {
      console.error("Errore nell'aggiornamento dell'opzione:", error)
      return false
    }

    return result || false
  } catch (error) {
    console.error("Errore nell'aggiornamento dell'opzione:", error)
    return false
  }
}

export async function deleteOpzione2026(id: number): Promise<boolean> {
  try {
    const { data: result, error } = await supabase.rpc("delete_opzione_2026", {
      p_id: id,
    })

    if (error) {
      console.error("Errore nell'eliminazione dell'opzione:", error)
      return false
    }

    return result || false
  } catch (error) {
    console.error("Errore nell'eliminazione dell'opzione:", error)
    return false
  }
}
