import { supabase } from "@/lib/supabase/client"
import { format, subYears } from "date-fns"

export interface DomandaProvvisorioData {
  id: string
  data: string
  best: number
  ricc: number
  pnt: number
  shel: number
  tosi: number
  sere: number
  exe: number
  cdp: number
  tnt: number
  cevi: number
  mima: number
  mich: number
  mivi: number
  tot: number
}

export interface DomandaProvvisorioFilters {
  dataInizio: Date | null
  dataFine: Date | null
}

export async function getDomandaProvvisorioData(filters: DomandaProvvisorioFilters): Promise<DomandaProvvisorioData[]> {
  try {
    const { dataInizio, dataFine } = filters

    // Chiamiamo la funzione RPC con il nome corretto: provvisorio_domanda
    const { data, error } = await supabase.rpc("provvisorio_domanda", {
      data_inizio: dataInizio ? format(dataInizio, "yyyy-MM-dd") : null,
      data_fine: dataFine ? format(dataFine, "yyyy-MM-dd") : null,
    })

    if (error) {
      console.error("Errore nel recupero dei dati della domanda provvisoria:", error)
      return []
    }

    return data || []
  } catch (error) {
    console.error("Errore nel servizio domanda-provvisorio:", error)
    return []
  }
}

export async function getDomandaProvvisorioSDLYData(
  filters: DomandaProvvisorioFilters,
): Promise<DomandaProvvisorioData[]> {
  try {
    const { dataInizio, dataFine } = filters

    // Calcola le date dell'anno precedente
    const dataInizioSDLY = dataInizio ? subYears(dataInizio, 1) : null
    const dataFineSDLY = dataFine ? subYears(dataFine, 1) : null

    // Chiamiamo la funzione RPC per ottenere i dati dell'anno precedente
    const { data, error } = await supabase.rpc("provvisorio_domanda", {
      data_inizio: dataInizioSDLY ? format(dataInizioSDLY, "yyyy-MM-dd") : null,
      data_fine: dataFineSDLY ? format(dataFineSDLY, "yyyy-MM-dd") : null,
    })

    if (error) {
      console.error("Errore nel recupero dei dati SDLY della domanda provvisoria:", error)
      return []
    }

    return data || []
  } catch (error) {
    console.error("Errore nel servizio domanda-provvisorio SDLY:", error)
    return []
  }
}

export async function getDomandaProvvisorioSD2LYData(
  filters: DomandaProvvisorioFilters,
): Promise<DomandaProvvisorioData[]> {
  try {
    const { dataInizio, dataFine } = filters

    // Calcola le date di due anni fa
    const dataInizioSD2LY = dataInizio ? subYears(dataInizio, 2) : null
    const dataFineSD2LY = dataFine ? subYears(dataFine, 2) : null

    // Chiamiamo la funzione RPC per ottenere i dati di due anni fa
    const { data, error } = await supabase.rpc("provvisorio_domanda", {
      data_inizio: dataInizioSD2LY ? format(dataInizioSD2LY, "yyyy-MM-dd") : null,
      data_fine: dataFineSD2LY ? format(dataFineSD2LY, "yyyy-MM-dd") : null,
    })

    if (error) {
      console.error("Errore nel recupero dei dati SD2LY della domanda provvisoria:", error)
      return []
    }

    return data || []
  } catch (error) {
    console.error("Errore nel servizio domanda-provvisorio SD2LY:", error)
    return []
  }
}

// Funzione per ottenere un colore per ogni hotel
export const getHotelColor = (code: string): string => {
  const hotelColors: Record<string, string> = {
    best: "#DD6B20", // arancio scuro
    ricc: "#ED8936", // arancio chiaro
    pnt: "#D53F8C", // fucsia
    shel: "#000000", // nero
    tosi: "#F687B3", // rosa
    sere: "#68D391", // verde chiaro
    exe: "#D53F8C", // fucsia (come pnt)
    cdp: "#63B3ED", // azzurro chiaro
    tnt: "#3182CE", // azzurro scuro
    cevi: "#38B2AC", // verde azzurro
    mima: "#9F7AEA", // viola
    mich: "#6B46C1", // viola scuro
    mivi: "#667EEA", // indaco
  }

  return hotelColors[code] || "#A0AEC0" // gray-500 come colore predefinito
}
