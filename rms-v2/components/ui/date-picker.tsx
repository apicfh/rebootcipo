"use client"

import { useState } from "react"
import { format } from "date-fns"
import { it } from "date-fns/locale"
import { CalendarIcon } from "lucide-react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { CustomCalendar } from "@/components/ui/custom-calendar"

interface DatePickerProps {
  date: Date | undefined
  setDate: (date: Date | undefined) => void
  className?: string
  placeholder?: string
  minDate?: Date
  maxDate?: Date
}

export function DatePicker({
  date,
  setDate,
  className,
  placeholder = "Seleziona una data",
  minDate,
  maxDate,
}: DatePickerProps) {
  const [open, setOpen] = useState(false)

  const handleSelect = (selectedDate: Date) => {
    setDate(selectedDate)
    setOpen(false)
  }

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant={"outline"}
          className={cn(
            "w-full justify-start text-left font-normal border hover:bg-accent hover:text-accent-foreground",
            !date && "text-muted-foreground",
            className,
          )}
        >
          <CalendarIcon className="mr-2 h-4 w-4" />
          {date ? format(date, "yyyy-MM-dd", { locale: it }) : <span>{placeholder}</span>}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-0" align="start">
        <CustomCalendar date={date || new Date()} onDateChange={handleSelect} minDate={minDate} maxDate={maxDate} />
      </PopoverContent>
    </Popover>
  )
}
