import { supabase } from "@/lib/supabase/client"
import { addDays, format, parseISO, differenceInDays, isWithinInterval } from "date-fns"
import { it } from "date-fns/locale"

// Verifica che il client Supabase sia disponibile
if (!supabase) {
  console.error("Client Supabase non disponibile. Verifica le variabili d'ambiente.")
}

// Interfacce per i dati
export interface PrenotazioneAnalisi {
  id: string
  id_hotel: string
  hotel_nome: string
  arrivo: string
  partenza: string
  totale_soggiorno: number
  stato_prenotazione: string
  notti: number
  tipo_camera: string
  pax: number
  adr_soggiorno: number
  booking_window: number
  data_prenotazione: string
}

export interface HotelCapienza {
  id: string
  nome: string
  numero_camere: number
}

export interface BookingPace {
  settimana: string
  numero_prenotazioni: number
  camere_prenotate: number
  valore_prenotazioni: number
}

export interface OccupazioneHotel {
  id_hotel: string
  hotel_nome: string
  capacita_totale: number
  camere_notti_prenotate: number
  percentuale_occupazione: number
  adr_medio: number
  fatturato_confermato: number
  fatturato_previsto: number
}

export interface OccupazionePeriodo {
  periodo_inizio: string
  periodo_fine: string
  capacita_totale: number
  camere_notti_prenotate: number
  percentuale_occupazione: number
  adr_medio: number
  fatturato_confermato: number
  fatturato_previsto: number
  prenotazioni_brevi: number // Prenotazioni di 5 notti o meno
  percentuale_prenotazioni_brevi: number
}

export interface BucoPlanning {
  id_hotel: string
  hotel_nome: string
  data_inizio: string
  data_fine: string
  durata_notti: number
  camere_disponibili: number
  percentuale_disponibilita: number
  prenotazioni_brevi: number
  percentuale_prenotazioni_brevi: number
  rischio: "alto" | "medio" | "basso"
}

export interface ScenarioPrevisionale {
  tipo: "ottimistico" | "realistico" | "conservativo"
  occupazione_prevista: number
  fatturato_previsto: number
  adr_previsto: number
  fattore_moltiplicativo: number
}

// Funzione per recuperare le prenotazioni per l'analisi
export async function getPrenotazioniPerAnalisi(dataInizio = "2024-10-01"): Promise<PrenotazioneAnalisi[]> {
  if (!supabase) {
    console.error("Client Supabase non disponibile. Impossibile recuperare le prenotazioni.")
    return []
  }

  const dataOggi = format(new Date(), "yyyy-MM-dd")

  try {
    const { data, error } = await supabase
      .from("prenotazioni")
      .select(`
        id,
        id_hotel,
        hotel_nome,
        arrivo,
        partenza,
        totale_soggiorno,
        stato_prenotazione,
        notti,
        tipo_camera,
        pax,
        adr_soggiorno,
        booking_window,
        data_prenotazione
      `)
      .gte("data_prenotazione", dataInizio)
      .lte("data_prenotazione", dataOggi)
      .gte("arrivo", "2025-06-07")
      .lte("partenza", "2025-09-05")
      .neq("stato_prenotazione", "8") // Escludiamo solo le prenotazioni con stato "8"

    if (error) {
      console.error("Errore nel recupero delle prenotazioni:", error)
      return []
    }

    return data || []
  } catch (error) {
    console.error("Errore nel recupero delle prenotazioni:", error)
    return []
  }
}

// Funzione per recuperare la capienza degli hotel
export async function getCapienzaHotel(): Promise<HotelCapienza[]> {
  if (!supabase) {
    console.error("Client Supabase non disponibile. Impossibile recuperare la capienza degli hotel.")
    return []
  }

  try {
    const { data, error } = await supabase.from("hotel").select("id, nome, numero_camere")

    if (error) {
      console.error("Errore nel recupero della capienza degli hotel:", error)
      return []
    }

    return data || []
  } catch (error) {
    console.error("Errore nel recupero della capienza degli hotel:", error)
    return []
  }
}

