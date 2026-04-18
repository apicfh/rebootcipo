"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { MultiSelect, type Option } from "@/components/ui/multi-select"
import { ElegantDateRangePicker } from "@/components/ui/elegant-date-range-picker"
import { Switch } from "@/components/ui/switch"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { getAllHotelsForRecap, getSettimanesSoggiorno, type SettimanasSoggiorno } from "@/lib/services/recap-service"
import type { DateRange } from "react-day-picker"

// Interfaccia per la modalità legacy (callback)
interface RecapFiltersLegacyProps {
  onFiltersChange: (filters: {
    hotel_ids?: string[]
    data_inizio?: string
    data_fine?: string
  }) => void
  // Props per la nuova modalità non definite
  hotels?: never
  selectedHotels?: never
  onHotelsChange?: never
  dateRange?: never
  onDateChange?: never
}

// Interfaccia per la nuova modalità (controllo diretto)
interface RecapFiltersDirectProps {
  hotels: { id: string; nome: string }[]
  selectedHotels: string[]
  onHotelsChange: (hotels: string[]) => void
  dateRange: { from?: Date; to?: Date }
  onDateChange: (range: { from?: Date; to?: Date }) => void
  // Props per la modalità legacy non definite
  onFiltersChange?: never
}

type RecapFiltersProps = RecapFiltersLegacyProps | RecapFiltersDirectProps

