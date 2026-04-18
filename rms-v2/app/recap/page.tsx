"use client"

import { useState, useEffect } from "react"
import { RecapCard } from "@/components/recap/recap-card"
import { RecapFilters } from "@/components/recap/recap-filters"
import { RecapChart } from "@/components/recap/recap-chart"
import {
  getRecapData,
  getAllHotelsForRecap,
  getSettimanesSoggiorno,
  type RecapData,
  type SettimanasSoggiorno,
} from "@/lib/services/recap-service"
import { Loader2, Sun } from "lucide-react"
import { useMobile } from "@/lib/hooks/use-mobile"
import { Switch } from "@/components/ui/switch"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

// Selettori periodo per mobile
const MOBILE_PERIODS = [
  { id: "tutto", label: "Tutto", months: [] },
  { id: "giugno", label: "Giugno", months: [6] },
  { id: "luglio", label: "Luglio", months: [7] },
  { id: "agosto", label: "Agosto", months: [8] },
  { id: "settembre", label: "Settembre", months: [9] },
]

export default function RecapPage() {
  const [data, setData] = useState<RecapData[]>([])
  const [loading, setLoading] = useState(true)
  const [hotels, setHotels] = useState<{ id: string; nome: string }[]>([])
  const [selectedHotels, setSelectedHotels] = useState<string[]>([])
  const [dateRange, setDateRange] = useState<{ from?: Date; to?: Date }>({})
  const [selectedPeriod, setSelectedPeriod] = useState("tutto")

  // Nuovi stati per le settimane (mobile)
  const [usePeriodoLiberoMobile, setUsePeriodoLiberoMobile] = useState(true)
  const [settimane, setSettimane] = useState<SettimanasSoggiorno[]>([])
  const [selectedSettimana, setSelectedSettimana] = useState<string>("")

  const isMobile = useMobile()

  // Carica gli hotel disponibili e le settimane
  useEffect(() => {
    async function loadData() {
      try {
        const hotelsData = await getAllHotelsForRecap()
        setHotels(hotelsData)
        setSelectedHotels(hotelsData.map((h) => h.id))

        // Carica settimane per l'anno corrente
        const currentYear = new Date().getFullYear()
        const settimaneData = await getSettimanesSoggiorno(currentYear)
        setSettimane(settimaneData)
      } catch (error) {
        console.error("Errore nel caricamento dei dati:", error)
      }
    }
    loadData()
  }, [])

  // Carica i dati quando cambiano i filtri
  useEffect(() => {
    async function loadRecapData() {
      if (selectedHotels.length === 0) return

      setLoading(true)
      try {
        const filters: any = {
          hotel_ids: selectedHotels,
        }

        // Per mobile, gestisce sia periodi predefiniti che settimane
        if (isMobile) {
          if (usePeriodoLiberoMobile) {
            // Usa i periodi predefiniti
            if (selectedPeriod !== "tutto") {
              const period = MOBILE_PERIODS.find((p) => p.id === selectedPeriod)
              if (period && period.months.length > 0) {
                const currentYear = new Date().getFullYear()
                const month = period.months[0]
                filters.data_inizio = `${currentYear}-${month.toString().padStart(2, "0")}-01`

                // Ultimo giorno del mese
                const lastDay = new Date(currentYear, month, 0).getDate()
                filters.data_fine = `${currentYear}-${month.toString().padStart(2, "0")}-${lastDay}`
              }
            }
          } else {
            // Usa la settimana selezionata
            const settimana = settimane.find((s) => s.id === selectedSettimana)
            if (settimana) {
              filters.data_inizio = settimana.inizio
              filters.data_fine = settimana.fine
            }
          }
        } else {
          // Per desktop, usa il date range picker (gestito dal componente RecapFilters)
          if (dateRange.from) {
            filters.data_inizio = dateRange.from.toISOString().split("T")[0]
          }
          if (dateRange.to) {
            filters.data_fine = dateRange.to.toISOString().split("T")[0]
          }
        }

        const recapData = await getRecapData(filters)
        setData(recapData)
      } catch (error) {
        console.error("Errore nel caricamento dei dati:", error)
      } finally {
        setLoading(false)
      }
    }

    loadRecapData()
  }, [selectedHotels, dateRange, selectedPeriod, selectedSettimana, usePeriodoLiberoMobile, isMobile, settimane])

  // Gestione cambio settimana mobile
  const handleSettimanaChangeMobile = (settimanaId: string) => {
    setSelectedSettimana(settimanaId)
  }

  // Calcola i totali complessivi
  const totali = data.reduce(
    (acc, hotel) => ({
      roombook: acc.roombook + hotel.total_roombook,
      invenduto: acc.invenduto + hotel.total_invenduto,
      rev: acc.rev + hotel.total_rev,
    }),
    { roombook: 0, invenduto: 0, rev: 0 },
  )

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    )
  }

  return (
    <div className={`container mx-auto p-4 space-y-6 ${isMobile ? "px-2" : ""}`}>
      <div className="flex flex-col space-y-4">
        <div className="flex items-center gap-3">
          <Sun className="h-8 w-8 text-yellow-500" />
          <h1 className={`font-bold text-primary ${isMobile ? "text-xl" : "text-3xl"}`}>Recap Vendite</h1>
        </div>

        {/* Filtri */}
        {isMobile ? (
          <div className="space-y-4">
            {/* Switch per modalità periodo mobile */}
            <div className="flex items-center space-x-2">
              <Switch
                id="periodo-mode-mobile"
                checked={usePeriodoLiberoMobile}
                onCheckedChange={setUsePeriodoLiberoMobile}
              />
              <Label htmlFor="periodo-mode-mobile" className="text-sm">
                {usePeriodoLiberoMobile ? "Periodi mensili" : "Settimane predefinite"}
              </Label>
            </div>

            {usePeriodoLiberoMobile ? (
              /* Selettore periodo mobile esistente */
              <div className="flex flex-wrap gap-2">
                {MOBILE_PERIODS.map((period) => (
                  <button
                    key={period.id}
                    className={`px-3 py-1 text-sm font-medium rounded-full ${
                      selectedPeriod === period.id
                        ? "bg-blue-600 text-white"
                        : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                    }`}
                    onClick={() => setSelectedPeriod(period.id)}
                  >
                    {period.label}
                  </button>
                ))}
              </div>
            ) : (
              /* Dropdown settimane mobile */
              <Select value={selectedSettimana} onValueChange={handleSettimanaChangeMobile}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Seleziona una settimana..." />
                </SelectTrigger>
                <SelectContent>
                  {settimane.map((settimana) => (
                    <SelectItem key={settimana.id} value={settimana.id}>
                      {settimana.nome}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          </div>
        ) : (
          <RecapFilters
            hotels={hotels}
            selectedHotels={selectedHotels}
            onHotelsChange={setSelectedHotels}
            dateRange={dateRange}
            onDateChange={setDateRange}
          />
        )}
      </div>

      {/* Card Totale */}
      {data.length > 0 && (
        <div className="bg-gradient-to-r from-blue-500 to-purple-600 rounded-lg p-1">
          <div className="bg-white rounded-lg p-4">
            <h3 className="text-lg font-semibold text-gray-800 mb-4 text-center">TOTALE COMPLESSIVO</h3>
            <div className={`grid gap-4 ${isMobile ? "grid-cols-1" : "grid-cols-3"}`}>
              <div className="text-center">
                <p className="text-sm text-gray-600">Room Book</p>
                <p className="text-2xl font-bold text-blue-600">{totali.roombook.toLocaleString()}</p>
              </div>
              <div className="text-center">
                <p className="text-sm text-gray-600">Invenduto</p>
                <p className="text-2xl font-bold text-red-600">{totali.invenduto.toLocaleString()}</p>
              </div>
              <div className="text-center">
                <p className="text-sm text-gray-600">Revenue</p>
                <p className="text-2xl font-bold text-green-600">€{totali.rev.toLocaleString()}</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Cards degli hotel */}
      <div className={`grid gap-6 ${isMobile ? "grid-cols-1" : "grid-cols-1 md:grid-cols-2 lg:grid-cols-3"}`}>
        {data.map((hotel) => (
          <RecapCard key={hotel.hotel_id} data={hotel} />
        ))}
      </div>

      {/* Grafico (solo desktop) */}
      {!isMobile && data.length > 0 && (
        <div className="mt-8">
          <RecapChart data={data} />
        </div>
      )}

      {/* Messaggio quando non ci sono dati */}
      {data.length === 0 && (
        <div className="bg-white p-8 rounded-lg border shadow-sm text-center">
          <Sun className="h-16 w-16 text-yellow-500 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-700 mb-2">Nessun dato disponibile</h3>
          <p className="text-muted-foreground">
            Non ci sono dati per i filtri selezionati. Prova a modificare i criteri di ricerca.
          </p>
        </div>
      )}
    </div>
  )
}
