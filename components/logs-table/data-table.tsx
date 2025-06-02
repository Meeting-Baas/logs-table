"use client"

import {
  type ColumnDef,
  type ColumnFiltersState,
  type RowSelectionState,
  type SortingState,
  type VisibilityState,
  flexRender,
  getCoreRowModel,
  getFilteredRowModel,
  getSortedRowModel,
  useReactTable
} from "@tanstack/react-table"

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import { useState } from "react"
import { ColumnVisibilityDropdown } from "@/components/logs-table/column-visibility-dropdown"
import { DataTableFilter } from "@/components/logs-table/data-table-filter"
import { cn } from "@/lib/utils"
import { AdditionalFilters } from "@/components/logs-table/additional-filters"
import { Loader2 } from "lucide-react"
import type { DateValueType } from "react-tailwindcss-datepicker"
import { DateRangeFilter } from "@/components/logs-table/date-range-filter"
import { ExportCsvDialog } from "@/components/logs-table/export-csv-dialog"
import { PageSizeSelector } from "@/components/logs-table/page-size-selector"
import { BotSearch } from "@/components/bot-search"
import type { FilterState, FormattedBotData } from "@/components/logs-table/types"
import { TableSelectionShare } from "@/components/logs-table/table-selection-share"
import { BackToAllLogs } from "@/components/logs-table/back-to-all-logs"

interface DataTableProps<TData extends FormattedBotData, TValue> {
  columns: ColumnDef<TData, TValue>[]
  data: TData[]
  pageCount: number
  pageIndex: number
  pageSize: number
  onPageChange: (pageIndex: number) => void
  onPageSizeChange: (pageSize: number) => void
  isRefetching: boolean
  dateRange: DateValueType
  setDateRange: (dateRange: DateValueType) => void
  filters: FilterState
  setFilters: (filters: FilterState) => void
  botUuids: string[]
  setBotUuids: (botUuids: string[]) => void
}

export function DataTable<TData extends FormattedBotData, TValue>({
  columns,
  data,
  pageCount,
  pageIndex,
  pageSize,
  onPageChange,
  onPageSizeChange,
  isRefetching,
  dateRange,
  setDateRange,
  filters,
  setFilters,
  botUuids,
  setBotUuids
}: DataTableProps<TData, TValue>) {
  const [sorting, setSorting] = useState<SortingState>([])
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]) // Required for global filter
  const [columnVisibility, setColumnVisibility] = useState<VisibilityState>({})
  const [globalFilter, setGlobalFilter] = useState("")
  const [rowSelection, setRowSelection] = useState<RowSelectionState>({})

  const table = useReactTable({
    data,
    columns,
    getCoreRowModel: getCoreRowModel(),
    onSortingChange: setSorting,
    getSortedRowModel: getSortedRowModel(),
    onColumnFiltersChange: setColumnFilters,
    getFilteredRowModel: getFilteredRowModel(),
    onColumnVisibilityChange: setColumnVisibility,
    onGlobalFilterChange: setGlobalFilter,
    onRowSelectionChange: setRowSelection,
    getRowId: (row: TData) => row.uuid,
    manualPagination: true,
    pageCount,
    state: {
      sorting,
      columnFilters,
      columnVisibility,
      globalFilter,
      pagination: {
        pageIndex,
        pageSize
      },
      rowSelection
    }
  })

  return (
    <div className="relative">
      <div className="sticky top-0 right-0 left-0 z-50 bg-background py-5">
        <div className="flex flex-col items-center justify-between gap-4 md:flex-row">
          <div className="flex w-full items-center gap-2 md:w-1/2">
            <DateRangeFilter value={dateRange} onChange={setDateRange} />
            {isRefetching && (
              <Loader2 className="size-4 animate-spin text-primary" aria-label="Refreshing logs" />
            )}
          </div>
          <div className="flex w-full items-start gap-2 md:w-1/2 lg:w-1/3 xl:w-1/4">
            <div className="flex w-full flex-col items-start gap-2">
              <DataTableFilter globalFilter={globalFilter} onGlobalFilterChange={setGlobalFilter} />
              <BotSearch />
            </div>
            <ExportCsvDialog
              table={table}
              dateRange={dateRange}
              pageIndex={pageIndex}
              filters={filters}
            />
            <ColumnVisibilityDropdown table={table} />
          </div>
        </div>
      </div>
      <div className="mb-2 flex flex-col justify-between gap-2 md:flex-row">
        <div className="flex flex-col items-center gap-2 md:flex-row">
          <BackToAllLogs botUuids={botUuids} setBotUuids={setBotUuids} />
          <AdditionalFilters
            filters={filters}
            setFilters={setFilters}
            pageIndex={pageIndex}
            onPageChange={onPageChange}
          />
        </div>
        <div className="flex items-center gap-2">
          <TableSelectionShare rowSelection={rowSelection} />
          <PageSizeSelector value={pageSize} onChange={onPageSizeChange} />
        </div>
      </div>
      <div>
        <Table className={cn(isRefetching && "animate-pulse")}>
          <TableHeader>
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id} className="bg-accent dark:bg-baas-primary-700">
                {headerGroup.headers.map((header, index) => {
                  return (
                    <TableHead
                      key={header.id}
                      className={cn(
                        index === 0 && "rounded-tl-md",
                        index === headerGroup.headers.length - 1 && "rounded-tr-md"
                      )}
                    >
                      {header.isPlaceholder
                        ? null
                        : flexRender(header.column.columnDef.header, header.getContext())}
                    </TableHead>
                  )
                })}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody>
            {!table.getAllColumns().some((column) => column.getIsVisible()) ? (
              <TableRow>
                <TableCell colSpan={columns.length} className="h-24 text-center">
                  <div className="flex flex-col items-center gap-2">
                    <p>All columns are hidden.</p>
                    <p className="text-muted-foreground text-sm">
                      Please make some columns visible to see the logs.
                    </p>
                  </div>
                </TableCell>
              </TableRow>
            ) : table.getRowModel().rows?.length ? (
              table.getRowModel().rows.map((row) => (
                <TableRow
                  key={row.id}
                  data-state={row.getIsSelected() && "selected"}
                  onClick={() => row.toggleSelected(!row.getIsSelected())}
                  className="cursor-pointer"
                >
                  {row.getVisibleCells().map((cell) => (
                    <TableCell key={cell.id}>
                      {flexRender(cell.column.columnDef.cell, cell.getContext())}
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={columns.length} className="h-24 text-center">
                  No logs found. Please try a different date range or filter.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
      <div className="mt-4 flex w-full items-center justify-end gap-2 md:w-auto">
        <Button
          variant="outline"
          size="sm"
          onClick={() => onPageChange(pageIndex - 1)}
          className="w-1/2 md:w-auto"
          disabled={pageIndex === 0}
        >
          Previous
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={() => onPageChange(pageIndex + 1)}
          disabled={pageIndex >= pageCount - 1}
          className="w-1/2 md:w-auto"
        >
          Next
        </Button>
      </div>
    </div>
  )
}