// Funzione per calcolare il booking pace settimanale
export function calcolaBookingPace(prenotazioni: PrenotazioneAnalisi[]): BookingPace[] {
  // Raggruppa le prenotazioni per settimana
  const prenotazioniPerSettimana: Record<
    string,
    {
      numero_prenotazioni: number
      camere_prenotate: number
      valore_prenotazioni: number
    }
  > = {}

  prenotazioni.forEach((prenotazione) => {
    const dataPrenotazione = parseISO(prenotazione.data_prenotazione)
    const settimana = format(dataPrenotazione, "yyyy-ww", { locale: it })

    if (!prenotazioniPerSettimana[settimana]) {
      prenotazioniPerSettimana[settimana] = {
        numero_prenotazioni: 0,
        camere_prenotate: 0,
        valore_prenotazioni: 0,
      }
    }

    prenotazioniPerSettimana[settimana].numero_prenotazioni += 1
    prenotazioniPerSettimana[settimana].camere_prenotate += 1
    prenotazioniPerSettimana[settimana].valore_prenotazioni += prenotazione.totale_soggiorno || 0
  })

  // Converti in array e ordina per settimana
  return Object.entries(prenotazioniPerSettimana)
    .map(([settimana, dati]) => ({
      settimana,
      ...dati,
    }))
    .sort((a, b) => a.settimana.localeCompare(b.settimana))
}

// Funzione per calcolare l'occupazione attuale e prevista per hotel
export function calcolaOccupazioneHotel(
  prenotazioni: PrenotazioneAnalisi[],
  hotel: HotelCapienza[],
): OccupazioneHotel[] {
  const risultati: OccupazioneHotel[] = []

  // Periodo della stagione estiva
  const dataInizio = parseISO("2025-06-07")
  const dataFine = parseISO("2025-09-05")
  const giorniStagione = differenceInDays(dataFine, dataInizio) + 1

  // Mappa per tenere traccia delle prenotazioni per hotel
  const prenotazioniPerHotel: Record<string, PrenotazioneAnalisi[]> = {}

  // Raggruppa le prenotazioni per hotel
  prenotazioni.forEach((prenotazione) => {
    if (!prenotazioniPerHotel[prenotazione.id_hotel]) {
      prenotazioniPerHotel[prenotazione.id_hotel] = []
    }
    prenotazioniPerHotel[prenotazione.id_hotel].push(prenotazione)
  })

  // Calcola l'occupazione per ogni hotel
  hotel.forEach((h) => {
    const prenotazioniHotel = prenotazioniPerHotel[h.id] || []

    // Calcola il totale di camere-notti prenotate
    let camereNottiPrenotate = 0
    prenotazioniHotel.forEach((p) => {
      // Usa il campo notti della prenotazione
      camereNottiPrenotate += p.notti || 0
    })

    // Calcola la capacità totale in camere-notti
    const capacitaTotale = h.numero_camere * giorniStagione

    // Calcola la percentuale di occupazione
    const percentualeOccupazione = capacitaTotale > 0 ? (camereNottiPrenotate / capacitaTotale) * 100 : 0

    // Calcola ADR medio
    const adrMedio =
      prenotazioniHotel.length > 0
        ? prenotazioniHotel.reduce((sum, p) => sum + (p.adr_soggiorno || 0), 0) / prenotazioniHotel.length
        : 0

    // Calcola fatturato confermato
    const fatturatoConfermato = prenotazioniHotel.reduce((sum, p) => sum + (p.totale_soggiorno || 0), 0)

    // Stima fatturato previsto (semplice proiezione lineare)
    const fattoreMoltiplicativo = percentualeOccupazione > 0 ? 100 / percentualeOccupazione : 0
    const fatturatoPrevisto = fatturatoConfermato * fattoreMoltiplicativo

    risultati.push({
      id_hotel: h.id,
      hotel_nome: h.nome,
      capacita_totale: capacitaTotale,
      camere_notti_prenotate: camereNottiPrenotate,
      percentuale_occupazione: percentualeOccupazione,
      adr_medio: adrMedio,
      fatturato_confermato: fatturatoConfermato,
      fatturato_previsto: fatturatoPrevisto,
    })
  })

  return risultati
}

