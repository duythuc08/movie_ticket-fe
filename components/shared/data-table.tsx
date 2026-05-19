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

interface DataTableProps<TData> {
  columns: ColumnDef<TData>[];
  data: TData[];
  searchKey?: keyof TData;
  searchPlaceholder?: string;
  filters?: FilterConfig[];
  onRowClick?: (row: TData) => void;
  isLoading?: boolean;
  emptyText?: string;
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
  children,
}: DataTableProps<TData>) {
  const [sorting, setSorting] = React.useState<SortingState>([]);
  const [columnFilters, setColumnFilters] = React.useState<ColumnFiltersState>([]);
  const [globalFilter, setGlobalFilter] = React.useState("");

  const table = useReactTable({
    data,
    columns,
    state: { sorting, columnFilters, globalFilter },
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
    onGlobalFilterChange: setGlobalFilter,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    initialState: { pagination: { pageSize: PAGE_SIZE } },
  });

  const { pageIndex, pageSize } = table.getState().pagination;
  const totalRows = table.getFilteredRowModel().rows.length;
  const from = totalRows === 0 ? 0 : pageIndex * pageSize + 1;
  const to = Math.min((pageIndex + 1) * pageSize, totalRows);

  const handleFilterChange = (key: string, value: string) => {
    if (value === "__all__") {
      table.getColumn(key)?.setFilterValue(undefined);
    } else {
      table.getColumn(key)?.setFilterValue(value);
    }
  };

  return (
    <div className="space-y-4">
      {/* Toolbar */}
      <div className="flex flex-wrap items-center gap-3">
        {searchKey && (
          <div className="relative flex-1 min-w-[200px] max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder={searchPlaceholder}
              value={globalFilter}
              onChange={(e) => setGlobalFilter(e.target.value)}
              className="pl-9"
            />
          </div>
        )}

        {filters?.map((filter) => (
          <Select
            key={filter.key}
            onValueChange={(value) => handleFilterChange(filter.key, value)}
          >
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder={filter.label} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="__all__">Tất cả</SelectItem>
              {filter.options.map((opt) => (
                <SelectItem key={opt.value} value={opt.value}>
                  {opt.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        ))}

        <div className="ml-auto">{children}</div>
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
          {totalRows === 0
            ? "Không có kết quả"
            : `Hiển thị ${from}–${to} trong ${totalRows} kết quả`}
        </span>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => table.previousPage()}
            disabled={!table.getCanPreviousPage()}
          >
            Trước
          </Button>
          <span className="text-foreground font-medium">
            {pageIndex + 1} / {table.getPageCount() || 1}
          </span>
          <Button
            variant="outline"
            size="sm"
            onClick={() => table.nextPage()}
            disabled={!table.getCanNextPage()}
          >
            Sau
          </Button>
        </div>
      </div>
    </div>
  );
}
