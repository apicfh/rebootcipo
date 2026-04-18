"use client"

import { useState } from "react"
import { ChevronDown } from "lucide-react"

interface Hotel {
  id: string
  nome: string
}

interface MobileHotelSelectorProps {
  hotels: Hotel[]
  selectedHotel: string
  onSelectHotel: (hotelId: string) => void
}

export function MobileHotelSelector({ hotels, selectedHotel, onSelectHotel }: MobileHotelSelectorProps) {
  const [isOpen, setIsOpen] = useState(false)

  const toggleDropdown = () => setIsOpen(!isOpen)

  const handleSelect = (hotelId: string) => {
    onSelectHotel(hotelId)
    setIsOpen(false)
  }

  const selectedHotelName = hotels.find((h) => h.id === selectedHotel)?.nome || "Seleziona hotel"

  return (
    <div className="relative">
      <button
        type="button"
        className="flex items-center justify-between w-full px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
        onClick={toggleDropdown}
      >
        <span>{selectedHotelName}</span>
        <ChevronDown className="w-4 h-4 ml-2" />
      </button>

      {isOpen && (
        <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-md shadow-lg max-h-60 overflow-auto">
          <ul className="py-1">
            {hotels.map((hotel) => (
              <li
                key={hotel.id}
                className={`px-4 py-2 text-sm cursor-pointer hover:bg-gray-100 ${
                  selectedHotel === hotel.id ? "bg-blue-50 text-blue-700" : ""
                }`}
                onClick={() => handleSelect(hotel.id)}
              >
                {hotel.nome}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  )
}
