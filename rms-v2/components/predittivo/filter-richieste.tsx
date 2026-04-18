"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import { Switch } from "@/components/ui/switch"
import { Checkbox } from "@/components/ui/checkbox"
import { Loader2 } from "lucide-react"

interface Room {
  id: string
  nome: string
}

interface FilterPredittivorichieste {
  roomTypeIds: string[]
  stayWeekStart: string
  rooms: Room[]
  weeks: { start: string; label: string }[]
  isLoading: boolean
  useStayWeek: boolean
  onRoomChange: (roomIds: string[]) => void
  onWeekChange: (week: string) => void
  onToggleWeekType: (useStay: boolean) => void
  onApply: () => void
}

export function FilterPredittivorichieste({
  roomTypeIds,
  stayWeekStart,
  rooms,
  weeks,
  isLoading,
  useStayWeek,
  onRoomChange,
  onWeekChange,
  onToggleWeekType,
  onApply,
}: FilterPredittivorichieste) {
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
        <CardTitle className="text-lg">Filtri</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div className="flex items-center justify-between rounded-lg border border-neutral-200 bg-neutral-50 p-3">
            <div className="flex flex-col gap-1">
              <Label className="text-sm font-medium">Visualizza per</Label>
              <span className="text-xs text-neutral-600">
                {useStayWeek ? "Settimana di Soggiorno" : "Settimana di Richiesta"}
              </span>
            </div>
            <Switch checked={useStayWeek} onCheckedChange={onToggleWeekType} />
          </div>

          <div className="grid gap-4 md:grid-cols-2">
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

            <div className="space-y-2">
              <Label htmlFor="week">
                {useStayWeek ? "Settimana di Richiesta" : "Settimana di Soggiorno"}
              </Label>
              <Select value={stayWeekStart} onValueChange={onWeekChange}>
                <SelectTrigger id="week">
                  <SelectValue placeholder="Seleziona settimana..." />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tutte</SelectItem>
                  {weeks.map((week) => (
                    <SelectItem key={week.start} value={week.start}>
                      {week.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <Button onClick={onApply} className="w-full" disabled={isLoading || roomTypeIds.length === 0}>
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
