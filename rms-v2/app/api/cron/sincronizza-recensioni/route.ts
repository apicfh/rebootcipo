import { createClient } from "@supabase/supabase-js"
import { NextResponse } from "next/server"

// Funzione per ritardare l'esecuzione (utile per evitare rate limiting)
const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms))

// Funzione per importare le recensioni di un hotel
async function importaRecensioniHotel(hotelId: string) {
  try {
    // Inizializza il client Supabase
    const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!)

    // Recupera il tripadvisor_id dell'hotel
    const { data: hotel, error: hotelError } = await supabase
      .from("hotel")
      .select("tripadvisor_id, nome")
      .eq("id", hotelId)
      .single()

    if (hotelError || !hotel || !hotel.tripadvisor_id) {
      console.error(`Hotel non trovato o tripadvisor_id non configurato per hotel ID: ${hotelId}`)
      return {
        success: false,
        error: "Hotel non trovato o tripadvisor_id non configurato",
        hotel_id: hotelId,
        totale_recensioni_fetchate: 0,
        nuove_recensioni_importate: 0,
      }
    }

    console.log(
      `Importazione recensioni per hotel: ${hotel.nome} (ID: ${hotelId}, Tripadvisor ID: ${hotel.tripadvisor_id})`,
    )

    // Chiama l'API di Tripadvisor per ottenere le recensioni
    // Utilizziamo limit=5 (il massimo consentito) e language=it per le recensioni italiane
    const tripadvisorApiUrl = `https://api.content.tripadvisor.com/api/v1/location/${hotel.tripadvisor_id}/reviews?key=${process.env.TRIPADVISOR_API_KEY!}&limit=5&language=it`
    console.log(
      `Chiamata API Tripadvisor: ${tripadvisorApiUrl.replace(process.env.TRIPADVISOR_API_KEY!, "API_KEY_HIDDEN")}`,
    )

    const response = await fetch(tripadvisorApiUrl, {
      method: "GET",
      headers: {
        accept: "application/json",
      },
    })

    if (!response.ok) {
      const errorText = await response.text()
      console.error(`Errore API Tripadvisor per hotel ${hotel.nome}: ${response.status} ${errorText}`)
      return {
        success: false,
        error: `Errore API Tripadvisor: ${response.status} ${errorText}`,
        hotel_id: hotelId,
        totale_recensioni_fetchate: 0,
        nuove_recensioni_importate: 0,
      }
    }

    const data = await response.json()
    const recensioni = data.data || []

    console.log(`Ricevute ${recensioni.length} recensioni da Tripadvisor per hotel ${hotel.nome}`)

    // Log dettagliato delle recensioni ricevute
    if (recensioni.length > 0) {
      console.log(`Dettaglio recensioni ricevute per hotel ${hotel.nome}:`)
      recensioni.forEach((recensione, index) => {
        console.log(
          `  ${index + 1}. ID: ${recensione.id}, Titolo: "${recensione.title}", Data: ${recensione.published_date}, Valutazione: ${recensione.rating}`,
        )
      })
    } else {
      console.log(`Nessuna recensione trovata per hotel ${hotel.nome}`)
    }

    // Contatori per le statistiche
    let nuoveRecensioniImportate = 0
    let recensioniEsistenti = 0

    // Per ogni recensione, verifica se esiste già e inseriscila se è nuova
    for (const recensione of recensioni) {
      try {
        // Assicuriamoci che l'ID della recensione sia una stringa per coerenza
        const reviewId = String(recensione.id)

        console.log(`Verifica esistenza recensione ID: ${reviewId} per hotel ${hotel.nome}`)

        // Verifica se la recensione esiste già - approccio più robusto con conteggio
        const { count, error: countError } = await supabase
          .from("tripadvisor_recensioni")
          .select("*", { count: "exact", head: true })
          .eq("tripadvisor_review_id", reviewId)

        if (countError) {
          console.error(`Errore nel controllo della recensione ${reviewId} per hotel ${hotel.nome}:`, countError)
          continue
        }

        console.log(`Recensione ID: ${reviewId} - Conteggio esistenti: ${count}`)

        // Se la recensione non esiste, inseriscila
        if (count === 0) {
          console.log(`Importazione nuova recensione ID: ${reviewId} per hotel ${hotel.nome}`)

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
            aggiornato_il: new Date().toISOString(), // Aggiungiamo anche questo campo
          }

          // Utilizziamo upsert invece di insert per gestire meglio i duplicati
          const { error: upsertError, data: insertedData } = await supabase
            .from("tripadvisor_recensioni")
            .upsert(recensioneData, {
              onConflict: "tripadvisor_review_id",
              ignoreDuplicates: false, // Aggiorna se esiste già
            })
            .select()

          if (upsertError) {
            console.error(`Errore nell'inserimento della recensione ${reviewId} per hotel ${hotel.nome}:`, upsertError)
            continue
          }

          console.log(`Recensione ID: ${reviewId} inserita con successo:`, insertedData)
          nuoveRecensioniImportate++
        } else {
          recensioniEsistenti++
          console.log(`Recensione ID: ${reviewId} già esistente per hotel ${hotel.nome}`)
        }
      } catch (error) {
        console.error(`Errore durante il processing della recensione:`, error)
      }
    }

    console.log(
      `Riepilogo importazione per hotel ${hotel.nome}: ${nuoveRecensioniImportate} nuove recensioni importate, ${recensioniEsistenti} recensioni già esistenti`,
    )

    // Restituisci le statistiche
    return {
      success: true,
      hotel_id: hotelId,
      hotel_nome: hotel.nome,
      totale_recensioni_fetchate: recensioni.length,
      nuove_recensioni_importate: nuoveRecensioniImportate,
      recensioni_esistenti: recensioniEsistenti,
    }
  } catch (error) {
    console.error("Errore durante l'importazione delle recensioni:", error)
    return {
      success: false,
      error: `Errore durante l'importazione: ${error instanceof Error ? error.message : String(error)}`,
      hotel_id: hotelId,
      totale_recensioni_fetchate: 0,
      nuove_recensioni_importate: 0,
    }
  }
}

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

    console.log(
      `Avvio sincronizzazione recensioni Tripadvisor - Tipo: ${isManualExecution ? "Manuale" : "Programmata"}`,
    )

    // Inizializza il client Supabase
    const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!)

    // Recupera tutti gli hotel con tripadvisor_id configurato
    const { data: hotels, error: hotelsError } = await supabase
      .from("hotel")
      .select("id, nome, tripadvisor_id")
      .not("tripadvisor_id", "is", null)
      .order("nome")

    if (hotelsError || !hotels || hotels.length === 0) {
      console.error("Nessun hotel trovato con ID Tripadvisor configurato:", hotelsError)
      return NextResponse.json(
        { success: false, error: "Nessun hotel trovato con ID Tripadvisor configurato" },
        { status: 404 },
      )
    }

    console.log(`Trovati ${hotels.length} hotel con ID Tripadvisor configurato:`)
    hotels.forEach((hotel, index) => {
      console.log(`  ${index + 1}. ${hotel.nome} (ID: ${hotel.id}, Tripadvisor ID: ${hotel.tripadvisor_id})`)
    })

    // Risultati dell'importazione
    const results = []

    // Processa ogni hotel
    for (const hotel of hotels) {
      try {
        console.log(`\n--- Inizio sincronizzazione recensioni per hotel: ${hotel.nome} (ID: ${hotel.id}) ---`)

        // Chiamiamo direttamente la funzione invece che l'endpoint
        const importResult = await importaRecensioniHotel(hotel.id)
        console.log(`Risultato importazione per ${hotel.nome}:`, importResult)

        results.push({
          hotel_id: hotel.id,
          hotel_nome: hotel.nome,
          success: importResult.success,
          message: importResult.success
            ? `Importazione completata: ${importResult.nuove_recensioni_importate} nuove recensioni, ${importResult.recensioni_esistenti || 0} già esistenti`
            : importResult.error,
          count: {
            success: importResult.nuove_recensioni_importate || 0,
            total: importResult.totale_recensioni_fetchate || 0,
            existing: importResult.recensioni_esistenti || 0,
          },
          error: importResult.success ? null : importResult.error,
        })

        console.log(`--- Fine sincronizzazione recensioni per hotel: ${hotel.nome} ---\n`)

        // Attendi 2 secondi tra una chiamata e l'altra per evitare rate limiting
        await delay(2000)
      } catch (error) {
        console.error(`Errore durante la sincronizzazione per hotel ${hotel.nome}:`, error)
        results.push({
          hotel_id: hotel.id,
          hotel_nome: hotel.nome,
          success: false,
          error: error instanceof Error ? error.message : "Errore sconosciuto",
        })
      }
    }

    // Calcola statistiche sui risultati
    const successCount = results.filter((r) => r.success).length
    const errorCount = results.filter((r) => !r.success).length
    const totalReviews = results.reduce((acc, r) => acc + (r.count?.success || 0), 0)
    const existingReviews = results.reduce((acc, r) => acc + (r.count?.existing || 0), 0)

    console.log(`\nRiepilogo sincronizzazione:`)
    console.log(`- Hotel processati: ${hotels.length}`)
    console.log(`- Hotel con successo: ${successCount}`)
    console.log(`- Hotel con errori: ${errorCount}`)
    console.log(`- Nuove recensioni importate: ${totalReviews}`)
    console.log(`- Recensioni già esistenti: ${existingReviews}`)

    // Registra l'esecuzione del cron job nella tabella rinominata
    const { error: logError } = await supabase.from("cron_log_tripadvisor").insert({
      job_name: "sincronizza_recensioni_tripadvisor",
      status: successCount > 0 ? "success" : "error",
      hotels_processed: hotels.length,
      hotels_success: successCount,
      hotels_error: errorCount,
      reviews_imported: totalReviews,
      details: results,
      error_message: errorCount > 0 ? `Errori in ${errorCount} hotel` : null,
      execution_type: isManualExecution ? "manual" : "scheduled",
    })

    if (logError) {
      console.error("Errore durante la registrazione del cron job:", logError)
    } else {
      console.log("Registrazione del cron job completata con successo")
    }

    return NextResponse.json({
      success: true,
      message: `Sincronizzazione completata per ${successCount}/${hotels.length} hotel${errorCount > 0 ? `, ${errorCount} con errori` : ""}. Importate ${totalReviews} nuove recensioni, ${existingReviews} già esistenti.`,
      hotels_processed: hotels.length,
      hotels_success: successCount,
      hotels_error: errorCount,
      reviews_imported: totalReviews,
      reviews_existing: existingReviews,
      results,
    })
  } catch (error) {
    console.error("Errore durante la sincronizzazione automatica delle recensioni:", error)
    return NextResponse.json(
      { success: false, error: "Errore durante la sincronizzazione automatica delle recensioni" },
      { status: 500 },
    )
  }
}
