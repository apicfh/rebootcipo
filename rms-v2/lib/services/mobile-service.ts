import { createClientComponentClient } from "@supabase/auth-helpers-nextjs"
import { format } from "date-fns"

export interface PeriodFilter {
  startDate: Date
  endDate: Date
}

export const MobileService = {
  // Riutilizziamo la funzione RPC esistente per le statistiche delle telefonate
  getTelefonateStats: async (hotelId: string | null, period: PeriodFilter, altaStagione = false) => {
    const supabase = createClientComponentClient()

    try {
      const { data, error } = await supabase.rpc("get_telefonate_stats_by_hotel_with_filter", {
        p_hotel_id: hotelId === "tutti" ? null : hotelId,
        p_start_date: format(period.startDate, "yyyy-MM-dd"),
        p_end_date: format(period.endDate, "yyyy-MM-dd"),
        p_alta_stagione: altaStagione,
      })

      if (error) {
        console.error("Errore RPC telefonate:", error)
        throw new Error(`Errore nel recupero delle statistiche telefonate: ${error.message}`)
      }

      return data || { totale_chiamate: 0, trend_chiamate: [] }
    } catch (err) {
      console.error("Errore completo telefonate:", err)
      throw err
    }
  },

  // Riutilizziamo la funzione RPC esistente per le conversioni
  getConversioni: async (hotelId: string | null, period: PeriodFilter) => {
    const supabase = createClientComponentClient()

    try {
      const { data, error } = await supabase.rpc("get_telefonate_conversioni", {
        p_hotel_id: hotelId === "tutti" ? null : hotelId,
        p_start_date: format(period.startDate, "yyyy-MM-dd"),
        p_end_date: format(period.endDate, "yyyy-MM-dd"),
      })

      if (error) {
        console.error("Errore RPC conversioni:", error)
        throw new Error(`Errore nel recupero dei dati di conversione: ${error.message}`)
      }

      return data || { totale_fatturato: 0, adr: 0 }
    } catch (err) {
      console.error("Errore completo conversioni:", err)
      throw err
    }
  },

  // Riutilizziamo la funzione RPC esistente per il tasso di occupazione
  getOccupazione: async (hotelId: string | null, period: PeriodFilter) => {
    const supabase = createClientComponentClient()

    try {
      const { data, error } = await supabase.rpc("get_occupazione_stats", {
        p_hotel_id: hotelId === "tutti" ? null : hotelId,
        p_start_date: format(period.startDate, "yyyy-MM-dd"),
        p_end_date: format(period.endDate, "yyyy-MM-dd"),
      })

      if (error) {
        console.error("Errore RPC occupazione:", error)
        throw new Error(`Errore nel recupero dei dati di occupazione: ${error.message}`)
      }

      return data || { tasso_occupazione: 0 }
    } catch (err) {
      console.error("Errore completo occupazione:", err)
      throw err
    }
  },

  // Recupera la lista degli hotel
  getHotels: async () => {
    const supabase = createClientComponentClient()

    try {
      const { data, error } = await supabase.from("hotels").select("id, nome").order("nome")

      if (error) {
        console.error("Errore query hotels:", error)
        throw new Error(`Errore nel recupero degli hotel: ${error.message}`)
      }

      return [{ id: "tutti", nome: "Tutti gli hotel" }, ...(data || [])]
    } catch (err) {
      console.error("Errore completo hotels:", err)
      throw err
    }
  },

  // Utilizziamo la funzione RPC specifica per la dashboard mobile
  getPrenotazioniPerHotel: async (period: PeriodFilter, altaStagione = false) => {
    const supabase = createClientComponentClient()

    try {
      const { data, error } = await supabase.rpc("get_prenotazioni_hotel_mobile", {
        p_start_date: format(period.startDate, "yyyy-MM-dd"),
        p_end_date: format(period.endDate, "yyyy-MM-dd"),
        p_alta_stagione: altaStagione,
      })

      if (error) {
        console.error("Errore RPC prenotazioni per hotel:", error)
        throw new Error(`Errore nel recupero delle prenotazioni per hotel: ${error.message}`)
      }

      // Formatta i dati per il grafico
      const formattedData =
        data?.map((item) => ({
          hotel: item.nome || "Hotel sconosciuto",
          prenotazioni: Number.parseInt(item.numero_prenotazioni) || 0,
        })) || []

      return {
        data: formattedData,
        total: formattedData.reduce((sum, item) => sum + item.prenotazioni, 0),
      }
    } catch (err) {
      console.error("Errore completo prenotazioni per hotel:", err)
      throw err
    }
  },

  // Nuova funzione per recuperare le prenotazioni per mese
  getPrenotazioniPerMese: async (period: PeriodFilter, hotelId: string | null, altaStagione = false) => {
    const supabase = createClientComponentClient()

    try {
      const { data, error } = await supabase.rpc("get_prenotazioni_per_mese_mobile", {
        p_start_date: format(period.startDate, "yyyy-MM-dd"),
        p_end_date: format(period.endDate, "yyyy-MM-dd"),
        p_hotel_id: hotelId === "tutti" ? null : hotelId,
        p_alta_stagione: altaStagione,
      })

      if (error) {
        console.error("Errore RPC prenotazioni per mese:", error)
        throw new Error(`Errore nel recupero delle prenotazioni per mese: ${error.message}`)
      }

      // Assicuriamoci di avere tutti i mesi da maggio a settembre
      const mesiCompleti = [
        { mese: 5, nome_mese: "Maggio", numero_prenotazioni: 0 },
        { mese: 6, nome_mese: "Giugno", numero_prenotazioni: 0 },
        { mese: 7, nome_mese: "Luglio", numero_prenotazioni: 0 },
        { mese: 8, nome_mese: "Agosto", numero_prenotazioni: 0 },
        { mese: 9, nome_mese: "Settembre", numero_prenotazioni: 0 },
      ]

      // Aggiorna i dati con i valori effettivi
      data?.forEach((item) => {
        const index = mesiCompleti.findIndex((m) => m.mese === item.mese)
        if (index !== -1) {
          mesiCompleti[index].numero_prenotazioni = Number(item.numero_prenotazioni) || 0
        }
      })

      return mesiCompleti
    } catch (err) {
      console.error("Errore completo prenotazioni per mese:", err)
      throw err
    }
  },

  // Funzione per aggregare i dati per settimana
  aggregateDataByWeek: (data: any[], dateField: string, valueField: string) => {
    if (!data || data.length === 0) return []

    // Raggruppa i dati per settimana
    const weeklyData: Record<string, { week: string; value: number }> = {}

    data.forEach((item) => {
      if (!item[dateField]) return

      const date = new Date(item[dateField])
      // Ottieni l'inizio della settimana (lunedì)
      const day = date.getDay()
      const diff = date.getDate() - day + (day === 0 ? -6 : 1) // Aggiusta quando il giorno è domenica
      const monday = new Date(date.setDate(diff))
      const weekKey = format(monday, "yyyy-MM-dd")

      if (!weeklyData[weekKey]) {
        weeklyData[weekKey] = {
          week: format(monday, "dd/MM"),
          value: 0,
        }
      }

      weeklyData[weekKey].value += Number(item[valueField] || 0)
    })

    // Converti in array e ordina per data
    return Object.values(weeklyData).sort((a, b) => {
      const dateA = new Date(a.week.split("/").reverse().join("-"))
      const dateB = new Date(b.week.split("/").reverse().join("-"))
      return dateA.getTime() - dateB.getTime()
    })
  },
}

export const getPeriodDates = (periodType: string): PeriodFilter => {
  const today = new Date()
  const endDate = new Date(today)
  let startDate = new Date(today)

  switch (periodType) {
    case "oggi":
      // Oggi: solo il giorno corrente
      startDate = new Date(today)
      break
    case "ieri":
      // Ieri: il giorno precedente
      startDate.setDate(today.getDate() - 1)
      endDate.setDate(today.getDate() - 1)
      break
    case "settimana":
      // Ultima settimana: 7 giorni precedenti
      startDate.setDate(today.getDate() - 7)
      break
    case "mese":
      // Ultimo mese: 30 giorni precedenti
      startDate.setDate(today.getDate() - 30)
      break
    case "1_gennaio":
      // Dal 1 gennaio anno corrente fino ad oggi
      startDate = new Date(today.getFullYear(), 0, 1)
      break
    case "da_inizio":
      // Non filtriamo per data_prenotazione, solo per anno di soggiorno (gestito nel componente)
      startDate = new Date(2000, 0, 1) // Data molto vecchia per includere tutte le prenotazioni
      break
    default:
      // Default: ultimo mese
      startDate.setDate(today.getDate() - 30)
  }

  return { startDate, endDate }
}
