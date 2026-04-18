// Nuovo service per gestire i dati dalla view v_essenziale_preventivi2025
import { createBrowserClient } from "@supabase/ssr"

const supabase = createBrowserClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!)

export interface DomandaTravelbrainFilters {
  creationDateStart?: string
  creationDateEnd?: string
  checkinStart?: string
  checkinEnd?: string
  checkoutStart?: string
  checkoutEnd?: string
  hotelIds?: number[]
  statiIds?: number[]
  showSDLY?: boolean
}

export interface PreventiviTimelineData {
  data_creazione: string // Manteniamo string perché PostgreSQL date viene serializzato come string
  numero_preventivi: number
  hotel_id: number
}

export interface AndamentoPreventiviData {
  data_creazione: string
  numero_preventivi: number
  confermato_si: number
  confermato_no: number
  hotel_id: number
  day_of_week?: number
  week_of_year?: number
}

export interface PressioneDomandaData {
  settimana_inizio: string
  settimana_fine: string
  numero_preventivi: number
  hotel_id: number
  anno_soggiorno: number
}

export interface OperatoriData {
  operatore: string
  numero_preventivi: number
  percentuale: number
}

export interface OperatoriDettaglioData {
  operatore: string
  numero_preventivi: number
  percentuale: number
  media_giornaliera: number
  trend_7_giorni: number
}

export interface HotelData {
  hotel_id: number
  hotel_name: string
}

export interface HeatmapData {
  data_notte: string
  numero_richieste: number
  hotel_id: number
}

export interface HeatmapGiorniRichiestiData {
  day: string
  hotel_id: number
  requests: number
  anno: number
  nome_hotel: string
}

export interface StatoPreventivo {
  id_stato: number
  descrizione: string
  categoria: string
}

export interface HeatmapFilters {
  anni?: number[]
  hotelIds?: number[]
}

export class DomandaTravelbrainService {
  static async getAndamentoPreventivi(filters: DomandaTravelbrainFilters): Promise<AndamentoPreventiviData[]> {
    const { data, error } = await supabase.rpc("get_domandatravelbrain_andamento_preventivi", {
      p_creation_date_start: filters.creationDateStart || null,
      p_creation_date_end: filters.creationDateEnd || null,
      p_checkin_start: filters.checkinStart || null,
      p_checkout_end: filters.checkoutEnd || null,
      p_hotel_ids: filters.hotelIds || null,
      p_stati_ids: filters.statiIds || null,
      p_show_sdly: filters.showSDLY || false,
    })

    if (error) {
      console.error("Errore nel recupero andamento preventivi:", error)
      throw error
    }

    return data || []
  }

  static async getPressioneDomanda(filters: DomandaTravelbrainFilters): Promise<PressioneDomandaData[]> {
    const { data, error } = await supabase.rpc("get_domandatravelbrain_pressione_domanda", {
      p_creation_date_start: filters.creationDateStart || null,
      p_creation_date_end: filters.creationDateEnd || null,
      p_hotel_ids: filters.hotelIds || null,
      p_stati_ids: filters.statiIds || null,
      p_show_sdly: filters.showSDLY || false,
    })

    if (error) {
      console.error("Errore nel recupero pressione domanda:", error)
      throw error
    }

    return data || []
  }

  static async getPreventiviTimeline(filters: DomandaTravelbrainFilters): Promise<PreventiviTimelineData[]> {
    const { data, error } = await supabase.rpc("get_domandatravelbrain_preventivi", {
      p_creation_date_start: filters.creationDateStart || null,
      p_creation_date_end: filters.creationDateEnd || null,
      p_checkin_start: filters.checkinStart || null,
      p_checkout_end: filters.checkoutEnd || null,
      p_hotel_ids: filters.hotelIds || null,
      p_stati_ids: filters.statiIds || null,
    })

    if (error) {
      console.error("Errore nel recupero timeline preventivi:", error)
      throw error
    }

    return data || []
  }

  static async getOperatoriStats(filters: DomandaTravelbrainFilters): Promise<OperatoriData[]> {
    const { data, error } = await supabase.rpc("get_domandatravelbrain_operatori", {
      p_creation_date_start: filters.creationDateStart || undefined,
      p_creation_date_end: filters.creationDateEnd || undefined,
      p_checkin_start: filters.checkinStart || undefined,
      p_checkout_end: filters.checkoutEnd || undefined,
      p_hotel_ids: filters.hotelIds && filters.hotelIds.length > 0 ? filters.hotelIds : undefined,
      p_stati_ids: filters.statiIds && filters.statiIds.length > 0 ? filters.statiIds : undefined,
    })

    if (error) {
      console.error("Errore nel recupero statistiche operatori:", error)
      throw error
    }

    return data || []
  }

