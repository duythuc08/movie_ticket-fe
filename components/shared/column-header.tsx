"use client";

/**
 * USAGE EXAMPLE:
 *
 * // Trong ColumnDef:
 * {
 *   accessorKey: "title",
 *   header: ({ column }) => <ColumnHeader column={column} title="Tên phim" />,
 * }
 */

import * as React from "react";
import type { Column } from "@tanstack/react-table";
import { ArrowDown, ArrowUp, ArrowUpDown } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

interface ColumnHeaderProps<TData> {
  column: Column<TData>;
  title: string;
  className?: string;
}

export function ColumnHeader<TData>({ column, title, className }: ColumnHeaderProps<TData>) {
  if (!column.getCanSort()) {
    return <span className={cn("text-sm font-medium", className)}>{title}</span>;
  }

  const sorted = column.getIsSorted();

  return (
    <Button
      variant="ghost"
      size="sm"
      className={cn("-ml-3 h-8 gap-1 font-medium", className)}
      onClick={() => column.toggleSorting(sorted === "asc")}
    >
      {title}
      {sorted === "asc" ? (
        <ArrowUp className="h-4 w-4" />
      ) : sorted === "desc" ? (
        <ArrowDown className="h-4 w-4" />
      ) : (
        <ArrowUpDown className="h-4 w-4 opacity-50" />
      )}
    </Button>
  );
}
