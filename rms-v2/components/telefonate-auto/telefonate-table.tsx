"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Search, AlertTriangle, ChevronLeft, ChevronRight } from "lucide-react"
import type { ChiamateAggregato } from "@/lib/services/telefonate-auto-service"
import { format } from "date-fns"
import { it } from "date-fns/locale"

interface TelefonateTableProps {
  dati: ChiamateAggregato[]
}

export function TelefonateTable({ dati }: TelefonateTableProps) {
  const [searchTerm, setSearchTerm] = useState("")
  const [currentPage, setCurrentPage] = useState(1)
  const itemsPerPage = 10

  // Filtra i dati in base al termine di ricerca
  const filteredData = dati.filter(
    (item) =>
      item.descrizione.toLowerCase().includes(searchTerm.toLowerCase()) ||
      format(new Date(item.data), "dd/MM/yyyy", { locale: it }).includes(searchTerm),
  )

  // Paginazione
  const totalPages = Math.ceil(filteredData.length / itemsPerPage)
  const startIndex = (currentPage - 1) * itemsPerPage
  const endIndex = startIndex + itemsPerPage
  const currentData = filteredData.slice(startIndex, endIndex)

  const getPercentualeBadge = (percentuale: number) => {
    if (percentuale >= 80) return { variant: "default" as const, color: "text-green-600" }
    if (percentuale >= 60) return { variant: "secondary" as const, color: "text-yellow-600" }
    return { variant: "destructive" as const, color: "text-red-600" }
  }

  const getAttesaBadge = (attesa: number) => {
    if (attesa <= 15) return { variant: "default" as const, color: "text-green-600" }
    if (attesa <= 30) return { variant: "secondary" as const, color: "text-yellow-600" }
    return { variant: "destructive" as const, color: "text-red-600" }
  }

  const formatDuration = (seconds: number) => {
    const minutes = Math.floor(seconds / 60)
    const remainingSeconds = Math.floor(seconds % 60)
    return `${minutes}m ${remainingSeconds}s`
  }

  const hasAlert = (item: ChiamateAggregato) => {
    return item.percentuale_risposta < 50 || item.attesa_media > 30
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <CardTitle>Dettaglio Telefonate</CardTitle>
          <div className="flex items-center gap-2">
            <Search className="h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Cerca per struttura o data..."
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value)
                setCurrentPage(1) // Reset alla prima pagina quando si cerca
              }}
              className="w-64"
            />
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Data</TableHead>
                <TableHead>Struttura</TableHead>
                <TableHead className="text-right">Ricevute</TableHead>
                <TableHead className="text-right">Risposte</TableHead>
                <TableHead className="text-right">Non Risposte</TableHead>
                <TableHead className="text-right">Timeout</TableHead>
                <TableHead className="text-right">% Risposta</TableHead>
                <TableHead className="text-right">Attesa</TableHead>
                <TableHead className="text-right">Durata</TableHead>
                <TableHead className="w-12"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {currentData.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={10} className="text-center py-8 text-muted-foreground">
                    {searchTerm ? "Nessun risultato trovato" : "Nessun dato disponibile"}
                  </TableCell>
                </TableRow>
              ) : (
                currentData.map((item, index) => {
                  const percentualeBadge = getPercentualeBadge(item.percentuale_risposta)
                  const attesaBadge = getAttesaBadge(item.attesa_media)
                  const alert = hasAlert(item)

                  return (
                    <TableRow key={`${item.data}-${item.descrizione}-${index}`}>
                      <TableCell className="font-medium">
                        {format(new Date(item.data), "dd/MM/yyyy", { locale: it })}
                      </TableCell>
                      <TableCell>{item.descrizione}</TableCell>
                      <TableCell className="text-right font-medium">
                        {item.chiamate_ricevute.toLocaleString()}
                      </TableCell>
                      <TableCell className="text-right text-green-600">
                        {item.chiamate_risposte.toLocaleString()}
                      </TableCell>
                      <TableCell className="text-right text-red-600">
                        {item.chiamate_non_risposte.toLocaleString()}
                      </TableCell>
                      <TableCell className="text-right text-orange-600">
                        {item.chiamate_timeout.toLocaleString()}
                      </TableCell>
                      <TableCell className="text-right">
                        <Badge variant={percentualeBadge.variant} className="text-xs">
                          {item.percentuale_risposta.toFixed(1)}%
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <Badge variant={attesaBadge.variant} className="text-xs">
                          {item.attesa_media.toFixed(1)}s
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">{formatDuration(item.durata_media)}</TableCell>
                      <TableCell>
                        {alert && <AlertTriangle className="h-4 w-4 text-red-500" title="Performance critica" />}
                      </TableCell>
                    </TableRow>
                  )
                })
              )}
            </TableBody>
          </Table>
        </div>

        {/* Paginazione */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between mt-4">
            <div className="text-sm text-muted-foreground">
              Mostrando {startIndex + 1}-{Math.min(endIndex, filteredData.length)} di {filteredData.length} risultati
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage(currentPage - 1)}
                disabled={currentPage === 1}
              >
                <ChevronLeft className="h-4 w-4" />
                Precedente
              </Button>
              <span className="text-sm">
                Pagina {currentPage} di {totalPages}
              </span>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage(currentPage + 1)}
                disabled={currentPage === totalPages}
              >
                Successiva
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
