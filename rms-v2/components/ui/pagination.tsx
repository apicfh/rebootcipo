"use client"

import type React from "react"

import { ChevronLeft, ChevronRight, MoreHorizontal } from "lucide-react"
import { Button } from "@/components/ui/button"

interface PaginationProps {
  totalItems: number
  itemsPerPage: number
  currentPage: number
  onPageChange: (page: number) => void
  maxPages?: number
}

export function Pagination({ totalItems, itemsPerPage, currentPage, onPageChange, maxPages = 5 }: PaginationProps) {
  const totalPages = Math.ceil(totalItems / itemsPerPage)

  // Non mostrare la paginazione se c'è solo una pagina
  if (totalPages <= 1) return null

  // Calcola le pagine da mostrare
  let startPage = Math.max(1, currentPage - Math.floor(maxPages / 2))
  const endPage = Math.min(totalPages, startPage + maxPages - 1)

  // Aggiusta startPage se endPage è al limite
  if (endPage === totalPages) {
    startPage = Math.max(1, endPage - maxPages + 1)
  }

  // Genera array di pagine
  const pages = Array.from({ length: endPage - startPage + 1 }, (_, i) => startPage + i)

  return (
    <div className="flex justify-center my-6">
      <PaginationContent>
        {currentPage > 1 && (
          <PaginationItem>
            <PaginationPrevious onClick={() => onPageChange(currentPage - 1)} />
          </PaginationItem>
        )}

        {startPage > 1 && (
          <>
            <PaginationItem>
              <PaginationLink onClick={() => onPageChange(1)}>1</PaginationLink>
            </PaginationItem>
            {startPage > 2 && (
              <PaginationItem>
                <PaginationEllipsis />
              </PaginationItem>
            )}
          </>
        )}

        {pages.map((page) => (
          <PaginationItem key={page}>
            <PaginationLink isActive={page === currentPage} onClick={() => onPageChange(page)}>
              {page}
            </PaginationLink>
          </PaginationItem>
        ))}

        {endPage < totalPages && (
          <>
            {endPage < totalPages - 1 && (
              <PaginationItem>
                <PaginationEllipsis />
              </PaginationItem>
            )}
            <PaginationItem>
              <PaginationLink onClick={() => onPageChange(totalPages)}>{totalPages}</PaginationLink>
            </PaginationItem>
          </>
        )}

        {currentPage < totalPages && (
          <PaginationItem>
            <PaginationNext onClick={() => onPageChange(currentPage + 1)} />
          </PaginationItem>
        )}
      </PaginationContent>
    </div>
  )
}

export function PaginationContent({ children }: { children: React.ReactNode }) {
  return <div className="flex items-center space-x-1">{children}</div>
}

export function PaginationItem({ children }: { children: React.ReactNode }) {
  return <div>{children}</div>
}

export function PaginationLink({
  children,
  isActive,
  onClick,
}: {
  children: React.ReactNode
  isActive?: boolean
  onClick?: () => void
}) {
  return (
    <Button
      variant={isActive ? "default" : "outline"}
      size="icon"
      onClick={onClick}
      className={`h-9 w-9 ${isActive ? "pointer-events-none" : ""}`}
    >
      {children}
    </Button>
  )
}

export function PaginationPrevious({ onClick }: { onClick?: () => void }) {
  return (
    <Button variant="outline" size="icon" className="h-9 w-9" onClick={onClick}>
      <ChevronLeft className="h-4 w-4" />
    </Button>
  )
}

export function PaginationNext({ onClick }: { onClick?: () => void }) {
  return (
    <Button variant="outline" size="icon" className="h-9 w-9" onClick={onClick}>
      <ChevronRight className="h-4 w-4" />
    </Button>
  )
}

export function PaginationEllipsis() {
  return (
    <div className="flex h-9 w-9 items-center justify-center">
      <MoreHorizontal className="h-4 w-4" />
    </div>
  )
}
