"use client"

import * as React from "react"
import { format } from "date-fns"
import { it } from "date-fns/locale"
import { CalendarDays } from "lucide-react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"

interface ElegantDatePickerProps {
  date?: Date
  onDateChange?: (date: Date | undefined) => void
  placeholder?: string
  className?: string
}

const ElegantCalendar = ({
  selected,
  onSelect,
  className,
}: {
  selected?: Date
  onSelect?: (date: Date | undefined) => void
  className?: string
}) => {
  const [currentDate, setCurrentDate] = React.useState(selected || new Date())

  const today = new Date()
  const year = currentDate.getFullYear()
  const month = currentDate.getMonth()

  const firstDayOfMonth = new Date(year, month, 1)
  const lastDayOfMonth = new Date(year, month + 1, 0)
  const firstDayOfWeek = firstDayOfMonth.getDay()
  const daysInMonth = lastDayOfMonth.getDate()

  const monthNames = [
    "gennaio",
    "febbraio",
    "marzo",
    "aprile",
    "maggio",
    "giugno",
    "luglio",
    "agosto",
    "settembre",
    "ottobre",
    "novembre",
    "dicembre",
  ]

  const dayNames = ["lun", "mar", "mer", "gio", "ven", "sab", "dom"]

  const navigateMonth = (direction: number) => {
    setCurrentDate(new Date(year, month + direction, 1))
  }

  const selectDate = (day: number) => {
    const selectedDate = new Date(year, month, day)
    onSelect?.(selectedDate)
  }

  const isSelected = (day: number) => {
    if (!selected) return false
    const date = new Date(year, month, day)
    return date.toDateString() === selected.toDateString()
  }

  const isToday = (day: number) => {
    const date = new Date(year, month, day)
    return date.toDateString() === today.toDateString()
  }

  // Generate calendar days
  const calendarDays = []

  // Add empty cells for days before month starts
  const startDay = firstDayOfWeek === 0 ? 6 : firstDayOfWeek - 1
  for (let i = 0; i < startDay; i++) {
    const prevMonthDay = new Date(year, month, -startDay + i + 1).getDate()
    calendarDays.push(
      <div key={`prev-${i}`} className="w-9 h-9 flex items-center justify-center">
        <span style={{ color: "#d1d5db", fontSize: "14px" }}>{prevMonthDay}</span>
      </div>,
    )
  }

  // Add days of current month
  for (let day = 1; day <= daysInMonth; day++) {
    const isSelectedDay = isSelected(day)
    const isTodayDay = isToday(day)

    calendarDays.push(
      <div key={day} className="w-9 h-9 flex items-center justify-center">
        <button
          onClick={() => selectDate(day)}
          style={{
            width: "36px",
            height: "36px",
            borderRadius: "50%",
            border: "none",
            backgroundColor: isSelectedDay ? "#3b82f6" : "transparent",
            color: isSelectedDay ? "white" : isTodayDay ? "#3b82f6" : "#374151",
            fontSize: "14px",
            fontWeight: isTodayDay ? "600" : "400",
            cursor: "pointer",
            transition: "all 0.2s ease",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
          onMouseEnter={(e) => {
            if (!isSelectedDay) {
              e.currentTarget.style.backgroundColor = "#dbeafe"
              e.currentTarget.style.color = "#2563eb"
              e.currentTarget.style.transform = "scale(1.05)"
            }
          }}
          onMouseLeave={(e) => {
            if (!isSelectedDay) {
              e.currentTarget.style.backgroundColor = "transparent"
              e.currentTarget.style.color = isTodayDay ? "#3b82f6" : "#374151"
              e.currentTarget.style.transform = "scale(1)"
            }
          }}
        >
          {day}
        </button>
      </div>,
    )
  }

  return (
    <div
      style={{
        padding: "16px",
        backgroundColor: "white",
        borderRadius: "8px",
        boxShadow: "0 4px 6px -1px rgba(0, 0, 0, 0.1)",
      }}
    >
      {/* Header */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "16px" }}>
        <button
          onClick={() => navigateMonth(-1)}
          style={{
            width: "32px",
            height: "32px",
            borderRadius: "6px",
            border: "none",
            backgroundColor: "transparent",
            cursor: "pointer",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            transition: "background-color 0.2s ease",
          }}
          onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = "#f3f4f6")}
          onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = "transparent")}
        >
          ←
        </button>

        <h2 style={{ fontSize: "16px", fontWeight: "600", color: "#111827", margin: 0 }}>
          {monthNames[month]} {year}
        </h2>

        <button
          onClick={() => navigateMonth(1)}
          style={{
            width: "32px",
            height: "32px",
            borderRadius: "6px",
            border: "none",
            backgroundColor: "transparent",
            cursor: "pointer",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            transition: "background-color 0.2s ease",
          }}
          onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = "#f3f4f6")}
          onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = "transparent")}
        >
          →
        </button>
      </div>

      {/* Day names */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)", gap: "0", marginBottom: "8px" }}>
        {dayNames.map((day) => (
          <div
            key={day}
            style={{ width: "36px", height: "32px", display: "flex", alignItems: "center", justifyContent: "center" }}
          >
            <span style={{ color: "#60a5fa", fontSize: "12px", fontWeight: "300" }}>{day}</span>
          </div>
        ))}
      </div>

      {/* Calendar grid */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)", gap: "0" }}>{calendarDays}</div>
    </div>
  )
}

export function ElegantDatePicker({
  date,
  onDateChange,
  placeholder = "Seleziona data",
  className,
}: ElegantDatePickerProps) {
  const [open, setOpen] = React.useState(false)

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          className={cn("w-full justify-start text-left font-normal", !date && "text-muted-foreground", className)}
        >
          <CalendarDays className="mr-2 h-4 w-4" />
          {date ? format(date, "dd/MM/yyyy", { locale: it }) : placeholder}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-0" align="start">
        <ElegantCalendar
          selected={date}
          onSelect={(selectedDate) => {
            onDateChange?.(selectedDate)
            setOpen(false)
          }}
        />
      </PopoverContent>
    </Popover>
  )
}
