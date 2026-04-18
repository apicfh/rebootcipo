import { supabase } from "@/lib/supabase/client"

export interface DebugStep {
  step_name: string
  count_result: number
  sample_data: any
}

export async function debugPrenotazioniAnalisiPrezzo(
  hotel_id: string,
  camera_id: string,
  settimana_id: string,
  stagione?: string,
): Promise<DebugStep[]> {
  if (!supabase) {
    throw new Error("Client Supabase non disponibile")
  }

  try {
    console.log("🔍 Debug prenotazioni con parametri:", { hotel_id, camera_id, settimana_id, stagione })

    const { data, error } = await supabase.rpc("debug_prenotazioni_analisi_prezzo", {
      p_hotel_id: hotel_id,
      p_camera_id: camera_id,
      p_settimana_id: settimana_id,
      p_stagione: stagione,
    })

    if (error) {
      console.error("Errore nel debug:", error)
      throw error
    }

    console.log("🔍 Risultati debug:", data)
    return data || []
  } catch (error) {
    console.error("Errore nel debug:", error)
    throw error
  }
}
