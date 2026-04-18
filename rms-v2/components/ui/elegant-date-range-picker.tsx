"use client"

import * as React from "react"
import { format } from "date-fns"
import { it } from "date-fns/locale"
import { CalendarIcon, ChevronLeft, ChevronRight } from "lucide-react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Calendar } from "@/components/ui/calendar"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import type { DateRange } from "react-day-picker"

interface ElegantDateRangePickerProps {
  date?: DateRange
  setDate: (date: DateRange | undefined) => void
  className?: string
}

export function ElegantDateRangePicker({ date, setDate, className }: ElegantDateRangePickerProps) {
  const [isStartOpen, setIsStartOpen] = React.useState(false)
  const [isEndOpen, setIsEndOpen] = React.useState(false)

  const handleStartDateSelect = (selectedDate: Date | undefined) => {
    if (selectedDate) {
      setDate({
        from: selectedDate,
        to: date?.to,
      })
      setIsStartOpen(false)
      // Apri automaticamente il picker della data fine se non è già selezionata
      if (!date?.to) {
        setTimeout(() => setIsEndOpen(true), 100)
      }
    }
  }

  const handleEndDateSelect = (selectedDate: Date | undefined) => {
    if (selectedDate) {
      setDate({
        from: date?.from,
        to: selectedDate,
      })
      setIsEndOpen(false)
    }
  }

  return (
    <div className={cn("grid grid-cols-1 md:grid-cols-2 gap-4", className)}>
      {/* Data Inizio */}
      <div className="space-y-2">
        <label className="text-sm font-medium text-gray-700">Data inizio</label>
        <Popover open={isStartOpen} onOpenChange={setIsStartOpen}>
          <PopoverTrigger asChild>
            <Button
              variant="outline"
              className={cn("w-full justify-start text-left font-normal h-11", !date?.from && "text-muted-foreground")}
            >
              <CalendarIcon className="mr-3 h-4 w-4 text-gray-500" />
              {date?.from ? format(date.from, "dd MMM yyyy", { locale: it }) : <span>Seleziona data</span>}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0" align="start">
            <div className="p-3">
              <Calendar
                mode="single"
                selected={date?.from}
                onSelect={handleStartDateSelect}
                disabled={(date) => date > new Date() || date < new Date("1900-01-01")}
                initialFocus
                locale={it}
                className="rounded-md"
                classNames={{
                  months: "flex flex-col sm:flex-row space-y-4 sm:space-x-4 sm:space-y-0",
                  month: "space-y-4",
                  caption: "flex justify-center pt-1 relative items-center",
                  caption_label: "text-sm font-medium",
                  nav: "space-x-1 flex items-center",
                  nav_button: cn(
                    "inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors",
                    "hover:bg-accent hover:text-accent-foreground h-7 w-7 bg-transparent p-0 opacity-50 hover:opacity-100",
                  ),
                  nav_button_previous: "absolute left-1",
                  nav_button_next: "absolute right-1",
                  table: "w-full border-collapse space-y-1",
                  head_row: "flex",
                  head_cell: "text-muted-foreground rounded-md w-8 font-normal text-[0.8rem]",
                  row: "flex w-full mt-2",
                  cell: cn(
                    "relative p-0 text-center text-sm focus-within:relative focus-within:z-20 [&:has([aria-selected])]:bg-accent",
                    "first:[&:has([aria-selected])]:rounded-l-md last:[&:has([aria-selected])]:rounded-r-md",
                  ),
                  day: cn(
                    "inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors",
                    "hover:bg-accent hover:text-accent-foreground h-8 w-8 p-0 font-normal aria-selected:opacity-100",
                  ),
                  day_selected:
                    "bg-primary text-primary-foreground hover:bg-primary hover:text-primary-foreground focus:bg-primary focus:text-primary-foreground",
                  day_today: "bg-accent text-accent-foreground",
                  day_outside: "text-muted-foreground opacity-50",
                  day_disabled: "text-muted-foreground opacity-50",
                  day_range_middle: "aria-selected:bg-accent aria-selected:text-accent-foreground",
                  day_hidden: "invisible",
                }}
                components={{
                  IconLeft: ({ ...props }) => <ChevronLeft className="h-4 w-4" />,
                  IconRight: ({ ...props }) => <ChevronRight className="h-4 w-4" />,
                }}
              />
              {date?.from && date?.to && (
                <div className="mt-3 pt-3 border-t">
                  <p className="text-sm text-orange-600 font-medium">Periodo selezionato</p>
                  <p className="text-xs text-gray-600 mt-1">
                    {format(date.from, "dd MMM yyyy", { locale: it })} -{" "}
                    {format(date.to, "dd MMM yyyy", { locale: it })}
                  </p>
                </div>
              )}
            </div>
          </PopoverContent>
        </Popover>
      </div>

      {/* Data Fine */}
      <div className="space-y-2">
        <label className="text-sm font-medium text-gray-700">Data fine</label>
        <Popover open={isEndOpen} onOpenChange={setIsEndOpen}>
          <PopoverTrigger asChild>
            <Button
              variant="outline"
              className={cn("w-full justify-start text-left font-normal h-11", !date?.to && "text-muted-foreground")}
            >
              <CalendarIcon className="mr-3 h-4 w-4 text-gray-500" />
              {date?.to ? format(date.to, "dd MMM yyyy", { locale: it }) : <span>Seleziona data</span>}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0" align="start">
            <div className="p-3">
              <Calendar
                mode="single"
                selected={date?.to}
                onSelect={handleEndDateSelect}
                disabled={(date) =>
                  date > new Date() || date < new Date("1900-01-01") || (date?.from ? date < date.from : false)
                }
                initialFocus
                locale={it}
                className="rounded-md"
                classNames={{
                  months: "flex flex-col sm:flex-row space-y-4 sm:space-x-4 sm:space-y-0",
                  month: "space-y-4",
                  caption: "flex justify-center pt-1 relative items-center",
                  caption_label: "text-sm font-medium",
                  nav: "space-x-1 flex items-center",
                  nav_button: cn(
                    "inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors",
                    "hover:bg-accent hover:text-accent-foreground h-7 w-7 bg-transparent p-0 opacity-50 hover:opacity-100",
                  ),
                  nav_button_previous: "absolute left-1",
                  nav_button_next: "absolute right-1",
                  table: "w-full border-collapse space-y-1",
                  head_row: "flex",
                  head_cell: "text-muted-foreground rounded-md w-8 font-normal text-[0.8rem]",
                  row: "flex w-full mt-2",
                  cell: cn(
                    "relative p-0 text-center text-sm focus-within:relative focus-within:z-20 [&:has([aria-selected])]:bg-accent",
                    "first:[&:has([aria-selected])]:rounded-l-md last:[&:has([aria-selected])]:rounded-r-md",
                  ),
                  day: cn(
                    "inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors",
                    "hover:bg-accent hover:text-accent-foreground h-8 w-8 p-0 font-normal aria-selected:opacity-100",
                  ),
                  day_selected:
                    "bg-primary text-primary-foreground hover:bg-primary hover:text-primary-foreground focus:bg-primary focus:text-primary-foreground",
                  day_today: "bg-accent text-accent-foreground",
                  day_outside: "text-muted-foreground opacity-50",
                  day_disabled: "text-muted-foreground opacity-50",
                  day_range_middle: "aria-selected:bg-accent aria-selected:text-accent-foreground",
                  day_hidden: "invisible",
                }}
                components={{
                  IconLeft: ({ ...props }) => <ChevronLeft className="h-4 w-4" />,
                  IconRight: ({ ...props }) => <ChevronRight className="h-4 w-4" />,
                }}
              />
              {date?.from && date?.to && (
                <div className="mt-3 pt-3 border-t">
                  <p className="text-sm text-orange-600 font-medium">Periodo selezionato</p>
                  <p className="text-xs text-gray-600 mt-1">
                    {format(date.from, "dd MMM yyyy", { locale: it })} -{" "}
                    {format(date.to, "dd MMM yyyy", { locale: it })}
                  </p>
                </div>
              )}
            </div>
          </PopoverContent>
        </Popover>
      </div>
    </div>
  )
}
