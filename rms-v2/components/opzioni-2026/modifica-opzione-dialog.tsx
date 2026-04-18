"use client"

import type React from "react"

import { useState, useEffect } from "react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { toast } from "@/components/ui/use-toast"
import type { Opzione2026 } from "@/lib/services/opzioni-2026-service"

interface Hotel {
  id: string
  nome: string
}

interface ModificaOpzioneDialogProps {
  opzione: Opzione2026 | null
  hotels: Hotel[]
  open: boolean
  onOpenChange: (open: boolean) => void
  onSuccess: () => void
}

export function ModificaOpzioneDialog({ opzione, hotels, open, onOpenChange, onSuccess }: ModificaOpzioneDialogProps) {
  const [loading, setLoading] = useState(false)
  const [formData, setFormData] = useState({
    id_hotel: "",
    nome: "",
    cellulare: "",
    email: "",
    note: "",
  })

  // Popola il form quando si apre il dialog
  useEffect(() => {
    if (opzione && open) {
      setFormData({
        id_hotel: opzione.id_hotel,
        nome: opzione.nome,
        cellulare: opzione.cellulare,
        email: opzione.email,
        note: opzione.note || "",
      })
    }
  }, [opzione, open])

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target
    setFormData((prev) => ({ ...prev, [name]: value }))
  }

  const handleHotelChange = (value: string) => {
    setFormData((prev) => ({ ...prev, id_hotel: value }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!opzione) return

    setLoading(true)

    try {
      // Validazione
      if (!formData.id_hotel || !formData.nome || !formData.cellulare || !formData.email) {
        toast({
          title: "Errore di validazione",
          description: "Tutti i campi sono obbligatori tranne le note",
          variant: "destructive",
        })
        setLoading(false)
        return
      }

      // Importa la funzione qui per evitare problemi di circular import
      const { updateOpzione2026 } = await import("@/lib/services/opzioni-2026-service")

      const success = await updateOpzione2026(opzione.id, formData)

      if (success) {
        toast({
          title: "Successo",
          description: "Opzione aggiornata con successo",
        })
        onOpenChange(false)
        onSuccess()
      } else {
        toast({
          title: "Errore",
          description: "Errore durante l'aggiornamento dell'opzione",
          variant: "destructive",
        })
      }
    } catch (error) {
      console.error("Errore:", error)
      toast({
        title: "Errore",
        description: "Si è verificato un errore durante l'aggiornamento",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Modifica Opzione 2026</DialogTitle>
          <DialogDescription>Modifica i dati dell'opzione selezionata</DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit}>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="edit_id_hotel">Hotel</Label>
              <Select value={formData.id_hotel} onValueChange={handleHotelChange}>
                <SelectTrigger id="edit_id_hotel">
                  <SelectValue placeholder="Seleziona un hotel" />
                </SelectTrigger>
                <SelectContent>
                  {hotels.map((hotel) => (
                    <SelectItem key={hotel.id} value={hotel.id}>
                      {hotel.nome}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="edit_nome">Nome Completo</Label>
              <Input
                id="edit_nome"
                name="nome"
                value={formData.nome}
                onChange={handleChange}
                placeholder="Inserisci nome e cognome"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="edit_cellulare">Cellulare</Label>
              <Input
                id="edit_cellulare"
                name="cellulare"
                value={formData.cellulare}
                onChange={handleChange}
                placeholder="Inserisci il numero di cellulare"
                type="text"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="edit_email">Email</Label>
              <Input
                id="edit_email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                placeholder="Inserisci l'indirizzo email"
                type="email"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="edit_note">Note (opzionale)</Label>
              <Textarea
                id="edit_note"
                name="note"
                value={formData.note}
                onChange={handleChange}
                placeholder="Inserisci eventuali note"
                rows={3}
              />
            </div>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Annulla
            </Button>
            <Button type="submit" disabled={loading} className="bg-primary-600 hover:bg-primary-700">
              {loading ? "Aggiornamento..." : "Aggiorna"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
