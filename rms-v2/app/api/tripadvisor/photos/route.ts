import { NextResponse } from "next/server"
import { getTripadvisorPhotos } from "@/lib/services/tripadvisor-service"

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const locationId = searchParams.get("locationId")
  const limit = searchParams.get("limit") ? Number.parseInt(searchParams.get("limit")!) : 10

  if (!locationId) {
    return NextResponse.json({ error: "Parametro locationId mancante" }, { status: 400 })
  }

  try {
    const photos = await getTripadvisorPhotos(locationId, { limit })
    return NextResponse.json({ photos })
  } catch (error: any) {
    console.error("Errore nel recupero delle foto:", error)
    return NextResponse.json({ error: error.message || "Errore nel recupero delle foto" }, { status: 500 })
  }
}
