"use client"

import * as React from "react"
import { format, addMonths, subMonths } from "date-fns"
import { it } from "date-fns/locale"
import { CalendarIcon, ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight } from "lucide-react"
import { DayPicker } from "react-day-picker"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"

export interface StyledDatePickerProps {
  date: Date | undefined
  setDate: (date: Date | undefined) => void
  className?: string
  placeholder?: string
  disabled?: boolean
}

export function StyledDatePicker({
  date,
  setDate,
  className,
  placeholder = "Seleziona data",
  disabled = false,
}: StyledDatePickerProps) {
  const [month, setMonth] = React.useState<Date>(date || new Date())

  // Funzioni per la navigazione del calendario
  const handlePreviousYear = () => setMonth(subMonths(month, 12))
  const handlePreviousMonth = () => setMonth(subMonths(month, 1))
  const handleNextMonth = () => setMonth(addMonths(month, 1))
  const handleNextYear = () => setMonth(addMonths(month, 12))

  return (
    <Popover>
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
        <div className="styled-calendar">
          <div className="styled-calendar-header">
            <div className="styled-calendar-title">{format(month, "MMMM yyyy", { locale: it })}</div>
            <div className="styled-calendar-nav">
              <button onClick={handlePreviousYear} className="styled-calendar-nav-button">
                <ChevronsLeft className="h-4 w-4" />
              </button>
              <button onClick={handlePreviousMonth} className="styled-calendar-nav-button">
                <ChevronLeft className="h-4 w-4" />
              </button>
              <button onClick={handleNextMonth} className="styled-calendar-nav-button">
                <ChevronRight className="h-4 w-4" />
              </button>
              <button onClick={handleNextYear} className="styled-calendar-nav-button">
                <ChevronsRight className="h-4 w-4" />
              </button>
            </div>
          </div>
          <DayPicker
            mode="single"
            selected={date}
            onSelect={setDate}
            month={month}
            onMonthChange={setMonth}
            locale={it}
            weekStartsOn={1}
            showOutsideDays
            classNames={{
              months: "styled-calendar-months",
              month: "styled-calendar-month",
              caption: "styled-calendar-caption",
              caption_label: "styled-calendar-caption-label hidden",
              nav: "styled-calendar-nav hidden",
              nav_button: "styled-calendar-nav-button hidden",
              nav_button_previous: "styled-calendar-nav-button-prev hidden",
              nav_button_next: "styled-calendar-nav-button-next hidden",
              table: "styled-calendar-table",
              head: "styled-calendar-head",
              head_row: "styled-calendar-head-row",
              head_cell: "styled-calendar-head-cell",
              row: "styled-calendar-row",
              cell: "styled-calendar-cell",
              day: "styled-calendar-day",
              day_selected: "styled-calendar-day-selected",
              day_today: "styled-calendar-day-today",
              day_outside: "styled-calendar-day-outside",
              day_disabled: "styled-calendar-day-disabled",
              day_hidden: "styled-calendar-day-hidden",
            }}
          />
        </div>
      </PopoverContent>
    </Popover>
  )
}
