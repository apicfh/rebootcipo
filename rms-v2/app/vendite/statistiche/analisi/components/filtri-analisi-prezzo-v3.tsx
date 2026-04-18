"use client"

import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Label } from "@/components/ui/label"
import type { FiltriAnalisiPrezzo } from "@/lib/services/analisi-prezzo-service"

interface FiltriAnalisiPrezzoV3Props {
  filtriDisponibili: FiltriAnalisiPrezzo
  hotelSelezionato: string
  cameraSelezionata: string
  settimanaSelezionata: string
  stagioneSelezionata: string
  onHotelChange: (value: string) => void
  onCameraChange: (value: string) => void
  onSettimanaChange: (value: string) => void
  onStagioneChange: (value: string) => void
}

export function FiltriAnalisiPrezzoV3({
  filtriDisponibili,
  hotelSelezionato,
  cameraSelezionata,
  settimanaSelezionata,
  stagioneSelezionata,
  onHotelChange,
  onCameraChange,
  onSettimanaChange,
  onStagioneChange,
}: FiltriAnalisiPrezzoV3Props) {
  // Filtra stagioni per hotel selezionato
  const stagioniFiltratePerHotel = hotelSelezionato
    ? filtriDisponibili.stagioni.filter((s) => s.hotel_id === hotelSelezionato)
    : []

  // Filtra settimane per stagione selezionata
  const settimaneFiltratePerStagione =
    stagioneSelezionata && stagioneSelezionata !== "all"
      ? (() => {
          const stagione = stagioniFiltratePerHotel.find((s) => s.stagione === stagioneSelezionata)
          return stagione ? filtriDisponibili.settimane.filter((s) => s.anno === stagione.anno) : []
        })()
      : filtriDisponibili.settimane

  // Filtra camere per hotel selezionato
  const camereFiltratePerHotel = hotelSelezionato
    ? filtriDisponibili.tipi_camere.filter((c) => c.id_hotel === hotelSelezionato)
    : []

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      {/* Hotel */}
      <div className="space-y-2">
        <Label className="text-sm font-medium">Hotel</Label>
        <Select value={hotelSelezionato} onValueChange={onHotelChange}>
          <SelectTrigger>
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

      {/* Stagione */}
      <div className="space-y-2">
        <Label className="text-sm font-medium">Stagione</Label>
        <Select value={stagioneSelezionata} onValueChange={onStagioneChange} disabled={!hotelSelezionato}>
          <SelectTrigger>
            <SelectValue placeholder="Seleziona stagione" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Tutte le stagioni</SelectItem>
            {stagioniFiltratePerHotel.map((stagione) => (
              <SelectItem key={`${stagione.stagione}-${stagione.anno}`} value={stagione.stagione}>
                {stagione.stagione} {stagione.anno}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Settimana */}
      <div className="space-y-2">
        <Label className="text-sm font-medium">Settimana</Label>
        <Select value={settimanaSelezionata} onValueChange={onSettimanaChange} disabled={!stagioneSelezionata}>
          <SelectTrigger>
            <SelectValue placeholder="Seleziona settimana" />
          </SelectTrigger>
          <SelectContent>
            {settimaneFiltratePerStagione.map((settimana) => (
              <SelectItem key={settimana.id} value={settimana.id}>
                {settimana.nome}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Tipo Camera */}
      <div className="space-y-2">
        <Label className="text-sm font-medium">Tipo Camera</Label>
        <Select value={cameraSelezionata} onValueChange={onCameraChange} disabled={!hotelSelezionato}>
          <SelectTrigger>
            <SelectValue placeholder="Seleziona camera" />
          </SelectTrigger>
          <SelectContent>
            {camereFiltratePerHotel.map((camera) => (
              <SelectItem key={camera.id} value={camera.id}>
                {camera.nome}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
    </div>
  )
}
