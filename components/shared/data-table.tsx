"use client";

/**
 * USAGE EXAMPLE:
 *
 * // columns.tsx
 * const columns: ColumnDef<Movie>[] = [
 *   {
 *     accessorKey: "title",
 *     header: ({ column }) => <ColumnHeader column={column} title="Tên phim" />,
 *   },
 *   {
 *     accessorKey: "status",
 *     header: "Trạng thái",
 *     cell: ({ row }) => (
 *       <StatusBadge status={row.getValue("status")} statusMap={MOVIE_STATUS_MAP} />
 *     ),
 *   },
 *   {
 *     id: "actions",
 *     cell: ({ row }) => (
 *       <ActionMenu actions={[
 *         { label: "Chỉnh sửa", icon: Pencil, onClick: () => onEdit(row.original) },
 *         { label: "Xóa", icon: Trash2, onClick: () => onDelete(row.original), variant: "destructive" },
 *       ]} />
 *     ),
 *   },
 * ];
 *
 * // page.tsx
 * <DataTable
 *   columns={columns}
 *   data={movies}
 *   searchKey="title"
 *   searchPlaceholder="Tìm phim..."
 *   filters={[{ key: "status", label: "Trạng thái", options: MOVIE_STATUS_OPTIONS }]}
 *   isLoading={isLoading}
 * />
 */

