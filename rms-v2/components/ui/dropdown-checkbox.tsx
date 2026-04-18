"use client"
import { ChevronDown } from "lucide-react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

export interface DropdownCheckboxOption {
  label: string
  value: string
  checked: boolean
}

interface DropdownCheckboxProps {
  options: DropdownCheckboxOption[]
  onCheckedChange: (value: string, checked: boolean) => void
  placeholder?: string
  label?: string
  className?: string
}

export function DropdownCheckbox({
  options,
  onCheckedChange,
  placeholder = "Seleziona opzioni",
  label,
  className,
}: DropdownCheckboxProps) {
  const selectedCount = options.filter((option) => option.checked).length
  const allSelected = selectedCount === options.length
  const someSelected = selectedCount > 0 && selectedCount < options.length

  const handleSelectAll = (checked: boolean) => {
    options.forEach((option) => {
      onCheckedChange(option.value, checked)
    })
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" className={cn("w-full justify-between", className)}>
          <span className="truncate">
            {selectedCount === 0
              ? placeholder
              : selectedCount === 1
                ? options.find((opt) => opt.checked)?.label
                : `${selectedCount} selezionati`}
          </span>
          <ChevronDown className="h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="w-56">
        {label && (
          <>
            <DropdownMenuLabel>{label}</DropdownMenuLabel>
            <DropdownMenuSeparator />
          </>
        )}
        <DropdownMenuCheckboxItem checked={allSelected} onCheckedChange={handleSelectAll} className="font-medium">
          Seleziona tutto
        </DropdownMenuCheckboxItem>
        <DropdownMenuSeparator />
        {options.map((option) => (
          <DropdownMenuCheckboxItem
            key={option.value}
            checked={option.checked}
            onCheckedChange={(checked) => onCheckedChange(option.value, checked)}
          >
            {option.label}
          </DropdownMenuCheckboxItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
