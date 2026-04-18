"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { ElegantDatePicker } from "@/components/ui/elegant-date-picker"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Loader2, Filter } from "lucide-react"
import { format } from "date-fns"
import { createBrowserClient } from "@supabase/ssr"

interface HotelPrezzi {
  id_hotel: string
  nome_hotel: string
  camere: {
    nome_camera: string
    paxmax: number
    livello: string
    prezzo_totale: number
    prezzo_per_notte: number
    notti: number
    dettaglio_settimane: any
  }[]
}

export default function ComparazionePrezziPage() {
  const [supabase] = useState(() =>
    createBrowserClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!),
  )

  const [dataArrivo, setDataArrivo] = useState<Date>()
  const [dataPartenza, setDataPartenza] = useState<Date>()
  const [paxmaxFilter, setPaxmaxFilter] = useState<string>("all")
  const [livelloFilter, setLivelloFilter] = useState<string>("all")
  const [prezzi, setPrezzi] = useState<HotelPrezzi[]>([])
  const [loading, setLoading] = useState(false)
  const [showAll, setShowAll] = useState(false)

  const handleVediPrezzi = async () => {
    if (!dataArrivo || !dataPartenza) {
      alert("Seleziona entrambe le date")
      return
    }

    setLoading(true)
    try {
      const dataArrivoFormatted = format(dataArrivo, "yyyy-MM-dd")
      const dataPartenzaFormatted = format(dataPartenza, "yyyy-MM-dd")

      const rpcParams: any = {
        data_arrivo_param: dataArrivoFormatted,
        data_partenza_param: dataPartenzaFormatted,
      }

      if (paxmaxFilter !== "all") {
        rpcParams.paxmax_filter = Number.parseInt(paxmaxFilter)
      }

      if (livelloFilter !== "all") {
        rpcParams.livello_filter = livelloFilter
      }

      console.log("[v0] Chiamando RPC con parametri:", rpcParams)

      const { data, error } = await supabase.rpc("get_prezzi_finale_comparazione_definitiva", rpcParams)

      console.log("[v0] Risposta RPC completa:", { data, error })

      if (error) {
        console.error("Errore nel recupero prezzi:", error.message)
        alert(`Errore: ${error.message}`)
        return
      }

      if (!data || data.length === 0) {
        console.log("[v0] Nessun dato ricevuto dalla RPC")
        setPrezzi([])
        return
      }

      const hotelMap = new Map<string, HotelPrezzi>()

      data.forEach((row: any, index: number) => {
        console.log(`[v0] Processando riga ${index}:`, row)

        const idHotel = String(row.id_hotel || "")
        const nomeHotel = String(row.nome_hotel || "Hotel sconosciuto")
        const nomeCamera = String(row.nome_camera || "Camera sconosciuta")
        const paxmax = Number.parseInt(row.paxmax) || 0
        const livello = String(row.livello || "")
        const prezzoTotale = Number.parseFloat(row.prezzo_totale) || 0
        const nottiTotali = Number.parseInt(row.notti_totali) || 1

        console.log(`[v0] Valori estratti:`, {
          idHotel,
          nomeHotel,
          nomeCamera,
          paxmax,
          livello,
          prezzoTotale,
          nottiTotali,
        })

        if (!hotelMap.has(idHotel)) {
          hotelMap.set(idHotel, {
            id_hotel: idHotel,
            nome_hotel: nomeHotel,
            camere: [],
          })
        }

        const hotel = hotelMap.get(idHotel)!
        hotel.camere.push({
          nome_camera: nomeCamera,
          paxmax: paxmax,
          livello: livello,
          prezzo_totale: prezzoTotale,
          prezzo_per_notte: prezzoTotale / nottiTotali,
          notti: nottiTotali,
          dettaglio_settimane: row.dettaglio_settimane || [],
        })
      })

      const risultatoFinale = Array.from(hotelMap.values())
      console.log("[v0] Risultato finale raggruppato:", risultatoFinale)
      setPrezzi(risultatoFinale)
    } catch (error: any) {
      console.error("Errore nella chiamata:", error)
      alert(`Errore imprevisto: ${error.message}`)
    } finally {
      setLoading(false)
    }
  }

  const handleResetFiltri = () => {
    setPaxmaxFilter("all")
    setLivelloFilter("all")
  }

  const handleDataArrivoSelect = (date: Date | undefined) => {
    setDataArrivo(date)
    if (date && dataPartenza && dataPartenza <= date) {
      setDataPartenza(undefined)
    }
  }

  const handleDataPartenzaSelect = (date: Date | undefined) => {
    setDataPartenza(date)
  }

  const prezziVisibili = showAll ? prezzi : prezzi.slice(0, 4)

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Comparazione Prezzi</h1>
        <p className="text-gray-600">Confronta i prezzi delle camere per periodo di soggiorno</p>
      </div>

      <div className="flex flex-col gap-6 mb-8">
        <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
          <div className="flex flex-col items-center">
            <label className="text-sm font-medium text-gray-700 mb-2">Data Arrivo</label>
            <ElegantDatePicker
              date={dataArrivo}
              onDateChange={handleDataArrivoSelect}
              placeholder="Seleziona data arrivo"
              className="w-[240px] h-12 border-2 border-gray-200 hover:border-blue-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all duration-200"
            />
          </div>

          <div className="flex flex-col items-center">
            <label className="text-sm font-medium text-gray-700 mb-2">Data Partenza</label>
            <ElegantDatePicker
              date={dataPartenza}
              onDateChange={handleDataPartenzaSelect}
              placeholder="Seleziona data partenza"
              className="w-[240px] h-12 border-2 border-gray-200 hover:border-blue-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all duration-200"
            />
          </div>

          <div className="flex flex-col items-center">
            <label className="text-sm font-medium text-gray-700">&nbsp;</label>
            <Button
              onClick={handleVediPrezzi}
              disabled={loading || !dataArrivo || !dataPartenza}
              className="w-[240px] bg-blue-600 hover:bg-blue-700 text-white font-semibold"
            >
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Caricamento...
                </>
              ) : (
                "VEDI PREZZI"
              )}
            </Button>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row gap-4 justify-center items-center bg-gray-50 p-4 rounded-lg">
          <div className="flex items-center gap-2">
            <Filter className="h-4 w-4 text-gray-600" />
            <span className="text-sm font-medium text-gray-700">Filtri:</span>
          </div>

          <div className="flex flex-col items-center">
            <label className="text-xs text-gray-600 mb-1">Persone esatto</label>
            <Select value={paxmaxFilter} onValueChange={setPaxmaxFilter}>
              <SelectTrigger className="w-[140px]">
                <SelectValue placeholder="Tutte" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tutte</SelectItem>
                <SelectItem value="1">1 esatto</SelectItem>
                <SelectItem value="2">2 esatto</SelectItem>
                <SelectItem value="3">3 esatto</SelectItem>
                <SelectItem value="4">4 esatto</SelectItem>
                <SelectItem value="5">5 esatto</SelectItem>
                <SelectItem value="6">6 esatto</SelectItem>
                <SelectItem value="8">8 esatto</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="flex flex-col items-center">
            <label className="text-xs text-gray-600 mb-1">Livello camera</label>
            <Select value={livelloFilter} onValueChange={setLivelloFilter}>
              <SelectTrigger className="w-[140px]">
                <SelectValue placeholder="Tutti" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tutti</SelectItem>
                <SelectItem value="single">Single</SelectItem>
                <SelectItem value="entry">Entry</SelectItem>
                <SelectItem value="sub_entry">Sub Entry</SelectItem>
                <SelectItem value="superior">Superior</SelectItem>
                <SelectItem value="superior_plus">Superior Plus</SelectItem>
                <SelectItem value="high_level">High Level</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {(paxmaxFilter !== "all" || livelloFilter !== "all") && (
            <Button variant="outline" size="sm" onClick={handleResetFiltri} className="text-xs bg-transparent">
              Reset filtri
            </Button>
          )}
        </div>
      </div>

      {(!dataArrivo || !dataPartenza) && (
        <div className="text-center mb-6">
          <p className="text-gray-500 text-sm">
            Seleziona le date di arrivo e partenza per visualizzare i prezzi disponibili
          </p>
        </div>
      )}

      {prezzi.length > 0 && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {prezziVisibili.map((hotel) => (
              <Card
                key={hotel.id_hotel}
                className="bg-blue-600 text-white rounded-xl overflow-hidden hover:bg-blue-700 transition-colors"
              >
                <CardContent className="p-4">
                  <h3 className="text-base font-bold mb-3 text-center">{hotel.nome_hotel.toUpperCase()}</h3>
                  <div className="space-y-2">
                    {hotel.camere.map((camera, index) => (
                      <div key={index} className="text-center border-b border-blue-500 last:border-b-0 pb-2 last:pb-0">
                        <div className="text-sm font-medium">{camera.nome_camera}</div>
                        <div className="text-lg font-bold">€{camera.prezzo_totale.toFixed(0)}</div>
                        <div className="text-xs opacity-80">
                          {camera.notti} notti - €{camera.prezzo_per_notte.toFixed(0)}/notte
                        </div>
                        <div className="text-xs opacity-70 mt-1">
                          {camera.paxmax} pax • {camera.livello}
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {prezzi.length > 4 && (
            <div className="flex justify-center">
              <Button
                onClick={() => setShowAll(!showAll)}
                className="w-full max-w-md bg-blue-600 hover:bg-blue-700 text-white rounded-2xl py-4 text-lg font-bold"
              >
                {showAll ? "MOSTRA MENO" : "MOSTRA ALTRI"}
              </Button>
            </div>
          )}
        </div>
      )}

      {prezzi.length === 0 && !loading && dataArrivo && dataPartenza && (
        <div className="text-center py-12">
          <p className="text-gray-500 text-lg">Nessun prezzo trovato per il periodo selezionato</p>
        </div>
      )}
    </div>
  )
}
