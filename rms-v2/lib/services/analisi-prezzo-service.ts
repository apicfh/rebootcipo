import { supabase } from "@/lib/supabase/client"

// Interfacce per i dati
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
  stagione: string
  nome_camera: string
}

export interface DatoPrenotazione {
  data_prenotazione: string
  numero_prenotazioni: number
  fatturato: number
  stato_prenotazione: string
  arrivo: string
  partenza: string
}

export interface RangeTemporale {
  inizio: string
  fine: string
  stagione_apertura: string
  stagione_chiusura: string
}

export interface DatiAnalisiPrezzo {
  prezzi: DatoPrezzo[]
  prenotazioni: DatoPrenotazione[]
  range_temporale: RangeTemporale
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

// Funzione per ottenere i filtri disponibili
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

// Funzione per ottenere i dati dell'analisi prezzi
export async function getDatiAnalisiPrezzo(
  hotel_id: string,
  camera_id: string,
  settimana_id: string,
  stagione?: string,
  includiStato8 = false,
): Promise<DatiAnalisiPrezzo> {
  if (!supabase) {
    throw new Error("Client Supabase non disponibile")
  }

  try {
    console.log("📊 Chiamata RPC analisi prezzo con parametri:", {
      hotel_id,
      camera_id,
      settimana_id,
      stagione,
      includiStato8,
    })

    const { data, error } = await supabase.rpc("get_analisi_prezzo_semplificata", {
      p_hotel_id: hotel_id,
      p_camera_id: camera_id,
      p_settimana_id: settimana_id,
      p_stagione: stagione,
      p_includi_stato_8: includiStato8,
    })

    if (error) {
      console.error("❌ Errore nel recupero dei dati:", error)
      throw error
    }

    if (!data || data.length === 0) {
      console.log("⚠️ Nessun dato restituito dalla RPC")
      return {
        prezzi: [],
        prenotazioni: [],
        range_temporale: {
          inizio: "",
          fine: "",
          stagione_apertura: "",
          stagione_chiusura: "",
        },
      }
    }

    const result = data[0]

    // Validazione e conversione dati
    const prezzi = (result.prezzi || []).map((p: any) => ({
      ...p,
      prezzo: Number(p.prezzo) || 0,
    }))

    const prenotazioni = (result.prenotazioni || []).map((p: any) => ({
      ...p,
      numero_prenotazioni: Number(p.numero_prenotazioni) || 0,
      fatturato: Number(p.fatturato) || 0,
    }))

    const range_temporale = result.range_temporale || {
      inizio: "",
      fine: "",
      stagione_apertura: "",
      stagione_chiusura: "",
    }

    console.log("✅ Dati processati:", {
      prezzi: prezzi.length,
      prenotazioni: prenotazioni.length,
      range: range_temporale,
    })

    return {
      prezzi,
      prenotazioni,
      range_temporale,
    }
  } catch (error) {
    console.error("❌ Errore nel recupero dei dati:", error)
    throw error
  }
}

// Colori predefiniti per i set di dati
export const COLORI_SET = [
  { primario: "#ef4444", secondario: "#dc2626" }, // Rosso
  { primario: "#3b82f6", secondario: "#2563eb" }, // Blu
  { primario: "#10b981", secondario: "#059669" }, // Verde
  { primario: "#f59e0b", secondario: "#d97706" }, // Arancione
  { primario: "#8b5cf6", secondario: "#7c3aed" }, // Viola
  { primario: "#06b6d4", secondario: "#0891b2" }, // Ciano
]

// Funzione per generare il nome display di un filtro
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
