"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import { Label } from "@/components/ui/label"
import { Loader2 } from "lucide-react"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { DatePicker } from "@/components/ui/date-picker"
import type { HotelType } from "../types"

interface SezioneFiltriProps {
  hotels: HotelType[]
  dataInizio: Date
  setDataInizio: (v: Date) => void
  dataFine: Date
  setDataFine: (v: Date) => void
  selectedHotels: string[]
  setSelectedHotels: (v: string[]) => void
  confrontoSDLY: boolean
  setConfrontoSDLY: (v: boolean) => void
  confrontoLY: boolean
  setConfrontoLY: (v: boolean) => void
  soloConfermate: boolean
  setSoloConfermate: (v: boolean) => void
  visualizzazione: "totale" | "per-hotel" | "per-periodo"
  setVisualizzazione: (v: "totale" | "per-hotel" | "per-periodo") => void
  visualizzazioneDati: "tabella" | "grafico"
  setVisualizzazioneDati: (v: "tabella" | "grafico") => void
  loading: boolean
  calcolaRisultati: () => void
}

export function SezioneFiltri({
  hotels,
  dataInizio, setDataInizio,
  dataFine, setDataFine,
  selectedHotels, setSelectedHotels,
  confrontoSDLY, setConfrontoSDLY,
  confrontoLY, setConfrontoLY,
  soloConfermate, setSoloConfermate,
  visualizzazione, setVisualizzazione,
  visualizzazioneDati, setVisualizzazioneDati,
  loading,
  calcolaRisultati,
}: SezioneFiltriProps) {
  return (
    <Card className="mb-6 border-2 border-secondary-300 shadow-md hover:shadow-lg transition-shadow">
      <CardHeader className="border-b-2 border-secondary-200">
        <CardTitle className="text-primary">Filtri</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-4">
          <div>
            <Label htmlFor="hotel-select" className="mb-2 block font-medium">
              Hotel
            </Label>
            <Select
              onValueChange={(value) => {
                if (value === "tutti") {
                  setSelectedHotels(hotels.map((h) => h.id))
                } else {
                  setSelectedHotels([value])
                }
              }}
            >
              <SelectTrigger id="hotel-select" className="border-2">
                <SelectValue placeholder="Seleziona hotel" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="tutti">Tutti gli hotel</SelectItem>
                {hotels.map((hotel) => (
                  <SelectItem key={hotel.id} value={hotel.id}>
                    {hotel.nome}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label className="mb-2 block font-medium">Data inizio</Label>
            <DatePicker date={dataInizio} setDate={setDataInizio} className="w-full border-2" />
          </div>

          <div>
            <Label className="mb-2 block font-medium">Data fine</Label>
            <DatePicker date={dataFine} setDate={setDataFine} className="w-full border-2" />
          </div>

          <div className="flex flex-col justify-end">
            <div className="flex items-center space-x-2 mb-2">
              <Checkbox
                id="confronto-sdly"
                checked={confrontoSDLY}
                onCheckedChange={(checked) => setConfrontoSDLY(checked as boolean)}
              />
              <Label htmlFor="confronto-sdly">Confronto SDLY (stesso periodo anno precedente)</Label>
            </div>
            <div className="flex items-center space-x-2 mb-2">
              <Checkbox
                id="confronto-ly"
                checked={confrontoLY}
                onCheckedChange={(checked) => setConfrontoLY(checked as boolean)}
              />
              <Label htmlFor="confronto-ly">Confronto LY (7 settembre anno precedente)</Label>
            </div>
            <div className="flex items-center space-x-2 mb-2">
              <Checkbox
                id="solo-confermate"
                checked={soloConfermate}
                onCheckedChange={(checked) => setSoloConfermate(checked as boolean)}
              />
              <Label htmlFor="solo-confermate">
                Solo prenotazioni confermate (stati 1, 3, 6, 7, Confermato, Confermata)
              </Label>
            </div>
          </div>
        </div>

        <div className="flex flex-col md:flex-row justify-between items-center mt-4">
          <div className="flex items-center space-x-4 mb-4 md:mb-0">
            <Label className="font-medium">Visualizzazione:</Label>
            <Select
              value={visualizzazione}
              onValueChange={(value: "totale" | "per-hotel" | "per-periodo") => setVisualizzazione(value)}
            >
              <SelectTrigger className="w-[180px] border-2">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="totale">Totale</SelectItem>
                <SelectItem value="per-hotel">Per Hotel</SelectItem>
                <SelectItem value="per-periodo">Per Periodo</SelectItem>
              </SelectContent>
            </Select>

            <div className="ml-4 flex items-center space-x-2">
              <Label className="font-medium">Formato:</Label>
              <div className="flex border-2 rounded-md overflow-hidden">
                <Button
                  variant={visualizzazioneDati === "tabella" ? "default" : "ghost"}
                  className="rounded-none px-3 py-1 h-9"
                  onClick={() => setVisualizzazioneDati("tabella")}
                >
                  Tabella
                </Button>
                <Button
                  variant={visualizzazioneDati === "grafico" ? "default" : "ghost"}
                  className="rounded-none px-3 py-1 h-9"
                  onClick={() => setVisualizzazioneDati("grafico")}
                >
                  Grafico
                </Button>
              </div>
            </div>
          </div>

          <Button onClick={calcolaRisultati} disabled={loading} className="font-bold">
            {loading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Elaborazione...
              </>
            ) : (
              "Ricerca"
            )}
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}
