"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"

export default function PrezziPage() {
  const router = useRouter()

  useEffect(() => {
    // Reindirizzamento aggiornato alla nuova URL
    router.push("/prezzi/strategiaprezzi")
  }, [router])

  // Rendering di un componente vuoto o di un loader mentre avviene il reindirizzamento
  return (
    <div className="container mx-auto py-6 flex items-center justify-center h-[50vh]">
      <div className="text-center">
        <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-primary border-r-transparent align-[-0.125em] motion-reduce:animate-[spin_1.5s_linear_infinite]"></div>
        <p className="mt-4 text-muted-foreground">Reindirizzamento a Strategia Prezzi...</p>
      </div>
    </div>
  )
}
