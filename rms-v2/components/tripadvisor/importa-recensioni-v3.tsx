"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Download, Check, AlertCircle, Loader2 } from "lucide-react"
import { useToast } from "@/components/ui/use-toast"

interface ImportaRecensioniV3Props {
  hotelId: string
  onSuccess?: (count?: number) => void
  disabled?: boolean
}

export function ImportaRecensioniV3({ hotelId, onSuccess, disabled = false }: ImportaRecensioniV3Props) {
  const [isLoading, setIsLoading] = useState(false)
  const [isSuccess, setIsSuccess] = useState(false)
  const [isError, setIsError] = useState(false)
  const { toast } = useToast()

  const importaRecensioni = async () => {
    if (!hotelId) {
      toast({
        title: "Errore",
        description: "ID hotel non specificato",
        variant: "destructive",
      })
      return
    }

    setIsLoading(true)
    setIsSuccess(false)
    setIsError(false)

    try {
      const response = await fetch(`/api/tripadvisor/importa-recensioni-hotel?hotel_id=${hotelId}`, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
        },
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || "Errore durante l'importazione delle recensioni")
      }

      const data = await response.json()

      setIsSuccess(true)

      // Messaggio diverso in base al numero di recensioni importate
      if (data.nuove_recensioni_importate > 0) {
        toast({
          title: "Importazione completata",
          description: `Importate ${data.nuove_recensioni_importate} nuove recensioni su ${data.totale_recensioni_fetchate} controllate`,
          variant: "default",
        })
      } else {
        toast({
          title: "Nessuna nuova recensione",
          description: `Controllate ${data.totale_recensioni_fetchate} recensioni, tutte già presenti nel database`,
          variant: "default",
        })
      }

      if (onSuccess && data.nuove_recensioni_importate > 0) {
        onSuccess(data.nuove_recensioni_importate)
      }
    } catch (error) {
      console.error("Errore durante l'importazione:", error)
      setIsError(true)
      toast({
        title: "Errore",
        description: error instanceof Error ? error.message : "Errore durante l'importazione delle recensioni",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
      // Reset success state after 3 seconds
      if (isSuccess) {
        setTimeout(() => setIsSuccess(false), 3000)
      }
    }
  }

  return (
    <Button
      onClick={importaRecensioni}
      disabled={isLoading || disabled}
      variant={isSuccess ? "outline" : isError ? "destructive" : "default"}
      className="flex items-center gap-2"
    >
      {isLoading ? (
        <>
          <Loader2 className="h-4 w-4 animate-spin" />
          <span>Importazione in corso...</span>
        </>
      ) : isSuccess ? (
        <>
          <Check className="h-4 w-4" />
          <span>Importazione completata</span>
        </>
      ) : isError ? (
        <>
          <AlertCircle className="h-4 w-4" />
          <span>Errore di importazione</span>
        </>
      ) : (
        <>
          <Download className="h-4 w-4" />
          <span>Importa recensioni</span>
        </>
      )}
    </Button>
  )
}
