"use client"

import { useState, useEffect } from "react"
import { format } from "date-fns"
import { it } from "date-fns/locale"
import { CalendarIcon } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Calendar } from "@/components/ui/calendar"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { cn } from "@/lib/utils"

interface DateSelectorProps {
  onDateChange: (date: string) => void
}

export function DateSelector({ onDateChange }: DateSelectorProps) {
  const [date, setDate] = useState<Date | undefined>(new Date())

  useEffect(() => {
    if (date) {
      onDateChange(format(date, "yyyy-MM-dd"))
    }
  }, [date, onDateChange])

  return (
    <div className="flex items-center space-x-2">
      <Popover>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            className={cn("w-[240px] justify-start text-left font-normal", !date && "text-muted-foreground")}
          >
            <CalendarIcon className="mr-2 h-4 w-4" />
            {date ? format(date, "PPP", { locale: it }) : <span>Seleziona una data</span>}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-auto p-0" align="start">
          <Calendar mode="single" selected={date} onSelect={setDate} initialFocus locale={it} />
        </PopoverContent>
      </Popover>
    </div>
  )
}