export function RecapFilters(props: RecapFiltersProps) {
  // Stati interni per la modalità legacy
  const [internalHotels, setInternalHotels] = useState<Option[]>([])
  const [internalSelectedHotels, setInternalSelectedHotels] = useState<string[]>([])
  const [internalDateRange, setInternalDateRange] = useState<DateRange | undefined>()
  const [loading, setLoading] = useState(true)

  // Nuovi stati per le settimane
  const [usePeriodoLibero, setUsePeriodoLibero] = useState(true)
  const [settimane, setSettimane] = useState<SettimanasSoggiorno[]>([])
  const [selectedSettimana, setSelectedSettimana] = useState<string>("")

  // Determina quale modalità stiamo usando
  const isLegacyMode = "onFiltersChange" in props && props.onFiltersChange
  const isDirectMode = "hotels" in props && props.hotels

  // Carica gli hotel e le settimane solo in modalità legacy
  useEffect(() => {
    if (!isLegacyMode) {
      setLoading(false)
      return
    }

    async function loadData() {
      try {
        // Carica hotel
        const hotelsData = await getAllHotelsForRecap()
        const hotelOptions = hotelsData.map((hotel) => ({
          label: hotel.nome,
          value: hotel.id,
        }))
        setInternalHotels(hotelOptions)

        // Carica settimane per l'anno corrente
        const currentYear = new Date().getFullYear()
        const settimaneData = await getSettimanesSoggiorno(currentYear)
        setSettimane(settimaneData)
      } catch (error) {
        console.error("Errore nel caricamento dei dati:", error)
      } finally {
        setLoading(false)
      }
    }

    loadData()
  }, [isLegacyMode])

  // Carica le settimane anche in modalità diretta
  useEffect(() => {
    if (isDirectMode) {
      async function loadSettimane() {
        try {
          const currentYear = new Date().getFullYear()
          const settimaneData = await getSettimanesSoggiorno(currentYear)
          setSettimane(settimaneData)
        } catch (error) {
          console.error("Errore nel caricamento delle settimane:", error)
        }
      }
      loadSettimane()
    }
  }, [isDirectMode])

  // Gestori per la modalità legacy
  const handleApplyFilters = () => {
    if (!isLegacyMode) return

    const filters: any = {
      hotel_ids: internalSelectedHotels.length > 0 ? internalSelectedHotels : undefined,
    }

    if (usePeriodoLibero) {
      // Usa il date range picker
      filters.data_inizio = internalDateRange?.from ? internalDateRange.from.toISOString().split("T")[0] : undefined
      filters.data_fine = internalDateRange?.to ? internalDateRange.to.toISOString().split("T")[0] : undefined
    } else {
      // Usa la settimana selezionata
      const settimana = settimane.find((s) => s.id === selectedSettimana)
      if (settimana) {
        filters.data_inizio = settimana.inizio
        filters.data_fine = settimana.fine
      }
    }

    props.onFiltersChange(filters)
  }

  const handleReset = () => {
    if (isLegacyMode) {
      setInternalSelectedHotels([])
      setInternalDateRange(undefined)
      setSelectedSettimana("")
      setUsePeriodoLibero(true)
      props.onFiltersChange({})
    } else if (isDirectMode) {
      props.onHotelsChange([])
      props.onDateChange({})
      setSelectedSettimana("")
      setUsePeriodoLibero(true)
    }
  }

  // Gestori per la modalità diretta
  const handleHotelsChange = (hotels: string[]) => {
    if (isDirectMode) {
      props.onHotelsChange(hotels)
    } else {
      setInternalSelectedHotels(hotels)
    }
  }

  const handleDateChange = (range: DateRange | undefined) => {
    if (isDirectMode) {
      props.onDateChange({ from: range?.from, to: range?.to })
    } else {
      setInternalDateRange(range)
    }
  }

  // Gestione cambio settimana per modalità diretta
  const handleSettimanaChange = (settimanaId: string) => {
    setSelectedSettimana(settimanaId)

    if (isDirectMode) {
      const settimana = settimane.find((s) => s.id === settimanaId)
      if (settimana) {
        props.onDateChange({
          from: new Date(settimana.inizio),
          to: new Date(settimana.fine),
        })
      }
    }
  }

  // Determina i valori da mostrare
  const hotels = isDirectMode ? props.hotels.map((h) => ({ label: h.nome, value: h.id })) : internalHotels

  const selectedHotels = isDirectMode ? props.selectedHotels : internalSelectedHotels

  const dateRange = isDirectMode
    ? props.dateRange.from || props.dateRange.to
      ? { from: props.dateRange.from, to: props.dateRange.to }
      : undefined
    : internalDateRange

  if (loading && isLegacyMode) {
    return <div className="p-4">Caricamento filtri...</div>
  }

  return (
    <div className="bg-white p-4 rounded-lg border shadow-sm space-y-4">
      <h3 className="text-lg font-semibold text-primary-700">Filtri</h3>

      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium mb-2">Hotel</label>
          <MultiSelect
            options={hotels}
            selected={selectedHotels}
            onChange={handleHotelsChange}
            placeholder="Seleziona hotel..."
          />
        </div>

        <div className="space-y-3">
          <label className="block text-sm font-medium">Periodo</label>

          {/* Switch per modalità periodo */}
          <div className="flex items-center space-x-2">
            <Switch id="periodo-mode" checked={usePeriodoLibero} onCheckedChange={setUsePeriodoLibero} />
            <Label htmlFor="periodo-mode" className="text-sm">
              {usePeriodoLibero ? "Periodo libero" : "Settimane predefinite"}
            </Label>
          </div>

          {/* Date Range Picker Elegante o Dropdown Settimane */}
          {usePeriodoLibero ? (
            <ElegantDateRangePicker date={dateRange} setDate={handleDateChange} className="w-full" />
          ) : (
            <Select value={selectedSettimana} onValueChange={handleSettimanaChange}>
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Seleziona una settimana..." />
              </SelectTrigger>
              <SelectContent>
                {settimane.map((settimana) => (
                  <SelectItem key={settimana.id} value={settimana.id}>
                    {settimana.nome} ({new Date(settimana.inizio).toLocaleDateString("it-IT")} -{" "}
                    {new Date(settimana.fine).toLocaleDateString("it-IT")})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
        </div>
      </div>

      <div className="flex gap-2">
        {isLegacyMode && (
          <Button onClick={handleApplyFilters} className="bg-primary-600 hover:bg-primary-700">
            Applica Filtri
          </Button>
        )}
        <Button onClick={handleReset} variant="outline">
          Reset
        </Button>
      </div>
    </div>
  )
}
