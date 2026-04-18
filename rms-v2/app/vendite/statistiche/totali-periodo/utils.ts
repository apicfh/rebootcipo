import { differenceInDays, addDays, parseISO, format } from "date-fns"
import type { HotelType, PrenotazioneType, RisultatoType, RisultatoPerHotelType, RisultatoPerPeriodoType } from "./types"

export function getUltimoSabatoMaggio(anno: number): Date {
  const data = new Date(anno, 4, 31)
  while (data.getDay() !== 6) {
    data.setDate(data.getDate() - 1)
  }
  return data
}

export function getSecondoSabatoSettembre(anno: number): Date {
  const data = new Date(anno, 8, 1)
  while (data.getDay() !== 6) {
    data.setDate(data.getDate() + 1)
  }
  data.setDate(data.getDate() + 7)
  return data
}

export function getAnnoRiferimento(): number {
  const oggi = new Date()
  const meseCorrente = oggi.getMonth()
  return meseCorrente >= 9 ? oggi.getFullYear() + 1 : oggi.getFullYear()
}

export function calcolaRisultatoTotale(
  prenotazioni: PrenotazioneType[],
  dataInizio: Date,
  dataFine: Date,
  hotels: HotelType[],
  selectedHotels: string[],
): RisultatoType {
  const giorniPeriodo = differenceInDays(dataFine, dataInizio) + 1
  const camereTotali = hotels
    .filter((h) => selectedHotels.includes(h.id))
    .reduce((sum, hotel) => sum + hotel.numero_camere, 0)
  const nottiDisponibili = camereTotali * giorniPeriodo

  let nottiPrenotate = 0
  let fatturato = 0

  prenotazioni.forEach((p) => {
    try {
      if (!p.arrivo || !p.partenza) return

      const dataArrivo = parseISO(p.arrivo)
      const dataPartenza = parseISO(p.partenza)

      if (dataPartenza > dataInizio && dataArrivo < addDays(dataFine, 1)) {
        const inizioSovrapposizione = dataArrivo > dataInizio ? dataArrivo : dataInizio
        const fineSovrapposizione = dataPartenza < addDays(dataFine, 1) ? dataPartenza : addDays(dataFine, 1)
        const nottiSovrapposte = differenceInDays(fineSovrapposizione, inizioSovrapposizione)
        const nottiTotali = p.notti || differenceInDays(dataPartenza, dataArrivo)
        if (nottiTotali > 0) {
          const proporzione = nottiSovrapposte / nottiTotali
          nottiPrenotate += nottiSovrapposte
          fatturato += p.totale_soggiorno * proporzione
        }
      }
    } catch (err: any) {
      console.error("Errore nel calcolo per prenotazione:", err, p)
    }
  })

  const adr = nottiPrenotate > 0 ? fatturato / nottiPrenotate : 0
  const tassoOccupazione = nottiDisponibili > 0 ? (nottiPrenotate / nottiDisponibili) * 100 : 0

  return { nottiDisponibili, nottiPrenotate, fatturato, adr, tassoOccupazione }
}

export function calcolaRisultatiPerHotel(
  prenotazioni: PrenotazioneType[],
  dataInizio: Date,
  dataFine: Date,
  hotels: HotelType[],
  selectedHotels: string[],
): RisultatoPerHotelType[] {
  const risultati: RisultatoPerHotelType[] = []
  const giorniPeriodo = differenceInDays(dataFine, dataInizio) + 1

  hotels
    .filter((h) => selectedHotels.includes(h.id))
    .forEach((hotel) => {
      const nottiDisponibili = hotel.numero_camere * giorniPeriodo
      const prenotazioniHotel = prenotazioni.filter((p) => p.id_hotel === hotel.id)

      let nottiPrenotate = 0
      let fatturato = 0

      prenotazioniHotel.forEach((p) => {
        try {
          if (!p.arrivo || !p.partenza) return
          const dataArrivo = parseISO(p.arrivo)
          const dataPartenza = parseISO(p.partenza)
          if (dataPartenza > dataInizio && dataArrivo < addDays(dataFine, 1)) {
            const inizioSovrapposizione = dataArrivo > dataInizio ? dataArrivo : dataInizio
            const fineSovrapposizione = dataPartenza < addDays(dataFine, 1) ? dataPartenza : addDays(dataFine, 1)
            const nottiSovrapposte = differenceInDays(fineSovrapposizione, inizioSovrapposizione)
            const nottiTotali = p.notti || differenceInDays(dataPartenza, dataArrivo)
            if (nottiTotali > 0) {
              const proporzione = nottiSovrapposte / nottiTotali
              nottiPrenotate += nottiSovrapposte
              fatturato += p.totale_soggiorno * proporzione
            }
          }
        } catch (err: any) {
          console.error("Errore nel calcolo per prenotazione:", err, p)
        }
      })

      const adr = nottiPrenotate > 0 ? fatturato / nottiPrenotate : 0
      const tassoOccupazione = nottiDisponibili > 0 ? (nottiPrenotate / nottiDisponibili) * 100 : 0

      risultati.push({ id_hotel: hotel.id, nome_hotel: hotel.nome, nottiDisponibili, nottiPrenotate, fatturato, adr, tassoOccupazione })
    })

  return risultati
}