// Funzione per calcolare l'occupazione per periodo
export function calcolaOccupazionePeriodo(
  prenotazioni: PrenotazioneAnalisi[],
  hotel: HotelCapienza[],
  periodoInizio = "2025-06-07",
  periodoFine = "2025-09-05",
  intervalloGiorni = 7,
): OccupazionePeriodo[] {
  const risultati: OccupazionePeriodo[] = []
  const dataInizio = parseISO(periodoInizio)
  const dataFine = parseISO(periodoFine)

  // Calcola la capacità totale di tutti gli hotel
  const capacitaTotale = hotel.reduce((sum, h) => sum + h.numero_camere, 0)

  // Genera i periodi
  let dataCorrente = dataInizio
  while (dataCorrente < dataFine) {
    const inizioPeriodo = format(dataCorrente, "yyyy-MM-dd")
    const finePeriodo = format(addDays(dataCorrente, intervalloGiorni - 1), "yyyy-MM-dd")
    const inizioPeriodoDate = dataCorrente
    const finePeriodoDate = addDays(dataCorrente, intervalloGiorni - 1)

    // Filtra le prenotazioni per questo periodo
    const prenotazioniPeriodo = prenotazioni.filter((p) => {
      const arrivo = parseISO(p.arrivo)
      const partenza = parseISO(p.partenza)

      // Verifica se la prenotazione si sovrappone al periodo
      return (
        isWithinInterval(arrivo, { start: inizioPeriodoDate, end: finePeriodoDate }) ||
        isWithinInterval(partenza, { start: inizioPeriodoDate, end: finePeriodoDate }) ||
        (arrivo <= inizioPeriodoDate && partenza >= finePeriodoDate)
      )
    })

    // Calcola le camere-notti prenotate per questo periodo
    let camereNottiPrenotate = 0
    let prenotazioniBrevi = 0

    prenotazioniPeriodo.forEach((p) => {
      const arrivo = parseISO(p.arrivo)
      const partenza = parseISO(p.partenza)

      // Calcola quante notti della prenotazione cadono in questo periodo
      const inizioConteggio = arrivo < inizioPeriodoDate ? inizioPeriodoDate : arrivo
      const fineConteggio = partenza > finePeriodoDate ? finePeriodoDate : partenza

      // Aggiungi un giorno perché differenceInDays non include il giorno finale
      const nottiNelPeriodo = Math.max(0, differenceInDays(fineConteggio, inizioConteggio))

      camereNottiPrenotate += nottiNelPeriodo

      // Conta le prenotazioni brevi (5 notti o meno)
      if (p.notti <= 5) {
        prenotazioniBrevi += 1
      }
    })

    const capacitaPeriodo = capacitaTotale * intervalloGiorni
    const percentualeOccupazione = (camereNottiPrenotate / capacitaPeriodo) * 100
    const percentualePrenotazioniBrevi =
      prenotazioniPeriodo.length > 0 ? (prenotazioniBrevi / prenotazioniPeriodo.length) * 100 : 0

    // Calcola ADR medio per il periodo
    const adrMedio =
      prenotazioniPeriodo.length > 0
        ? prenotazioniPeriodo.reduce((sum, p) => sum + (p.adr_soggiorno || 0), 0) / prenotazioniPeriodo.length
        : 0

    // Calcola fatturato confermato
    const fatturatoConfermato = prenotazioniPeriodo.reduce((sum, p) => sum + (p.totale_soggiorno || 0), 0)

    // Stima fatturato previsto
    const fattoreMoltiplicativo = percentualeOccupazione > 0 ? 100 / percentualeOccupazione : 0
    const fatturatoPrevisto = fatturatoConfermato * fattoreMoltiplicativo

    risultati.push({
      periodo_inizio: inizioPeriodo,
      periodo_fine: finePeriodo,
      capacita_totale: capacitaPeriodo,
      camere_notti_prenotate: camereNottiPrenotate,
      percentuale_occupazione: percentualeOccupazione,
      adr_medio: adrMedio,
      fatturato_confermato: fatturatoConfermato,
      fatturato_previsto: fatturatoPrevisto,
      prenotazioni_brevi: prenotazioniBrevi,
      percentuale_prenotazioni_brevi: percentualePrenotazioniBrevi,
    })

    dataCorrente = addDays(dataCorrente, intervalloGiorni)
  }

  return risultati
}

