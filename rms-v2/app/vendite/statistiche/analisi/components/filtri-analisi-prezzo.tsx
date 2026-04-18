"use client"

import { useState, useEffect } from "react"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import { Search, Plus } from "lucide-react"
import type { FiltriAnalisiPrezzo as FiltriType } from "@/lib/services/analisi-prezzo-service"

interface FiltriAnalisiPrezzoProps {
  filtriDisponibili: FiltriType
  onFiltriChange: (hotel_id: string, camera_id: string, settimana_id: string, stagione?: string) => void
  valoriIniziali?: {
    hotel_id?: string
    camera_id?: string
    settimana_id?: string
    stagione?: string
  }
}

export function FiltriAnalisiPrezzo({ filtriDisponibili, onFiltriChange, valoriIniziali }: FiltriAnalisiPrezzoProps) {
  const [hotelSelezionato, setHotelSelezionato] = useState("")
  const [cameraSelezionata, setCameraSelezionata] = useState("")
  const [settimanaSelezionata, setSettimanaSelezionata] = useState("")
  const [stagioneSelezionata, setStagioneSelezionata] = useState("")

  // Filtri derivati
  const camereFiltrate = filtriDisponibili.tipi_camere.filter(
    (camera) => !hotelSelezionato || camera.id_hotel === hotelSelezionato,
  )

  const stagioniFiltrate = filtriDisponibili.stagioni.filter(
    (stagione) => !hotelSelezionato || stagione.hotel_id === hotelSelezionato,
  )

  // Filtra le settimane in base alla stagione selezionata
  const settimaneFiltratePerStagione = filtriDisponibili.settimane.filter((settimana) => {
    if (!stagioneSelezionata) return false

    const stagioneObj = stagioniFiltrate.find((s) => s.stagione === stagioneSelezionata)
    if (!stagioneObj) return false

    // Filtra le settimane che sono nell'anno della stagione selezionata
    return settimana.anno === stagioneObj.anno
  })

  // Gestisci il cambio di hotel
  const handleHotelChange = (value: string) => {
    setHotelSelezionato(value)
    setCameraSelezionata("")
    setStagioneSelezionata("")
    setSettimanaSelezionata("")
  }

  // Gestisci il cambio di stagione
  const handleStagioneChange = (value: string) => {
    setStagioneSelezionata(value)
    setSettimanaSelezionata("") // Reset settimana quando cambia stagione
  }

  // Funzione per applicare i filtri
  const applicaFiltri = () => {
    if (hotelSelezionato && cameraSelezionata && settimanaSelezionata) {
      onFiltriChange(hotelSelezionato, cameraSelezionata, settimanaSelezionata, stagioneSelezionata || undefined)
    }
  }

  // Aggiorna i filtri quando cambiano i valori iniziali
  useEffect(() => {
    if (valoriIniziali) {
      if (valoriIniziali.hotel_id !== undefined) setHotelSelezionato(valoriIniziali.hotel_id)
      if (valoriIniziali.camera_id !== undefined) setCameraSelezionata(valoriIniziali.camera_id)
      if (valoriIniziali.settimana_id !== undefined) setSettimanaSelezionata(valoriIniziali.settimana_id)
      if (valoriIniziali.stagione !== undefined) setStagioneSelezionata(valoriIniziali.stagione)
    }
  }, [valoriIniziali])

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Hotel */}
        <div className="space-y-2">
          <Label htmlFor="hotel">Hotel</Label>
          <Select value={hotelSelezionato} onValueChange={handleHotelChange}>
            <SelectTrigger id="hotel">
              <SelectValue placeholder="Seleziona hotel" />
            </SelectTrigger>
            <SelectContent>
              {filtriDisponibili.hotels.map((hotel) => (
                <SelectItem key={hotel.id} value={hotel.id}>
                  {hotel.nome}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Tipo Camera */}
        <div className="space-y-2">
          <Label htmlFor="camera">Tipo Camera</Label>
          <Select
            value={cameraSelezionata}
            onValueChange={setCameraSelezionata}
            disabled={!hotelSelezionato || camereFiltrate.length === 0}
          >
            <SelectTrigger id="camera">
              <SelectValue placeholder="Seleziona tipo camera" />
            </SelectTrigger>
            <SelectContent>
              {camereFiltrate.map((camera) => (
                <SelectItem key={camera.id} value={camera.id}>
                  {camera.nome}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Stagione */}
        <div className="space-y-2">
          <Label htmlFor="stagione">Stagione</Label>
          <Select
            value={stagioneSelezionata}
            onValueChange={handleStagioneChange}
            disabled={!hotelSelezionato || stagioniFiltrate.length === 0}
          >
            <SelectTrigger id="stagione">
              <SelectValue placeholder="Seleziona stagione" />
            </SelectTrigger>
            <SelectContent>
              {stagioniFiltrate.map((stagione) => (
                <SelectItem key={stagione.id} value={stagione.stagione}>
                  {stagione.stagione} ({stagione.anno})
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Settimana - Solo dopo aver selezionato la stagione */}
        <div className="space-y-2">
          <Label htmlFor="settimana">Settimana</Label>
          <Select
            value={settimanaSelezionata}
            onValueChange={setSettimanaSelezionata}
            disabled={!stagioneSelezionata || settimaneFiltratePerStagione.length === 0}
          >
            <SelectTrigger id="settimana">
              <SelectValue placeholder="Prima seleziona una stagione" />
            </SelectTrigger>
            <SelectContent>
              {settimaneFiltratePerStagione.map((settimana) => (
                <SelectItem key={settimana.id} value={settimana.id}>
                  {settimana.nome} ({settimana.inizio.substring(0, 10)} - {settimana.fine.substring(0, 10)})
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Info filtri */}
      <div className="text-sm text-muted-foreground">
        {stagioneSelezionata && (
          <p>
            Settimane disponibili per {stagioneSelezionata}: {settimaneFiltratePerStagione.length}
          </p>
        )}
      </div>

      {/* Pulsante Filtra */}
      <Button
        onClick={applicaFiltri}
        disabled={!hotelSelezionato || !cameraSelezionata || !settimanaSelezionata || !stagioneSelezionata}
        className="w-full"
      >
        <Search className="h-4 w-4 mr-2" />
        Filtra Dati
      </Button>
      {hotelSelezionato && cameraSelezionata && settimanaSelezionata && stagioneSelezionata && (
        <Button onClick={applicaFiltri} variant="outline" className="w-full mt-2 bg-transparent">
          <Plus className="h-4 w-4 mr-2" />
          Aggiungi Confronto
        </Button>
      )}
    </div>
  )
}
