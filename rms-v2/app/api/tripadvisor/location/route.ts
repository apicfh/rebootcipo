import { type NextRequest, NextResponse } from "next/server"

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams
  const locationId = searchParams.get("locationId")

  if (!locationId) {
    return NextResponse.json({ error: "Parametro locationId mancante" }, { status: 400 })
  }

  try {
    // Verifica che locationId sia un numero valido
    if (isNaN(Number(locationId))) {
      return NextResponse.json({ error: "locationId deve essere un numero valido" }, { status: 400 })
    }

    const apiKey = process.env.TRIPADVISOR_API_KEY

    if (!apiKey) {
      return NextResponse.json({ error: "API key di Tripadvisor non configurata" }, { status: 500 })
    }

    // Aggiungiamo il parametro include=ranking_data per ottenere i dati di ranking
    const url = `https://api.content.tripadvisor.com/api/v1/location/${locationId}/details?key=${apiKey}&language=it&include=ranking_data`

    const response = await fetch(url, {
      headers: {
        Accept: "application/json",
      },
    })

    if (!response.ok) {
      const errorText = await response.text()
      console.error(`Errore API Tripadvisor (${response.status}):`, errorText)
      return NextResponse.json({ error: `Errore API Tripadvisor: ${response.status}` }, { status: response.status })
    }

    const data = await response.json()
    return NextResponse.json(data)
  } catch (error) {
    console.error("Errore nel recupero dei dettagli della location:", error)
    return NextResponse.json({ error: "Errore nel recupero dei dettagli della location" }, { status: 500 })
  }
}
