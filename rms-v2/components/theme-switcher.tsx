"use client"

import * as React from "react"
import { Moon, Sun } from "lucide-react"
import { useTheme } from "next-themes"

import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
  DropdownMenuLabel,
} from "@/components/ui/dropdown-menu"

export function ThemeSwitcher() {
  const { setTheme, theme } = useTheme()
  const [activePalette, setActivePalette] = React.useState<string>(() => {
    if (typeof window !== "undefined") {
      return localStorage.getItem("cfh-palette") || "palette-4"
    }
    return "palette-4"
  })

  // Effetto per applicare la palette al body
  React.useEffect(() => {
    if (typeof window !== "undefined") {
      // Rimuovi tutte le classi palette esistenti
      document.body.classList.remove("palette-1", "palette-2", "palette-3", "palette-4")
      // Aggiungi la classe della palette attiva
      document.body.classList.add(activePalette)
      // Salva la preferenza nel localStorage
      localStorage.setItem("cfh-palette", activePalette)
    }
  }, [activePalette])

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" size="icon" className="border-2">
          <Sun className="h-[1.2rem] w-[1.2rem] rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
          <Moon className="absolute h-[1.2rem] w-[1.2rem] rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
          <span className="sr-only">Cambia tema</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuLabel>Tema</DropdownMenuLabel>
        <DropdownMenuItem onClick={() => setTheme("light")}>Chiaro</DropdownMenuItem>
        <DropdownMenuItem onClick={() => setTheme("dark")}>Scuro</DropdownMenuItem>
        <DropdownMenuItem onClick={() => setTheme("system")}>Sistema</DropdownMenuItem>

        <DropdownMenuSeparator />

        <DropdownMenuLabel>Palette colori</DropdownMenuLabel>
        <DropdownMenuItem onClick={() => setActivePalette("palette-1")} className="flex items-center gap-2">
          <div className="w-4 h-4 rounded-full bg-blue-600"></div>
          Classica
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => setActivePalette("palette-2")} className="flex items-center gap-2">
          <div className="w-4 h-4 rounded-full bg-purple-600"></div>
          Moderna
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => setActivePalette("palette-3")} className="flex items-center gap-2">
          <div className="w-4 h-4 rounded-full bg-green-500"></div>
          Vivace
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => setActivePalette("palette-4")} className="flex items-center gap-2">
          <div className="w-4 h-4 rounded-full bg-sky-500"></div>
          Mediterranea
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
