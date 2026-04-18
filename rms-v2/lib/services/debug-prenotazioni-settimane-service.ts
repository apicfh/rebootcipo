import { createClient } from "@/lib/supabase/client"

export interface DebugPrenotazioniSettimaneResult {
  step_name: string
  count_result: number
  sample_data: any
}

export async function debugPrenotazioniSettimaneLink(
  hotelId: string,
  cameraId: string,
  settimanaId: string,
): Promise<DebugPrenotazioniSettimaneResult[]> {
  const supabase = createClient()

  try {
    const { data, error } = await supabase.rpc("debug_prenotazioni_settimane_link", {
      p_hotel_id: hotelId,
      p_camera_id: cameraId,
      p_settimana_id: settimanaId,
    })

    if (error) {
      console.error("Errore debug prenotazioni-settimane:", error)
      throw error
    }

    return data || []
  } catch (error) {
    console.error("Errore nel debug prenotazioni-settimane:", error)
    throw error
  }
}
