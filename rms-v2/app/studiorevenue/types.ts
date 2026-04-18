export interface TimeSeriesData {
  week: string;
  display_date: string;
  anno_corrente: number;
  anno_meno_1: number;
  anno_meno_2: number;
  anno_meno_3: number;
}

export interface Hotel {
  id: string;
  nome: string;
}

export interface Prenotazione {
  id: string;
  oid_pms: number;
  id_hotel: string | null;
  id_cliente: string | null;
  arrivo: string;
  partenza: string;
  totale_soggiorno: number;
  stato_prenotazione: string;
  notti: number | null;
  oid_cliente: number | null;
  tipo_camera: string | null;
  motivoCancellazione: string | null;
  pax: number | null;
  codice_prenotazione: string | null;
  adr_soggiorno: number | null;
  booking_window: number | null;
  motivo_cancellazione: string | null;
  data_prenotazione: string | null;
  camera_id: string | null;
  caparra: number | null;
  cliente_nome: string | null;
  cliente_cognome: string | null;
  cliente_email: string | null;
  cliente_telefono: string | null;
  cliente_cellulare: string | null;
  hotel_nome: string | null;
  settimane: string[] | null;
  stagione: string | null;
  stagione_tariffa: string | null;
}

export interface StagioneTariffaria {
  id: string;
  nome: string;
  data_inizio: string;
  data_fine: string;
  anno: number;
  tipo_stagione: string;
}

export interface KPIData {
  oggi: number;
  oggi_anno_1: number;
  oggi_anno_2: number;
  oggi_anno_3: number;
  ultimi7giorni: number;
  ultimi7giorni_anno_1: number;
  ultimi7giorni_anno_2: number;
  ultimi7giorni_anno_3: number;
  ultimi30giorni: number;
  ultimi30giorni_anno_1: number;
  ultimi30giorni_anno_2: number;
  ultimi30giorni_anno_3: number;
  totaleStazione: number;
  totaleStazione_anno_1: number;
  totaleStazione_anno_2: number;
  totaleStazione_anno_3: number;
}

export type OccupancyDataPoint = {
  date: string;
  display_date: string;
  anno_corrente: number;
  anno_meno_1: number;
  anno_meno_2: number;
  anno_meno_3: number;
};

export type CameraTypeDataPoint = {
  date: string;
  display_date: string;
  [key: string]: string | number;
};

export type PickupDataPoint = {
  date: string;
  display_date: string;
  occupate: number;
  proiezione: number;
  totali: number;
  percentuale_attuale: number;
  percentuale_proiezione: number;
  storico: number | null;
};

export type VisibleSeries = {
  anno_corrente: boolean;
  anno_meno_1: boolean;
  anno_meno_2: boolean;
  anno_meno_3: boolean;
};
