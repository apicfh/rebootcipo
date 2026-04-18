"use client"

import { useState, useEffect } from "react"
import { format } from "date-fns"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
// Sostituisco l'import del DateRangePicker con DatePicker
import { DatePicker } from "@/components/ui/date-picker"
import { getHotelPrenotazioniInserite, type HotelPrenotazioniAggregato } from "@/lib/services/performance-service"
import { Loader2 } from "lucide-react"

export default function TabellePerformancePage() {
  const [isLoading, setIsLoading] = useState(false)
  const [prenotazioni, setPrenotazioni] = useState<HotelPrenotazioniAggregato[]>([])

  // Imposta le date di default (ultimi 30 giorni)
  const oggi = new Date()
  const trentaGiorniFa = new Date()
  trentaGiorniFa.setDate(oggi.getDate() - 30)

  // Sostituisco l'oggetto dateRange con due stati separati
  const [dataInizio, setDataInizio] = useState<Date | undefined>(trentaGiorniFa)
  const [dataFine, setDataFine] = useState<Date | undefined>(oggi)

  const fetchData = async () => {
    if (!dataInizio || !dataFine) return

    setIsLoading(true)
    try {
      const dataInizioFormatted = format(dataInizio, "yyyy-MM-dd")
      const dataFineFormatted = format(dataFine, "yyyy-MM-dd")

      const data = await getHotelPrenotazioniInserite(dataInizioFormatted, dataFineFormatted)
      setPrenotazioni(data)
    } catch (error) {
      console.error("Errore nel caricamento dei dati:", error)
    } finally {
      setIsLoading(false)
    }
  }

  // Carica i dati all'avvio
  useEffect(() => {
    fetchData()
  }, [])

  return (
    <div className="container mx-auto p-6">
      <h1 className="text-2xl font-bold mb-6">Tabelle Performance</h1>

      <div className="bg-white rounded-lg shadow-md p-6 mb-6">
        <div className="flex flex-col md:flex-row gap-6 items-start md:items-end">
          <div>
            <h2 className="text-sm font-medium mb-2">Data Inizio</h2>
            <DatePicker
              date={dataInizio}
              setDate={setDataInizio}
              className="w-full"
              placeholder="Seleziona data inizio"
            />
          </div>
          <div>
            <h2 className="text-sm font-medium mb-2">Data Fine</h2>
            <DatePicker date={dataFine} setDate={setDataFine} className="w-full" placeholder="Seleziona data fine" />
          </div>
          <Button onClick={fetchData} className="mt-2 md:mt-0" disabled={isLoading}>
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Caricamento...
              </>
            ) : (
              "Cerca"
            )}
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {isLoading ? (
          <div className="col-span-full flex justify-center items-center h-64">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : prenotazioni.length > 0 ? (
          prenotazioni.map((hotel) => (
            <Card key={hotel.hotel_nome} className="overflow-hidden">
              <CardHeader className="bg-primary/10 pb-2">
                <CardTitle className="text-lg font-medium">{hotel.hotel_nome}</CardTitle>
              </CardHeader>
              <CardContent className="pt-4">
                <div className="text-3xl font-bold text-primary">{hotel.prenotazioni_inserite}</div>
                <p className="text-sm text-muted-foreground mt-1">Prenotazioni inserite</p>
              </CardContent>
            </Card>
          ))
        ) : (
          <div className="col-span-full text-center py-10">
            <p className="text-muted-foreground">Nessun dato disponibile per il periodo selezionato.</p>
          </div>
        )}
      </div>
    </div>
  )
}
