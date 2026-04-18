"use client"

import { useState, useEffect } from "react"

export function useMobile() {
  const [isMobile, setIsMobile] = useState(false)

  useEffect(() => {
    // Funzione per verificare se il dispositivo è mobile
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768)
    }

    // Esegui il controllo iniziale
    checkMobile()

    // Aggiungi un listener per il ridimensionamento della finestra
    window.addEventListener("resize", checkMobile)

    // Rimuovi il listener quando il componente viene smontato
    return () => {
      window.removeEventListener("resize", checkMobile)
    }
  }, [])

  return isMobile
}