  static async getHotels(): Promise<HotelData[]> {
    const { data, error } = await supabase.rpc("get_domandatravelbrain_hotels")

    if (error) {
      console.error("Errore nel recupero lista hotel:", error)
      throw error
    }

    return data || []
  }

  static async getHeatmapData(filters: DomandaTravelbrainFilters): Promise<HeatmapData[]> {
    const { data, error } = await supabase.rpc("get_domandatravelbrain_heatmap", {
      p_creation_date_start: filters.creationDateStart || null,
      p_creation_date_end: filters.creationDateEnd || null,
      p_hotel_ids: filters.hotelIds || null,
      p_stati_ids: filters.statiIds || null,
      p_season_start: "2025-07-01",
      p_season_end: "2025-07-31",
    })

    if (error) {
      console.error("Errore nel recupero dati heatmap:", error)
      throw error
    }

    return data || []
  }

  static async getStatiPreventivi(): Promise<StatoPreventivo[]> {
    const { data, error } = await supabase.rpc("get_domandatravelbrain_stati_preventivi")

    if (error) {
      console.error("Errore nel recupero stati preventivi:", error)
      throw error
    }

    return data || []
  }

  static async getOperatoriDettaglio(filters: DomandaTravelbrainFilters): Promise<OperatoriDettaglioData[]> {
    const { data, error } = await supabase.rpc("get_domandatravelbrain_operatori_dettaglio", {
      p_creation_date_start: filters.creationDateStart || null,
      p_creation_date_end: filters.creationDateEnd || null,
      p_checkin_start: filters.checkinStart || null,
      p_checkout_end: filters.checkoutEnd || null,
      p_hotel_ids: filters.hotelIds || null,
      p_stati_ids: filters.statiIds || null,
    })

    if (error) {
      console.error("Errore nel recupero dettaglio operatori:", error)
      throw error
    }

    return data || []
  }

  static async getHeatmapGiorniRichiesti(filters: HeatmapFilters): Promise<HeatmapGiorniRichiestiData[]> {
    const { data, error } = await supabase.rpc("get_heatmap_giorni_richiesti", {
      p_anni: filters.anni || null,
      p_hotel_ids: filters.hotelIds || null,
    })

    if (error) {
      console.error("Errore nel recupero dati heatmap giorni richiesti:", error)
      throw error
    }

    return data || []
  }

  static async getHotelsTravelbrain(): Promise<{ hotel_id: number; nome_hotel: string }[]> {
    const { data, error } = await supabase.rpc("get_hotels_travelbrain")

    if (error) {
      console.error("Errore nel recupero lista hotel travelbrain:", error)
      throw error
    }

    return data || []
  }

  static async getConteggioPreventiviPressione(
    soggiornoInizio: string | null,
    soggiornoFine: string | null,
    hotelIds: number[] | null,
  ): Promise<number> {
    console.log("[v0] getConteggioPreventiviPressione chiamata con:", {
      p_soggiorno_inizio: soggiornoInizio,
      p_soggiorno_fine: soggiornoFine,
      p_hotel_ids: hotelIds,
      tipo_hotel_ids: typeof hotelIds,
      is_array: Array.isArray(hotelIds),
      lunghezza: hotelIds?.length,
    })

    const { data, error } = await supabase.rpc("get_cardconteggiototalepreventivi_pressione", {
      p_soggiorno_inizio: soggiornoInizio,
      p_soggiorno_fine: soggiornoFine,
      p_hotel_ids: hotelIds,
    })

    console.log("[v0] getConteggioPreventiviPressione risposta:", { data, error })

    if (error) {
      console.error("Errore nel recupero conteggio preventivi totali:", error)
      throw error
    }

    if (data && typeof data === "object" && "count" in data) {
      const result = data as { count: number; details?: any[] }

      if (result.details && result.details.length > 0) {
        console.log("[v0] Preventivi filtrati (count < 10):")
        console.table(result.details)
      }

      return result.count || 0
    }

    return data || 0
  }
}
