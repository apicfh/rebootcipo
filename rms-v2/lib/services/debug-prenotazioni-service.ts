import { createSupabaseClient } from "@/lib/supabase/client"

export interface DebugStep {
  step_number: number
  step_description: string
  count_result: number
  sample_data: string | null
}

export async function debugPrenotazioniStepByStep(
  hotelNome: string,
  cameraNome: string,
  settimana: string,
  stagione?: string,
): Promise<DebugStep[]> {
  const supabase = createSupabaseClient()

  console.log("🔍 Debug parametri:", { hotelNome, cameraNome, settimana, stagione })

  const { data, error } = await supabase.rpc("debug_prenotazioni_step_by_step", {
    p_hotel_nome: hotelNome,
    p_camera_nome: cameraNome,
    p_settimana: settimana,
    p_stagione: stagione || null,
  })

  if (error) {
    console.error("❌ Errore debug prenotazioni:", error)
    throw error
  }

  console.log("✅ Risultati debug:", data)
  return data || []
}
