"use client"

import type React from "react"

import { useState } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import type { FiltroRecensioni } from "@/lib/services/recensioni-tripadvisor-service"
import { DatePicker } from "@/components/ui/date-picker"
import { Search, SlidersHorizontal, X } from "lucide-react"

interface FiltriRecensioniProps {
  hotels: { id: string; nome: string }[]
  filtri: FiltroRecensioni
  onFiltriChange: (filtri: FiltroRecensioni) => void
}

export function FiltriRecensioni({ hotels, filtri, onFiltriChange }: FiltriRecensioniProps) {
  const [mostraFiltriAvanzati, setMostraFiltriAvanzati] = useState(false)
  const [filtriLocali, setFiltriLocali] = useState<FiltroRecensioni>(filtri)

  const handleChange = (campo: keyof FiltroRecensioni, valore: any) => {
    setFiltriLocali((prev) => ({ ...prev, [campo]: valore }))
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    onFiltriChange(filtriLocali)
  }

  const handleReset = () => {
    const filtriFresh: FiltroRecensioni = {}
    setFiltriLocali(filtriFresh)
    onFiltriChange(filtriFresh)
  }

  return (
    <Card>
      <CardContent className="pt-6">
        <form onSubmit={handleSubmit}>
          <div className="flex flex-col md:flex-row gap-4 mb-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  type="text"
                  placeholder="Cerca nelle recensioni..."
                  className="pl-8"
                  value={filtriLocali.ricerca || ""}
                  onChange={(e) => handleChange("ricerca", e.target.value)}
                />
              </div>
            </div>

            <div className="flex gap-2">
              <Button type="button" variant="outline" onClick={() => setMostraFiltriAvanzati(!mostraFiltriAvanzati)}>
                <SlidersHorizontal className="h-4 w-4 mr-2" />
                Filtri
              </Button>
              <Button type="submit">Applica</Button>
            </div>
          </div>

          {mostraFiltriAvanzati && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mt-4 border-t pt-4">
              <div>
                <Label htmlFor="hotel">Hotel</Label>
                <Select
                  value={filtriLocali.hotel_id || ""}
                  onValueChange={(value) => handleChange("hotel_id", value || undefined)}
                >
                  <SelectTrigger id="hotel">
                    <SelectValue placeholder="Tutti gli hotel" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">Tutti gli hotel</SelectItem>
                    {hotels.map((hotel) => (
                      <SelectItem key={hotel.id} value={hotel.id}>
                        {hotel.nome}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="valutazione">Valutazione</Label>
                <Select
                  value={filtriLocali.valutazione?.toString() || ""}
                  onValueChange={(value) => handleChange("valutazione", value ? Number.parseInt(value) : undefined)}
                >
                  <SelectTrigger id="valutazione">
                    <SelectValue placeholder="Tutte le valutazioni" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Tutte le valutazioni</SelectItem>
                    <SelectItem value="5">5 stelle</SelectItem>
                    <SelectItem value="4">4 stelle</SelectItem>
                    <SelectItem value="3">3 stelle</SelectItem>
                    <SelectItem value="2">2 stelle</SelectItem>
                    <SelectItem value="1">1 stella</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="data_inizio">Data inizio</Label>
                <DatePicker
                  id="data_inizio"
                  date={filtriLocali.data_inizio ? new Date(filtriLocali.data_inizio) : undefined}
                  onSelect={(date) => handleChange("data_inizio", date ? date.toISOString() : undefined)}
                />
              </div>

              <div>
                <Label htmlFor="data_fine">Data fine</Label>
                <DatePicker
                  id="data_fine"
                  date={filtriLocali.data_fine ? new Date(filtriLocali.data_fine) : undefined}
                  onSelect={(date) => handleChange("data_fine", date ? date.toISOString() : undefined)}
                />
              </div>

              <div>
                <Label htmlFor="ordinamento">Ordinamento</Label>
                <Select
                  value={filtriLocali.ordinamento || "recenti"}
                  onValueChange={(value) =>
                    handleChange(
                      "ordinamento",
                      value as "recenti" | "vecchie" | "valutazione_alta" | "valutazione_bassa",
                    )
                  }
                >
                  <SelectTrigger id="ordinamento">
                    <SelectValue placeholder="Più recenti" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="recenti">Più recenti</SelectItem>
                    <SelectItem value="vecchie">Più vecchie</SelectItem>
                    <SelectItem value="valutazione_alta">Valutazione più alta</SelectItem>
                    <SelectItem value="valutazione_bassa">Valutazione più bassa</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="md:col-span-2 lg:col-span-3 flex items-end">
                <Button type="button" variant="ghost" onClick={handleReset} className="gap-1">
                  <X className="h-4 w-4" /> Reimposta filtri
                </Button>
              </div>
            </div>
          )}
        </form>
      </CardContent>
    </Card>
  )
}
