// Componente per i filtri della nuova sezione domanda TravelBrain
"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { ElegantDatePicker } from "@/components/ui/elegant-date-picker"
import { Checkbox } from "@/components/ui/checkbox"
import { Switch } from "@/components/ui/switch"
import { format, subDays, startOfMonth, endOfMonth } from "date-fns"
import { cn } from "@/lib/utils"
import type { DomandaTravelbrainFilters, HotelData, StatoPreventivo } from "@/lib/services/domanda-travelbrain-service"
import { DomandaTravelbrainService } from "@/lib/services/domanda-travelbrain-service"

interface FiltriTravelbrainProps {
  filters: DomandaTravelbrainFilters
  onFiltersChange: (filters: DomandaTravelbrainFilters) => void
  hotels: HotelData[]
  selectedHotels: number[]
  onHotelsChange: (hotelIds: number[]) => void
  onApplyFilters: () => void
}

export function FiltriTravelbrain({
  filters,
  onFiltersChange,
  hotels,
  selectedHotels,
  onHotelsChange,
  onApplyFilters,
}: FiltriTravelbrainProps) {
  const [creationStartDate, setCreationStartDate] = useState<Date>()
  const [creationEndDate, setCreationEndDate] = useState<Date>()
  const [checkinDate, setCheckinDate] = useState<Date>()
  const [checkoutDate, setCheckoutDate] = useState<Date>()
  const [statiPreventivi, setStatiPreventivi] = useState<StatoPreventivo[]>([])
  const [selectedStati, setSelectedStati] = useState<number[]>([])

  const [useCreationPresets, setUseCreationPresets] = useState(true)
  const [useSoggiornoPresets, setUseSoggiornoPresets] = useState(true)
  const [selectedCreationPreset, setSelectedCreationPreset] = useState<string>("")
  const [selectedSoggiornoPreset, setSelectedSoggiornoPreset] = useState<string>("")

  useEffect(() => {
    const loadStatiPreventivi = async () => {
      try {
        const stati = await DomandaTravelbrainService.getStatiPreventivi()
        setStatiPreventivi(stati)
        const allStatiIds = stati.map((stato) => stato.id_stato)
        setSelectedStati(allStatiIds)

        const newFilters = { ...filters }
        newFilters.statiIds = allStatiIds
        onFiltersChange(newFilters)
      } catch (error) {
        console.error("Errore nel caricamento stati preventivi:", error)
      }
    }

    loadStatiPreventivi()
  }, [])

  const handleCreationPreset = (preset: string) => {
    setSelectedCreationPreset(preset)
    const newFilters = { ...filters }
    const today = new Date()
    const currentYear = today.getFullYear()

    switch (preset) {
      case "7giorni":
        newFilters.creationDateStart = subDays(today, 7).toISOString()
        newFilters.creationDateEnd = today.toISOString()
        break
      case "14giorni":
        newFilters.creationDateStart = subDays(today, 14).toISOString()
        newFilters.creationDateEnd = today.toISOString()
        break
      case "30giorni":
        newFilters.creationDateStart = subDays(today, 30).toISOString()
        newFilters.creationDateEnd = today.toISOString()
        break
      case "inizio":
        newFilters.creationDateStart = new Date(currentYear - 1, 8, 15).toISOString() // 15 settembre anno precedente
        newFilters.creationDateEnd = today.toISOString()
        break
      default:
        newFilters.creationDateStart = undefined
        newFilters.creationDateEnd = undefined
    }

    onFiltersChange(newFilters)
  }

  const handleSoggiornoPreset = (preset: string) => {
    setSelectedSoggiornoPreset(preset)
    const newFilters = { ...filters }
    const currentYear = new Date().getFullYear()

    switch (preset) {
      case "maggio":
        newFilters.checkinStart = format(startOfMonth(new Date(currentYear, 4)), "yyyy-MM-dd")
        newFilters.checkoutEnd = format(endOfMonth(new Date(currentYear, 4)), "yyyy-MM-dd")
        break
      case "giugno":
        newFilters.checkinStart = format(startOfMonth(new Date(currentYear, 5)), "yyyy-MM-dd")
        newFilters.checkoutEnd = format(endOfMonth(new Date(currentYear, 5)), "yyyy-MM-dd")
        break
      case "luglio":
        newFilters.checkinStart = format(startOfMonth(new Date(currentYear, 6)), "yyyy-MM-dd")
        newFilters.checkoutEnd = format(endOfMonth(new Date(currentYear, 6)), "yyyy-MM-dd")
        break
      case "agosto":
        newFilters.checkinStart = format(startOfMonth(new Date(currentYear, 7)), "yyyy-MM-dd")
        newFilters.checkoutEnd = format(endOfMonth(new Date(currentYear, 7)), "yyyy-MM-dd")
        break
      case "settembre":
        newFilters.checkinStart = format(startOfMonth(new Date(currentYear, 8)), "yyyy-MM-dd")
        newFilters.checkoutEnd = format(endOfMonth(new Date(currentYear, 8)), "yyyy-MM-dd")
        break
      case "estate":
        newFilters.checkinStart = format(new Date(currentYear, 4, 15), "yyyy-MM-dd") // 15 maggio
        newFilters.checkoutEnd = format(new Date(currentYear, 8, 15), "yyyy-MM-dd") // 15 settembre
        break
      default:
        newFilters.checkinStart = undefined
        newFilters.checkoutEnd = undefined
    }

    onFiltersChange(newFilters)
  }

  const handleDateChange = (type: "creationStart" | "creationEnd" | "checkin" | "checkout", date: Date | undefined) => {
    const newFilters = { ...filters }

    switch (type) {
      case "creationStart":
        setCreationStartDate(date)
        newFilters.creationDateStart = date ? date.toISOString() : undefined
        break
      case "creationEnd":
        setCreationEndDate(date)
        newFilters.creationDateEnd = date ? date.toISOString() : undefined
        break
      case "checkin":
        setCheckinDate(date)
        newFilters.checkinStart = date ? format(date, "yyyy-MM-dd") : undefined
        break
      case "checkout":
        setCheckoutDate(date)
        newFilters.checkoutEnd = date ? format(date, "yyyy-MM-dd") : undefined
        break
    }

    onFiltersChange(newFilters)
  }

  const toggleHotel = (hotelId: number) => {
    const isCurrentlySelected = selectedHotels.includes(hotelId)

    if (isCurrentlySelected) {
      const newSelected = selectedHotels.filter((id) => id !== hotelId)
      onHotelsChange(newSelected)
    } else {
      if (selectedHotels.length < 3) {
        const newSelected = [...selectedHotels, hotelId]
        onHotelsChange(newSelected)
      }
    }
  }

  const toggleStato = (statoId: number) => {
    const newSelected = selectedStati.includes(statoId)
      ? selectedStati.filter((id) => id !== statoId)
      : [...selectedStati, statoId]
    setSelectedStati(newSelected)

    const newFilters = { ...filters }
    newFilters.statiIds = newSelected.length > 0 ? newSelected : undefined
    onFiltersChange(newFilters)
  }

  const getHotelColor = (hotelName: string) => {
    const name = hotelName.toLowerCase()

    // Arancio e sfumature
    if (name.includes("best riccione")) return "bg-orange-600 hover:bg-orange-700"
    if (name.includes("riccione fronte mare")) return "bg-orange-400 hover:bg-orange-500"
    if (name.includes("riccione village")) return "bg-orange-500 hover:bg-orange-600"

    // Azzurro e variazioni
    if (name.includes("cervia village")) return "bg-sky-500 hover:bg-sky-600"
    if (name.includes("costa dei pini")) return "bg-sky-300 hover:bg-sky-400"
    if (name.includes("tintoretto")) return "bg-blue-600 hover:bg-blue-700"

    // Verde, rosa, rosa shocking
    if (name.includes("serenissima")) return "bg-green-500 hover:bg-green-600"
    if (name.includes("tosi beach")) return "bg-pink-500 hover:bg-pink-600"
    if (name.includes("rimini village")) return "bg-pink-600 hover:bg-pink-700"

    // Viola e sfumature
    if (name.includes("milano marittima")) return "bg-purple-600 hover:bg-purple-700"
    if (name.includes("michelangelo")) return "bg-purple-500 hover:bg-purple-600"
    if (name.includes("mivi village")) return "bg-violet-500 hover:bg-violet-600"

    // Nero
    if (name.includes("executive")) return "bg-gray-900 hover:bg-black"
    if (name.includes("palace lido")) return "bg-gray-800 hover:bg-gray-900"

    return "bg-gray-500 hover:bg-gray-600"
  }

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Filtri Data Creazione */}
        <Card>
          <CardHeader>
            <CardTitle>Data Creazione Preventivo</CardTitle>
            <p className="text-sm text-gray-600">Opzionale - lascia vuoto per non filtrare per data creazione</p>
            <div className="flex items-center space-x-2">
              <Switch
                id="creation-preset-switch"
                checked={useCreationPresets}
                onCheckedChange={setUseCreationPresets}
              />
              <label htmlFor="creation-preset-switch" className="text-sm font-medium">
                {useCreationPresets ? "Date predefinite" : "Date personalizzate"}
              </label>
            </div>
          </CardHeader>
          <CardContent>
            {useCreationPresets ? (
              <div className="space-y-2">
                {[
                  { value: "7giorni", label: "Ultimi 7 giorni" },
                  { value: "14giorni", label: "Ultimi 14 giorni" },
                  { value: "30giorni", label: "Ultimi 30 giorni" },
                  { value: "inizio", label: "Dall'inizio" },
                ].map((preset) => (
                  <Button
                    key={preset.value}
                    variant={selectedCreationPreset === preset.value ? "default" : "outline"}
                    size="sm"
                    onClick={() => handleCreationPreset(preset.value)}
                    className="w-full justify-start"
                  >
                    {preset.label}
                  </Button>
                ))}
              </div>
            ) : (
              <div className="space-y-4">
                <div>
                  <label className="text-sm font-medium mb-2 block">Data Inizio</label>
                  <ElegantDatePicker
                    date={creationStartDate}
                    onDateChange={(date) => handleDateChange("creationStart", date)}
                    placeholder="Seleziona data inizio"
                  />
                </div>

                <div>
                  <label className="text-sm font-medium mb-2 block">Data Fine</label>
                  <ElegantDatePicker
                    date={creationEndDate}
                    onDateChange={(date) => handleDateChange("creationEnd", date)}
                    placeholder="Seleziona data fine"
                  />
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Filtri Data Soggiorno */}
        <Card>
          <CardHeader>
            <CardTitle>Data Soggiorno</CardTitle>
            <p className="text-sm text-gray-600">Opzionale - lascia vuoto per non filtrare per data soggiorno</p>
            <div className="flex items-center space-x-2">
              <Switch
                id="soggiorno-preset-switch"
                checked={useSoggiornoPresets}
                onCheckedChange={setUseSoggiornoPresets}
              />
              <label htmlFor="soggiorno-preset-switch" className="text-sm font-medium">
                {useSoggiornoPresets ? "Date predefinite" : "Date personalizzate"}
              </label>
            </div>
          </CardHeader>
          <CardContent>
            {useSoggiornoPresets ? (
              <div className="space-y-2">
                {[
                  { value: "maggio", label: "Maggio" },
                  { value: "giugno", label: "Giugno" },
                  { value: "luglio", label: "Luglio" },
                  { value: "agosto", label: "Agosto" },
                  { value: "settembre", label: "Settembre" },
                  { value: "estate", label: "Estate" },
                ].map((preset) => (
                  <Button
                    key={preset.value}
                    variant={selectedSoggiornoPreset === preset.value ? "default" : "outline"}
                    size="sm"
                    onClick={() => handleSoggiornoPreset(preset.value)}
                    className="w-full justify-start"
                  >
                    {preset.label}
                  </Button>
                ))}
              </div>
            ) : (
              <div className="space-y-4">
                <div>
                  <label className="text-sm font-medium mb-2 block">Check-in</label>
                  <ElegantDatePicker
                    date={checkinDate}
                    onDateChange={(date) => handleDateChange("checkin", date)}
                    placeholder="Seleziona data check-in"
                  />
                </div>

                <div>
                  <label className="text-sm font-medium mb-2 block">Check-out</label>
                  <ElegantDatePicker
                    date={checkoutDate}
                    onDateChange={(date) => handleDateChange("checkout", date)}
                    placeholder="Seleziona data check-out"
                  />
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Filtri Stati Preventivi */}
      <Card>
        <CardHeader>
          <CardTitle>Stati Preventivi</CardTitle>
          <p className="text-sm text-gray-600">Seleziona gli stati da includere nell'analisi</p>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
            {statiPreventivi.map((stato) => (
              <div key={stato.id_stato} className="flex items-center space-x-2">
                <Checkbox
                  id={`stato-${stato.id_stato}`}
                  checked={selectedStati.includes(stato.id_stato)}
                  onCheckedChange={() => toggleStato(stato.id_stato)}
                />
                <label
                  htmlFor={`stato-${stato.id_stato}`}
                  className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                >
                  {stato.descrizione}
                </label>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Filtri Hotel */}
      <Card>
        <CardHeader>
          <CardTitle>Hotel</CardTitle>
          <p className="text-sm text-gray-600">
            Massimo 3 hotel selezionabili contemporaneamente per ottimizzare le performance
          </p>
          {selectedHotels.length >= 3 && (
            <p className="text-sm text-amber-600 font-medium">
              Limite raggiunto: deseleziona un hotel per sceglierne un altro
            </p>
          )}
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-2">
            {hotels.map((hotel) => (
              <Button
                key={hotel.hotel_id}
                variant={selectedHotels.includes(hotel.hotel_id) ? "default" : "outline"}
                size="sm"
                onClick={() => toggleHotel(hotel.hotel_id)}
                disabled={selectedHotels.length >= 3 && !selectedHotels.includes(hotel.hotel_id)}
                className={cn(
                  "text-white",
                  selectedHotels.includes(hotel.hotel_id) ? getHotelColor(hotel.hotel_name) : "hover:text-white",
                  selectedHotels.length >= 3 &&
                    !selectedHotels.includes(hotel.hotel_id) &&
                    "opacity-50 cursor-not-allowed",
                )}
              >
                {hotel.hotel_name}
              </Button>
            ))}
          </div>
        </CardContent>
      </Card>

      <div className="flex justify-center pt-4">
        <Button onClick={onApplyFilters} size="lg" className="bg-blue-600 hover:bg-blue-700 text-white px-8">
          Applica Filtri
        </Button>
      </div>
    </div>
  )
}

export function getHotelColorByName(hotelName: string): string {
  const name = hotelName.toLowerCase()

  // Arancio e sfumature
  if (name.includes("best riccione")) return "#FF8C00"
  if (name.includes("riccione fronte mare")) return "#FF7F50"
  if (name.includes("riccione village")) return "#FFA500"

  // Azzurro e variazioni
  if (name.includes("cervia village")) return "#00BFFF"
  if (name.includes("costa dei pini")) return "#87CEEB"
  if (name.includes("tintoretto")) return "#4682B4"

  // Verde, rosa, rosa shocking
  if (name.includes("serenissima")) return "#32CD32"
  if (name.includes("tosi beach")) return "#FF69B4"
  if (name.includes("rimini village")) return "#FF1493"

  // Viola e sfumature
  if (name.includes("milano marittima")) return "#8A2BE2"
  if (name.includes("michelangelo")) return "#9370DB"
  if (name.includes("mivi village")) return "#BA55D3"

  // Nero
  if (name.includes("executive")) return "#000000"
  if (name.includes("palace lido")) return "#2F2F2F"

  return "#6B7280" // Grigio di fallback
}
