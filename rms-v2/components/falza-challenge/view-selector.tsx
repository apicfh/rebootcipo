"use client"

import { LayoutGrid, Calendar } from "lucide-react"
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group"

export type ViewType = "daily" | "weekly"

interface ViewSelectorProps {
  activeView: ViewType
  onViewChange: (view: ViewType) => void
}

export function ViewSelector({ activeView, onViewChange }: ViewSelectorProps) {
  return (
    <ToggleGroup type="single" value={activeView} onValueChange={(value) => value && onViewChange(value as ViewType)}>
      <ToggleGroupItem value="daily" aria-label="Visualizzazione giornaliera">
        <LayoutGrid className="mr-2 h-4 w-4" />
        Giornaliera
      </ToggleGroupItem>
      <ToggleGroupItem value="weekly" aria-label="Visualizzazione settimanale">
        <Calendar className="mr-2 h-4 w-4" />
        Settimanale
      </ToggleGroupItem>
    </ToggleGroup>
  )
}
