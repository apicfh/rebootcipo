import { createClient } from "@supabase/supabase-js"
import { NextResponse } from "next/server"

export async function GET(request: Request) {
  try {
    // Verifica se la richiesta proviene da Vercel Cron o da un'esecuzione manuale
    const authHeader = request.headers.get("authorization")
    const isVercelCron = process.env.CRON_SECRET && authHeader === `Bearer ${process.env.CRON_SECRET}`
    const isManualExecution = !authHeader // Consideriamo le richieste senza header di autorizzazione come esecuzioni manuali

    // Se non è né un cron Vercel né un'esecuzione manuale, rifiuta la richiesta
    if (!isVercelCron && !isManualExecution) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 })
    }

    // Ottieni i parametri dalla query string
    const url = new URL(request.url)
    const hotelId = url.searchParams.get("hotel_id")
    const hotelCode = url.searchParams.get("hotel_code") || "UNKNOWN"

    if (!hotelId) {
      return NextResponse.json({ success: false, error: "Hotel ID mancante" }, { status: 400 })
    }

    console.log(`Avvio importazione recensioni Tripadvisor per hotel ID: ${hotelId} (${hotelCode})`)

    // Inizializza il client Supabase
    const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!)

    // Recupera le informazioni dell'hotel
    const { data: hotel, error: hotelError } = await supabase
      .from("hotel")
      .select("tripadvisor_id, nome")
      .eq("id", hotelId)
      .single()

    if (hotelError || !hotel || !hotel.tripadvisor_id) {
      console.error(`Hotel non trovato o tripadvisor_id non configurato per hotel ID: ${hotelId}`)

      // Registra l'errore nel log
      await supabase.from("cron_log_tripadvisor").insert({
        job_name: `import_tripadvisor_${hotelCode}`,
        status: "error",
        hotels_processed: 1,
        hotels_success: 0,
        hotels_error: 1,
        reviews_imported: 0,
        details: [
          {
            hotel_id: hotelId,
            hotel_nome: "Sconosciuto",
            success: false,
            error: "Hotel non trovato o tripadvisor_id non configurato",
          },
        ],
        error_message: "Hotel non trovato o tripadvisor_id non configurato",
        execution_type: isManualExecution ? "manual" : "scheduled",
      })

      return NextResponse.json(
        { success: false, error: "Hotel non trovato o tripadvisor_id non configurato" },
        { status: 404 },
      )
    }

    console.log(
      `Importazione recensioni per hotel: ${hotel.nome} (ID: ${hotelId}, Tripadvisor ID: ${hotel.tripadvisor_id})`,
    )

    // Chiama l'API di Tripadvisor per ottenere le recensioni
    const tripadvisorApiUrl = `https://api.content.tripadvisor.com/api/v1/location/${hotel.tripadvisor_id}/reviews?key=${process.env.TRIPADVISOR_API_KEY!}&limit=5&language=it`

    const response = await fetch(tripadvisorApiUrl, {
      method: "GET",
      headers: {
        accept: "application/json",
      },
    })

    if (!response.ok) {
      const errorText = await response.text()
      console.error(`Errore API Tripadvisor per hotel ${hotel.nome}: ${response.status} ${errorText}`)

      // Registra l'errore nel log
      await supabase.from("cron_log_tripadvisor").insert({
        job_name: `import_tripadvisor_${hotelCode}`,
        status: "error",
        hotels_processed: 1,
        hotels_success: 0,
        hotels_error: 1,
        reviews_imported: 0,
        details: [
          {
            hotel_id: hotelId,
            hotel_nome: hotel.nome,
            success: false,
            error: `Errore API Tripadvisor: ${response.status} ${errorText}`,
          },
        ],
        error_message: `Errore API Tripadvisor: ${response.status} ${errorText}`,
        execution_type: isManualExecution ? "manual" : "scheduled",
      })

      return NextResponse.json(
        { success: false, error: `Errore API Tripadvisor: ${response.status} ${errorText}` },
        { status: response.status },
      )
    }

    const data = await response.json()
    const recensioni = data.data || []

    console.log(`Ricevute ${recensioni.length} recensioni da Tripadvisor per hotel ${hotel.nome}`)

    // Contatori per le statistiche
    let nuoveRecensioniImportate = 0
    let recensioniEsistenti = 0

    // Per ogni recensione, verifica se esiste già e inseriscila se è nuova
    for (const recensione of recensioni) {
      try {
        // Assicuriamoci che l'ID della recensione sia una stringa per coerenza
        const reviewId = String(recensione.id)

        // Verifica se la recensione esiste già
        const { count, error: countError } = await supabase
          .from("tripadvisor_recensioni")
          .select("*", { count: "exact", head: true })
          .eq("tripadvisor_review_id", reviewId)

        if (countError) {
          console.error(`Errore nel controllo della recensione ${reviewId} per hotel ${hotel.nome}:`, countError)
          continue
        }

        // Se la recensione non esiste, inseriscila
        if (count === 0) {
          // Prepara i dati per l'inserimento
          const recensioneData = {
            tripadvisor_review_id: reviewId,
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
            aggiornato_il: new Date().toISOString(),
          }

          // Utilizziamo upsert per gestire meglio i duplicati
          const { error: upsertError } = await supabase.from("tripadvisor_recensioni").upsert(recensioneData, {
            onConflict: "tripadvisor_review_id",
            ignoreDuplicates: false, // Aggiorna se esiste già
          })

          if (upsertError) {
            console.error(`Errore nell'inserimento della recensione ${reviewId} per hotel ${hotel.nome}:`, upsertError)
            continue
          }

          nuoveRecensioniImportate++
        } else {
          recensioniEsistenti++
        }
      } catch (error) {
        console.error(`Errore durante il processing della recensione:`, error)
      }
    }

    console.log(
      `Riepilogo importazione per hotel ${hotel.nome}: ${nuoveRecensioniImportate} nuove recensioni importate, ${recensioniEsistenti} recensioni già esistenti`,
    )

    // Registra il successo nel log
    await supabase.from("cron_log_tripadvisor").insert({
      job_name: `import_tripadvisor_${hotelCode}`,
      status: "success",
      hotels_processed: 1,
      hotels_success: 1,
      hotels_error: 0,
      reviews_imported: nuoveRecensioniImportate,
      details: [
        {
          hotel_id: hotelId,
          hotel_nome: hotel.nome,
          success: true,
          message: `Importazione completata: ${nuoveRecensioniImportate} nuove recensioni, ${recensioniEsistenti} già esistenti`,
          count: {
            success: nuoveRecensioniImportate,
            total: recensioni.length,
            existing: recensioniEsistenti,
          },
        },
      ],
      execution_type: isManualExecution ? "manual" : "scheduled",
    })

    return NextResponse.json({
      success: true,
      message: `Importazione completata per hotel ${hotel.nome}. Importate ${nuoveRecensioniImportate} nuove recensioni, ${recensioniEsistenti} già esistenti.`,
      hotel: {
        id: hotelId,
        nome: hotel.nome,
        tripadvisor_id: hotel.tripadvisor_id,
      },
      stats: {
        reviews_imported: nuoveRecensioniImportate,
        reviews_existing: recensioniEsistenti,
        reviews_total: recensioni.length,
      },
    })
  } catch (error) {
    console.error("Errore durante l'importazione delle recensioni:", error)

    // Ottieni i parametri dalla query string per il log di errore
    const url = new URL(request.url)
    const hotelId = url.searchParams.get("hotel_id") || "unknown"
    const hotelCode = url.searchParams.get("hotel_code") || "UNKNOWN"

    // Inizializza il client Supabase per il log di errore
    const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!)

    // Registra l'errore nel log
    await supabase.from("cron_log_tripadvisor").insert({
      job_name: `import_tripadvisor_${hotelCode}`,
      status: "error",
      hotels_processed: 1,
      hotels_success: 0,
      hotels_error: 1,
      reviews_imported: 0,
      details: [
        {
          hotel_id: hotelId,
          success: false,
          error: error instanceof Error ? error.message : String(error),
        },
      ],
      error_message: `Errore durante l'importazione: ${error instanceof Error ? error.message : String(error)}`,
      execution_type: "scheduled",
    })

    return NextResponse.json(
      { success: false, error: "Errore durante l'importazione delle recensioni" },
      { status: 500 },
    )
  }
}
