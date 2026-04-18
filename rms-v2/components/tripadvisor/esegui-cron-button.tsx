"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Clock, Loader2, CheckCircle, AlertCircle } from "lucide-react"
import { useToast } from "@/components/ui/use-toast"

interface EseguiCronButtonProps {
  className?: string
}

export function EseguiCronButton({ className }: EseguiCronButtonProps) {
  const [isLoading, setIsLoading] = useState(false)
  const [isSuccess, setIsSuccess] = useState(false)
  const [isError, setIsError] = useState(false)
  const { toast } = useToast()

  const eseguiCronJob = async () => {
    setIsLoading(true)
    setIsSuccess(false)
    setIsError(false)

    try {
      const response = await fetch("/api/cron/sincronizza-recensioni", {
        method: "GET",
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || "Errore durante l'esecuzione del cron job")
      }

      const data = await response.json()
      setIsSuccess(true)

      toast({
        title: "Sincronizzazione completata",
        description: `Processati ${data.hotels_processed} hotel, importate ${data.reviews_imported} recensioni`,
        variant: "default",
      })
    } catch (error) {
      console.error("Errore durante l'esecuzione del cron job:", error)
      setIsError(true)
      toast({
        title: "Errore",
        description: error instanceof Error ? error.message : "Errore durante l'esecuzione del cron job",
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
      onClick={eseguiCronJob}
      disabled={isLoading}
      variant={isSuccess ? "outline" : isError ? "destructive" : "secondary"}
      className={`flex items-center gap-2 ${className}`}
    >
      {isLoading ? (
        <>
          <Loader2 className="h-4 w-4 animate-spin" />
          <span>Sincronizzazione in corso...</span>
        </>
      ) : isSuccess ? (
        <>
          <CheckCircle className="h-4 w-4" />
          <span>Sincronizzazione completata</span>
        </>
      ) : isError ? (
        <>
          <AlertCircle className="h-4 w-4" />
          <span>Errore di sincronizzazione</span>
        </>
      ) : (
        <>
          <Clock className="h-4 w-4" />
          <span>Esegui sincronizzazione programmata</span>
        </>
      )}
    </Button>
  )
}
