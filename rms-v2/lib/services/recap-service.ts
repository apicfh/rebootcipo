import { createSupabaseClient } from "@/lib/supabase/client"

export interface RecapData {
  hotel_id: string
  hotel_nome: string
  total_roombook: number
  total_invenduto: number
  total_rev: number
}

export interface SettimanasSoggiorno {
  id: string
  inizio: string
  fine: string
  nome: string
  anno: number
}

class RecapService {
  private supabase = createSupabaseClient()

  async getRecapData(filters: {
    hotel_ids?: string[]
    data_inizio?: string
    data_fine?: string
  }): Promise<RecapData[]> {
    try {
      const { data, error } = await this.supabase.rpc("get_recap_data", {
        p_hotel_ids: filters.hotel_ids || null,
        p_data_inizio: filters.data_inizio || null,
        p_data_fine: filters.data_fine || null,
      })

      if (error) {
        console.error("Errore nel recupero dati recap:", error)
        throw error
      }

      return data || []
    } catch (error) {
      console.error("Errore nel servizio recap:", error)
      throw error
    }
  }

  async getAllHotelsForRecap(): Promise<{ id: string; nome: string }[]> {
    try {
      const { data, error } = await this.supabase.from("hotel").select("id, nome").order("nome")

      if (error) {
        console.error("Errore nel recupero hotel:", error)
        throw error
      }

      return data || []
    } catch (error) {
      console.error("Errore nel servizio hotel:", error)
      throw error
    }
  }

  async getSettimanesSoggiorno(anno?: number): Promise<SettimanasSoggiorno[]> {
    try {
      const { data, error } = await this.supabase.rpc("get_settimane_soggiorno", {
        p_anno: anno || null,
      })

      if (error) {
        console.error("Errore nel recupero settimane:", error)
        throw error
      }

      return data || []
    } catch (error) {
      console.error("Errore nel servizio settimane:", error)
      throw error
    }
  }
}

const recapService = new RecapService()

export const getRecapData = (filters: {
  hotel_ids?: string[]
  data_inizio?: string
  data_fine?: string
}) => recapService.getRecapData(filters)

export const getAllHotelsForRecap = () => recapService.getAllHotelsForRecap()

export const getSettimanesSoggiorno = (anno?: number) => recapService.getSettimanesSoggiorno(anno)
