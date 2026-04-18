import { supabase } from "@/lib/supabase/client"

// Interfacce esistenti...
export interface HotelFiltro {
  id: string
  nome: string
  nome_completo: string
}

export interface StagioneFiltro {
  id: string
  hotel_id: string
  anno: number
  stagione: string
  apertura: string
  chiusura: string
}

export interface SettimanaFiltro {
  id: string
  nome: string
  inizio: string
  fine: string
  anno: number
}

export interface TipoCameraFiltro {
  id: string
  nome: string
  id_hotel: string
  categoria: string
  livello: string
  tipo: string
}

export interface FiltriAnalisiPrezzo {
  hotels: HotelFiltro[]
  stagioni: StagioneFiltro[]
  settimane: SettimanaFiltro[]
  tipi_camere: TipoCameraFiltro[]
}

export interface DatoPrezzo {
  data: string
  prezzo: number
  valido_da: string
  valido_a: string
}

export interface DatoPrenotazione {
  settimana_prenotazione: string
  numero_prenotazioni: number
  fatturato_totale: number
  periodo_soggiorno?: string // ✅ Nuovo campo per debug
}

export interface DatiAnalisiPrezzo {
  prezzi: DatoPrezzo[]
  prenotazioni: DatoPrenotazione[]
}

export interface FiltroSelezionato {
  id: string
  hotel_id: string
  camera_id: string
  settimana_id: string
  stagione?: string
  colore: string
  nome_display: string
}

// Funzione per ottenere i filtri disponibili (invariata)
export async function getFiltriAnalisiPrezzo(): Promise<FiltriAnalisiPrezzo> {
  if (!supabase) {
    throw new Error("Client Supabase non disponibile")
  }

  try {
    const { data, error } = await supabase.rpc("get_filtri_analisi_prezzo")

    if (error) {
      console.error("Errore nel recupero dei filtri:", error)
      throw error
    }

    if (!data || data.length === 0) {
      return {
        hotels: [],
        stagioni: [],
        settimane: [],
        tipi_camere: [],
      }
    }

    const result = data[0]
    return {
      hotels: result.hotels || [],
      stagioni: result.stagioni || [],
      settimane: result.settimane || [],
      tipi_camere: result.tipi_camere || [],
    }
  } catch (error) {
    console.error("Errore nel recupero dei filtri:", error)
    throw error
  }
}

// ✅ Funzione corretta con logica semplificata
export async function getDatiAnalisiPrezzo(
  hotel_id: string,
  camera_id: string,
  settimana_id: string,
  stagione?: string,
): Promise<DatiAnalisiPrezzo> {
  if (!supabase) {
    throw new Error("Client Supabase non disponibile")
  }

  try {
    console.log("📊 Chiamata RPC CORRETTA con parametri:", {
      hotel_id,
      camera_id,
      settimana_id,
      stagione,
    })

    // ✅ Usa la funzione corretta
    const { data, error } = await supabase.rpc("get_dati_analisi_prezzo_fixed", {
      p_hotel_id: hotel_id,
      p_camera_id: camera_id,
      p_settimana_id: settimana_id,
      p_stagione: stagione,
    })

    if (error) {
      console.error("❌ Errore nel recupero dei dati:", error)
      throw error
    }

    console.log("📊 Risposta RPC grezza:", data)

    if (!data || data.length === 0) {
      console.log("⚠️ Nessun dato restituito dalla RPC")
      return {
        prezzi: [],
        prenotazioni: [],
      }
    }

    const result = data[0]
    console.log("📊 Primo elemento della risposta:", result)

    // Validazione e conversione dati
    const prezzi = (result.prezzi || []).map((p: any) => ({
      ...p,
      prezzo: Number(p.prezzo) || 0,
    }))

    const prenotazioni = (result.prenotazioni || []).map((p: any) => ({
      ...p,
      numero_prenotazioni: Number(p.numero_prenotazioni) || 0,
      fatturato_totale: Number(p.fatturato_totale) || 0,
    }))

    console.log("✅ Dati finali processati:", {
      prezzi: prezzi.length,
      prenotazioni: prenotazioni.length,
    })

    // ✅ Debug aggiuntivo per prenotazioni
    if (prenotazioni.length > 0) {
      console.log("🏨 Prime 3 prenotazioni:", prenotazioni.slice(0, 3))
    }

    return {
      prezzi,
      prenotazioni,
    }
  } catch (error) {
    console.error("❌ Errore nel recupero dei dati:", error)
    throw error
  }
}

// Funzioni di utilità esistenti...
export const COLORI_SET = [
  { primario: "#ef4444", secondario: "#dc2626" }, // Rosso
  { primario: "#3b82f6", secondario: "#2563eb" }, // Blu
  { primario: "#10b981", secondario: "#059669" }, // Verde
  { primario: "#f59e0b", secondario: "#d97706" }, // Arancione
  { primario: "#8b5cf6", secondario: "#7c3aed" }, // Viola
  { primario: "#06b6d4", secondario: "#0891b2" }, // Ciano
]

export function generaNomeDisplay(
  hotel: HotelFiltro | undefined,
  camera: TipoCameraFiltro | undefined,
  settimana: SettimanaFiltro | undefined,
  stagione: StagioneFiltro | undefined,
): string {
  const parti = []

  if (hotel) parti.push(hotel.nome)
  if (camera) parti.push(camera.nome)
  if (settimana) parti.push(settimana.nome)
  if (stagione) parti.push(stagione.stagione)

  return parti.join(" - ")
}

// ✅ Nuova funzione di debug per verificare dati
export async function debugAnalisiPrezzo(hotel_id: string, camera_id: string, settimana_id: string): Promise<any> {
  if (!supabase) {
    throw new Error("Client Supabase non disponibile")
  }

  try {
    const { data, error } = await supabase.rpc("debug_analisi_prezzo", {
      p_hotel_id: hotel_id,
      p_camera_id: camera_id,
      p_settimana_id: settimana_id,
    })

    if (error) {
      console.error("Errore debug:", error)
      throw error
    }

    return data
  } catch (error) {
    console.error("Errore debug:", error)
    throw error
  }
}
