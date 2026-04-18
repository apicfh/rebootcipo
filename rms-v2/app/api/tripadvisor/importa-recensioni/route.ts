// DEPRECATO: Questo endpoint è stato sostituito da /api/import-tripadvisor-reviews
// Mantenuto solo per riferimento storico

import { NextResponse } from "next/server"

export async function POST(request: Request) {
  return NextResponse.json(
    {
      success: false,
      error: "Endpoint deprecato. Utilizzare /api/import-tripadvisor-reviews invece.",
    },
    { status: 410 },
  )
}

export async function GET(request: Request) {
  return NextResponse.json(
    {
      success: false,
      error: "Endpoint deprecato. Utilizzare /api/import-tripadvisor-reviews invece.",
    },
    { status: 410 },
  )
}
