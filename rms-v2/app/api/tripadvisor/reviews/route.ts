import { NextResponse } from "next/server"

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const locationId = searchParams.get("locationId")
  const limit = searchParams.get("limit") ? Number.parseInt(searchParams.get("limit")!) : 5
  const language = searchParams.get("language") || "it"

  if (!locationId) {
    return NextResponse.json({ error: "Parametro locationId mancante" }, { status: 400 })
  }

  // Verifica che locationId sia un numero valido
  if (isNaN(Number(locationId))) {
    return NextResponse.json({ error: "locationId deve essere un numero valido" }, { status: 400 })
  }

  try {
    const apiKey = process.env.TRIPADVISOR_API_KEY

    if (!apiKey) {
      console.error("API key di Tripadvisor non configurata")
      return NextResponse.json({ error: "API key non configurata" }, { status: 500 })
    }

    // URL per l'API di Tripadvisor
    const apiUrl = `https://api.content.tripadvisor.com/api/v1/location/${locationId}/reviews?key=${apiKey}&language=${language}&limit=${limit}`

    console.log("Chiamata API Tripadvisor:", apiUrl.replace(apiKey, "API_KEY_HIDDEN"))

    const response = await fetch(apiUrl, {
      headers: {
        Accept: "application/json",
      },
      // Aggiungiamo un timeout per evitare che la richiesta rimanga in sospeso troppo a lungo
      signal: AbortSignal.timeout(10000), // 10 secondi di timeout
    })

    if (!response.ok) {
      const errorText = await response.text()
      console.error(`Errore API Tripadvisor (${response.status}):`, errorText)
      return NextResponse.json(
        { error: `Errore API Tripadvisor: ${response.statusText}`, details: errorText },
        { status: response.status },
      )
    }

    const data = await response.json()
    return NextResponse.json({ reviews: data.data || [] })
  } catch (error) {
    console.error("Errore nella richiesta a Tripadvisor:", error)
    return NextResponse.json({ error: "Errore nel recupero delle recensioni", details: String(error) }, { status: 500 })
  }
}
