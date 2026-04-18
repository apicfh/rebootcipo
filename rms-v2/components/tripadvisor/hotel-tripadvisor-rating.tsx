"use client"

import { useState, useEffect } from "react"
import { supabase } from "@/lib/supabase/client"

interface HotelTripadvisorRatingProps {
  hotelId: string
  className?: string
}

export function HotelTripadvisorRating({ hotelId, className = "" }: HotelTripadvisorRatingProps) {
  const [tripadvisorId, setTripadvisorId] = useState<string | null>(null)
  const [rating, setRating] = useState<number | null>(null)
  const [position, setPosition] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Funzione per estrarre il numero dall'ID di Tripadvisor
  const extractNumericId = (id: string): string => {
    // Se l'ID è nel formato "d1234567", estrai solo la parte numerica
    if (id && id.startsWith("d") && !isNaN(Number.parseInt(id.substring(1)))) {
      return id.substring(1)
    }
    // Se l'ID è già un numero, restituiscilo
    if (id && !isNaN(Number.parseInt(id))) {
      return id
    }
    // Altrimenti, cerca qualsiasi sequenza di numeri nell'ID
    const matches = id ? id.match(/\d+/) : null
    return matches ? matches[0] : ""
  }

  useEffect(() => {
    async function fetchTripadvisorData() {
      if (!hotelId) return

      setLoading(true)
      try {
        // Recupera l'ID Tripadvisor e il nome della città dal database
        const { data, error } = await supabase.from("hotel").select("tripadvisor_id, città").eq("id", hotelId).single()

        if (error) {
          throw error
        }

        const tripId = data?.tripadvisor_id || null
        const city = data?.città || ""
        setTripadvisorId(tripId)

        if (tripId) {
          // Estrai il numero dall'ID di Tripadvisor
          const numericId = extractNumericId(tripId)

          if (!numericId) {
            throw new Error("ID Tripadvisor non valido")
          }

          // Recupera i dettagli della location da Tripadvisor
          const response = await fetch(`/api/tripadvisor/location?locationId=${numericId}`)

          if (!response.ok) {
            throw new Error(`Errore API: ${response.status}`)
          }

          const locationData = await response.json()

          // Verifica che il rating sia un numero valido
          const ratingValue = locationData.rating ? Number.parseFloat(locationData.rating) : null
          setRating(ratingValue)

          // Estrai la posizione nella località
          if (locationData.ranking_data && locationData.ranking_data.geo_location_name) {
            const rankingPosition = locationData.ranking_data.ranking_position || ""
            const totalHotels = locationData.ranking_data.ranking_denominator || ""
            const locationName = locationData.ranking_data.geo_location_name || city

            if (rankingPosition && totalHotels) {
              setPosition(`N.${rankingPosition} di ${totalHotels} hotel a ${locationName}`)
            }
          }
        }
      } catch (error) {
        console.error("Errore nel recupero dei dati Tripadvisor:", error)
        setError("Impossibile recuperare i dati Tripadvisor")
      } finally {
        setLoading(false)
      }
    }

    fetchTripadvisorData()
  }, [hotelId])

  if (loading || error || !rating) {
    return null
  }

  // Verifica che rating sia un numero prima di chiamare toFixed
  const formattedRating = typeof rating === "number" ? rating.toFixed(1) : ""

  return (
    <div className={`flex items-center ${className}`}>
      <img src="/icons/tripadvisor-logo.png" alt="Tripadvisor" width={24} height={24} className="mr-1" />
      <div className="text-yellow-500 font-bold mr-2">{formattedRating}</div>
      {position && <div className="text-sm text-gray-600">{position}</div>}
    </div>
  )
}
