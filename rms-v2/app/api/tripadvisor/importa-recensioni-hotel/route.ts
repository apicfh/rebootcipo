import { createClient } from "@supabase/supabase-js"
import { NextResponse } from "next/server"

export async function GET(request: Request) {
  try {
    // Ottieni l'hotel_id dalla query string
    const { searchParams } = new URL(request.url)
    const hotelId = searchParams.get("hotel_id")

    if (!hotelId) {
      return NextResponse.json({ success: false, error: "hotel_id è obbligatorio" }, { status: 400 })
    }

    // Inizializza il client Supabase
    const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!)

    // Recupera il tripadvisor_id dell'hotel
    const { data: hotel, error: hotelError } = await supabase
      .from("hotel")
      .select("tripadvisor_id")
      .eq("id", hotelId)
      .single()

    if (hotelError || !hotel || !hotel.tripadvisor_id) {
      return NextResponse.json(
        {
          success: false,
          error: "Hotel non trovato o tripadvisor_id non configurato",
          hotel_id: hotelId,
          totale_recensioni_fetchate: 0,
          nuove_recensioni_importate: 0,
        },
        { status: 404 },
      )
    }

    // Chiama l'API di Tripadvisor per ottenere le recensioni
    const tripadvisorApiUrl = `https://api.content.tripadvisor.com/api/v1/location/${hotel.tripadvisor_id}/reviews?key=${process.env.TRIPADVISOR_API_KEY!}`
    const response = await fetch(tripadvisorApiUrl, {
      method: "GET",
      headers: {
        accept: "application/json",
      },
    })

    if (!response.ok) {
      const errorText = await response.text()
      return NextResponse.json(
        {
          success: false,
          error: `Errore API Tripadvisor: ${response.status} ${errorText}`,
          hotel_id: hotelId,
          totale_recensioni_fetchate: 0,
          nuove_recensioni_importate: 0,
        },
        { status: 500 },
      )
    }

    const data = await response.json()
    const recensioni = data.data || []

    // Contatori per le statistiche
    let nuoveRecensioniImportate = 0

    // Per ogni recensione, verifica se esiste già e inseriscila se è nuova
    for (const recensione of recensioni) {
      // Verifica se la recensione esiste già
      const { data: esistente, error: checkError } = await supabase
        .from("tripadvisor_recensioni")
        .select("id")
        .eq("tripadvisor_review_id", recensione.id)
        .maybeSingle()

      if (checkError) {
        console.error(`Errore nel controllo della recensione ${recensione.id}:`, checkError)
        continue
      }

      // Se la recensione non esiste, inseriscila
      if (!esistente) {
        const { error: insertError } = await supabase.from("tripadvisor_recensioni").insert({
          tripadvisor_review_id: recensione.id,
          hotel_id: hotelId,
          location_id: hotel.tripadvisor_id,
          titolo: recensione.title || null,
          testo: recensione.text || null,
          valutazione: recensione.rating || null,
          data_pubblicazione: recensione.published_date || null,
          lingua: recensione.lang || null,
          url: recensione.url || null,
          voti_utili: recensione.helpful_votes || 0,
          tipo_viaggio: recensione.trip_type || null,
          data_viaggio: recensione.travel_date || null,
          nome_utente: recensione.user?.username || null,
          provenienza_utente: recensione.user?.user_location || null,
          avatar_thumbnail: recensione.user?.avatar?.thumbnail || null,
          avatar_small: recensione.user?.avatar?.small || null,
          avatar_medium: recensione.user?.avatar?.medium || null,
          avatar_large: recensione.user?.avatar?.large || null,
          avatar_original: recensione.user?.avatar?.original || null,
          importato_il: new Date().toISOString(),
        })

        if (insertError) {
          console.error(`Errore nell'inserimento della recensione ${recensione.id}:`, insertError)
          continue
        }

        nuoveRecensioniImportate++
      }
    }

    // Restituisci le statistiche
    return NextResponse.json({
      success: true,
      hotel_id: hotelId,
      totale_recensioni_fetchate: recensioni.length,
      nuove_recensioni_importate: nuoveRecensioniImportate,
    })
  } catch (error) {
    console.error("Errore durante l'importazione delle recensioni:", error)
    return NextResponse.json(
      {
        success: false,
        error: `Errore durante l'importazione: ${error instanceof Error ? error.message : String(error)}`,
        hotel_id: new URL(request.url).searchParams.get("hotel_id") || "unknown",
        totale_recensioni_fetchate: 0,
        nuove_recensioni_importate: 0,
      },
      { status: 500 },
    )
  }
}
