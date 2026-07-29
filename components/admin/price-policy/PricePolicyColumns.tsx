"use client";

import type { ColumnDef } from "@tanstack/react-table";
import type { PricePolicy } from "@/types/admin/pricePolicy";
import { ActionMenu, StatusBadge } from "@/components/shared";
import type { StatusMap } from "@/components/shared";
import { ListOrdered, Pencil, Trash2 } from "lucide-react";

interface PricePolicyColumnsProps {
  onManageRules: (p: PricePolicy) => void;
  onEdit: (p: PricePolicy) => void;
  onDelete: (p: PricePolicy) => void;
}

const STATUS_MAP: StatusMap = {
  true: { label: "Đang áp dụng", variant: "success" },
  false: { label: "Chưa áp dụng", variant: "secondary" },
};

const formatDate = (iso: string | null) =>
  iso ? new Date(iso).toLocaleDateString("vi-VN", { day: "2-digit", month: "2-digit", year: "numeric" }) : "Không giới hạn";

export const createPricePolicyColumns = ({
  onManageRules,
  onEdit,
  onDelete,
}: PricePolicyColumnsProps): ColumnDef<PricePolicy>[] => [
    {
      accessorKey: "pricePolicyId",
      header: "ID",
      cell: ({ row }) => (
        <span className="text-xs text-muted-foreground">#{row.original.pricePolicyId}</span>
      ),
    },
    {
      accessorKey: "name",
      header: "Tên chính sách",
      cell: ({ row }) => <span className="font-medium text-sm">{row.original.name}</span>,
    },
    {
      accessorKey: "cinemaName",
      header: "Rạp áp dụng",
      cell: ({ row }) => <span className="text-sm">{row.original.cinemaName}</span>,
    },
    {
      id: "effective",
      header: "Hiệu lực từ / đến",
      cell: ({ row }) => (
        <span className="text-sm">
          {formatDate(row.original.effectiveFrom)} — {formatDate(row.original.effectiveTo)}
        </span>
      ),
    },
    {
      accessorKey: "isActive",
      header: "Trạng thái",
      cell: ({ row }) => (
        <StatusBadge status={String(row.original.isActive)} statusMap={STATUS_MAP} />
      ),
    },
    {
      id: "actions",
      cell: ({ row }) => {
        const p = row.original;
        return (
          <ActionMenu
            actions={[
              { label: "Quản lý rule", icon: ListOrdered, onClick: () => onManageRules(p) },
              { label: "Chỉnh sửa", icon: Pencil, onClick: () => onEdit(p) },
              { label: "Xóa", icon: Trash2, variant: "destructive", onClick: () => onDelete(p) },
            ]}
          />
        );
      },
    },
  ];
