import { createClient } from "@supabase/supabase-js"
import { NextResponse } from "next/server"

export async function GET(request: Request) {
  try {
    // Verifica se la richiesta proviene da Vercel Cron
    const authHeader = request.headers.get("authorization")
    if (!process.env.CRON_SECRET || authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 })
    }

    // Inizializza il client Supabase
    const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!)

    // ID dell'hotel di Cervia
    const hotelId = "175793b6-5952-4612-b311-eeed8e81f6ab"

    // Recupera informazioni sull'hotel
    const { data: hotel, error: hotelError } = await supabase
      .from("hotel")
      .select("nome, tripadvisor_id")
      .eq("id", hotelId)
      .single()

    if (hotelError || !hotel) {
      // Registra l'errore nel log
      await supabase.from("cron_log_tripadvisor").insert({
        job_name: "import_tripadvisor_cervia",
        status: "error",
        hotels_processed: 0,
        hotels_success: 0,
        hotels_error: 1,
        reviews_imported: 0,
        error_message: `Errore nel recupero dell'hotel: ${hotelError?.message || "Hotel non trovato"}`,
      })

      return NextResponse.json(
        { success: false, error: `Errore nel recupero dell'hotel: ${hotelError?.message || "Hotel non trovato"}` },
        { status: 404 },
      )
    }

    // Chiama l'endpoint di importazione recensioni
    const importUrl = new URL("/api/tripadvisor/importa-recensioni-hotel", request.url)
    importUrl.searchParams.append("hotel_id", hotelId)

    const importResponse = await fetch(importUrl.toString(), {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
      },
    })

    const importResult = await importResponse.json()

    // Registra il risultato nel log
    await supabase.from("cron_log_tripadvisor").insert({
      job_name: "import_tripadvisor_cervia",
      status: importResult.success ? "success" : "error",
      hotels_processed: 1,
      hotels_success: importResult.success ? 1 : 0,
      hotels_error: importResult.success ? 0 : 1,
      reviews_imported: importResult.nuove_recensioni_importate || 0,
      details: {
        hotel_id: hotelId,
        hotel_nome: hotel.nome,
        totale_recensioni_fetchate: importResult.totale_recensioni_fetchate || 0,
        nuove_recensioni_importate: importResult.nuove_recensioni_importate || 0,
      },
      error_message: importResult.error || null,
    })

    return NextResponse.json({
      success: true,
      message: `Importazione recensioni per ${hotel.nome} completata`,
      result: importResult,
    })
  } catch (error) {
    console.error("Errore durante l'importazione automatica delle recensioni per Cervia:", error)

    // Inizializza il client Supabase per registrare l'errore
    const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!)

    // Registra l'errore nel log
    await supabase.from("cron_log_tripadvisor").insert({
      job_name: "import_tripadvisor_cervia",
      status: "error",
      hotels_processed: 0,
      hotels_success: 0,
      hotels_error: 1,
      reviews_imported: 0,
      error_message: `Errore durante l'importazione: ${error instanceof Error ? error.message : String(error)}`,
    })

    return NextResponse.json(
      { success: false, error: "Errore durante l'importazione automatica delle recensioni per Cervia" },
      { status: 500 },
    )
  }
}