export function calcolaRisultatiPerPeriodo(
  prenotazioni: PrenotazioneType[],
  dataInizio: Date,
  dataFine: Date,
  hotels: HotelType[],
  selectedHotels: string[],
): RisultatoPerPeriodoType[] {
  const risultati: Record<string, RisultatoPerPeriodoType> = {}

  const primoSabato = new Date(dataInizio)
  while (primoSabato.getDay() !== 6) {
    primoSabato.setDate(primoSabato.getDate() - 1)
  }

  let inizioSettimana = new Date(primoSabato)
  while (inizioSettimana <= dataFine) {
    const fineSettimana = new Date(inizioSettimana)
    fineSettimana.setDate(fineSettimana.getDate() + 6)

    if (fineSettimana < dataInizio || inizioSettimana > dataFine) {
      inizioSettimana.setDate(inizioSettimana.getDate() + 7)
      continue
    }

    const chiaveSettimana = format(inizioSettimana, "yyyy-MM-dd")
    const inizioEffettivo = inizioSettimana < dataInizio ? dataInizio : inizioSettimana
    const fineEffettivo = fineSettimana > dataFine ? dataFine : fineSettimana
    const nomePeriodo = `${format(inizioEffettivo, "dd/MM")} - ${format(fineEffettivo, "dd/MM/yyyy")}`

    risultati[chiaveSettimana] = { periodo: nomePeriodo, nottiDisponibili: 0, nottiPrenotate: 0, fatturato: 0, adr: 0, tassoOccupazione: 0 }

    inizioSettimana = new Date(inizioSettimana)
    inizioSettimana.setDate(inizioSettimana.getDate() + 7)
  }

  Object.keys(risultati).forEach((chiaveSettimana) => {
    const inizioS = parseISO(chiaveSettimana)
    const fineS = new Date(inizioS)
    fineS.setDate(fineS.getDate() + 6)

    const inizioEffettivo = inizioS < dataInizio ? dataInizio : inizioS
    const fineEffettivo = fineS > dataFine ? dataFine : fineS
    const giorniSettimana = Math.max(0, differenceInDays(fineEffettivo, inizioEffettivo) + 1)
    const camereTotali = hotels.filter((h) => selectedHotels.includes(h.id)).reduce((sum, hotel) => sum + hotel.numero_camere, 0)
    risultati[chiaveSettimana].nottiDisponibili = camereTotali * giorniSettimana
  })

  prenotazioni.forEach((p) => {
    try {
      if (!p.arrivo || !p.partenza) return
      const dataArrivo = parseISO(p.arrivo)
      const dataPartenza = parseISO(p.partenza)

      Object.keys(risultati).forEach((chiaveSettimana) => {
        const inizioS = parseISO(chiaveSettimana)
        const fineS = new Date(inizioS)
        fineS.setDate(fineS.getDate() + 6)

        if (dataPartenza > inizioS && dataArrivo < addDays(fineS, 1)) {
          const inizioSovrapposizione = dataArrivo > inizioS ? dataArrivo : inizioS
          const fineSovrapposizione = dataPartenza < addDays(fineS, 1) ? dataPartenza : addDays(fineS, 1)
          const nottiSovrapposte = differenceInDays(fineSovrapposizione, inizioSovrapposizione)
          const nottiTotali = p.notti || differenceInDays(dataPartenza, dataArrivo)
          if (nottiTotali > 0) {
            const proporzione = nottiSovrapposte / nottiTotali
            risultati[chiaveSettimana].nottiPrenotate += nottiSovrapposte
            risultati[chiaveSettimana].fatturato += p.totale_soggiorno * proporzione
          }
        }
      })
    } catch (err: any) {
      console.error("Errore nel calcolo per prenotazione:", err, p)
    }
  })

  Object.values(risultati).forEach((r) => {
    r.adr = r.nottiPrenotate > 0 ? r.fatturato / r.nottiPrenotate : 0
    r.tassoOccupazione = r.nottiDisponibili > 0 ? (r.nottiPrenotate / r.nottiDisponibili) * 100 : 0
  })

  return Object.values(risultati)
}

