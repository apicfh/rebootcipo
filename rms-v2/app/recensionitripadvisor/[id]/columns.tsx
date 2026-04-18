"use client"

import type { ColumnDef } from "@tanstack/react-table"
import type { RecensioneTripadvisor } from "@/lib/services/recensioni-tripadvisor-service"
import { format } from "date-fns"
import { it } from "date-fns/locale"
import { Star } from "lucide-react"

// Funzione per formattare la data
const formatDate = (dateString: string) => {
  try {
    return format(new Date(dateString), "d MMMM yyyy", { locale: it })
  } catch (error) {
    return "Data non disponibile"
  }
}

// Componente per visualizzare le stelle
export function RatingStars({ rating }: { rating: number }) {
  return (
    <div className="flex">
      {[1, 2, 3, 4, 5].map((star) => (
        <Star key={star} size={16} className={star <= rating ? "text-yellow-400 fill-yellow-400" : "text-gray-300"} />
      ))}
    </div>
  )
}

export const columns: ColumnDef<RecensioneTripadvisor>[] = [
  {
    accessorKey: "titolo",
    header: "Titolo",
    cell: ({ row }) => <div className="font-medium">{row.getValue("titolo")}</div>,
  },
  {
    accessorKey: "valutazione",
    header: "Valutazione",
    cell: ({ row }) => <RatingStars rating={row.getValue("valutazione")} />,
  },
  {
    accessorKey: "testo",
    header: "Recensione",
    cell: ({ row }) => <div className="max-w-xl whitespace-normal">{row.getValue("testo")}</div>,
  },
  {
    accessorKey: "nome_utente",
    header: "Utente",
    cell: ({ row }) => {
      const recensione = row.original
      return (
        <div>
          <div>{recensione.nome_utente}</div>
          {recensione.provenienza_utente && (
            <div className="text-xs text-muted-foreground">{recensione.provenienza_utente}</div>
          )}
        </div>
      )
    },
  },
  {
    accessorKey: "data_pubblicazione",
    header: "Data",
    cell: ({ row }) => formatDate(row.getValue("data_pubblicazione")),
  },
]
