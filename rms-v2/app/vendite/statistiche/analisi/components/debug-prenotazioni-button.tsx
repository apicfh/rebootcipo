"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { debugPrenotazioniAnalisiPrezzo, type DebugStep } from "@/lib/services/analisi-prezzo-debug-service"
import type { FiltroSelezionato } from "@/lib/services/analisi-prezzo-service"

interface Props {
  filtroSelezionato: FiltroSelezionato | null
}

export function DebugPrenotazioniButton({ filtroSelezionato }: Props) {
  const [debugResults, setDebugResults] = useState<DebugStep[]>([])
  const [loading, setLoading] = useState(false)

  const handleDebug = async () => {
    if (!filtroSelezionato) return

    setLoading(true)
    try {
      const results = await debugPrenotazioniAnalisiPrezzo(
        filtroSelezionato.hotel_id,
        filtroSelezionato.camera_id,
        filtroSelezionato.settimana_id,
        filtroSelezionato.stagione,
      )
      setDebugResults(results)
    } catch (error) {
      console.error("Errore debug:", error)
    } finally {
      setLoading(false)
    }
  }

  if (!filtroSelezionato) {
    return (
      <Card>
        <CardContent className="pt-6">
          <p className="text-muted-foreground">Seleziona un filtro per eseguire il debug</p>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle>Debug Prenotazioni</CardTitle>
          <CardDescription>
            Analizza step-by-step il filtraggio delle prenotazioni per: {filtroSelezionato.nome_display}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Button onClick={handleDebug} disabled={loading}>
            {loading ? "Analizzando..." : "Esegui Debug"}
          </Button>
        </CardContent>
      </Card>

      {debugResults.length > 0 && (
        <div className="space-y-4">
          {debugResults.map((step, index) => (
            <Card key={index}>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="text-lg">{step.step_name}</CardTitle>
                  <Badge variant={step.count_result > 0 ? "default" : "secondary"}>{step.count_result} risultati</Badge>
                </div>
              </CardHeader>
              <CardContent>
                {step.sample_data && (
                  <div className="bg-muted p-4 rounded-lg">
                    <pre className="text-sm overflow-auto max-h-40">{JSON.stringify(step.sample_data, null, 2)}</pre>
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
