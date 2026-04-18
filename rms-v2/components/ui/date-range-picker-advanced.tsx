"use client"

import * as React from "react"
import { addDays, format, startOfMonth, endOfMonth, startOfYear, endOfYear } from "date-fns"
import { it } from "date-fns/locale"
import { CalendarIcon, ChevronDown } from "lucide-react"
import type { DateRange } from "react-day-picker"

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Calendar } from "@/components/ui/calendar"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"

interface DateRangePickerAdvancedProps {
  value?: DateRange
  onChange?: (range: DateRange | undefined) => void
  placeholder?: string
  className?: string
  disabled?: boolean
}

export function DateRangePickerAdvanced({
  value,
  onChange,
  placeholder = "Seleziona periodo",
  className,
  disabled = false,
}: DateRangePickerAdvancedProps) {
  const [date, setDate] = React.useState<DateRange | undefined>(value)
  const [isOpen, setIsOpen] = React.useState(false)

  React.useEffect(() => {
    setDate(value)
  }, [value])

  const handleDateChange = (newDate: DateRange | undefined) => {
    setDate(newDate)
    onChange?.(newDate)
  }

  const handlePresetSelect = (preset: string) => {
    const today = new Date()
    let newRange: DateRange | undefined

    switch (preset) {
      case "today":
        newRange = { from: today, to: today }
        break
      case "yesterday":
        const yesterday = addDays(today, -1)
        newRange = { from: yesterday, to: yesterday }
        break
      case "last7days":
        newRange = { from: addDays(today, -7), to: today }
        break
      case "last30days":
        newRange = { from: addDays(today, -30), to: today }
        break
      case "thisMonth":
        newRange = { from: startOfMonth(today), to: endOfMonth(today) }
        break
      case "lastMonth":
        const lastMonth = addDays(startOfMonth(today), -1)
        newRange = { from: startOfMonth(lastMonth), to: endOfMonth(lastMonth) }
        break
      case "thisYear":
        newRange = { from: startOfYear(today), to: endOfYear(today) }
        break
      case "lastYear":
        const lastYear = new Date(today.getFullYear() - 1, 0, 1)
        newRange = { from: startOfYear(lastYear), to: endOfYear(lastYear) }
        break
      default:
        newRange = undefined
    }

    handleDateChange(newRange)
    setIsOpen(false)
  }

  const formatDateRange = (range: DateRange | undefined) => {
    if (!range?.from) return placeholder

    if (!range.to) {
      return format(range.from, "dd MMM yyyy", { locale: it })
    }

    if (range.from.getTime() === range.to.getTime()) {
      return format(range.from, "dd MMM yyyy", { locale: it })
    }

    return `${format(range.from, "dd MMM", { locale: it })} - ${format(range.to, "dd MMM yyyy", { locale: it })}`
  }

  return (
    <div className={cn("grid gap-2", className)}>
      <Popover open={isOpen} onOpenChange={setIsOpen}>
        <PopoverTrigger asChild>
          <Button
            id="date"
            variant="outline"
            className={cn("w-full justify-start text-left font-normal", !date && "text-muted-foreground")}
            disabled={disabled}
          >
            <CalendarIcon className="mr-2 h-4 w-4" />
            {formatDateRange(date)}
            <ChevronDown className="ml-auto h-4 w-4 opacity-50" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-auto p-0" align="start">
          <div className="flex">
            {/* Preset rapidi */}
            <div className="border-r p-3 space-y-1">
              <div className="text-sm font-medium mb-2">Periodi rapidi</div>
              <div className="space-y-1">
                <Button
                  variant="ghost"
                  size="sm"
                  className="w-full justify-start text-xs"
                  onClick={() => handlePresetSelect("today")}
                >
                  Oggi
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  className="w-full justify-start text-xs"
                  onClick={() => handlePresetSelect("yesterday")}
                >
                  Ieri
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  className="w-full justify-start text-xs"
                  onClick={() => handlePresetSelect("last7days")}
                >
                  Ultimi 7 giorni
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  className="w-full justify-start text-xs"
                  onClick={() => handlePresetSelect("last30days")}
                >
                  Ultimi 30 giorni
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  className="w-full justify-start text-xs"
                  onClick={() => handlePresetSelect("thisMonth")}
                >
                  Questo mese
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  className="w-full justify-start text-xs"
                  onClick={() => handlePresetSelect("lastMonth")}
                >
                  Mese scorso
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  className="w-full justify-start text-xs"
                  onClick={() => handlePresetSelect("thisYear")}
                >
                  Quest'anno
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  className="w-full justify-start text-xs"
                  onClick={() => handlePresetSelect("lastYear")}
                >
                  Anno scorso
                </Button>
              </div>
            </div>

            {/* Calendario */}
            <div className="p-3">
              <Calendar
                initialFocus
                mode="range"
                defaultMonth={date?.from}
                selected={date}
                onSelect={handleDateChange}
                numberOfMonths={2}
                locale={it}
              />
            </div>
          </div>

          {/* Azioni */}
          <div className="border-t p-3 flex justify-between">
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                handleDateChange(undefined)
                setIsOpen(false)
              }}
            >
              Cancella
            </Button>
            <Button size="sm" onClick={() => setIsOpen(false)} disabled={!date?.from}>
              Applica
            </Button>
          </div>
        </PopoverContent>
      </Popover>
    </div>
  )
}
