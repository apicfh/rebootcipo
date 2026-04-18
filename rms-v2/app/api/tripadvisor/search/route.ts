import { type NextRequest, NextResponse } from "next/server"

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams
  const query = searchParams.get("query")

  if (!query) {
    return NextResponse.json({ error: "Parametro query mancante" }, { status: 400 })
  }

  try {
    const apiKey = process.env.TRIPADVISOR_API_KEY

    if (!apiKey) {
      return NextResponse.json({ error: "API key di Tripadvisor non configurata" }, { status: 500 })
    }

    const url = `https://api.content.tripadvisor.com/api/v1/location/search?key=${apiKey}&searchQuery=${encodeURIComponent(
      query,
    )}&language=it&category=hotels`

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
    return NextResponse.json(data.data || [])
  } catch (error) {
    console.error("Errore nella ricerca:", error)
    return NextResponse.json({ error: "Errore nella ricerca" }, { status: 500 })
  }
}
