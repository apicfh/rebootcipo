"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { DateRangePickerAdvanced } from "@/components/ui/date-range-picker-advanced"
import { CalendarDays, Filter, Search } from "lucide-react"
import { subDays, format } from "date-fns"
import { it } from "date-fns/locale"
import type { DateRange } from "react-day-picker"
import type { DescrizioneTelefonate } from "@/lib/services/telefonate-auto-service"

interface TelefonateFiltersProps {
  dateRange: DateRange | undefined
  onDateRangeChange: (range: DateRange | undefined) => void
  selectedDescrizione: string
  onDescrizioneChange: (descrizione: string) => void
  descrizioni: DescrizioneTelefonate[]
  onApplyFilters: () => void
  isLoading: boolean
}

export function TelefonateFilters({
  dateRange,
  onDateRangeChange,
  selectedDescrizione,
  onDescrizioneChange,
  descrizioni,
  onApplyFilters,
  isLoading,
}: TelefonateFiltersProps) {
  const handleQuickDateSelect = (days: number) => {
    const newRange = {
      from: subDays(new Date(), days),
      to: new Date(),
    }
    onDateRangeChange(newRange)
  }

  const formatDateRange = () => {
    if (!dateRange?.from) return "Nessun periodo selezionato"
    if (!dateRange.to) return format(dateRange.from, "dd/MM/yyyy", { locale: it })
    return `${format(dateRange.from, "dd/MM/yyyy", { locale: it })} - ${format(dateRange.to, "dd/MM/yyyy", { locale: it })}`
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Filter className="h-5 w-5" />
          Filtri Telefonate
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Filtri principali */}
        <div className="flex flex-col md:flex-row gap-4">
          {/* Date Range Picker */}
          <div className="flex-1">
            <label className="text-sm font-medium mb-2 block">Periodo</label>
            <DateRangePickerAdvanced
              value={dateRange}
              onChange={onDateRangeChange}
              placeholder="Seleziona periodo..."
              className="w-full"
            />
            <p className="text-xs text-muted-foreground mt-1">{formatDateRange()}</p>
          </div>

          {/* Filtro Struttura */}
          <div className="w-full md:w-64">
            <label className="text-sm font-medium mb-2 block">Struttura</label>
            <Select value={selectedDescrizione} onValueChange={onDescrizioneChange}>
              <SelectTrigger>
                <SelectValue placeholder="Tutte le strutture" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tutte le strutture</SelectItem>
                {descrizioni.map((desc) => (
                  <SelectItem key={desc.descrizione} value={desc.descrizione}>
                    {desc.descrizione}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Bottone Applica */}
          <div className="flex items-end">
            <Button onClick={onApplyFilters} disabled={isLoading || !dateRange?.from} className="w-full md:w-auto">
              <Search className="h-4 w-4 mr-2" />
              {isLoading ? "Caricamento..." : "Applica Filtri"}
            </Button>
          </div>
        </div>

        {/* Bottoni rapidi per date */}
        <div className="flex flex-wrap gap-2">
          <span className="text-sm font-medium text-muted-foreground flex items-center gap-1">
            <CalendarDays className="h-4 w-4" />
            Periodi rapidi:
          </span>
          <Button variant="outline" size="sm" onClick={() => handleQuickDateSelect(7)} className="text-xs">
            Ultimi 7 giorni
          </Button>
          <Button variant="outline" size="sm" onClick={() => handleQuickDateSelect(30)} className="text-xs">
            Ultimi 30 giorni
          </Button>
          <Button variant="outline" size="sm" onClick={() => handleQuickDateSelect(90)} className="text-xs">
            Ultimi 90 giorni
          </Button>
        </div>

        {/* Debug info */}
        {process.env.NODE_ENV === "development" && (
          <div className="text-xs text-muted-foreground bg-gray-50 p-2 rounded">
            <strong>Debug:</strong> {JSON.stringify({ dateRange, selectedDescrizione })}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
