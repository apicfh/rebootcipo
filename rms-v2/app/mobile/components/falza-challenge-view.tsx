"use client"

import { useState, useEffect } from "react"
import { format } from "date-fns"
import { it } from "date-fns/locale"
import { Loader2, ArrowUp, ArrowDown } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { getFalzaChallengeData, type FalzaChallengeData } from "@/lib/services/falza-challenge-service"
import { getAllHotels } from "@/lib/services/hotel-service"
import { DatePicker } from "@/components/ui/date-picker"

export function FalzaChallengeView() {
  const [data, setData] = useState<FalzaChallengeData[]>([])
  const [loading, setLoading] = useState(true)
  const [currentDate, setCurrentDate] = useState(new Date())
  const [totals, setTotals] = useState({
    obiettivo: 0,
    attuale: 0,
    differenza: 0,
    percentuale: 0,
  })

  useEffect(() => {
    async function loadData() {
      setLoading(true)
      try {
        // Carica gli hotel per assicurarsi che tutti siano rappresentati
        const hotels = await getAllHotels()
        const filteredHotels = hotels.filter((hotel) => hotel.nome !== "Tutti")

        // Carica i dati della challenge
        const dateStr = format(currentDate, "yyyy-MM-dd")
        const challengeData = await getFalzaChallengeData(dateStr)

        // Filtra l'hotel "Tutti" dai dati
        const filteredData = challengeData.filter((item) => item.nome_hotel !== "Tutti")

        // Crea un set di hotel già presenti nei dati
        const existingHotels = new Set(filteredData.map((item) => item.nome_hotel))

        // Aggiungi gli hotel mancanti
        const dataWithAllHotels = [...filteredData]
        filteredHotels.forEach((hotel) => {
          if (!existingHotels.has(hotel.nome)) {
            let obiettivo = 0
            if (hotel.nome === "RIMINI") obiettivo = 7
            else if (hotel.nome === "RIVI") obiettivo = 4

            dataWithAllHotels.push({
              nome_hotel: hotel.nome,
              id_hotel: hotel.id,
              prenotazioni_2024: obiettivo,
              prenotazioni_2025: 0,
              differenza: -obiettivo,
              mese: 0,
              giorno: 0,
              data_formato: dateStr,
            })
          }
        })

        // Modifica gli obiettivi per Rimini e Rivi
        const modifiedData = dataWithAllHotels.map((item) => {
          if (item.nome_hotel === "RIVI") {
            return {
              ...item,
              prenotazioni_2024: 4,
              differenza: item.prenotazioni_2025 - 4,
            }
          } else if (item.nome_hotel === "RIMINI") {
            return {
              ...item,
              prenotazioni_2024: 7,
              differenza: item.prenotazioni_2025 - 7,
            }
          }
          return item
        })

        // Calcola i totali
        const calculatedTotals = modifiedData.reduce(
          (acc, item) => {
            acc.prenotazioni2024 += item.prenotazioni_2024
            acc.prenotazioni2025 += item.prenotazioni_2025
            return acc
          },
          { prenotazioni2024: 0, prenotazioni2025: 0 },
        )

        // Calcola l'obiettivo (prenotazioni 2024 + 12)
        const obiettivo = calculatedTotals.prenotazioni2024 + 12
        const differenza = calculatedTotals.prenotazioni2025 - obiettivo
        const percentuale = Math.round((calculatedTotals.prenotazioni2025 / obiettivo) * 100)

        setTotals({
          obiettivo,
          attuale: calculatedTotals.prenotazioni2025,
          differenza,
          percentuale,
        })

        setData(modifiedData)
      } catch (error) {
        console.error("Errore nel caricamento dei dati:", error)
      } finally {
        setLoading(false)
      }
    }

    loadData()
  }, [currentDate])

  const formattedDate = format(currentDate, "d MMMM yyyy", { locale: it })
  const isPositive = totals.differenza >= 0

  return (
    <div className="space-y-4">
      <div className="mb-4">
        <DatePicker
          date={currentDate}
          setDate={setCurrentDate}
          className="w-full border-2"
          placeholder="Seleziona data"
        />
      </div>

      {loading ? (
        <div className="flex h-40 items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin" />
        </div>
      ) : (
        <>
          <Card className="border-2 border-secondary-300 shadow-md">
            <CardHeader className="pb-2">
              <CardTitle className="text-center text-lg">Riepilogo {formattedDate}</CardTitle>
            </CardHeader>
            <CardContent className="pt-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="text-center">
                  <p className="text-sm text-muted-foreground">Obiettivo</p>
                  <p className="text-2xl font-bold">{totals.obiettivo}</p>
                </div>
                <div className="text-center">
                  <p className="text-sm text-muted-foreground">Attuale</p>
                  <p className="text-2xl font-bold">{totals.attuale}</p>
                </div>
                <div className="text-center">
                  <p className="text-sm text-muted-foreground">Differenza</p>
                  <div className="flex items-center justify-center">
                    <div
                      className={`flex items-center gap-1 rounded-full px-2 py-1 ${
                        isPositive ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"
                      }`}
                    >
                      {isPositive ? <ArrowUp className="h-4 w-4" /> : <ArrowDown className="h-4 w-4" />}
                      <span className="font-medium">
                        {isPositive ? "+" : ""}
                        {totals.differenza}
                      </span>
                    </div>
                  </div>
                </div>
                <div className="text-center">
                  <p className="text-sm text-muted-foreground">Completamento</p>
                  <p className="text-2xl font-bold">{totals.percentuale}%</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <div className="grid grid-cols-2 gap-3">
            {data.map((hotel) => {
              const isHotelPositive = hotel.differenza >= 0
              const isSpecialHotel = hotel.nome_hotel === "RIMINI" || hotel.nome_hotel === "RIVI"

              return (
                <Card key={hotel.id_hotel} className="overflow-hidden">
                  <CardHeader className={`pb-2 ${isSpecialHotel ? "bg-amber-100" : "bg-primary-100"}`}>
                    <CardTitle className="text-sm font-bold truncate">{hotel.nome_hotel}</CardTitle>
                  </CardHeader>
                  <CardContent className="p-3">
                    <div className="grid grid-cols-2 gap-2 text-sm">
                      <div className="text-center">
                        <p className="text-xs text-muted-foreground">2024</p>
                        <p className="font-bold">{hotel.prenotazioni_2024}</p>
                      </div>
                      <div className="text-center">
                        <p className="text-xs text-muted-foreground">2025</p>
                        <p className={`font-bold ${hotel.prenotazioni_2025 === 0 ? "text-red-500" : ""}`}>
                          {hotel.prenotazioni_2025}
                        </p>
                      </div>
                    </div>
                    <div className="mt-2 flex items-center justify-center">
                      <div
                        className={`flex items-center gap-1 rounded-full px-2 py-1 text-xs ${
                          isHotelPositive ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"
                        }`}
                      >
                        {isHotelPositive ? <ArrowUp className="h-3 w-3" /> : <ArrowDown className="h-3 w-3" />}
                        <span className="font-medium">
                          {isHotelPositive ? "+" : ""}
                          {hotel.differenza}
                        </span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )
            })}
          </div>
        </>
      )}
    </div>
  )
}
