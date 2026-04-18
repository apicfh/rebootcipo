"use client"

import * as React from "react"
import { format, addMonths, subMonths, getDaysInMonth, startOfMonth, getDay } from "date-fns"
import { it } from "date-fns/locale"
import { CalendarIcon, ChevronLeft, ChevronRight } from "lucide-react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"

export interface SimpleDatePickerProps {
  date: Date | undefined
  setDate: (date: Date | undefined) => void
  className?: string
  placeholder?: string
  disabled?: boolean
}

export function SimpleDatePicker({
  date,
  setDate,
  className,
  placeholder = "Seleziona data",
  disabled = false,
}: SimpleDatePickerProps) {
  const [currentMonth, setCurrentMonth] = React.useState<Date>(date || new Date())
  const [open, setOpen] = React.useState(false)

  // Funzioni per la navigazione del calendario
  const goToPreviousMonth = () => setCurrentMonth(subMonths(currentMonth, 1))
  const goToNextMonth = () => setCurrentMonth(addMonths(currentMonth, 1))

  // Genera la griglia del calendario
  const renderCalendarGrid = () => {
    const daysInMonth = getDaysInMonth(currentMonth)
    const firstDayOfMonth = startOfMonth(currentMonth)
    const startingDayIndex = getDay(firstDayOfMonth) || 7 // 0 = domenica, 1-6 = lunedì-sabato, converto 0 a 7

    const days = []

    // Intestazioni dei giorni della settimana
    const weekDays = ["lun", "mar", "mer", "gio", "ven", "sab", "dom"]

    // Aggiungi le intestazioni dei giorni
    const headerRow = (
      <div className="grid grid-cols-7 text-center text-xs mb-1" key="header">
        {weekDays.map((day, index) => (
          <div key={`header-${index}`} className="py-1">
            {day}
          </div>
        ))}
      </div>
    )

    days.push(headerRow)

    // Crea le righe per i giorni
    let dayCounter = 1
    const rows = []
    let cells = []

    // Aggiungi celle vuote per i giorni prima dell'inizio del mese
    for (let i = 1; i < startingDayIndex; i++) {
      cells.push(<div key={`empty-${i}`} className="h-8 w-8 flex items-center justify-center"></div>)
    }

    // Aggiungi i giorni del mese
    while (dayCounter <= daysInMonth) {
      const currentDate = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), dayCounter)
      const isSelected =
        date &&
        date.getDate() === dayCounter &&
        date.getMonth() === currentMonth.getMonth() &&
        date.getFullYear() === currentMonth.getFullYear()

      cells.push(
        <div
          key={`day-${dayCounter}`}
          className={cn(
            "h-8 w-8 flex items-center justify-center text-sm cursor-pointer hover:bg-gray-100",
            isSelected && "bg-blue-500 text-white hover:bg-blue-600",
          )}
          onClick={() => {
            setDate(currentDate)
            setOpen(false)
          }}
        >
          {dayCounter}
        </div>,
      )

      // Se abbiamo 7 celle o è l'ultimo giorno, aggiungi la riga
      if (cells.length === 7 || dayCounter === daysInMonth) {
        rows.push(
          <div className="grid grid-cols-7 gap-0" key={`row-${rows.length}`}>
            {cells}
          </div>,
        )
        cells = []
      }

      dayCounter++
    }

    days.push(...rows)
    return days
  }

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant={"outline"}
          className={cn("w-full justify-start text-left font-normal", !date && "text-muted-foreground", className)}
          disabled={disabled}
        >
          <CalendarIcon className="mr-2 h-4 w-4" />
          {date ? format(date, "dd MMM yyyy", { locale: it }) : <span>{placeholder}</span>}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-0" align="start">
        <div className="p-3">
          <div className="flex items-center justify-between mb-2">
            <div className="text-center font-medium">{format(currentMonth, "MMMM yyyy", { locale: it })}</div>
            <div className="flex space-x-1">
              <Button variant="outline" size="icon" className="h-7 w-7 p-0" onClick={goToPreviousMonth}>
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <Button variant="outline" size="icon" className="h-7 w-7 p-0" onClick={goToNextMonth}>
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
          <div className="space-y-1">{renderCalendarGrid()}</div>
        </div>
      </PopoverContent>
    </Popover>
  )
}
