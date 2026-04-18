"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import {
  debugPrenotazioniSettimaneLink,
  type DebugPrenotazioniSettimaneResult,
} from "@/lib/services/debug-prenotazioni-settimane-service"

interface DebugPrenotazioniSettimaneProps {
  hotelId: string
  cameraId: string
  settimanaId: string
}

export function DebugPrenotazioniSettimane({ hotelId, cameraId, settimanaId }: DebugPrenotazioniSettimaneProps) {
  const [results, setResults] = useState<DebugPrenotazioniSettimaneResult[]>([])
  const [loading, setLoading] = useState(false)

  const handleDebug = async () => {
    setLoading(true)
    try {
      const data = await debugPrenotazioniSettimaneLink(hotelId, cameraId, settimanaId)
      setResults(data)
    } catch (error) {
      console.error("Errore debug:", error)
    } finally {
      setLoading(false)
    }
  }

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle>Debug Prenotazioni-Settimane Link</CardTitle>
        <CardDescription>Verifica come sono collegati prenotazioni e settimane</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <Button onClick={handleDebug} disabled={loading}>
          {loading ? "Analizzando..." : "Esegui Debug"}
        </Button>

        {results.length > 0 && (
          <div className="space-y-4">
            {results.map((result, index) => (
              <Card key={index}>
                <CardHeader>
                  <CardTitle className="text-sm">{result.step_name}</CardTitle>
                  <CardDescription>Risultati trovati: {result.count_result}</CardDescription>
                </CardHeader>
                <CardContent>
                  <pre className="text-xs bg-gray-100 p-2 rounded overflow-auto max-h-40">
                    {JSON.stringify(result.sample_data, null, 2)}
                  </pre>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
