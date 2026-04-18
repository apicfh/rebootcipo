"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import { Loader2 } from "lucide-react"

interface Room {
  id: string
  nome: string
}

interface FilterCrescitaProps {
  roomTypeIds: string[]
  stayWeekStart: string
  rooms: Room[]
  stayWeeks: { start: string; label: string }[]
  isLoading: boolean
  mode: 'incremental' | 'cumulative'
  metricType: 'quotes' | 'bookings' | 'combined'
  includeForecast: boolean
  onRoomChange: (roomIds: string[]) => void
  onStayWeekChange: (week: string) => void
  onModeChange: (mode: 'incremental' | 'cumulative') => void
  onMetricTypeChange: (type: 'quotes' | 'bookings' | 'combined') => void
  onIncludeForecastChange: (include: boolean) => void
  onApply: () => void
}

export function FilterCrescita({
  roomTypeIds,
  stayWeekStart,
  rooms,
  stayWeeks,
  isLoading,
  mode,
  metricType,
  includeForecast,
  onRoomChange,
  onStayWeekChange,
  onModeChange,
  onMetricTypeChange,
  onIncludeForecastChange,
  onApply,
}: FilterCrescitaProps) {
  const handleRoomToggle = (roomId: string) => {
    const updated = roomTypeIds.includes(roomId)
      ? roomTypeIds.filter((id) => id !== roomId)
      : [...roomTypeIds, roomId]
    onRoomChange(updated)
  }

  const handleSelectAll = () => {
    if (roomTypeIds.length === rooms.length) {
      onRoomChange([])
    } else {
      onRoomChange(rooms.map((r) => r.id))
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">Filtri Crescita</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {/* Riga 1: Stay Week + Metrica */}
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="stay-week">Settimana di Soggiorno (Fisso)</Label>
              <Select value={stayWeekStart} onValueChange={onStayWeekChange}>
                <SelectTrigger id="stay-week">
                  <SelectValue placeholder="Seleziona settimana..." />
                </SelectTrigger>
                <SelectContent>
                  {stayWeeks.map((week) => (
                    <SelectItem key={week.start} value={week.start}>
                      {week.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="metric">Metrica</Label>
              <Select value={metricType} onValueChange={(value: any) => onMetricTypeChange(value)}>
                <SelectTrigger id="metric">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="quotes">Richieste</SelectItem>
                  <SelectItem value="bookings">Conversioni</SelectItem>
                  <SelectItem value="combined">Entrambe</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Riga 2: Modalità */}
          <div className="grid gap-4 md:grid-cols-3">
            <div className="space-y-2">
              <Label htmlFor="mode">Visualizzazione</Label>
              <Select value={mode} onValueChange={(value: any) => onModeChange(value)}>
                <SelectTrigger id="mode">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="incremental">Incrementale (settimanale)</SelectItem>
                  <SelectItem value="cumulative">Cumulato (progressivo)</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="flex items-end">
              <div className="flex items-center gap-2">
                <Checkbox
                  id="include-forecast"
                  checked={includeForecast}
                  onCheckedChange={(checked) => onIncludeForecastChange(checked as boolean)}
                />
                <Label htmlFor="include-forecast" className="text-sm cursor-pointer font-normal">
                  Mostra Forecast
                </Label>
              </div>
            </div>
          </div>

          {/* Riga 3: Room Types */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label>Tipologia Camera</Label>
              <button
                onClick={handleSelectAll}
                className="text-xs text-blue-600 hover:text-blue-700"
              >
                {roomTypeIds.length === rooms.length ? "Deseleziona tutto" : "Seleziona tutto"}
              </button>
            </div>
            <div className="max-h-48 space-y-2 overflow-y-auto border border-neutral-200 rounded-md p-3 bg-white">
              {rooms.length === 0 ? (
                <p className="text-xs text-neutral-500">Nessuna tipologia disponibile</p>
              ) : (
                rooms.map((room) => (
                  <div key={room.id} className="flex items-center gap-2">
                    <Checkbox
                      id={`room-${room.id}`}
                      checked={roomTypeIds.includes(room.id)}
                      onCheckedChange={() => handleRoomToggle(room.id)}
                    />
                    <Label htmlFor={`room-${room.id}`} className="text-sm cursor-pointer font-normal">
                      {room.nome}
                    </Label>
                  </div>
                ))
              )}
            </div>
            {roomTypeIds.length > 0 && (
              <p className="text-xs text-neutral-600">
                {roomTypeIds.length} tipologia{roomTypeIds.length !== 1 ? "e" : ""} selezionata{roomTypeIds.length !== 1 ? "e" : ""}
              </p>
            )}
          </div>

          {/* Button Applica */}
          <Button onClick={onApply} className="w-full" disabled={isLoading || !stayWeekStart}>
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Caricamento...
              </>
            ) : (
              "Applica Filtri"
            )}
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}
