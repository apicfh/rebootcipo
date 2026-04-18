"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import type { PrenotazioneAnalisi, OccupazioneHotel } from "@/lib/services/analisi-predittiva-service"

interface KpiCardsProps {
  prenotazioni: PrenotazioneAnalisi[]
  occupazioneHotel: OccupazioneHotel[]
}

export function KpiCards({ prenotazioni, occupazioneHotel }: KpiCardsProps) {
  // Calcola l'ADR medio
  const adrMedio =
    prenotazioni.length > 0 ? prenotazioni.reduce((sum, p) => sum + (p.adr_soggiorno || 0), 0) / prenotazioni.length : 0

  // Calcola il booking window medio
  const bookingWindowMedio =
    prenotazioni.length > 0
      ? prenotazioni.reduce((sum, p) => sum + (p.booking_window || 0), 0) / prenotazioni.length
      : 0

  // Calcola l'occupazione media (usando la stessa logica della sezione Occupazione)
  const occupazioneMedia =
    occupazioneHotel.length > 0
      ? occupazioneHotel.reduce((sum, h) => sum + h.percentuale_occupazione, 0) / occupazioneHotel.length
      : 0

  // Calcola il fatturato confermato totale (tutte le prenotazioni con stato diverso da "8")
  const fatturatoConfermato = prenotazioni.reduce((sum, p) => sum + (p.totale_soggiorno || 0), 0)

  // Formatta i valori per la visualizzazione
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("it-IT", {
      style: "currency",
      currency: "EUR",
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value)
  }

  return (
    <>
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium">ADR Medio</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{formatCurrency(adrMedio)}</div>
          <p className="text-xs text-muted-foreground">Prezzo medio giornaliero</p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium">Booking Window</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{Math.round(bookingWindowMedio)} giorni</div>
          <p className="text-xs text-muted-foreground">Anticipo medio di prenotazione</p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium">Occupazione Attuale</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{occupazioneMedia.toFixed(1)}%</div>
          <p className="text-xs text-muted-foreground">Percentuale camere-notti prenotate</p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium">Fatturato Confermato</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{formatCurrency(fatturatoConfermato)}</div>
          <p className="text-xs text-muted-foreground">Totale prenotazioni confermate</p>
        </CardContent>
      </Card>
    </>
  )
}
