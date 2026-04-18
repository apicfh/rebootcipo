import { supabase } from "@/lib/supabase/client"

export interface ScenarioCrescitaData {
  data_soggiorno: string
  occupazione_attuale: number
  capacita_hotel: number
  notti_storiche: number
  notti_recenti: number
  notti_attuali: number
  giorni_rimanenti: number
  trend_storico: number
  trend_recente: number
  trend_attuale: number
}

export interface ProiezioneOccupazione {
  data: string
  storico_costante: number
  storico_ottimistico: number
  storico_pessimistico: number
  recente_costante: number
  recente_ottimistico: number
  recente_pessimistico: number
  attuale_costante: number
  attuale_ottimistico: number
  attuale_pessimistico: number
  occupazione_attuale: number
  capacita_hotel: number
}

export async function getScenariCrescitaOccupazionale(idHotel: string): Promise<ScenarioCrescitaData[]> {
  if (!supabase) {
    console.error("Client Supabase non disponibile")
    return []
  }

  try {
    const { data, error } = await supabase.rpc("get_scenari_crescita_occupazionale", {
      p_id_hotel: idHotel,
    })

    if (error) {
      console.error("Errore nel recupero degli scenari di crescita:", error)
      return []
    }

    return data || []
  } catch (error) {
    console.error("Errore nel recupero degli scenari di crescita:", error)
    return []
  }
}

export function calcolaProiezioniOccupazione(dati: ScenarioCrescitaData[]): ProiezioneOccupazione[] {
  return dati.map((giorno) => {
    const capacita = giorno.capacita_hotel
    const occupazioneAttualeDelGiorno = giorno.occupazione_attuale
    const giorniRimanenti = giorno.giorni_rimanenti

    // Calcola le proiezioni base per ogni scenario
    const proiezioneStoricaBase = Math.min(
      capacita,
      occupazioneAttualeDelGiorno + giorno.trend_storico * giorniRimanenti,
    )
    const proiezioneRecenteBase = Math.min(
      capacita,
      occupazioneAttualeDelGiorno + giorno.trend_recente * giorniRimanenti,
    )
    const proiezioneAttualeBase = Math.min(
      capacita,
      occupazioneAttualeDelGiorno + giorno.trend_attuale * giorniRimanenti,
    )

    // Applica i fattori di crescita DIRETTAMENTE al trend, non alla proiezione totale
    const trendStoricoAccelerato = giorno.trend_storico * 1.2
    const trendStoricoRallentato = giorno.trend_storico * 0.8

    const trendRecenteAccelerato = giorno.trend_recente * 1.2
    const trendRecenteRallentato = giorno.trend_recente * 0.8

    const trendAttualeAccelerato = giorno.trend_attuale * 1.2
    const trendAttualeRallentato = giorno.trend_attuale * 0.8

    // Calcola le proiezioni con i trend modificati
    const storicoOttimistico = Math.min(
      capacita,
      occupazioneAttualeDelGiorno + trendStoricoAccelerato * giorniRimanenti,
    )
    const storicoConstante = proiezioneStoricaBase
    const storicoPessimistico = Math.max(
      occupazioneAttualeDelGiorno,
      Math.min(capacita, occupazioneAttualeDelGiorno + trendStoricoRallentato * giorniRimanenti),
    )

    const recenteOttimistico = Math.min(
      capacita,
      occupazioneAttualeDelGiorno + trendRecenteAccelerato * giorniRimanenti,
    )
    const recenteConstante = proiezioneRecenteBase
    const recentePessimistico = Math.max(
      occupazioneAttualeDelGiorno,
      Math.min(capacita, occupazioneAttualeDelGiorno + trendRecenteRallentato * giorniRimanenti),
    )

    const attualeOttimistico = Math.min(
      capacita,
      occupazioneAttualeDelGiorno + trendAttualeAccelerato * giorniRimanenti,
    )
    const attualeConstante = proiezioneAttualeBase
    const attualePessimistico = Math.max(
      occupazioneAttualeDelGiorno,
      Math.min(capacita, occupazioneAttualeDelGiorno + trendAttualeRallentato * giorniRimanenti),
    )

    return {
      data: giorno.data_soggiorno,
      storico_costante: (storicoConstante / capacita) * 100,
      storico_ottimistico: (storicoOttimistico / capacita) * 100,
      storico_pessimistico: (storicoPessimistico / capacita) * 100,
      recente_costante: (recenteConstante / capacita) * 100,
      recente_ottimistico: (recenteOttimistico / capacita) * 100,
      recente_pessimistico: (recentePessimistico / capacita) * 100,
      attuale_costante: (attualeConstante / capacita) * 100,
      attuale_ottimistico: (attualeOttimistico / capacita) * 100,
      attuale_pessimistico: (attualePessimistico / capacita) * 100,
      occupazione_attuale: (occupazioneAttualeDelGiorno / capacita) * 100,
      capacita_hotel: capacita,
    }
  })
}
