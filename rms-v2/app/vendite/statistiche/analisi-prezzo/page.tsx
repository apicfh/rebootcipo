"use client"

import { AnalisiPrezzoContentV3 } from "../analisi/components/analisi-prezzo-content-v3"

export default function AnalisiPrezzoPage() {
  return (
    <div className="container py-6">
      <div className="mb-8">
        <h1 className="text-3xl font-bold tracking-tight text-primary">Analisi Prezzo</h1>
        <p className="text-muted-foreground mt-2">
          Andamento e confronti prezzi per nel tempo in funzione delle prenotazioni
        </p>
      </div>

      <AnalisiPrezzoContentV3 />
    </div>
  )
}
