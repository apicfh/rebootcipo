"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import type { OccupazionePeriodo } from "@/lib/services/analisi-predittiva-service"
import { Badge } from "@/components/ui/badge"
import { format, parseISO } from "date-fns"
import { it } from "date-fns/locale"

interface StrategiePricingProps {
  data: OccupazionePeriodo[]
}

export function StrategiePricing({ data }: StrategiePricingProps) {
  // Determina la strategia di pricing in base all'occupazione
  const strategieData = data.map((periodo) => {
    let strategia = ""
    let colore = ""

    if (periodo.percentuale_occupazione < 30) {
      strategia = "Promozione Aggressiva"
      colore = "bg-red-100 text-red-800 hover:bg-red-100"
    } else if (periodo.percentuale_occupazione < 50) {
      strategia = "Sconto Moderato"
      colore = "bg-orange-100 text-orange-800 hover:bg-orange-100"
    } else if (periodo.percentuale_occupazione < 70) {
      strategia = "Mantenimento Prezzi"
      colore = "bg-yellow-100 text-yellow-800 hover:bg-yellow-100"
    } else if (periodo.percentuale_occupazione < 85) {
      strategia = "Aumento Moderato"
      colore = "bg-green-100 text-green-800 hover:bg-green-100"
    } else {
      strategia = "Aumento Significativo"
      colore = "bg-emerald-100 text-emerald-800 hover:bg-emerald-100"
    }

    return {
      ...periodo,
      strategia,
      colore,
    }
  })

  return (
    <Card className="col-span-2">
      <CardHeader>
        <CardTitle>Strategie di Pricing Suggerite</CardTitle>
        <CardDescription>Suggerimenti per ottimizzare i prezzi in base al ritmo di prenotazioni</CardDescription>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Periodo</TableHead>
              <TableHead>Occupazione</TableHead>
              <TableHead>ADR Attuale</TableHead>
              <TableHead>Strategia Suggerita</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {strategieData.map((periodo, index) => (
              <TableRow key={index}>
                <TableCell className="font-medium">
                  {format(parseISO(periodo.periodo_inizio), "dd/MM", { locale: it })} -{" "}
                  {format(parseISO(periodo.periodo_fine), "dd/MM", { locale: it })}
                </TableCell>
                <TableCell>{periodo.percentuale_occupazione.toFixed(1)}%</TableCell>
                <TableCell>{periodo.adr_medio.toFixed(0)} €</TableCell>
                <TableCell>
                  <Badge className={periodo.colore}>{periodo.strategia}</Badge>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  )
}
