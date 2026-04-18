"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { Loader2, HotelIcon } from "lucide-react"
import { supabase } from "@/lib/supabase/client"

interface PrezzoFinale {
  id: string
  id_hotel: string
  nome_hotel: string
  stagione: string
  camera_id: string
  nome_camera: string
  prezzo: number
  valido_da: string
  valido_a: string | null
  settimana_id: string
  settimana_nome: string
  settimana_inizio: string
  settimana_fine: string
}

interface HotelData {
  id: string
  nome: string
}

interface PriceMatrix {
  [cameraName: string]: {
    [settimanaId: string]: number
  }
}

export default function ListiniPage() {
  const [hotels, setHotels] = useState<HotelData[]>([])
  const [selectedHotel, setSelectedHotel] = useState<string>("")
  const [selectedStagione, setSelectedStagione] = useState<string>("all")
  const [stagioni, setStagioni] = useState<string[]>([])
  const [prezzi, setPrezzi] = useState<PrezzoFinale[]>([])
  const [loading, setLoading] = useState(false)
  const [priceMatrix, setPriceMatrix] = useState<PriceMatrix>({})
  const [settimane, setSettimane] = useState<Array<{ id: string; nome: string; inizio: string; fine: string }>>([])
  const [camere, setCamere] = useState<string[]>([])
  const [hiddenColumns, setHiddenColumns] = useState<Set<string>>(new Set())

  useEffect(() => {
    loadHotels()
  }, [])

  useEffect(() => {
    if (selectedHotel) {
      loadPrezzi()
    }
  }, [selectedHotel, selectedStagione])

  useEffect(() => {
    if (prezzi.length > 0) {
      buildPriceMatrix()
    }
  }, [prezzi])

  const loadHotels = async () => {
    try {
      const { data, error } = await supabase.rpc("get_hotel_per_strategia_prezzi")
      if (error) throw error
      setHotels(data || [])
    } catch (error) {
      console.error("Errore caricamento hotel:", error)
    }
  }

  const loadPrezzi = async () => {
    if (!selectedHotel) return

    setLoading(true)
    try {
      const { data, error } = await supabase.rpc("get_prezzi_finale", {
        hotel_id_param: selectedHotel,
        stagione_param: selectedStagione === "all" ? null : selectedStagione,
      })
      if (error) throw error
      setPrezzi(data || [])

      const uniqueStagioni = [...new Set((data || []).map((p) => p.stagione))].sort()
      setStagioni(uniqueStagioni)
    } catch (error) {
      console.error("Errore caricamento prezzi:", error)
    } finally {
      setLoading(false)
    }
  }

  const buildPriceMatrix = () => {
    const matrix: PriceMatrix = {}
    const settimaneSet = new Set<string>()
    const camereSet = new Set<string>()
    const settimaneData: Array<{ id: string; nome: string; inizio: string; fine: string }> = []

    prezzi.forEach((prezzo) => {
      if (!matrix[prezzo.nome_camera]) {
        matrix[prezzo.nome_camera] = {}
      }
      matrix[prezzo.nome_camera][prezzo.settimana_id] = prezzo.prezzo

      if (!settimaneSet.has(prezzo.settimana_id)) {
        settimaneSet.add(prezzo.settimana_id)
        settimaneData.push({
          id: prezzo.settimana_id,
          nome: prezzo.settimana_nome,
          inizio: prezzo.settimana_inizio,
          fine: prezzo.settimana_fine,
        })
      }

      camereSet.add(prezzo.nome_camera)
    })

    settimaneData.sort((a, b) => new Date(a.inizio).getTime() - new Date(b.inizio).getTime())

    setPriceMatrix(matrix)
    setSettimane(settimaneData)
    setCamere(Array.from(camereSet).sort())
  }

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat("it-IT", {
      style: "currency",
      currency: "EUR",
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(price)
  }

  const formatDateRange = (inizio: string, fine: string) => {
    const startDate = new Date(inizio)
    const endDate = new Date(fine)
    return `${startDate.getDate()}/${startDate.getMonth() + 1} - ${endDate.getDate()}/${endDate.getMonth() + 1}`
  }

  const getWeekColor = (inizio: string) => {
    const month = new Date(inizio).getMonth()
    const colors = {
      0: "bg-blue-100 border-blue-200", // Gennaio
      1: "bg-blue-100 border-blue-200", // Febbraio
      2: "bg-green-100 border-green-200", // Marzo
      3: "bg-green-100 border-green-200", // Aprile
      4: "bg-yellow-100 border-yellow-200", // Maggio - giallo
      5: "bg-sky-100 border-sky-200", // Giugno - blu chiaro
      6: "bg-green-100 border-green-200", // Luglio - verde
      7: "bg-orange-100 border-orange-200", // Agosto - arancio
      8: "bg-pink-100 border-pink-200", // Settembre - rosa
      9: "bg-orange-100 border-orange-200", // Ottobre
      10: "bg-gray-100 border-gray-200", // Novembre
      11: "bg-blue-100 border-blue-200", // Dicembre
    }
    return colors[month as keyof typeof colors] || "bg-gray-100 border-gray-200"
  }

  const toggleColumnVisibility = (camera: string) => {
    const newHiddenColumns = new Set(hiddenColumns)
    if (newHiddenColumns.has(camera)) {
      newHiddenColumns.delete(camera)
    } else {
      newHiddenColumns.add(camera)
    }
    setHiddenColumns(newHiddenColumns)
  }

  const visibleCamere = camere.filter((camera) => !hiddenColumns.has(camera))

  return (
    <div className="container py-6">
      <div className="mb-8">
        <h1 className="text-3xl font-bold tracking-tight text-primary">Listini</h1>
        <p className="text-muted-foreground mt-2">
          Visualizza i prezzi per tipologia di camera e settimana di soggiorno
        </p>
      </div>

      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <HotelIcon className="h-5 w-5 text-primary" />
            Filtri
          </CardTitle>
          <CardDescription>Seleziona hotel e stagione per visualizzare il listino prezzi</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium mb-2 block">Hotel</label>
              <Select value={selectedHotel} onValueChange={setSelectedHotel}>
                <SelectTrigger>
                  <SelectValue placeholder="Seleziona un hotel..." />
                </SelectTrigger>
                <SelectContent>
                  {hotels.map((hotel) => (
                    <SelectItem key={hotel.id} value={hotel.id}>
                      {hotel.nome}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <label className="text-sm font-medium mb-2 block">Stagione</label>
              <Select value={selectedStagione} onValueChange={setSelectedStagione}>
                <SelectTrigger>
                  <SelectValue placeholder="Tutte le stagioni" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tutte le stagioni</SelectItem>
                  {stagioni.map((stagione) => (
                    <SelectItem key={stagione} value={stagione}>
                      {stagione}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {selectedHotel && (
        <Card>
          <CardHeader>
            <CardTitle>Listino Prezzi</CardTitle>
            <CardDescription>
              Prezzi per settimana di soggiorno e tipologia di camera
              {hotels.find((h) => h.id === selectedHotel) && (
                <Badge variant="outline" className="ml-2">
                  {hotels.find((h) => h.id === selectedHotel)?.nome}
                </Badge>
              )}
              {selectedStagione !== "all" && (
                <Badge variant="outline" className="ml-2">
                  {selectedStagione}
                </Badge>
              )}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="h-6 w-6 animate-spin mr-2" />
                Caricamento prezzi...
              </div>
            ) : prezzi.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                Nessun prezzo disponibile per i filtri selezionati
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full border-collapse">
                  <thead>
                    <tr>
                      <th className="border border-border p-3 bg-muted text-left font-semibold min-w-[200px]">
                        Settimana Soggiorno
                      </th>
                      {camere.map((camera) => (
                        <th
                          key={camera}
                          className={`border border-border p-3 bg-muted text-center font-semibold min-w-[120px] cursor-pointer hover:bg-muted/80 transition-colors ${
                            hiddenColumns.has(camera) ? "opacity-50 line-through" : ""
                          }`}
                          onClick={() => toggleColumnVisibility(camera)}
                          title={hiddenColumns.has(camera) ? "Clicca per mostrare" : "Clicca per nascondere"}
                        >
                          {camera}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {settimane.map((settimana) => (
                      <tr key={settimana.id} className="hover:bg-muted/50">
                        <td className={`border border-border p-3 font-medium ${getWeekColor(settimana.inizio)}`}>
                          <div className="font-semibold">{settimana.nome}</div>
                          <div className="text-xs text-muted-foreground mt-1">
                            {formatDateRange(settimana.inizio, settimana.fine)}
                          </div>
                        </td>
                        {camere.map((camera) => (
                          <td
                            key={camera}
                            className={`border border-border p-3 text-center ${
                              hiddenColumns.has(camera) ? "opacity-30 bg-gray-50" : ""
                            }`}
                          >
                            {!hiddenColumns.has(camera) && priceMatrix[camera]?.[settimana.id] ? (
                              <span className="font-semibold text-primary">
                                {formatPrice(priceMatrix[camera][settimana.id])}
                              </span>
                            ) : !hiddenColumns.has(camera) ? (
                              <span className="text-muted-foreground text-sm">-</span>
                            ) : (
                              <span className="text-xs text-muted-foreground">nascosto</span>
                            )}
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  )
}
