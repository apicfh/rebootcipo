export interface HotelType {
  id: string
  nome: string
  numero_camere: number
}

export interface PrenotazioneType {
  id: string
  id_hotel: string
  arrivo: string
  partenza: string
  notti: number
  totale_soggiorno: number
  stato_prenotazione: string
  adr_soggiorno: number
  data_prenotazione?: string
  tipo_camera?: string
}

export interface RisultatoType {
  nottiDisponibili: number
  nottiPrenotate: number
  fatturato: number
  adr: number
  tassoOccupazione: number
}

export interface RisultatoPerHotelType {
  id_hotel: string
  nome_hotel: string
  nottiDisponibili: number
  nottiPrenotate: number
  fatturato: number
  adr: number
  tassoOccupazione: number
}

export interface RisultatoPerPeriodoType {
  periodo: string
  nottiDisponibili: number
  nottiPrenotate: number
  fatturato: number
  adr: number
  tassoOccupazione: number
}
