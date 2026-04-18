"use client"
import { format } from "date-fns"
import { it } from "date-fns/locale"
import { CalendarIcon, ChevronLeft, ChevronRight } from "lucide-react"
import { useState } from "react"

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import {
  addMonths,
  subMonths,
  startOfMonth,
  endOfMonth,
  eachDayOfInterval,
  startOfWeek,
  endOfWeek,
  isSameMonth,
  isSameDay,
  isWithinInterval,
  format as formatDate,
} from "date-fns"

interface DateRange {
  from: Date | undefined
  to: Date | undefined
}

interface CompactDateRangePickerProps {
  dateRange: DateRange
  setDateRange: (range: DateRange) => void
  className?: string
  placeholder?: string
}

export function CompactDateRangePicker({
  dateRange,
  setDateRange,
  className,
  placeholder = "Seleziona un intervallo",
}: CompactDateRangePickerProps) {
  const [currentMonth, setCurrentMonth] = useState(dateRange.from || new Date())
  const [selectingMode, setSelectingMode] = useState<"from" | "to">("from")

  const nextMonth = () => {
    setCurrentMonth(addMonths(currentMonth, 1))
  }

  const prevMonth = () => {
    setCurrentMonth(subMonths(currentMonth, 1))
  }

  const monthStart = startOfMonth(currentMonth)
  const monthEnd = endOfMonth(currentMonth)
  const startDate = startOfWeek(monthStart, { weekStartsOn: 1 })
  const endDate = endOfWeek(monthEnd, { weekStartsOn: 1 })

  const dateFormat = "d"
  const monthFormat = "MMMM yyyy"

  const days = ["lun", "mar", "mer", "gio", "ven", "sab", "dom"]

  const handleDateClick = (day: Date) => {
    if (selectingMode === "from" || !dateRange.from) {
      setDateRange({ from: day, to: undefined })
      setSelectingMode("to")
    } else {
      if (day < dateRange.from) {
        setDateRange({ from: day, to: dateRange.from })
      } else {
        setDateRange({ ...dateRange, to: day })
      }
      setSelectingMode("from")
    }
  }

  const renderDays = () => {
    return days.map((day) => (
      <div key={day} className="w-8 h-8 flex items-center justify-center text-sm font-medium">
        {day}
      </div>
    ))
  }

  const renderCells = () => {
    const dateInterval = eachDayOfInterval({
      start: startDate,
      end: endDate,
    })

    const rows = []
    let days = []

    dateInterval.forEach((day, i) => {
      const isSelected = isSameDay(day, dateRange.from || new Date(0)) || isSameDay(day, dateRange.to || new Date(0))

      const isInRange =
        dateRange.from &&
        dateRange.to &&
        isWithinInterval(day, {
          start: dateRange.from,
          end: dateRange.to,
        })

      days.push(
        <div
          key={day.toString()}
          className={cn(
            "w-8 h-8 flex items-center justify-center text-sm cursor-pointer",
            !isSameMonth(day, monthStart) && "text-gray-300",
            isSelected && "bg-blue-500 text-white rounded-full",
            isInRange && !isSelected && "bg-blue-100",
          )}
          onClick={() => handleDateClick(day)}
        >
          {formatDate(day, dateFormat)}
        </div>,
      )

      if ((i + 1) % 7 === 0 || i === dateInterval.length - 1) {
        rows.push(
          <div key={day.toString()} className="flex">
            {days}
          </div>,
        )
        days = []
      }
    })

    return rows
  }

  const formatDateRange = () => {
    if (dateRange.from && dateRange.to) {
      return `${format(dateRange.from, "dd/MM/yyyy", { locale: it })} - ${format(dateRange.to, "dd/MM/yyyy", { locale: it })}`
    } else if (dateRange.from) {
      return `${format(dateRange.from, "dd/MM/yyyy", { locale: it })} - ...`
    } else {
      return placeholder
    }
  }

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button
          variant={"outline"}
          className={cn(
            "w-full justify-start text-left font-normal border hover:bg-accent hover:text-accent-foreground",
            !dateRange.from && !dateRange.to && "text-muted-foreground",
            className,
          )}
        >
          <CalendarIcon className="mr-2 h-4 w-4" />
          <span>{formatDateRange()}</span>
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-0" align="start">
        <div className="bg-white rounded-md shadow-md p-4">
          <div className="text-center font-medium mb-4">{format(currentMonth, monthFormat, { locale: it })}</div>

          <div className="flex justify-between items-center mb-2">
            <div className="flex">
              <Button variant="ghost" size="icon" className="h-7 w-7" onClick={prevMonth}>
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <Button variant="ghost" size="icon" className="h-7 w-7 ml-1" onClick={nextMonth}>
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>

          <div className="flex mb-2">{renderDays()}</div>

          <div className="space-y-1">{renderCells()}</div>
        </div>
      </PopoverContent>
    </Popover>
  )
}
