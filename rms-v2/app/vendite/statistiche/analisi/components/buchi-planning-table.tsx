"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import type { BucoPlanning } from "@/lib/services/analisi-predittiva-service"
import { Badge } from "@/components/ui/badge"
import { format, parseISO } from "date-fns"
import { it } from "date-fns/locale"

interface BuchiPlanningTableProps {
  data: BucoPlanning[]
}

export function BuchiPlanningTable({ data }: BuchiPlanningTableProps) {
  // Mappa per i colori dei badge di rischio
  const rischioColors: Record<string, string> = {
    alto: "bg-red-100 text-red-800 hover:bg-red-100",
    medio: "bg-yellow-100 text-yellow-800 hover:bg-yellow-100",
    basso: "bg-green-100 text-green-800 hover:bg-green-100",
  }

  return (
    <Card className="col-span-2">
      <CardHeader>
        <CardTitle>Periodi Critici</CardTitle>
        <CardDescription>
          Identificazione dei "buchi" nel planning con alta presenza di prenotazioni brevi
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Hotel</TableHead>
              <TableHead>Periodo</TableHead>
              <TableHead>Durata</TableHead>
              <TableHead>Disponibilità</TableHead>
              <TableHead>Prenot. Brevi</TableHead>
              <TableHead>Rischio</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {data.length > 0 ? (
              data.map((buco, index) => (
                <TableRow key={index}>
                  <TableCell className="font-medium">{buco.hotel_nome}</TableCell>
                  <TableCell>
                    {format(parseISO(buco.data_inizio), "dd/MM", { locale: it })} -{" "}
                    {format(parseISO(buco.data_fine), "dd/MM", { locale: it })}
                  </TableCell>
                  <TableCell>{buco.durata_notti} notti</TableCell>
                  <TableCell>{buco.percentuale_disponibilita.toFixed(0)}%</TableCell>
                  <TableCell>{buco.percentuale_prenotazioni_brevi.toFixed(0)}%</TableCell>
                  <TableCell>
                    <Badge className={rischioColors[buco.rischio]}>
                      {buco.rischio.charAt(0).toUpperCase() + buco.rischio.slice(1)}
                    </Badge>
                  </TableCell>
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={6} className="text-center py-4">
                  Nessun periodo critico identificato
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  )
}