import * as React from "react";
import {
  flexRender,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  useReactTable,
  type ColumnDef,
  type ColumnFiltersState,
  type SortingState,
} from "@tanstack/react-table";
import { Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

export interface FilterOption {
  label: string;
  value: string;
}

export interface FilterConfig {
  key: string;
  label: string;
  options: FilterOption[];
}

export interface ServerPaginationConfig {
  page: number;       // 0-indexed
  pageCount: number;
  total: number;
  onChange: (page: number) => void;
}

interface DataTableProps<TData> {
  columns: ColumnDef<TData>[];
  data: TData[];
  searchKey?: keyof TData;
  searchPlaceholder?: string;
  filters?: FilterConfig[];
  onRowClick?: (row: TData) => void;
  isLoading?: boolean;
  emptyText?: string;
  onResetFilters?: () => void;
  initialFilters?: ColumnFiltersState;
  serverPagination?: ServerPaginationConfig;
  /** Slot bên phải toolbar — ví dụ nút "Thêm mới" */
  children?: React.ReactNode;
}

const PAGE_SIZE = 10;

export function DataTable<TData>({
  columns,
  data,
  searchKey,
  searchPlaceholder = "Tìm kiếm...",
  filters,
  onRowClick,
  isLoading = false,
  emptyText = "Không có dữ liệu.",
  onResetFilters,
  initialFilters = [],
  serverPagination,
  children,
}: DataTableProps<TData>) {
  const [sorting, setSorting] = React.useState<SortingState>([]);
  const [columnFilters, setColumnFilters] = React.useState<ColumnFiltersState>(initialFilters || []);
  const [globalFilter, setGlobalFilter] = React.useState("");
  const [filterKey, setFilterKey] = React.useState(0);

  const table = useReactTable({
    data,
    columns,
    manualPagination: !!serverPagination,
    pageCount: serverPagination?.pageCount ?? -1,
    autoResetPageIndex: !serverPagination,
    state: { sorting, columnFilters, globalFilter },
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
    onGlobalFilterChange: setGlobalFilter,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    initialState: {
      pagination: { pageSize: PAGE_SIZE },
      columnFilters: initialFilters,
    },
  });

  const { pageIndex, pageSize } = table.getState().pagination;
  const clientTotalRows = table.getFilteredRowModel().rows.length;
  const clientTotalPages = Math.ceil(clientTotalRows / pageSize) || 1;
  const safePageIndex = Math.min(pageIndex, clientTotalPages - 1);

  const displayPage   = serverPagination?.page   ?? safePageIndex;
  const displayTotal  = serverPagination?.total   ?? clientTotalRows;
  const displayPages  = serverPagination?.pageCount ?? clientTotalPages;
  const from = displayTotal === 0 ? 0 : displayPage * pageSize + 1;
  const to   = Math.min((displayPage + 1) * pageSize, displayTotal);
  const canPrev = serverPagination ? serverPagination.page > 0 : table.getCanPreviousPage();
  const canNext = serverPagination ? serverPagination.page < serverPagination.pageCount - 1 : table.getCanNextPage();

  const handleFilterChange = (key: string, value: string) => {
    if (value === "__all__") {
      table.getColumn(key)?.setFilterValue(undefined);
    } else {
      table.getColumn(key)?.setFilterValue(value);
    }
  };

  const isFiltered = columnFilters.length > 0 || globalFilter !== "";

  const handleReset = () => {
    table.resetColumnFilters();
    setGlobalFilter("");
    setFilterKey((k) => k + 1);
    if (onResetFilters) onResetFilters();
  };

  return (
    <div className="space-y-4">
      {/* Toolbar */}
      <div className="flex flex-wrap items-center gap-3">
        {searchKey && (
          <div className="relative flex-1 min-w-50 max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder={searchPlaceholder}
              value={globalFilter}
              onChange={(e) => setGlobalFilter(e.target.value)}
              className="pl-9"
            />
          </div>
        )}

        {filters?.map((filter) => {
          const currentFilterValue = (table.getColumn(filter.key)?.getFilterValue() as string) || "__all__";
          return (
            <Select
              key={`${filter.key}-${filterKey}`}
              value={currentFilterValue}
              onValueChange={(value) => handleFilterChange(filter.key, value)}
            >
              <SelectTrigger className="w-45">
                <SelectValue placeholder={filter.label} />
              </SelectTrigger>
              <SelectContent data-admin="">
                {filter.options.map((opt) => (
                  <SelectItem key={opt.value} value={opt.value}>
                    {opt.label}
                  </SelectItem>
                ))}
                <SelectItem value="__all__">Tất cả</SelectItem>
              </SelectContent>
            </Select>
          );
        })}

        {children}

        {(isFiltered || onResetFilters) && (
          <Button
            variant="ghost"
            onClick={handleReset}
            className="h-9 px-3 text-muted-foreground hover:text-foreground"
          >
            Xóa lọc
          </Button>
        )}
      </div>

      {/* Table */}
      <div className="rounded-lg border border-border overflow-hidden">
        <Table>
          <TableHeader>
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id} className="bg-muted/50 hover:bg-muted/50">
                {headerGroup.headers.map((header) => (
                  <TableHead key={header.id}>
                    {header.isPlaceholder
                      ? null
                      : flexRender(header.column.columnDef.header, header.getContext())}
                  </TableHead>
                ))}
              </TableRow>
            ))}
          </TableHeader>

          <TableBody>
            {isLoading ? (
              Array.from({ length: PAGE_SIZE }).map((_, i) => (
                <TableRow key={i}>
                  {columns.map((_, j) => (
                    <TableCell key={j}>
                      <Skeleton className="h-5 w-full rounded" />
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : table.getRowModel().rows.length > 0 ? (
              table.getRowModel().rows.map((row) => (
                <TableRow
                  key={row.id}
                  data-state={row.getIsSelected() ? "selected" : undefined}
                  onClick={() => onRowClick?.(row.original)}
                  className={onRowClick ? "cursor-pointer" : undefined}
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
                <TableCell colSpan={columns.length} className="h-32 text-center text-muted-foreground">
                  {emptyText}
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      {/* Pagination */}
      <div className="flex items-center justify-between text-sm text-muted-foreground">
        <span>
          {displayTotal === 0
            ? "Không có kết quả"
            : `Hiển thị ${from}–${to} trong ${displayTotal} kết quả`}
        </span>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => serverPagination
              ? serverPagination.onChange(serverPagination.page - 1)
              : table.previousPage()}
            disabled={!canPrev}
          >
            Trước
          </Button>
          <span className="text-foreground font-medium">
            {displayPage + 1} / {displayPages}
          </span>
          <Button
            variant="outline"
            size="sm"
            onClick={() => serverPagination
              ? serverPagination.onChange(serverPagination.page + 1)
              : table.nextPage()}
            disabled={!canNext}
          >
            Sau
          </Button>
        </div>
      </div>
    </div>
  );
}
