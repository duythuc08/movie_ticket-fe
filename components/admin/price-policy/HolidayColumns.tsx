"use client";

import type { ColumnDef } from "@tanstack/react-table";
import type { Holiday } from "@/types/admin/pricePolicy";
import { ActionMenu } from "@/components/shared";
import { Pencil, Trash2 } from "lucide-react";

interface HolidayColumnsProps {
  onEdit: (h: Holiday) => void;
  onDelete: (h: Holiday) => void;
}

const formatDate = (iso: string) =>
  new Date(iso).toLocaleDateString("vi-VN", { day: "2-digit", month: "2-digit", year: "numeric" });

export const createHolidayColumns = ({
  onEdit,
  onDelete,
}: HolidayColumnsProps): ColumnDef<Holiday>[] => [
    {
      accessorKey: "name",
      header: "Tên kỳ nghỉ",
      cell: ({ row }) => <span className="font-medium text-sm">{row.original.name}</span>,
    },
    {
      accessorKey: "dateFrom",
      header: "Từ ngày",
      cell: ({ row }) => <span className="text-sm">{formatDate(row.original.dateFrom)}</span>,
    },
    {
      accessorKey: "dateTo",
      header: "Đến ngày",
      cell: ({ row }) => <span className="text-sm">{formatDate(row.original.dateTo)}</span>,
    },
    {
      id: "actions",
      cell: ({ row }) => {
        const h = row.original;
        return (
          <ActionMenu
            actions={[
              { label: "Chỉnh sửa", icon: Pencil, onClick: () => onEdit(h) },
              { label: "Xóa", icon: Trash2, variant: "destructive", onClick: () => onDelete(h) },
            ]}
          />
        );
      },
    },
  ];