// Funzione per identificare i "buchi" nel planning
export function identificaBuchiPlanning(
  prenotazioni: PrenotazioneAnalisi[],
  hotel: HotelCapienza[],
  sogliaNotti = 3,
): BucoPlanning[] {
  const risultati: BucoPlanning[] = []

  // Per ogni hotel, analizza il planning giorno per giorno
  hotel.forEach((h) => {
    const prenotazioniHotel = prenotazioni.filter((p) => p.id_hotel === h.id)

    // Crea un array di occupazione giornaliera
    const occupazioneGiornaliera: Record<string, { occupate: number; prenotazioniBrevi: number }> = {}

    // Inizializza l'occupazione a 0 per tutti i giorni della stagione
    const dataInizio = parseISO("2025-06-07")
    const dataFine = parseISO("2025-09-05")
    let dataCorrente = dataInizio

    while (dataCorrente <= dataFine) {
      occupazioneGiornaliera[format(dataCorrente, "yyyy-MM-dd")] = { occupate: 0, prenotazioniBrevi: 0 }
      dataCorrente = addDays(dataCorrente, 1)
    }

    // Calcola l'occupazione per ogni giorno
    prenotazioniHotel.forEach((p) => {
      const arrivo = parseISO(p.arrivo)
      const partenza = parseISO(p.partenza)
      const isPrenotazioneBreve = p.notti <= 5

      let dataOccupata = arrivo
      while (dataOccupata < partenza) {
        const dataKey = format(dataOccupata, "yyyy-MM-dd")
        if (occupazioneGiornaliera[dataKey] !== undefined) {
          occupazioneGiornaliera[dataKey].occupate += 1
          if (isPrenotazioneBreve) {
            occupazioneGiornaliera[dataKey].prenotazioniBrevi += 1
          }
        }
        dataOccupata = addDays(dataOccupata, 1)
      }
    })

    // Identifica i buchi (periodi con bassa occupazione)
    let inizioBuco: Date | null = null
    let occupazioneBuco = h.numero_camere
    let prenotazioniBrevi = 0

    dataCorrente = dataInizio
    while (dataCorrente <= dataFine) {
      const dataKey = format(dataCorrente, "yyyy-MM-dd")
      const occupazioneGiorno = occupazioneGiornaliera[dataKey]?.occupate || 0
      const prenotazioniBreviGiorno = occupazioneGiornaliera[dataKey]?.prenotazioniBrevi || 0
      const disponibilita = h.numero_camere - occupazioneGiorno

      // Se c'è alta disponibilità, potrebbe essere l'inizio di un buco
      if (disponibilita > h.numero_camere * 0.3 && !inizioBuco) {
        inizioBuco = dataCorrente
        occupazioneBuco = occupazioneGiorno
        prenotazioniBrevi = prenotazioniBreviGiorno
      }
      // Se la disponibilità diminuisce o siamo alla fine, controlliamo se abbiamo un buco
      else if (inizioBuco && (disponibilita <= h.numero_camere * 0.3 || dataCorrente >= dataFine)) {
        const fineBuco = disponibilita <= h.numero_camere * 0.3 ? addDays(dataCorrente, -1) : dataCorrente
        const durataBuco = differenceInDays(fineBuco, inizioBuco) + 1

        // Se la durata è sufficiente, registra il buco
        if (durataBuco >= sogliaNotti && durataBuco <= 7) {
          const percentualeDisponibilita = ((h.numero_camere - occupazioneBuco) / h.numero_camere) * 100
          const percentualePrenotazioniBrevi = occupazioneBuco > 0 ? (prenotazioniBrevi / occupazioneBuco) * 100 : 0

          // Determina il rischio in base alla disponibilità e alla presenza di prenotazioni brevi
          let rischio: "alto" | "medio" | "basso" = "basso"

          // Se ci sono molte camere libere E molte prenotazioni brevi, il rischio è alto
          if (percentualeDisponibilita > 50 && percentualePrenotazioniBrevi > 40) {
            rischio = "alto"
          }
          // Se ci sono molte camere libere O molte prenotazioni brevi, il rischio è medio
          else if (percentualeDisponibilita > 50 || percentualePrenotazioniBrevi > 40) {
            rischio = "medio"
          }

          risultati.push({
            id_hotel: h.id,
            hotel_nome: h.nome,
            data_inizio: format(inizioBuco, "yyyy-MM-dd"),
            data_fine: format(fineBuco, "yyyy-MM-dd"),
            durata_notti: durataBuco,
            camere_disponibili: h.numero_camere - occupazioneBuco,
            percentuale_disponibilita: percentualeDisponibilita,
            prenotazioni_brevi: prenotazioniBrevi,
            percentuale_prenotazioni_brevi: percentualePrenotazioniBrevi,
            rischio,
          })
        }

        inizioBuco = null
      }

      dataCorrente = addDays(dataCorrente, 1)
    }
  })

  return risultati.sort((a, b) => {
    // Ordina per rischio (alto, medio, basso) e poi per data
    const rischioOrdine = { alto: 0, medio: 1, basso: 2 }
    if (rischioOrdine[a.rischio] !== rischioOrdine[b.rischio]) {
      return rischioOrdine[a.rischio] - rischioOrdine[b.rischio]
    }
    return a.data_inizio.localeCompare(b.data_inizio)
  })
}