export function calcolaDistribuzionePerPeriodo(
  prenotazioni: PrenotazioneType[],
  dataInizio: Date,
  dataFine: Date,
  indicatore: string,
): { tipo_camera: string; notti: number }[] {
  const distribuzione: Record<string, number> = {}

  prenotazioni.forEach((p) => {
    try {
      if (!p.arrivo || !p.partenza || !p.tipo_camera) return

      const dataArrivo = parseISO(p.arrivo)
      const dataPartenza = parseISO(p.partenza)

      if (dataPartenza > dataInizio && dataArrivo < addDays(dataFine, 1)) {
        const inizioSovrapposizione = dataArrivo > dataInizio ? dataArrivo : dataInizio
        const fineSovrapposizione = dataPartenza < addDays(dataFine, 1) ? dataPartenza : addDays(dataFine, 1)
        const nottiSovrapposte = differenceInDays(fineSovrapposizione, inizioSovrapposizione)
        const nottiTotali = p.notti || differenceInDays(dataPartenza, dataArrivo)

        if (nottiTotali > 0) {
          const proporzione = nottiSovrapposte / nottiTotali
          const tipoCamera = p.tipo_camera || "Non specificato"

          switch (indicatore) {
            case "Notti Prenotate":
              distribuzione[tipoCamera] = (distribuzione[tipoCamera] || 0) + nottiSovrapposte
              break
            case "Fatturato Totale":
              distribuzione[tipoCamera] = (distribuzione[tipoCamera] || 0) + p.totale_soggiorno * proporzione
              break
            case "ADR":
              if (!distribuzione[tipoCamera]) {
                distribuzione[tipoCamera] = 0
                distribuzione[`${tipoCamera}_notti`] = 0
                distribuzione[`${tipoCamera}_fatturato`] = 0
              }
              distribuzione[`${tipoCamera}_notti`] += nottiSovrapposte
              distribuzione[`${tipoCamera}_fatturato`] += p.totale_soggiorno * proporzione
              break
            case "Tasso di Occupazione":
              distribuzione[tipoCamera] = (distribuzione[tipoCamera] || 0) + nottiSovrapposte
              break
            default:
              distribuzione[tipoCamera] = (distribuzione[tipoCamera] || 0) + nottiSovrapposte
          }
        }
      }
    } catch (err: any) {
      console.error("Errore nel calcolo distribuzione per prenotazione:", err, p)
    }
  })

  if (indicatore === "ADR") {
    const adrDistribuzione: Record<string, number> = {}
    Object.keys(distribuzione).forEach((key) => {
      if (!key.includes("_notti") && !key.includes("_fatturato")) {
        const notti = distribuzione[`${key}_notti`] || 0
        const fatturato = distribuzione[`${key}_fatturato`] || 0
        adrDistribuzione[key] = notti > 0 ? fatturato / notti : 0
      }
    })
    return Object.entries(adrDistribuzione)
      .map(([tipo_camera, valore]) => ({ tipo_camera, notti: valore }))
      .filter((item) => item.notti > 0)
      .sort((a, b) => b.notti - a.notti)
  }

  return Object.entries(distribuzione)
    .filter(([key]) => !key.includes("_notti") && !key.includes("_fatturato"))
    .map(([tipo_camera, valore]) => ({ tipo_camera, notti: valore }))
    .filter((item) => item.notti > 0)
    .sort((a, b) => b.notti - a.notti)
}

export function formatCurrency(value: number) {
  return new Intl.NumberFormat("it-IT", { style: "currency", currency: "EUR" }).format(value)
}

export function formatNumber(value: number) {
  return new Intl.NumberFormat("it-IT").format(Math.round(value))
}

export function formatPercent(value: number) {
  return `${value.toFixed(2)}%`
}

export function calcolaVariazione(attuale: number, precedente: number) {
  if (precedente === 0) return attuale > 0 ? 100 : 0
  return ((attuale - precedente) / precedente) * 100
}

export function getVariazioneClass(variazione: number) {
  return variazione >= 0 ? "text-green-600 font-bold" : "text-red-600 font-bold"
}

export const chartColors = {
  cy: "#36A2EB",
  ly: "#FFCE56",
  sdly: "#FF6384",
  nottiDisponibili: "#8884d8",
  nottiPrenotate: "#82ca9d",
  fatturato: "#ffc658",
  adr: "#ff7300",
  tassoOccupazione: "#0088fe",
}

export const chartStyle = {
  container: "h-80 mt-4",
  title: "text-lg font-semibold mb-2 text-gray-800",
}
