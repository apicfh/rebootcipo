// DEPRECATO: Questo componente è stato sostituito da importa-recensioni-v3.tsx
// Mantenuto solo per riferimento storico

"use client"
import { Button } from "@/components/ui/button"
import { AlertCircle } from "lucide-react"
import { useToast } from "@/components/ui/use-toast"

// DEPRECATO: Utilizzare ImportaRecensioniV3 al posto di questo componente
// @deprecated
export function ImportaRecensioniButton({ hotelId, onSuccess, disabled = false }: any) {
  const { toast } = useToast()

  const importaRecensioni = async () => {
    toast({
      title: "Componente deprecato",
      description: "Questo componente è stato sostituito da ImportaRecensioniV3. Aggiorna il tuo codice.",
      variant: "destructive",
    })
  }

  return (
    <Button onClick={importaRecensioni} disabled={true} variant="destructive" className="flex items-center gap-2">
      <AlertCircle className="h-4 w-4" />
      <span>Componente deprecato</span>
    </Button>
  )
}
