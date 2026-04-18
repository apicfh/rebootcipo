import { createSupabaseClient } from "@/lib/supabase/client"

export interface DebugSettimaneStep {
  step_number: number
  step_description: string
  count_result: number
  sample_data: string | null
}

export async function debugSettimaneSpecifico(
  hotelNome: string,
  cameraNome: string,
  settimana: string,
  stagione?: string,
): Promise<DebugSettimaneStep[]> {
  const supabase = createSupabaseClient()

  console.log("🔍 Debug settimane parametri:", { hotelNome, cameraNome, settimana, stagione })

  const { data, error } = await supabase.rpc("debug_settimane_specifico", {
    p_hotel_nome: hotelNome,
    p_camera_nome: cameraNome,
    p_settimana: settimana,
    p_stagione: stagione || null,
  })

  if (error) {
    console.error("❌ Errore debug settimane:", error)
    throw error
  }

  console.log("✅ Risultati debug settimane:", data)
  return data || []
}
