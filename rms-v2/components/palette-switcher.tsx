"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"

interface PaletteSwitcherProps {
  className?: string
}

export function PaletteSwitcher({ className }: PaletteSwitcherProps) {
  // Array delle palette disponibili
  const palettes = [
    { id: "palette-1", name: "Minimal" },
    { id: "palette-2", name: "Rosso" },
    { id: "palette-3", name: "Viola" },
    { id: "palette-4", name: "Blu" },
  ]

  const [activePalette, setActivePalette] = useState<string>(() => {
    if (typeof window !== "undefined") {
      return localStorage.getItem("cfh-palette") || "palette-4"
    }
    return "palette-4"
  })

  // Trova l'indice della palette attiva
  const activeIndex = palettes.findIndex((p) => p.id === activePalette)

  useEffect(() => {
    if (typeof window !== "undefined") {
      // Rimuovi tutte le classi palette esistenti
      document.body.classList.remove(...palettes.map((p) => p.id))
      // Aggiungi la classe della palette attiva
      document.body.classList.add(activePalette)
      // Salva la preferenza nel localStorage
      localStorage.setItem("cfh-palette", activePalette)
    }
  }, [activePalette])

  // Funzione per cambiare ciclicamente la palette
  const cyclePalette = () => {
    const nextIndex = (activeIndex + 1) % palettes.length
    setActivePalette(palettes[nextIndex].id)
  }

  return (
    <Button onClick={cyclePalette} className={`${className} transition-all duration-300`} variant="outline">
      Tema: {palettes[activeIndex].name}
    </Button>
  )
}
