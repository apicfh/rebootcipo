import { createBrowserClient } from "@supabase/ssr"

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

// Crea un client browser per l'uso client-side
export const supabase = createBrowserClient(supabaseUrl, supabaseAnonKey)

export const createClient = () => {
  return createBrowserClient(supabaseUrl, supabaseAnonKey)
}

// Manteniamo questa funzione per compatibilità con il codice esistente
export const createSupabaseClient = () => {
  return createBrowserClient(supabaseUrl, supabaseAnonKey)
}
