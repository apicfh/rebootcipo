"use client"

import { useState, useEffect } from "react"
import { getFalzaChallengeData, type FalzaChallengeData } from "@/lib/services/falza-challenge-service"
import { getAllHotels, type Hotel } from "@/lib/services/hotel-service"
import { DateSelector } from "@/components/falza-challenge/date-selector"
import { ViewSelector, type ViewType } from "@/components/falza-challenge/view-selector"
import { HotelChallengeCard } from "@/components/falza-challenge/hotel-challenge-card"
import { ChallengeSummary } from "@/components/falza-challenge/challenge-summary"
import { WeeklyChallengeCard } from "@/components/falza-challenge/weekly-challenge-card"
import { format, startOfWeek, endOfWeek, eachDayOfInterval } from "date-fns"
import { it } from "date-fns/locale"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { HelpCircle } from "lucide-react"
import { Button } from "@/components/ui/button"

interface WeeklyHotelData {
  nome_hotel: string
  id_hotel: string
  prenotazioni_2024: number
  prenotazioni_2025: number
  differenza: number
}

export default function FalzaChallengePage() {
  const [data, setData] = useState<FalzaChallengeData[]>([])
  const [weeklyData, setWeeklyData] = useState<WeeklyHotelData[]>([])
  const [loading, setLoading] = useState(true)
  const [currentDate, setCurrentDate] = useState(format(new Date(), "yyyy-MM-dd"))
  const [viewType, setViewType] = useState<ViewType>("daily")
  const [allHotels, setAllHotels] = useState<Hotel[]>([])

  // Carica l'elenco completo degli hotel
  useEffect(() => {
    async function loadHotels() {
      try {
        const hotels = await getAllHotels()
        // Filtra l'hotel "Tutti" dall'elenco
        const filteredHotels = hotels.filter((hotel) => hotel.nome !== "Tutti")
        setAllHotels(filteredHotels)
      } catch (error) {
        console.error("Errore nel caricamento degli hotel:", error)
      }
    }

    loadHotels()
  }, [])

  useEffect(() => {
    async function loadData() {
      if (allHotels.length === 0) return // Aspetta che l'elenco degli hotel sia caricato

      setLoading(true)
      try {
        const challengeData = await getFalzaChallengeData(currentDate)

        // Filtra l'hotel "Tutti" dai dati ricevuti
        const filteredChallengeData = challengeData.filter((item) => item.nome_hotel !== "Tutti")

        // Debug: stampa i nomi degli hotel per verificare
        console.log(
          "Hotel names:",
          filteredChallengeData.map((item) => item.nome_hotel),
        )

        // Crea un set di hotel già presenti nei dati
        const existingHotels = new Set(filteredChallengeData.map((item) => item.nome_hotel))

        // Crea un array con tutti gli hotel, inclusi quelli senza prenotazioni
        const dataWithAllHotels = [...filteredChallengeData]

        // Aggiungi gli hotel mancanti con prenotazioni_2025 = 0
        allHotels.forEach((hotel) => {
          if (!existingHotels.has(hotel.nome) && hotel.nome !== "Tutti") {
            console.log(`${hotel.nome} non trovato, lo aggiungo manualmente`)

            // Determina l'obiettivo in base al nome dell'hotel
            let obiettivo = 0
            if (hotel.nome === "RIMINI") {
              obiettivo = 7
            } else if (hotel.nome === "RIVI") {
              obiettivo = 4
            } else {
              // Per gli altri hotel, usa un valore predefinito o recuperalo dai dati storici
              // Per ora, usiamo 0 come valore predefinito
              obiettivo = 0
            }

            dataWithAllHotels.push({
              nome_hotel: hotel.nome,
              id_hotel: hotel.id,
              prenotazioni_2024: obiettivo,
              prenotazioni_2025: 0,
              differenza: -obiettivo,
              mese: 0,
              giorno: 0,
              data_formato: currentDate,
            })
          }
        })

        // Modifica gli obiettivi per Rimini e Rivi
        const modifiedData = dataWithAllHotels.map((item) => {
          // Controlla se il nome dell'hotel è esattamente "RIVI"
          if (item.nome_hotel === "RIVI") {
            console.log("Trovato RIVI, imposto obiettivo a 4")
            return {
              ...item,
              prenotazioni_2024: 4, // Obiettivo fisso per Rivi
              differenza: item.prenotazioni_2025 - 4, // Ricalcola la differenza
            }
          }
          // Controlla se il nome dell'hotel è esattamente "RIMINI"
          else if (item.nome_hotel === "RIMINI") {
            console.log("Trovato RIMINI, imposto obiettivo a 7")
            return {
              ...item,
              prenotazioni_2024: 7, // Obiettivo fisso per Rimini
              differenza: item.prenotazioni_2025 - 7, // Ricalcola la differenza
            }
          }
          // Per gli altri hotel, mantieni i dati originali
          return item
        })

        // Debug: stampa i dati modificati
        console.log("Modified data:", modifiedData)

        setData(modifiedData)

        // Calcola i dati settimanali
        if (modifiedData.length > 0) {
          const selectedDate = new Date(currentDate)
          const start = startOfWeek(selectedDate, { weekStartsOn: 1 }) // Inizia da lunedì
          const end = endOfWeek(selectedDate, { weekStartsOn: 1 })
          const weekDays = eachDayOfInterval({ start, end })

          // Carica i dati per ogni giorno della settimana
          const weekPromises = weekDays.map((day) => {
            const dateStr = format(day, "yyyy-MM-dd")
            return getFalzaChallengeData(dateStr)
          })

          const weekResults = await Promise.all(weekPromises)

          // Raggruppa i dati per hotel
          const hotelMap = new Map<string, WeeklyHotelData>()

          // Inizializza la mappa con tutti gli hotel
          allHotels.forEach((hotel) => {
            if (hotel.nome !== "Tutti") {
              let obiettivo = 0
              if (hotel.nome === "RIMINI") {
                obiettivo = 7 * weekDays.length
              } else if (hotel.nome === "RIVI") {
                obiettivo = 4 * weekDays.length
              }

              hotelMap.set(hotel.id, {
                nome_hotel: hotel.nome,
                id_hotel: hotel.id,
                prenotazioni_2024: obiettivo,
                prenotazioni_2025: 0,
                differenza: -obiettivo,
              })
            }
          })

          // Somma i dati per ogni giorno
          weekResults.forEach((dayData) => {
            // Filtra l'hotel "Tutti" dai dati giornalieri
            const filteredDayData = dayData.filter((item) => item.nome_hotel !== "Tutti")

            filteredDayData.forEach((item) => {
              const hotel = hotelMap.get(item.id_hotel)
              if (hotel) {
                // Applica la stessa logica per Rimini e Rivi
                if (item.nome_hotel === "RIVI") {
                  hotel.prenotazioni_2025 += item.prenotazioni_2025
                } else if (item.nome_hotel === "RIMINI") {
                  hotel.prenotazioni_2025 += item.prenotazioni_2025
                } else {
                  hotel.prenotazioni_2024 += item.prenotazioni_2024
                  hotel.prenotazioni_2025 += item.prenotazioni_2025
                }
              }
            })
          })

          // Calcola le differenze dopo aver sommato tutti i valori
          hotelMap.forEach((hotel) => {
            if (hotel.nome_hotel === "RIVI") {
              hotel.prenotazioni_2024 = 4 * weekDays.length
            } else if (hotel.nome_hotel === "RIMINI") {
              hotel.prenotazioni_2024 = 7 * weekDays.length
            }
            hotel.differenza = hotel.prenotazioni_2025 - hotel.prenotazioni_2024
          })

          setWeeklyData(Array.from(hotelMap.values()))
        }
      } catch (error) {
        console.error("Errore nel caricamento dei dati:", error)
      } finally {
        setLoading(false)
      }
    }

    loadData()
  }, [currentDate, allHotels])

  const handleDateChange = (date: string) => {
    setCurrentDate(date)
  }

  const formattedDate = currentDate
    ? format(new Date(currentDate), "d MMMM yyyy", { locale: it })
    : "Data non selezionata"

  const weekStart = format(startOfWeek(new Date(currentDate), { weekStartsOn: 1 }), "d MMMM", { locale: it })
  const weekEnd = format(endOfWeek(new Date(currentDate), { weekStartsOn: 1 }), "d MMMM yyyy", { locale: it })

  return (
    <div className="container mx-auto py-6">
      <div className="mb-6">
        <h1 className="text-3xl font-bold tracking-tight">Falza&apos;s Challenge</h1>
        <p className="text-muted-foreground">Forza ragazzi, siamo tutti con voi!</p>
      </div>

      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <DateSelector onDateChange={handleDateChange} />
        <ViewSelector activeView={viewType} onViewChange={setViewType} />
      </div>

      {loading ? (
        <div className="flex h-40 items-center justify-center">
          <p className="text-lg text-muted-foreground">Caricamento dati in corso...</p>
        </div>
      ) : data.length === 0 ? (
        <div className="flex h-40 items-center justify-center">
          <p className="text-lg text-muted-foreground">
            Nessun dato disponibile per{" "}
            {viewType === "daily" ? formattedDate : `la settimana dal ${weekStart} al ${weekEnd}`}
          </p>
        </div>
      ) : (
        <>
          <div className="mb-6 flex items-start gap-2">
            <div className="flex-1">
              {viewType === "daily" ? (
                <ChallengeSummary data={data.filter((item) => item.nome_hotel !== "Tutti")} />
              ) : (
                <ChallengeSummary
                  data={weeklyData
                    .filter((item) => item.nome_hotel !== "Tutti")
                    .map((item) => ({
                      ...item,
                      mese: 0,
                      giorno: 0,
                      data_formato: `Settimana dal ${weekStart} al ${weekEnd}`,
                    }))}
                />
              )}
            </div>
            <Dialog>
              <DialogTrigger asChild>
                <Button variant="ghost" size="icon" className="mt-2">
                  <HelpCircle className="h-5 w-5" />
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-md">
                <DialogHeader>
                  <DialogTitle>Informazioni sui dati</DialogTitle>
                </DialogHeader>
                <DialogDescription>
                  I dati obiettivo sono ricavati dal nostro database che per il 2024 rileva tutte le prenotazioni del
                  2024 che si sono effettivamente consumate sul piano camere di tutti gli hotel eccetto Executive. Sono
                  quindi esclusi da questo computo gli amici di Facebook e le prenotazioni che sono state confermate e
                  in seguito cancellate prima della data di soggiorno.
                </DialogDescription>
              </DialogContent>
            </Dialog>
          </div>

          <h2 className="mb-4 text-xl font-semibold">
            {viewType === "daily" ? `Dati per ${formattedDate}` : `Dati settimanali (${weekStart} - ${weekEnd})`}
          </h2>

          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {viewType === "daily"
              ? data
                  .filter((item) => item.nome_hotel !== "Tutti")
                  .map((item) => (
                    <HotelChallengeCard
                      key={item.id_hotel}
                      data={
                        item.nome_hotel === "RIVI"
                          ? { ...item, prenotazioni_2024: 4, differenza: item.prenotazioni_2025 - 4 }
                          : item.nome_hotel === "RIMINI"
                            ? { ...item, prenotazioni_2024: 7, differenza: item.prenotazioni_2025 - 7 }
                            : item
                      }
                    />
                  ))
              : weeklyData
                  .filter((item) => item.nome_hotel !== "Tutti")
                  .map((item) => <WeeklyChallengeCard key={item.id_hotel} data={item} />)}
          </div>
        </>
      )}
    </div>
  )
}
