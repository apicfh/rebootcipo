import { supabase } from "@/lib/supabase/client"

// Tipi per i dati
export interface HotelStrategia {
  id: string
  nome: string
}

export interface StagioneStrategia {
  id: string
  stagione: string
  anno: number
  apertura: string
  chiusura: string
}

export interface TipoCameraStrategia {
  id: string
  nome: string
  tipo: string
  livello: string
  letti: number
  paxmax: number
}

export interface SettimanaStrategia {
  id: string
  nome: string
  inizio: string
  fine: string
}

export interface CreaPrezzoParams {
  idHotel: string
  stagione: string
  cameraId: string
  nomeCamera: string
  prezzo: number
  settimanaId: string
}

export interface CreaPrezzoStoricoParams extends CreaPrezzoParams {
  validoDa: string
  validoA: string | null
}

export interface PrezzoFinale {
  id: string
  id_hotel: string
  nome_hotel: string
  stagione: string
  camera_id: string
  nome_camera: string
  prezzo: number
  valido_da: string
  valido_a: string | null
  settimana_id: string
  settimana_nome: string
  settimana_inizio: string
  settimana_fine: string
}

// Funzioni del servizio
export async function getHotelPerStrategiaPrezzi(): Promise<HotelStrategia[]> {
  try {
    const { data, error } = await supabase.rpc("get_hotel_per_strategia_prezzi")

    if (error) {
      console.error("Errore nel recupero degli hotel:", error)
      throw new Error(`Errore nel recupero degli hotel: ${error.message}`)
    }

    return data || []
  } catch (error) {
    console.error("Errore nel servizio strategia prezzi:", error)
    throw error
  }
}

export async function getStagioniPerHotel(hotelId: string): Promise<StagioneStrategia[]> {
  try {
    const { data, error } = await supabase.rpc("get_stagioni_per_hotel", {
      hotel_id_param: hotelId,
    })

    if (error) {
      console.error("Errore nel recupero delle stagioni:", error)
      throw new Error(`Errore nel recupero delle stagioni: ${error.message}`)
    }

    return data || []
  } catch (error) {
    console.error("Errore nel servizio strategia prezzi:", error)
    throw error
  }
}

export async function getTipiCamerePerHotel(hotelId: string): Promise<TipoCameraStrategia[]> {
  try {
    const { data, error } = await supabase.rpc("get_tipi_camere_per_hotel", {
      hotel_id_param: hotelId,
      categoria_filter: "attivo",
    })

    if (error) {
      console.error("Errore nel recupero dei tipi camera:", error)
      throw new Error(`Errore nel recupero dei tipi camera: ${error.message}`)
    }

    return data || []
  } catch (error) {
    console.error("Errore nel servizio strategia prezzi:", error)
    throw error
  }
}

export async function getSettimanePerStagione(anno: number): Promise<SettimanaStrategia[]> {
  try {
    const { data, error } = await supabase.rpc("get_settimane_per_stagione", {
      anno_param: anno,
    })

    if (error) {
      console.error("Errore nel recupero delle settimane:", error)
      throw new Error(`Errore nel recupero delle settimane: ${error.message}`)
    }

    return data || []
  } catch (error) {
    console.error("Errore nel servizio strategia prezzi:", error)
    throw error
  }
}

export async function createPrezzoFinale(params: CreaPrezzoParams): Promise<string> {
  try {
    console.log("🚀 Creazione prezzo con parametri:", params)

    // Validazione lato client
    if (!params.idHotel || !params.stagione || !params.cameraId || !params.nomeCamera || !params.settimanaId) {
      throw new Error("Parametri mancanti per la creazione del prezzo")
    }

    if (params.prezzo <= 0) {
      throw new Error("Il prezzo deve essere maggiore di zero")
    }

    const { data, error } = await supabase.rpc("create_prezzo_finale", {
      id_hotel_param: params.idHotel,
      stagione_param: params.stagione,
      camera_id_param: params.cameraId,
      nome_camera_param: params.nomeCamera,
      prezzo_param: params.prezzo,
      settimana_id_param: params.settimanaId,
    })

    if (error) {
      console.error("❌ Errore nella creazione del prezzo:", error)

      // Gestisci errori specifici
      if (error.message.includes("Hotel") && error.message.includes("non trovato")) {
        throw new Error("Hotel selezionato non valido")
      }
      if (error.message.includes("Tipo camera") && error.message.includes("non trovato")) {
        throw new Error("Tipo camera selezionato non valido")
      }
      if (error.message.includes("Settimana") && error.message.includes("non trovata")) {
        throw new Error("Settimana selezionata non valida")
      }
      if (error.message.includes("prezzo deve essere maggiore")) {
        throw new Error("Il prezzo deve essere maggiore di zero")
      }
      if (error.message.includes("Could not find the function")) {
        throw new Error("Errore di configurazione del database. Contatta l'amministratore.")
      }

      throw new Error(`Errore nella creazione del prezzo: ${error.message}`)
    }

    if (!data) {
      throw new Error("Nessun ID restituito dalla creazione del prezzo")
    }

    console.log("✅ Prezzo creato con successo, ID:", data)
    return data
  } catch (error) {
    console.error("💥 Errore nel servizio strategia prezzi:", error)
    throw error
  }
}

export async function createPrezziStoricoMultipli(richieste: CreaPrezzoStoricoParams[]): Promise<string[]> {
  try {
    console.log("🚀 Creazione prezzi storici multipli:", richieste.length)

    // Validazione lato client
    if (richieste.length === 0) {
      throw new Error("Nessuna richiesta di creazione prezzo")
    }

    // Verifica che tutte le richieste abbiano i campi obbligatori
    for (const richiesta of richieste) {
      if (
        !richiesta.idHotel ||
        !richiesta.stagione ||
        !richiesta.cameraId ||
        !richiesta.nomeCamera ||
        !richiesta.settimanaId ||
        !richiesta.validoDa
      ) {
        throw new Error("Parametri mancanti per la creazione del prezzo storico")
      }

      if (richiesta.prezzo <= 0) {
        throw new Error("Il prezzo deve essere maggiore di zero")
      }

      if (richiesta.validoA && richiesta.validoA <= richiesta.validoDa) {
        throw new Error("La data di fine validità deve essere successiva alla data di inizio validità")
      }
    }

    const { data, error } = await supabase.rpc("create_prezzi_storico_multipli", {
      richieste: richieste,
    })

    if (error) {
      console.error("❌ Errore nella creazione dei prezzi storici:", error)
      throw new Error(`Errore nella creazione dei prezzi storici: ${error.message}`)
    }

    if (!data) {
      throw new Error("Nessun ID restituito dalla creazione dei prezzi storici")
    }

    console.log("✅ Prezzi storici creati con successo, IDs:", data)
    return data
  } catch (error) {
    console.error("💥 Errore nel servizio strategia prezzi:", error)
    throw error
  }
}

export async function getPrezziFinale(hotelId?: string, stagione?: string): Promise<PrezzoFinale[]> {
  try {
    const { data, error } = await supabase.rpc("get_prezzi_finale", {
      hotel_id_param: hotelId || null,
      stagione_param: stagione || null,
    })

    if (error) {
      console.error("Errore nel recupero dei prezzi finali:", error)
      throw new Error(`Errore nel recupero dei prezzi finali: ${error.message}`)
    }

    return data || []
  } catch (error) {
    console.error("Errore nel servizio strategia prezzi:", error)
    throw error
  }
}
