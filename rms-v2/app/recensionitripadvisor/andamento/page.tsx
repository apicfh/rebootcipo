"use client"

import { useState, useEffect } from "react"
import { subMonths } from "date-fns"
import { it } from "date-fns/locale"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Sidebar } from "@/components/sidebar"
import { DatePicker } from "@/components/ui/date-picker"
import { Button } from "@/components/ui/button"
import { LineChart } from "@/components/charts/line-chart"
import { BarChart } from "@/components/charts/bar-chart"
import { HotelSelector } from "@/components/tripadvisor/hotel-selector"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { AlertCircle, ArrowLeft } from "lucide-react"
import { type AndamentoRecensioni, getAndamentoRecensioni } from "@/lib/services/recensioni-tripadvisor-service"
import Link from "next/link"

export default function AndamentoRecensioniPage() {
  // Stati per i filtri
  const [selectedHotels, setSelectedHotels] = useState<string[]>([])
  const [dataInizio, setDataInizio] = useState<Date | undefined>(subMonths(new Date(), 12)) // Default: 12 mesi fa
  const [dataFine, setDataFine] = useState<Date | undefined>(new Date()) // Default: oggi

  // Stati per i dati
  const [andamentoData, setAndamentoData] = useState<AndamentoRecensioni[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Carica i dati quando cambiano i filtri
  useEffect(() => {
    async function fetchAndamento() {
      setLoading(true)
      setError(null)
      try {
        const data = await getAndamentoRecensioni(dataInizio, dataFine, selectedHotels)
        setAndamentoData(data)
      } catch (err) {
        console.error("Errore nel caricamento dei dati di andamento:", err)
        setError("Si è verificato un errore nel caricamento dei dati. Riprova più tardi.")
      } finally {
        setLoading(false)
      }
    }

    fetchAndamento()
  }, [dataInizio, dataFine, selectedHotels])

  // Prepara i dati per il grafico delle valutazioni
  const prepareValutazioniData = () => {
    // Raggruppa i dati per hotel
    const hotelData = new Map<string, { name: string; data: { x: string; y: number }[] }>()

    andamentoData.forEach((item) => {
      if (!hotelData.has(item.hotel_id)) {
        hotelData.set(item.hotel_id, {
          name: item.hotel_nome,
          data: [],
        })
      }

      hotelData.get(item.hotel_id)?.data.push({
        x: item.periodo,
        y: item.media_valutazioni,
      })
    })

    // Converti la mappa in un array per il grafico
    return Array.from(hotelData.values())
  }

  // Prepara i dati per il grafico del numero di recensioni
  const prepareRecensioniData = () => {
    // Raggruppa i dati per periodo
    const periodi = [...new Set(andamentoData.map((item) => item.periodo))].sort()

    return periodi.map((periodo) => {
      const periodoData = andamentoData.filter((item) => item.periodo === periodo)

      // Crea un oggetto con il periodo e i dati per ogni hotel
      const result: Record<string, any> = { name: formatPeriod(periodo) }

      periodoData.forEach((item) => {
        result[item.hotel_nome] = item.num_recensioni
      })

      return result
    })
  }

  // Prepara le configurazioni per il grafico a barre
  const prepareBarConfig = () => {
    const hotels = [...new Set(andamentoData.map((item) => item.hotel_nome))]

    return hotels.map((hotel, index) => ({
      dataKey: hotel,
      name: hotel,
      color: `hsl(${(index * 30) % 360}, 70%, 50%)`,
    }))
  }

  // Formatta il periodo per la visualizzazione
  const formatPeriod = (periodo: string) => {
    const [year, month] = periodo.split("-")
    return `${month}/${year}`
  }

  const valutazioniData = prepareValutazioniData()
  const recensioniData = prepareRecensioniData()
  const barConfig = prepareBarConfig()

  return (
    <div className="flex min-h-screen">
      <Sidebar />
      <div className="flex-1 p-8">
        <div className="flex flex-col md:flex-row md:items-center justify-between mb-8">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <Link href="/recensionitripadvisor">
                <Button variant="ghost" size="icon" className="h-8 w-8">
                  <ArrowLeft className="h-4 w-4" />
                </Button>
              </Link>
              <h1 className="text-3xl font-bold">Andamento Recensioni</h1>
            </div>
            <p className="text-muted-foreground">Analisi temporale delle recensioni e valutazioni</p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div>
            <label className="block text-sm font-medium mb-2">Hotel</label>
            <HotelSelector selectedHotels={selectedHotels} onChange={setSelectedHotels} />
          </div>
          <div>
            <label className="block text-sm font-medium mb-2">Data inizio</label>
            <DatePicker
              date={dataInizio}
              setDate={setDataInizio}
              placeholder="Seleziona data inizio"
              maxDate={dataFine}
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-2">Data fine</label>
            <DatePicker date={dataFine} setDate={setDataFine} placeholder="Seleziona data fine" minDate={dataInizio} />
          </div>
        </div>

        {error && (
          <Alert variant="destructive" className="my-4">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Errore</AlertTitle>
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {loading ? (
          <div className="space-y-6">
            <Card className="animate-pulse">
              <CardHeader>
                <div className="h-6 bg-gray-200 rounded w-1/3 mb-2"></div>
              </CardHeader>
              <CardContent>
                <div className="h-[300px] bg-gray-100 rounded"></div>
              </CardContent>
            </Card>
            <Card className="animate-pulse">
              <CardHeader>
                <div className="h-6 bg-gray-200 rounded w-1/3 mb-2"></div>
              </CardHeader>
              <CardContent>
                <div className="h-[300px] bg-gray-100 rounded"></div>
              </CardContent>
            </Card>
          </div>
        ) : andamentoData.length === 0 ? (
          <Card className="mt-6">
            <CardContent className="p-12 flex flex-col items-center justify-center">
              <img src="/icons/recensioni-panda.png" alt="Nessun dato" className="h-32 w-32 mb-4 opacity-50" />
              <h3 className="text-xl font-medium mb-2">Nessun dato disponibile</h3>
              <p className="text-muted-foreground text-center">
                Non ci sono dati disponibili per i filtri selezionati. Prova a modificare i filtri o a selezionare un
                periodo diverso.
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Andamento Valutazioni</CardTitle>
              </CardHeader>
              <CardContent>
                <LineChart
                  data={valutazioniData}
                  height={350}
                  isSeriesData={true}
                  dateFormat="MM/yyyy"
                  dateLocale={it}
                  yAxisLabel="Valutazione"
                  showLegend={true}
                />
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Numero Recensioni per Periodo</CardTitle>
              </CardHeader>
              <CardContent>
                <BarChart data={recensioniData} height={350} bars={barConfig} xAxisKey="name" />
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </div>
  )
}
