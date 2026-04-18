"use client"

import { useState, useEffect } from "react"
import { Check, ChevronsUpDown } from "lucide-react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Badge } from "@/components/ui/badge"
import { getHotelDisponibili } from "@/lib/services/recensioni-tripadvisor-service"

interface HotelSelectorProps {
  selectedHotels: string[]
  onChange: (selectedHotels: string[]) => void
  className?: string
}

export function HotelSelector({ selectedHotels, onChange, className }: HotelSelectorProps) {
  const [open, setOpen] = useState(false)
  const [hotels, setHotels] = useState<{ id: string; nome: string }[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function loadHotels() {
      try {
        const hotelList = await getHotelDisponibili()
        setHotels(hotelList)
      } catch (error) {
        console.error("Errore nel caricamento degli hotel:", error)
      } finally {
        setLoading(false)
      }
    }

    loadHotels()
  }, [])

  const toggleHotel = (hotelId: string) => {
    if (selectedHotels.includes(hotelId)) {
      onChange(selectedHotels.filter((id) => id !== hotelId))
    } else {
      onChange([...selectedHotels, hotelId])
    }
  }

  const getSelectedHotelNames = () => {
    return selectedHotels.map((id) => hotels.find((hotel) => hotel.id === id)?.nome).filter(Boolean) as string[]
  }

  const removeHotel = (hotelId: string) => {
    onChange(selectedHotels.filter((id) => id !== hotelId))
  }

  return (
    <div className={cn("space-y-2", className)}>
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            role="combobox"
            aria-expanded={open}
            className="w-full justify-between"
            disabled={loading}
          >
            {selectedHotels.length > 0 ? `${selectedHotels.length} hotel selezionati` : "Seleziona hotel..."}
            <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-full p-0">
          <Command>
            <CommandInput placeholder="Cerca hotel..." />
            <CommandList>
              <CommandEmpty>Nessun hotel trovato.</CommandEmpty>
              <CommandGroup className="max-h-64 overflow-auto">
                {hotels.map((hotel) => (
                  <CommandItem
                    key={hotel.id}
                    value={hotel.nome}
                    onSelect={() => {
                      toggleHotel(hotel.id)
                      setOpen(true) // Mantieni aperto il popover
                    }}
                  >
                    <Check
                      className={cn("mr-2 h-4 w-4", selectedHotels.includes(hotel.id) ? "opacity-100" : "opacity-0")}
                    />
                    {hotel.nome}
                  </CommandItem>
                ))}
              </CommandGroup>
            </CommandList>
          </Command>
        </PopoverContent>
      </Popover>

      {selectedHotels.length > 0 && (
        <div className="flex flex-wrap gap-2 mt-2">
          {getSelectedHotelNames().map((name, index) => (
            <Badge key={index} variant="secondary" className="px-2 py-1">
              {name}
              <button
                className="ml-2 text-muted-foreground hover:text-foreground"
                onClick={() => removeHotel(selectedHotels[index])}
              >
                ×
              </button>
            </Badge>
          ))}
        </div>
      )}
    </div>
  )
}
