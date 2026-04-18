import { createSupabaseClient } from "@/lib/supabase/client"

export interface ChiamateAggregato {
  data: string
  descrizione: string
  chiamate_ricevute: number
  chiamate_risposte: number
  chiamate_non_risposte: number
  chiamate_timeout: number
  attesa_media: number
  durata_media: number
  percentuale_risposta: number
}

export interface DescrizioneTelefonate {
  descrizione: string
}

export interface StatsData {
  totaleChiamate: number
  totaleRisposte: number
  percentualeRisposta: number
  attesaMedia: number
  durataMedia: number
}

export class TelefonateAutoService {
  private supabase = createSupabaseClient()

  async getChiamateAggregato(dataInizio: Date, dataFine: Date, descrizione?: string): Promise<ChiamateAggregato[]> {
    try {
      const { data, error } = await this.supabase.rpc("get_chiamate_aggregato_periodo", {
        data_inizio: dataInizio.toISOString().split("T")[0],
        data_fine: dataFine.toISOString().split("T")[0],
        p_descrizione: descrizione || null,
      })

      if (error) {
        console.error("Errore RPC get_chiamate_aggregato_periodo:", error)
        throw new Error(`Errore nel caricamento dei dati: ${error.message}`)
      }

      return data || []
    } catch (error) {
      console.error("Errore getChiamateAggregato:", error)
      throw error
    }
  }

  async getDescrizioni(): Promise<DescrizioneTelefonate[]> {
    try {
      const { data, error } = await this.supabase.rpc("get_descrizioni_telefonate")

      if (error) {
        console.error("Errore RPC get_descrizioni_telefonate:", error)
        throw new Error(`Errore nel caricamento delle descrizioni: ${error.message}`)
      }

      return data || []
    } catch (error) {
      console.error("Errore getDescrizioni:", error)
      throw error
    }
  }

  calculateStats(dati: ChiamateAggregato[]): StatsData {
    if (dati.length === 0) {
      return {
        totaleChiamate: 0,
        totaleRisposte: 0,
        percentualeRisposta: 0,
        attesaMedia: 0,
        durataMedia: 0,
      }
    }

    const totaleChiamate = dati.reduce((sum, item) => sum + item.chiamate_ricevute, 0)
    const totaleRisposte = dati.reduce((sum, item) => sum + item.chiamate_risposte, 0)
    const percentualeRisposta = totaleChiamate > 0 ? (totaleRisposte / totaleChiamate) * 100 : 0

    // Calcola medie ponderate
    let sommaAttesaPonderata = 0
    let sommaDurataPonderata = 0
    let pesoTotaleAttesa = 0
    let pesoTotaleDurata = 0

    dati.forEach((item) => {
      if (item.attesa_media > 0 && item.chiamate_ricevute > 0) {
        sommaAttesaPonderata += item.attesa_media * item.chiamate_ricevute
        pesoTotaleAttesa += item.chiamate_ricevute
      }
      if (item.durata_media > 0 && item.chiamate_risposte > 0) {
        sommaDurataPonderata += item.durata_media * item.chiamate_risposte
        pesoTotaleDurata += item.chiamate_risposte
      }
    })

    const attesaMedia = pesoTotaleAttesa > 0 ? sommaAttesaPonderata / pesoTotaleAttesa : 0
    const durataMedia = pesoTotaleDurata > 0 ? sommaDurataPonderata / pesoTotaleDurata : 0

    return {
      totaleChiamate,
      totaleRisposte,
      percentualeRisposta: Math.round(percentualeRisposta * 100) / 100,
      attesaMedia: Math.round(attesaMedia * 100) / 100,
      durataMedia: Math.round(durataMedia * 100) / 100,
    }
  }

  formatChartData(dati: ChiamateAggregato[]) {
    return dati.map((item) => ({
      data: item.data,
      descrizione: item.descrizione,
      chiamate_ricevute: item.chiamate_ricevute,
      chiamate_risposte: item.chiamate_risposte,
      chiamate_non_risposte: item.chiamate_non_risposte,
      percentuale_risposta: item.percentuale_risposta,
      attesa_media: item.attesa_media,
      durata_media: item.durata_media,
    }))
  }
}
