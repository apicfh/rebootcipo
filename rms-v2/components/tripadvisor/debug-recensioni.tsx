"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { supabase } from "@/lib/supabase/client"
import { Alert, AlertDescription } from "@/components/ui/alert"

export function DebugRecensioni() {
  const [conteggio, setConteggio] = useState<number | null>(null)
  const [errore, setErrore] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  // Funzione per verificare il conteggio delle recensioni
  const verificaConteggio = async () => {
    setLoading(true)
    setErrore(null)

    try {
      // Verifica il conteggio usando la funzione RPC
      const { data: countData, error: countError } = await supabase.rpc("count_recensioni_tripadvisor")

      if (countError) throw countError

      setConteggio(countData)
    } catch (err: any) {
      console.error("Errore nella verifica del conteggio:", err)
      setErrore(`Errore nella verifica del conteggio: ${err.message || "Errore sconosciuto"}`)
    } finally {
      setLoading(false)
    }
  }

  return (
    <Card className="mb-6">
      <CardHeader>
        <CardTitle>Debug Recensioni Tripadvisor</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex flex-col gap-4">
          <Button onClick={verificaConteggio} disabled={loading}>
            Verifica Conteggio Recensioni
          </Button>

          {loading && <p className="text-sm text-muted-foreground">Caricamento in corso...</p>}

          {errore && (
            <Alert variant="destructive">
              <AlertDescription>{errore}</AlertDescription>
            </Alert>
          )}

          {conteggio !== null && (
            <div className="p-4 border rounded-md">
              <p className="font-medium">Conteggio recensioni: {conteggio}</p>
              {conteggio === 0 && (
                <p className="text-sm text-muted-foreground mt-2">
                  Non ci sono recensioni nella tabella. Potrebbe essere necessario importarle nuovamente.
                </p>
              )}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  )
}
