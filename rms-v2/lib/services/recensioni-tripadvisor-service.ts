import { supabase } from "@/lib/supabase/client"

export type RecensioneTripadvisor = {
  id: string
  tripadvisor_review_id: number
  hotel_id: string
  location_id: number
  titolo: string
  testo: string
  valutazione: number
  data_pubblicazione: string
  lingua: string
  url: string
  voti_utili?: number
  tipo_viaggio?: string
  data_viaggio?: string | null
  nome_utente: string
  provenienza_utente?: string | null
  avatar_thumbnail?: string
  avatar_small?: string
  avatar_medium?: string
  avatar_large?: string
  avatar_original?: string
  importato_il: string
  aggiornato_il?: string | null
  hotel_nome: string
}

export type FiltroRecensioni = {
  hotel_id?: string
  ricerca?: string
  valutazione?: number
  data_inizio?: string
  data_fine?: string
  ordinamento?: "recenti" | "vecchie" | "valutazione_alta" | "valutazione_bassa"
}

export type AndamentoRecensioni = {
  periodo: string
  hotel_id: string
  hotel_nome: string
  num_recensioni: number
  media_valutazioni: number
}

/**
 * Conta il numero totale di recensioni Tripadvisor
 */
export async function countRecensioniTripadvisor(): Promise<number> {
  try {
    const { data, error } = await supabase.rpc("count_recensioni_tripadvisor")

    if (error) {
      console.error("Errore nel conteggio delle recensioni:", error)
      throw error
    }

    return data || 0
  } catch (error) {
    console.error("Errore nel conteggio delle recensioni:", error)
    return 0
  }
}

/**
 * Recupera tutte le recensioni Tripadvisor dal database
 */
export async function getAllRecensioniTripadvisor(): Promise<RecensioneTripadvisor[]> {
  try {
    console.log("Chiamata a getAllRecensioniTripadvisor")

    // Prima verifica se ci sono recensioni
    const count = await countRecensioniTripadvisor()
    console.log(`Conteggio recensioni: ${count}`)

    if (count === 0) {
      console.log("Nessuna recensione trovata")
      return []
    }

    // Chiama la funzione RPC per ottenere tutte le recensioni
    const { data, error } = await supabase.rpc("get_recensioni_tripadvisor", {
      p_limit: 1000, // Valore alto per ottenere tutte le recensioni
      p_offset: 0,
    })

    if (error) {
      console.error("Errore RPC get_recensioni_tripadvisor:", error)
      throw error
    }

    console.log(`Recensioni recuperate: ${data?.length || 0}`)
    return data as RecensioneTripadvisor[]
  } catch (error) {
    console.error("Errore nel recupero delle recensioni Tripadvisor:", error)
    return []
  }
}

/**
 * Recupera le recensioni Tripadvisor dal database con paginazione
 * @param pagina Numero di pagina
 * @param per_pagina Numero di elementi per pagina
 */
export async function getRecensioniTripadvisor(
  pagina = 1,
  per_pagina = 10,
): Promise<{ recensioni: RecensioneTripadvisor[]; totale: number }> {
  try {
    // Calcola l'offset per la paginazione
    const offset = (pagina - 1) * per_pagina

    // Chiama la funzione RPC
    const { data, error } = await supabase.rpc("get_recensioni_tripadvisor", {
      p_limit: per_pagina,
      p_offset: offset,
    })

    if (error) {
      console.error("Errore RPC get_recensioni_tripadvisor:", error)
      throw error
    }

    // Ottieni il conteggio totale delle recensioni
    const totalCount = await countRecensioniTripadvisor()

    return {
      recensioni: data as RecensioneTripadvisor[],
      totale: totalCount,
    }
  } catch (error) {
    console.error("Errore nel recupero delle recensioni Tripadvisor:", error)
    return { recensioni: [], totale: 0 }
  }
}

/**
 * Recupera le recensioni di un hotel specifico
 * @param hotelId ID dell'hotel
 * @param pagina Numero di pagina
 * @param per_pagina Numero di elementi per pagina
 */
export async function getRecensioniHotel(
  hotelId: string,
  pagina = 1,
  per_pagina = 10,
): Promise<{ recensioni: RecensioneTripadvisor[]; totale: number }> {
  try {
    // Calcola l'offset per la paginazione
    const offset = (pagina - 1) * per_pagina

    // Chiama la funzione RPC specifica per hotel
    const { data, error } = await supabase.rpc("get_recensioni_hotel", {
      p_hotel_id: hotelId,
      p_limit: per_pagina,
      p_offset: offset,
    })

    if (error) {
      console.error("Errore RPC get_recensioni_hotel:", error)
      throw error
    }

    // Ottieni il conteggio totale delle recensioni per questo hotel
    const { count: totalCount, error: countError } = await supabase
      .from("tripadvisor_recensioni")
      .select("*", { count: "exact", head: true })
      .eq("hotel_id", hotelId)

    if (countError) {
      console.error("Errore nel conteggio delle recensioni per hotel:", countError)
      throw countError
    }

    return {
      recensioni: data as RecensioneTripadvisor[],
      totale: totalCount || 0,
    }
  } catch (error) {
    console.error(`Errore nel recupero delle recensioni per l'hotel ${hotelId}:`, error)
    return { recensioni: [], totale: 0 }
  }
}

/**
 * Recupera i dati di andamento delle recensioni per hotel
 * @param dataInizio Data di inizio del periodo
 * @param dataFine Data di fine del periodo
 * @param hotelIds Array di ID degli hotel da filtrare
 */
export async function getAndamentoRecensioni(
  dataInizio?: Date,
  dataFine?: Date,
  hotelIds?: string[],
): Promise<AndamentoRecensioni[]> {
  try {
    const { data, error } = await supabase.rpc("get_recensioni_andamento", {
      p_data_inizio: dataInizio ? dataInizio.toISOString() : null,
      p_data_fine: dataFine ? dataFine.toISOString() : null,
      p_hotel_ids: hotelIds && hotelIds.length > 0 ? hotelIds : null,
    })

    if (error) {
      console.error("Errore RPC get_recensioni_andamento:", error)
      throw error
    }

    return data as AndamentoRecensioni[]
  } catch (error) {
    console.error("Errore nel recupero dell'andamento delle recensioni:", error)
    return []
  }
}

/**
 * Recupera la lista degli hotel disponibili
 */
export async function getHotelDisponibili(): Promise<{ id: string; nome: string }[]> {
  try {
    const { data, error } = await supabase.from("hotel").select("id, nome").order("nome")

    if (error) {
      console.error("Errore nel recupero degli hotel disponibili:", error)
      throw error
    }

    return data.filter((hotel) => hotel.nome.toLowerCase() !== "tutti")
  } catch (error) {
    console.error("Errore nel recupero degli hotel disponibili:", error)
    return []
  }
}