// Funzione per generare scenari previsionali
export function generaScenariPrevisionali(
  occupazioneAttuale: OccupazioneHotel[],
): Record<string, ScenarioPrevisionale[]> {
  const risultati: Record<string, ScenarioPrevisionale[]> = {}

  occupazioneAttuale.forEach((hotel) => {
    // Calcola i fattori moltiplicativi per i diversi scenari
    const fattoreOttimistico = 1.2 // +20% rispetto alla proiezione lineare
    const fattoreRealistico = 1.0 // proiezione lineare standard
    const fattoreConservativo = 0.8 // -20% rispetto alla proiezione lineare

    // Calcola l'occupazione prevista per ogni scenario
    const occupazioneOttimistica = Math.min(100, hotel.percentuale_occupazione * fattoreOttimistico)
    const occupazioneRealistica = hotel.percentuale_occupazione * fattoreRealistico
    const occupazioneConservativa = hotel.percentuale_occupazione * fattoreConservativo

    // Calcola il fatturato previsto per ogni scenario
    const fatturatoPrevisto = hotel.fatturato_previsto
    const fatturatoOttimistico = fatturatoPrevisto * fattoreOttimistico
    const fatturatoRealistico = fatturatoPrevisto
    const fatturatoConservativo = fatturatoPrevisto * fattoreConservativo

    // Calcola l'ADR previsto per ogni scenario
    const adrOttimistico = hotel.adr_medio * 1.05 // +5% sull'ADR
    const adrRealistico = hotel.adr_medio
    const adrConservativo = hotel.adr_medio * 0.95 // -5% sull'ADR

    risultati[hotel.id_hotel] = [
      {
        tipo: "ottimistico",
        occupazione_prevista: occupazioneOttimistica,
        fatturato_previsto: fatturatoOttimistico,
        adr_previsto: adrOttimistico,
        fattore_moltiplicativo: fattoreOttimistico,
      },
      {
        tipo: "realistico",
        occupazione_prevista: occupazioneRealistica,
        fatturato_previsto: fatturatoRealistico,
        adr_previsto: adrRealistico,
        fattore_moltiplicativo: fattoreRealistico,
      },
      {
        tipo: "conservativo",
        occupazione_prevista: occupazioneConservativa,
        fatturato_previsto: fatturatoConservativo,
        adr_previsto: adrConservativo,
        fattore_moltiplicativo: fattoreConservativo,
      },
    ]
  })

  return risultati
}

