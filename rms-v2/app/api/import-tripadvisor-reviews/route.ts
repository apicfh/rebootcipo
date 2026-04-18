import { createClient } from "@supabase/supabase-js"
import { NextResponse } from "next/server"

// Mappa degli hotel per il logging
const hotelNames: Record<string, string> = {
  "175793b6-5952-4612-b311-eeed8e81f6ab": "CERVIA",
  "3e5b0cad-c9e4-498d-b7d3-42f897606b33": "RIVI",
  "5e6fee95-48c6-40a7-af3f-8b5d3065c8c6": "TOSI",
  "657a94ab-ed25-48a0-bea9-ad2c9f6f4319": "MIMA",
  "7b0840be-fe15-43b5-9269-a02ae0c8b1bc": "RICCIONE",
  "86941a24-f964-4e64-98a3-7e2f2f91b7b3": "BEST",
  "8e15c216-36d7-471f-b3fe-308cdcff26db": "SERE",
  "adbaa6af-36a2-45bc-812d-42dfdcfe0873": "COSTA",
  "d875730e-4744-45da-ab1b-2d2c32f9444b": "TINTO",
  "de0c9e23-816e-4a9d-977f-a6b9246f7bf9": "MICHE",
  "ed23f0f6-6521-40b1-b71b-5c03f9efaf1e": "MIVI",
}

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

    // Nome del job per il logging
    const jobName = `import_tripadvisor_${hotelNames[hotelId] || "unknown"}`

    // Recupera il tripadvisor_id dell'hotel
    const { data: hotel, error: hotelError } = await supabase
      .from("hotel")
      .select("tripadvisor_id, nome")
      .eq("id", hotelId)
      .single()

    if (hotelError || !hotel || !hotel.tripadvisor_id) {
      // Registra l'errore nel log
      await supabase.from("cron_log_tripadvisor").insert({
        job_name: jobName,
        status: "error",
        hotels_processed: 1,
        hotels_success: 0,
        hotels_error: 1,
        reviews_imported: 0,
        details: { hotel_id: hotelId },
        error_message: `Hotel non trovato o tripadvisor_id non configurato: ${hotelError?.message || "ID mancante"}`,
      })

      return NextResponse.json(
        { success: false, error: "Hotel non trovato o tripadvisor_id non configurato" },
        { status: 404 },
      )
    }

    // Estrai l'ID numerico dalla stringa tripadvisor_id (es. "d1234567" -> "1234567")
    const locationId = hotel.tripadvisor_id.startsWith("d") ? hotel.tripadvisor_id.substring(1) : hotel.tripadvisor_id

    // Chiama l'API di Tripadvisor per ottenere le recensioni
    const tripadvisorApiKey = process.env.TRIPADVISOR_API_KEY
    if (!tripadvisorApiKey) {
      // Registra l'errore nel log
      await supabase.from("cron_log_tripadvisor").insert({
        job_name: jobName,
        status: "error",
        hotels_processed: 1,
        hotels_success: 0,
        hotels_error: 1,
        reviews_imported: 0,
        details: { hotel_id: hotelId, hotel_nome: hotel.nome },
        error_message: "API key di Tripadvisor non configurata",
      })

      return NextResponse.json({ success: false, error: "API key di Tripadvisor non configurata" }, { status: 500 })
    }

    const apiUrl = `https://api.content.tripadvisor.com/api/v1/location/${locationId}/reviews?key=${tripadvisorApiKey}&language=it&limit=5`

    const response = await fetch(apiUrl, {
      headers: { Accept: "application/json" },
      next: { revalidate: 0 }, // Assicura che non venga usata la cache
    })

    if (!response.ok) {
      const errorText = await response.text()

      // Registra l'errore nel log
      await supabase.from("cron_log_tripadvisor").insert({
        job_name: jobName,
        status: "error",
        hotels_processed: 1,
        hotels_success: 0,
        hotels_error: 1,
        reviews_imported: 0,
        details: { hotel_id: hotelId, hotel_nome: hotel.nome },
        error_message: `Errore API Tripadvisor: ${response.status} ${response.statusText} - ${errorText}`,
      })

      return NextResponse.json(
        { success: false, error: `Errore API Tripadvisor: ${response.status} ${response.statusText}` },
        { status: response.status },
      )
    }

    const tripadvisorData = await response.json()
    const reviews = tripadvisorData.data || []

    // Contatori per le statistiche
    let nuoveRecensioniImportate = 0
    let recensioniEsistenti = 0

    // Per ogni recensione, controlla se esiste già e inseriscila se nuova
    for (const review of reviews) {
      // Controlla se la recensione esiste già
      const { data: existingReview } = await supabase
        .from("tripadvisor_recensioni")
        .select("id")
        .eq("tripadvisor_review_id", review.id)
        .maybeSingle()

      // Se la recensione esiste già, salta
      if (existingReview) {
        recensioniEsistenti++
        continue
      }

      // Inserisci la nuova recensione
      const { error: insertError } = await supabase.from("tripadvisor_recensioni").insert({
        tripadvisor_review_id: review.id,
        hotel_id: hotelId,
        location_id: review.location_id,
        titolo: review.title,
        testo: review.text,
        valutazione: review.rating,
        data_pubblicazione: new Date(review.published_date).toISOString(),
        lingua: review.lang,
        url: review.url,
        voti_utili: review.helpful_votes,
        tipo_viaggio: review.trip_type,
        data_viaggio: review.travel_date ? new Date(review.travel_date).toISOString() : null,
        nome_utente: review.user.username,
        provenienza_utente: review.user.user_location?.name,
        avatar_thumbnail: review.user.avatar?.thumbnail,
        avatar_small: review.user.avatar?.small,
        avatar_medium: review.user.avatar?.medium,
        avatar_large: review.user.avatar?.large,
        avatar_original: review.user.avatar?.original,
        importato_il: new Date().toISOString(),
      })

      if (insertError) {
        console.error(`Errore inserimento recensione ${review.id}:`, insertError)
        continue
      }

      // Inserisci anche le subvalutazioni se presenti
      if (review.subratings && Object.keys(review.subratings).length > 0) {
        // Prima recupera l'ID della recensione appena inserita
        const { data: insertedReview } = await supabase
          .from("tripadvisor_recensioni")
          .select("id")
          .eq("tripadvisor_review_id", review.id)
          .single()

        if (insertedReview) {
          const subratings = Object.entries(review.subratings).map(([key, subrating]) => ({
            recensione_id: insertedReview.id,
            categoria: subrating.name,
            nome_localizzato: subrating.localized_name,
            valore: subrating.value,
            url_immagine: subrating.rating_image_url,
          }))

          const { error: subratingsError } = await supabase.from("tripadvisor_subvalutazioni").insert(subratings)

          if (subratingsError) {
            console.error(`Errore inserimento subratings per recensione ${review.id}:`, subratingsError)
          }
        }
      }

      nuoveRecensioniImportate++
    }

    // Registra il successo nel log
    await supabase.from("cron_log_tripadvisor").insert({
      job_name: jobName,
      status: "success",
      hotels_processed: 1,
      hotels_success: 1,
      hotels_error: 0,
      reviews_imported: nuoveRecensioniImportate,
      details: {
        hotel_id: hotelId,
        hotel_nome: hotel.nome,
        totale_recensioni_fetchate: reviews.length,
        nuove_recensioni_importate: nuoveRecensioniImportate,
        recensioni_esistenti: recensioniEsistenti,
      },
    })

    // Restituisci il risultato
    return NextResponse.json({
      success: true,
      hotel_id: hotelId,
      hotel_nome: hotel.nome,
      totale_recensioni_fetchate: reviews.length,
      nuove_recensioni_importate: nuoveRecensioniImportate,
      recensioni_esistenti: recensioniEsistenti,
    })
  } catch (error) {
    console.error("Errore durante l'importazione delle recensioni:", error)

    // Ottieni l'hotel_id dalla query string per il logging
    const { searchParams } = new URL(request.url)
    const hotelId = searchParams.get("hotel_id") || "unknown"

    // Nome del job per il logging
    const jobName = `import_tripadvisor_${hotelNames[hotelId] || "unknown"}`

    // Inizializza il client Supabase per il logging degli errori
    const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!)

    // Registra l'errore nel log
    await supabase.from("cron_log_tripadvisor").insert({
      job_name: jobName,
      status: "error",
      hotels_processed: 1,
      hotels_success: 0,
      hotels_error: 1,
      reviews_imported: 0,
      details: { hotel_id: hotelId },
      error_message: `Errore durante l'importazione: ${error instanceof Error ? error.message : String(error)}`,
    })

    return NextResponse.json(
      { success: false, error: "Errore durante l'importazione delle recensioni" },
      { status: 500 },
    )
  }
}
