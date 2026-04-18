"use client"

import {
  type ColumnDef,
  flexRender,
  getCoreRowModel,
  useReactTable,
  getPaginationRowModel,
  type SortingState,
  getSortedRowModel,
} from "@tanstack/react-table"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import { useState } from "react"
import { ChevronDown, ChevronUp, ChevronsUpDown } from "lucide-react"

interface DataTableProps<TData, TValue> {
  columns: ColumnDef<TData, TValue>[]
  data: TData[]
  enableSorting?: boolean
  visibleColumns?: string[]
}

export function DataTable<TData, TValue>({
  columns,
  data,
  enableSorting = false,
  visibleColumns,
}: DataTableProps<TData, TValue>) {
  const [sorting, setSorting] = useState<SortingState>([])

  // Filtra le colonne in base a visibleColumns se fornito
  const visibleColumnsArray = visibleColumns
    ? columns.filter((col) => visibleColumns.includes(col.accessorKey as string))
    : columns

  const table = useReactTable({
    data,
    columns: visibleColumnsArray, // Usa le colonne filtrate
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    onSortingChange: setSorting,
    getSortedRowModel: getSortedRowModel(),
    enableSorting,
    state: {
      sorting,
    },
  })

  // Il resto del componente rimane invariato
  return (
    <div>
      <div className="rounded-lg border-2 border-secondary-300 shadow-md overflow-hidden">
        <Table>
          <TableHeader>
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id} className="bg-secondary-50">
                {headerGroup.headers.map((header) => {
                  return (
                    <TableHead
                      key={header.id}
                      className={enableSorting && header.column.getCanSort() ? "cursor-pointer select-none" : ""}
                      onClick={
                        enableSorting && header.column.getCanSort()
                          ? header.column.getToggleSortingHandler()
                          : undefined
                      }
                    >
                      <div className="flex items-center justify-between">
                        {header.isPlaceholder ? null : flexRender(header.column.columnDef.header, header.getContext())}

                        {enableSorting && header.column.getCanSort() && (
                          <div className="ml-2">
                            {{
                              asc: <ChevronUp className="h-4 w-4 text-primary" />,
                              desc: <ChevronDown className="h-4 w-4 text-primary" />,
                            }[header.column.getIsSorted() as string] ?? (
                              <ChevronsUpDown className="h-4 w-4 opacity-50" />
                            )}
                          </div>
                        )}
                      </div>
                    </TableHead>
                  )
                })}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody>
            {table.getRowModel().rows?.length ? (
              table.getRowModel().rows.map((row) => (
                <TableRow
                  key={row.id}
                  data-state={row.getIsSelected() && "selected"}
                  className="hover:bg-secondary-50 transition-colors"
                >
                  {row.getVisibleCells().map((cell) => (
                    <TableCell key={cell.id} className="align-top py-4">
                      {flexRender(cell.column.columnDef.cell, cell.getContext())}
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={columns.length} className="h-24 text-center">
                  Nessun risultato.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
      <div className="flex items-center justify-end space-x-2 py-4">
        <Button
          variant="outline"
          size="sm"
          onClick={() => table.previousPage()}
          disabled={!table.getCanPreviousPage()}
          className="border-2 hover:bg-secondary-100 transition-colors"
        >
          Precedente
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={() => table.nextPage()}
          disabled={!table.getCanNextPage()}
          className="border-2 hover:bg-secondary-100 transition-colors"
        >
          Successivo
        </Button>
      </div>
    </div>
  )
}
