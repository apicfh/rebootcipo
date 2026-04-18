import { supabase } from "@/lib/supabase/client"

export interface HotelPrenotazione {
  hotel_nome: string
  data_prenotazione: string
  prenotazioni_inserite: number
}

export interface HotelPrenotazioniAggregato {
  hotel_nome: string
  prenotazioni_inserite: number
}

export async function getHotelPrenotazioniInserite(
  dataInizio: string,
  dataFine: string,
): Promise<HotelPrenotazioniAggregato[]> {
  const { data, error } = await supabase.rpc("get_hotel_prenotazioni_inserite", {
    data_inizio: dataInizio,
    data_fine: dataFine,
  })

  if (error) {
    console.error("Errore nel recupero delle prenotazioni inserite:", error)
    throw new Error(`Errore nel recupero delle prenotazioni inserite: ${error.message}`)
  }

  // Aggreghiamo i dati per hotel_nome
  const risultatiAggregati: Record<string, number> = {}

  // Sommiamo le prenotazioni per ogni hotel
  data?.forEach((item: HotelPrenotazione) => {
    if (!risultatiAggregati[item.hotel_nome]) {
      risultatiAggregati[item.hotel_nome] = 0
    }
    risultatiAggregati[item.hotel_nome] += Number(item.prenotazioni_inserite)
  })

  // Convertiamo l'oggetto in un array di oggetti
  const risultatiFinali: HotelPrenotazioniAggregato[] = Object.entries(risultatiAggregati).map(
    ([hotel_nome, prenotazioni_inserite]) => ({
      hotel_nome,
      prenotazioni_inserite,
    }),
  )

  return risultatiFinali
}
