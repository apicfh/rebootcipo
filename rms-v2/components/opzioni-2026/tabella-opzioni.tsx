"use client"

import type React from "react"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import { ChevronUp, ChevronDown, ChevronsUpDown } from "lucide-react"
import { format } from "date-fns"
import { it } from "date-fns/locale"
import type { Opzione2026 } from "@/lib/services/opzioni-2026-service"
import { MoreHorizontal, Edit, Trash2, Filter } from "lucide-react"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { ModificaOpzioneDialog } from "./modifica-opzione-dialog"
import { deleteOpzione2026 } from "@/lib/services/opzioni-2026-service"
import { toast } from "@/components/ui/use-toast"

interface Hotel {
  id: string
  nome: string
}

interface TabellaOpzioniProps {
  opzioni: Opzione2026[]
  hotels: Hotel[]
  onDataChange: () => void
}

type SortField = keyof Opzione2026
type SortDirection = "asc" | "desc" | null

export function TabellaOpzioni({ opzioni, hotels, onDataChange }: TabellaOpzioniProps) {
  const [sortField, setSortField] = useState<SortField | null>(null)
  const [sortDirection, setSortDirection] = useState<SortDirection>(null)
  const [selectedHotel, setSelectedHotel] = useState<string>("all")
  const [opzioneToEdit, setOpzioneToEdit] = useState<Opzione2026 | null>(null)
  const [opzioneToDelete, setOpzioneToDelete] = useState<Opzione2026 | null>(null)
  const [showEditDialog, setShowEditDialog] = useState(false)
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)
  const [deleting, setDeleting] = useState(false)

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection(sortDirection === "asc" ? "desc" : "asc")
    } else {
      setSortField(field)
      setSortDirection("asc")
    }
  }

  const handleEdit = (opzione: Opzione2026) => {
    setOpzioneToEdit(opzione)
    setShowEditDialog(true)
  }

  const handleDelete = (opzione: Opzione2026) => {
    setOpzioneToDelete(opzione)
    setShowDeleteDialog(true)
  }

  const confirmDelete = async () => {
    if (!opzioneToDelete) return

    setDeleting(true)
    try {
      const success = await deleteOpzione2026(opzioneToDelete.id)

      if (success) {
        toast({
          title: "Successo",
          description: "Opzione eliminata con successo",
        })
        onDataChange()
      } else {
        toast({
          title: "Errore",
          description: "Errore durante l'eliminazione dell'opzione",
          variant: "destructive",
        })
      }
    } catch (error) {
      console.error("Errore:", error)
      toast({
        title: "Errore",
        description: "Si è verificato un errore durante l'eliminazione",
        variant: "destructive",
      })
    } finally {
      setDeleting(false)
      setShowDeleteDialog(false)
      setOpzioneToDelete(null)
    }
  }

  // Filtra le opzioni per hotel selezionato
  const filteredOpzioni =
    selectedHotel === "all" ? opzioni : opzioni.filter((opzione) => opzione.id_hotel === selectedHotel)

  const sortedOpzioni = [...filteredOpzioni].sort((a, b) => {
    if (!sortField || !sortDirection) return 0

    let aValue = a[sortField]
    let bValue = b[sortField]

    // Gestione speciale per le date
    if (sortField === "created_at") {
      aValue = new Date(aValue as string).getTime()
      bValue = new Date(bValue as string).getTime()
    }

    // Gestione per stringhe e numeri
    if (typeof aValue === "string" && typeof bValue === "string") {
      aValue = aValue.toLowerCase()
      bValue = bValue.toLowerCase()
    }

    if (aValue < bValue) return sortDirection === "asc" ? -1 : 1
    if (aValue > bValue) return sortDirection === "asc" ? 1 : -1
    return 0
  })

  const getSortIcon = (field: SortField) => {
    if (sortField !== field) {
      return <ChevronsUpDown className="h-4 w-4 opacity-50" />
    }
    if (sortDirection === "asc") {
      return <ChevronUp className="h-4 w-4 text-primary" />
    }
    if (sortDirection === "desc") {
      return <ChevronDown className="h-4 w-4 text-primary" />
    }
    return <ChevronsUpDown className="h-4 w-4 opacity-50" />
  }

  const SortableHeader = ({ field, children }: { field: SortField; children: React.ReactNode }) => (
    <TableHead>
      <Button
        variant="ghost"
        className="h-auto p-0 font-semibold hover:bg-transparent"
        onClick={() => handleSort(field)}
      >
        <div className="flex items-center justify-between w-full">
          {children}
          {getSortIcon(field)}
        </div>
      </Button>
    </TableHead>
  )

  // Calcola le statistiche per il filtro corrente
  const getHotelStats = () => {
    const hotelCounts = hotels
      .map((hotel) => ({
        ...hotel,
        count: opzioni.filter((opzione) => opzione.id_hotel === hotel.id).length,
      }))
      .filter((hotel) => hotel.count > 0)

    return hotelCounts
  }

  const hotelStats = getHotelStats()

  return (
    <Card>
      <CardHeader>
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <CardTitle className="text-xl text-primary-700">
            Lista Opzioni 2026 ({sortedOpzioni.length} di {opzioni.length} totali)
          </CardTitle>

          <div className="flex items-center gap-2">
            <Filter className="h-4 w-4 text-gray-500" />
            <Select value={selectedHotel} onValueChange={setSelectedHotel}>
              <SelectTrigger className="w-64">
                <SelectValue placeholder="Filtra per hotel" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tutti gli hotel ({opzioni.length})</SelectItem>
                {hotelStats.map((hotel) => (
                  <SelectItem key={hotel.id} value={hotel.id}>
                    {hotel.nome} ({hotel.count})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        {selectedHotel !== "all" && (
          <div className="text-sm text-gray-600">
            Visualizzando opzioni per: <strong>{hotels.find((h) => h.id === selectedHotel)?.nome}</strong>
          </div>
        )}
      </CardHeader>
      <CardContent>
        <div className="rounded-lg border overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow className="bg-secondary-50">
                <SortableHeader field="id">ID</SortableHeader>
                <SortableHeader field="created_at">Data Creazione</SortableHeader>
                <SortableHeader field="nome_hotel">Hotel</SortableHeader>
                <SortableHeader field="nome">Nome</SortableHeader>
                <SortableHeader field="cellulare">Cellulare</SortableHeader>
                <SortableHeader field="email">Email</SortableHeader>
                <SortableHeader field="note">Note</SortableHeader>
                <TableHead className="w-20">Azioni</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {sortedOpzioni.length > 0 ? (
                sortedOpzioni.map((opzione) => (
                  <TableRow key={opzione.id} className="hover:bg-secondary-50">
                    <TableCell className="font-medium">{opzione.id}</TableCell>
                    <TableCell>{format(new Date(opzione.created_at), "dd/MM/yyyy HH:mm", { locale: it })}</TableCell>
                    <TableCell className="font-medium">{opzione.nome_hotel}</TableCell>
                    <TableCell>{opzione.nome}</TableCell>
                    <TableCell>{opzione.cellulare}</TableCell>
                    <TableCell>{opzione.email}</TableCell>
                    <TableCell className="max-w-xs">
                      {opzione.note && (
                        <div className="truncate" title={opzione.note}>
                          {opzione.note}
                        </div>
                      )}
                    </TableCell>
                    <TableCell>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" className="h-8 w-8 p-0">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => handleEdit(opzione)}>
                            <Edit className="mr-2 h-4 w-4" />
                            Modifica
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => handleDelete(opzione)} className="text-red-600">
                            <Trash2 className="mr-2 h-4 w-4" />
                            Elimina
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={8} className="text-center py-8 text-gray-500">
                    {selectedHotel === "all"
                      ? "Nessuna opzione trovata"
                      : `Nessuna opzione trovata per ${hotels.find((h) => h.id === selectedHotel)?.nome}`}
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      </CardContent>
      <ModificaOpzioneDialog
        opzione={opzioneToEdit}
        hotels={hotels}
        open={showEditDialog}
        onOpenChange={setShowEditDialog}
        onSuccess={onDataChange}
      />

      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Conferma eliminazione</AlertDialogTitle>
            <AlertDialogDescription>
              Sei sicuro di voler eliminare l'opzione di <strong>{opzioneToDelete?.nome}</strong>? Questa azione non può
              essere annullata.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Annulla</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDelete} disabled={deleting} className="bg-red-600 hover:bg-red-700">
              {deleting ? "Eliminazione..." : "Elimina"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </Card>
  )
}
