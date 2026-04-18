"use client"

import { useState } from "react"
import { ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight } from "lucide-react"
import { it } from "date-fns/locale"
import {
  format,
  addMonths,
  addYears,
  setMonth,
  setYear,
  startOfMonth,
  endOfMonth,
  eachDayOfInterval,
  isSameMonth,
  isSameDay,
  isToday,
} from "date-fns"
import { cn } from "@/lib/utils"

interface CustomCalendarProps {
  date: Date
  onDateChange: (date: Date) => void
  minDate?: Date
  maxDate?: Date
}

export function CustomCalendar({ date, onDateChange, minDate, maxDate }: CustomCalendarProps) {
  const [currentDate, setCurrentDate] = useState(date || new Date())
  const [viewMode, setViewMode] = useState<"date" | "month" | "year">("date")

  // Funzioni di navigazione
  const goToPreviousMonth = () => setCurrentDate(addMonths(currentDate, -1))
  const goToNextMonth = () => setCurrentDate(addMonths(currentDate, 1))
  const goToPreviousYear = () => setCurrentDate(addYears(currentDate, -1))
  const goToNextYear = () => setCurrentDate(addYears(currentDate, 1))

  // Funzioni per cambiare la visualizzazione
  const showMonthView = () => setViewMode("month")
  const showYearView = () => setViewMode("year")
  const showDateView = () => setViewMode("date")

  // Funzioni per selezionare mese/anno
  const selectMonth = (monthIndex: number) => {
    setCurrentDate(setMonth(currentDate, monthIndex))
    showDateView()
  }

  const selectYear = (year: number) => {
    setCurrentDate(setYear(currentDate, year))
    showMonthView()
  }

  // Funzione per selezionare una data
  const selectDate = (day: Date) => {
    onDateChange(day)
  }

  // Verifica se una data è disabilitata
  const isDisabled = (day: Date) => {
    if (minDate && day < minDate) return true
    if (maxDate && day > maxDate) return true
    return false
  }

  // Genera i giorni del mese corrente
  const generateDays = () => {
    const monthStart = startOfMonth(currentDate)
    const monthEnd = endOfMonth(currentDate)
    const days = eachDayOfInterval({ start: monthStart, end: monthEnd })

    // Aggiungi giorni del mese precedente per riempire la prima settimana
    const firstDayOfWeek = monthStart.getDay() || 7 // 0 è domenica, lo convertiamo a 7
    const prevMonthDays = []
    if (firstDayOfWeek > 1) {
      // Se non inizia di lunedì
      const prevMonth = addMonths(monthStart, -1)
      const prevMonthEnd = endOfMonth(prevMonth)
      for (let i = firstDayOfWeek - 2; i >= 0; i--) {
        const day = new Date(prevMonthEnd)
        day.setDate(prevMonthEnd.getDate() - i)
        prevMonthDays.push(day)
      }
    }

    // Aggiungi giorni del mese successivo per riempire l'ultima settimana
    const lastDayOfWeek = monthEnd.getDay() || 7
    const nextMonthDays = []
    if (lastDayOfWeek < 7) {
      // Se non finisce di domenica
      const daysToAdd = 7 - lastDayOfWeek
      const nextMonth = addMonths(monthStart, 1)
      for (let i = 1; i <= daysToAdd; i++) {
        const day = new Date(nextMonth)
        day.setDate(i)
        nextMonthDays.push(day)
      }
    }

    return [...prevMonthDays, ...days, ...nextMonthDays]
  }

  // Genera i mesi dell'anno
  const months = [
    { index: 0, name: "gen" },
    { index: 1, name: "feb" },
    { index: 2, name: "mar" },
    { index: 3, name: "apr" },
    { index: 4, name: "mag" },
    { index: 5, name: "giu" },
    { index: 6, name: "lug" },
    { index: 7, name: "ago" },
    { index: 8, name: "set" },
    { index: 9, name: "ott" },
    { index: 10, name: "nov" },
    { index: 11, name: "dic" },
  ]

  // Genera gli anni (10 anni intorno all'anno corrente)
  const currentYear = currentDate.getFullYear()
  const startYear = Math.floor(currentYear / 10) * 10 - 5
  const years = Array.from({ length: 10 }, (_, i) => startYear + i)

  // Genera i giorni per la vista calendario
  const days = generateDays()

  return (
    <div className="mx-datepicker-main bg-white rounded-md shadow-md border border-gray-200 w-[280px]">
      <div className="mx-datepicker-content">
        <div className="mx-datepicker-body">
          <div className="mx-calendar">
            {/* Header con navigazione */}
            <div className="mx-calendar-header flex items-center justify-between p-2 border-b">
              <div className="flex">
                <button
                  type="button"
                  className="mx-btn p-1 hover:bg-gray-100 rounded-full"
                  onClick={viewMode === "year" ? () => selectYear(startYear - 10) : goToPreviousYear}
                >
                  <ChevronsLeft className="h-4 w-4" />
                </button>
                <button
                  type="button"
                  className="mx-btn p-1 hover:bg-gray-100 rounded-full ml-1"
                  onClick={viewMode === "date" ? goToPreviousMonth : viewMode === "year" ? () => {} : goToPreviousYear}
                >
                  <ChevronLeft className="h-4 w-4" />
                </button>
              </div>

              <span className="mx-calendar-header-label flex">
                {viewMode === "date" && (
                  <>
                    <button
                      type="button"
                      className="mx-btn mx-btn-text mx-btn-current-month px-1 hover:bg-gray-100 rounded"
                      onClick={showMonthView}
                    >
                      {format(currentDate, "MMM", { locale: it })}
                    </button>
                    <button
                      type="button"
                      className="mx-btn mx-btn-text mx-btn-current-year px-1 hover:bg-gray-100 rounded ml-1"
                      onClick={showYearView}
                    >
                      {format(currentDate, "yyyy")}
                    </button>
                  </>
                )}
                {viewMode === "month" && (
                  <button type="button" className="mx-btn mx-btn-text hover:bg-gray-100 rounded" onClick={showYearView}>
                    {format(currentDate, "yyyy")}
                  </button>
                )}
                {viewMode === "year" && (
                  <button type="button" className="mx-btn mx-btn-text hover:bg-gray-100 rounded">
                    {startYear} - {startYear + 9}
                  </button>
                )}
              </span>

              <div className="flex">
                <button
                  type="button"
                  className="mx-btn p-1 hover:bg-gray-100 rounded-full mr-1"
                  onClick={viewMode === "date" ? goToNextMonth : viewMode === "year" ? () => {} : goToNextYear}
                >
                  <ChevronRight className="h-4 w-4" />
                </button>
                <button
                  type="button"
                  className="mx-btn p-1 hover:bg-gray-100 rounded-full"
                  onClick={viewMode === "year" ? () => selectYear(startYear + 10) : goToNextYear}
                >
                  <ChevronsRight className="h-4 w-4" />
                </button>
              </div>
            </div>

            {/* Contenuto del calendario */}
            <div className="mx-calendar-content p-2">
              {/* Vista anni */}
              {viewMode === "year" && (
                <table className="mx-table mx-table-year w-full">
                  <tbody>
                    {Array.from({ length: 5 }, (_, rowIndex) => (
                      <tr key={rowIndex}>
                        {Array.from({ length: 2 }, (_, colIndex) => {
                          const yearIndex = rowIndex * 2 + colIndex
                          const year = startYear + yearIndex
                          return (
                            <td
                              key={colIndex}
                              className={cn(
                                "cell text-center py-2 cursor-pointer hover:bg-gray-100",
                                year === currentDate.getFullYear() && "active bg-primary text-white hover:bg-primary",
                              )}
                              onClick={() => selectYear(year)}
                            >
                              <div>{year}</div>
                            </td>
                          )
                        })}
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}

              {/* Vista mesi */}
              {viewMode === "month" && (
                <table className="mx-table mx-table-month w-full">
                  <tbody>
                    {Array.from({ length: 4 }, (_, rowIndex) => (
                      <tr key={rowIndex}>
                        {Array.from({ length: 3 }, (_, colIndex) => {
                          const monthIndex = rowIndex * 3 + colIndex
                          const month = months[monthIndex]
                          return (
                            <td
                              key={colIndex}
                              className={cn(
                                "cell text-center py-2 cursor-pointer hover:bg-gray-100",
                                monthIndex === currentDate.getMonth() &&
                                  "active bg-primary text-white hover:bg-primary",
                              )}
                              onClick={() => selectMonth(monthIndex)}
                            >
                              <div>{month.name}</div>
                            </td>
                          )
                        })}
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}

              {/* Vista giorni */}
              {viewMode === "date" && (
                <table className="mx-table mx-table-date w-full">
                  <thead>
                    <tr>
                      <th className="text-center text-xs font-light text-blue-400 py-2">lun</th>
                      <th className="text-center text-xs font-light text-blue-400 py-2">mar</th>
                      <th className="text-center text-xs font-light text-blue-400 py-2">mer</th>
                      <th className="text-center text-xs font-light text-blue-400 py-2">gio</th>
                      <th className="text-center text-xs font-light text-blue-400 py-2">ven</th>
                      <th className="text-center text-xs font-light text-blue-400 py-2">sab</th>
                      <th className="text-center text-xs font-light text-blue-400 py-2">dom</th>
                    </tr>
                  </thead>
                  <tbody>
                    {Array.from({ length: Math.ceil(days.length / 7) }, (_, weekIndex) => {
                      const weekDays = days.slice(weekIndex * 7, (weekIndex + 1) * 7)

                      if (weekDays.length === 0) return null

                      return (
                        <tr key={weekIndex} className="mx-date-row">
                          {weekDays.map((day, dayIndex) => {
                            const isCurrentMonth = isSameMonth(day, currentDate)
                            const isSelected = isSameDay(day, date)
                            const isDayToday = isToday(day)
                            const disabled = isDisabled(day)

                            return (
                              <td
                                key={dayIndex}
                                className={cn(
                                  "cell text-center py-2 px-1 cursor-pointer hover:bg-blue-50 transition-colors duration-150",
                                  !isCurrentMonth && "not-current-month text-gray-300",
                                  isSelected && "active bg-primary text-white hover:bg-primary",
                                  disabled && "disabled text-gray-300 cursor-not-allowed hover:bg-transparent",
                                )}
                                onClick={() => !disabled && selectDate(day)}
                                title={format(day, "yyyy-MM-dd")}
                              >
                                <div
                                  className={cn(
                                    "w-9 h-9 flex items-center justify-center mx-auto rounded-full transition-all duration-150 hover:scale-105 hover:bg-blue-100 hover:text-blue-600",
                                    isSelected &&
                                      !disabled &&
                                      "bg-primary shadow-md hover:bg-primary hover:text-white hover:scale-100",
                                    isDayToday && !isSelected && "bg-blue-100 text-blue-600 font-medium",
                                  )}
                                >
                                  {format(day, "d")}
                                </div>
                              </td>
                            )
                          })}
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