// Funzione per calcolare la velocità di riempimento
export function calcolaVelocitaRiempimento(
  prenotazioni: PrenotazioneAnalisi[],
  periodoInizio = "2025-06-07",
  periodoFine = "2025-09-05",
  intervalloSettimane = 2,
): any[] {
  // Implementazione della velocità di riempimento
  // Questa è una versione semplificata che calcola quante prenotazioni sono state fatte
  // per ogni periodo di soggiorno nelle ultime settimane

  const dataInizio = parseISO(periodoInizio)
  const dataFine = parseISO(periodoFine)

  // Genera i periodi di soggiorno
  const periodiSoggiorno: { inizio: string; fine: string }[] = []
  let dataCorrente = dataInizio

  while (dataCorrente < dataFine) {
    const inizioPeriodo = format(dataCorrente, "yyyy-MM-dd")
    const finePeriodo = format(addDays(dataCorrente, intervalloSettimane * 7 - 1), "yyyy-MM-dd")

    periodiSoggiorno.push({
      inizio: inizioPeriodo,
      fine: finePeriodo,
    })

    dataCorrente = addDays(dataCorrente, intervalloSettimane * 7)
  }

  // Calcola il numero di prenotazioni per ogni periodo nelle ultime settimane
  const risultati = periodiSoggiorno.map((periodo) => {
    // Filtra le prenotazioni per questo periodo di soggiorno
    const prenotazioniPeriodo = prenotazioni.filter((p) => {
      const arrivo = p.arrivo
      return arrivo >= periodo.inizio && arrivo <= periodo.fine
    })

    // Raggruppa per settimana di prenotazione
    const prenotazioniPerSettimana: Record<string, number> = {}

    prenotazioniPeriodo.forEach((p) => {
      const dataPrenotazione = parseISO(p.data_prenotazione)
      const settimana = format(dataPrenotazione, "yyyy-ww", { locale: it })

      if (!prenotazioniPerSettimana[settimana]) {
        prenotazioniPerSettimana[settimana] = 0
      }

      prenotazioniPerSettimana[settimana] += 1
    })

    // Converti in array e calcola la velocità
    const settimaneOrdinate = Object.entries(prenotazioniPerSettimana)
      .map(([settimana, conteggio]) => ({ settimana, conteggio }))
      .sort((a, b) => a.settimana.localeCompare(b.settimana))

    // Calcola la velocità come la pendenza della curva di prenotazioni
    let velocita = 0
    if (settimaneOrdinate.length > 1) {
      const ultimaSettimana = settimaneOrdinate[settimaneOrdinate.length - 1]
      const penultimaSettimana = settimaneOrdinate[settimaneOrdinate.length - 2]
      velocita = ultimaSettimana.conteggio - penultimaSettimana.conteggio
    }

    return {
      periodo_inizio: periodo.inizio,
      periodo_fine: periodo.fine,
      prenotazioni_totali: prenotazioniPeriodo.length,
      prenotazioni_per_settimana: settimaneOrdinate,
      velocita_riempimento: velocita,
    }
  })

  return risultati
}
