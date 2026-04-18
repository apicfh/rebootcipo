export interface CallData {
  id: string
  data: string
  ora: string
  esito: string
  durata_secondi: number
  numero_chiamato?: string
  numero_originario?: string
  operatore_chiamante?: string
}

export interface KPIMetrics {
  totaleChiamate: number
  risposte: number
  durataTotale: number
  tassoConversione: number
  topNumeri: Array<{ numero: string; count: number }>
}

export interface HotelNumber {
  hotel_id: string
  hotel_nome: string
  numero_hotel: string
}

export interface CodaDistribution {
  coda_destinazione: string
  count_answered: number
}

export interface ConversionAnalysis {
  categoria: string
  count_chiamate: number
}

export interface TelefonateAutomatico {
  id: string
  data_ora_inizio: string
  data_ora_fine: string
  chiamante: string
  durata_secondi: number
  durata_mmss: string
  stato: string
  coda: string
  agente: string
}

export interface OperatoreStatistiche {
  totale_chiamate: number
  chiamate_risposte: number
  tasso_risposta: number
  giorni_analisi: number
  coda_riferimento: string
}

export interface CodaOperatore {
  coda: string
  count_coda: number
}

export interface SerieTemporaleOperatore {
  data: string
  count_chiamate: number
}

export interface DistribuzioneOraria {
  ora: number
  count_chiamate: number
}

export interface OperatoreOutboundStatistiche {
  totale_chiamate: number
  chiamate_risposte: number
  rapporto_successo: number
  durata_totale_secondi: number
  durata_media_secondi: number
  giorni_analisi: number
}

export interface SerieTemporaleOutbound {
  data: string
  count_chiamate: number
}

export interface ConversioniAgentiStats {
  agente_nome: string
  agente_profilo_senza_sigla: string
  totale_chiamate_agente: number
  prenotazioni_convertite: number
  tasso_conversione: number
  fatturato_generato: number
  giorni_media_cottura: number
}

export interface ConversioniAreaItem {
  area_id: string
  nome_area: string
  totale_chiamate: number
  totale_chiamate_risposte: number
  totale_chiamate_che_hanno_portato_a_conversione: number
  conversion_rate: number
}

export interface DrilldownItem {
  prenotazione_id: string
  hotel_nome: string
  data_prenotazione: string
  arrivo: string
  telefono_normalizzato_matchato: string
  tipo_chiamata: string
  data_chiamata: string
  ora_chiamata: string
  durata_secondi: number
  agente: string
  esito: string
}

export type ActiveTab = 'ricevute' | 'effettuate' | 'operatori' | 'conversioni' | 'conversioni_area'
export type SortColumn = 'chiamate' | 'prenotazioni' | 'tasso' | null
export type SortDir = 'asc' | 'desc'
export type CriterioAttribuzione = 'primo-contatto' | 'durata-massima' | 'ogni-contatto'
export type ModeConversioniArea = 'all_calls' | 'answered_calls'
