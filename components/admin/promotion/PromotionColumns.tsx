"use client";

import type { ColumnDef } from "@tanstack/react-table";
import type { AdminPromotion } from "@/types/admin/promotion";
import { ActionMenu, StatusBadge } from "@/components/shared";
import type { StatusMap } from "@/components/shared";
import { Eye, Pencil } from "lucide-react";
import { Badge } from "@/components/ui/badge";

interface PromotionColumnsProps {
  onViewDetail: (p: AdminPromotion) => void;
  onEdit:       (p: AdminPromotion) => void;
}

const STATUS_MAP: StatusMap = {
  DRAFT:              { label: "Nháp",       variant: "secondary"   },
  PENDING_APPROVAL:   { label: "Chờ duyệt",  variant: "warning"     },
  PUBLISHED:          { label: "Đang chạy",  variant: "success"     },
  PAUSED:             { label: "Tạm dừng",   variant: "warning"     },
  EXPIRED:            { label: "Hết hạn",    variant: "secondary"   },
};

const formatDiscount = (p: AdminPromotion) =>
  p.type === "PERCENTAGE"
    ? `${p.discountValue}%`
    : `${p.discountValue.toLocaleString("vi-VN")} đ`;

const formatDate = (iso: string) =>
  new Date(iso).toLocaleDateString("vi-VN", {
    day: "2-digit", month: "2-digit", year: "numeric",
  });

export const createPromotionColumns = ({
  onViewDetail,
  onEdit,
}: PromotionColumnsProps): ColumnDef<AdminPromotion>[] => [
  {
    accessorKey: "promotionId",
    header: "ID",
    cell: ({ row }) => (
      <span className="font-mono text-xs text-muted-foreground">
        #{row.original.promotionId}
      </span>
    ),
  },
  {
    id: "info",
    header: "Mã / Tên",
    cell: ({ row }) => (
      <div className="space-y-0.5">
        <p className="font-semibold font-mono text-sm">{row.original.code}</p>
        <p className="text-xs text-muted-foreground">{row.original.name}</p>
      </div>
    ),
  },
  {
    id: "discount",
    header: "Giảm giá",
    cell: ({ row }) => (
      <div className="space-y-1">
        <Badge variant="outline" className="font-bold text-base px-2">
          {formatDiscount(row.original)}
        </Badge>
        <p className="text-[10px] text-muted-foreground">
          {row.original.type === "PERCENTAGE" ? "Phần trăm" : "Cố định"}
        </p>
      </div>
    ),
  },
  {
    id: "usage",
    header: "Lượt dùng",
    cell: ({ row }) => {
      const { usedCount, useLimit } = row.original;
      const pct = useLimit ? Math.min(100, Math.round((usedCount / useLimit) * 100)) : null;
      return (
        <div className="space-y-1 min-w-[80px]">
          <p className="text-sm font-medium">
            {usedCount} / <span className="text-muted-foreground">{useLimit ?? "∞"}</span>
          </p>
          {pct !== null && (
            <div className="h-1.5 rounded-full bg-muted overflow-hidden">
              <div
                className={`h-full rounded-full ${pct >= 90 ? "bg-destructive" : "bg-primary"}`}
                style={{ width: `${pct}%` }}
              />
            </div>
          )}
        </div>
      );
    },
  },
  {
    id: "period",
    header: "Thời gian",
    cell: ({ row }) => (
      <div className="text-xs space-y-0.5">
        <p className="text-muted-foreground">Từ {formatDate(row.original.startTime)}</p>
        <p className="text-muted-foreground">Đến {formatDate(row.original.endTime)}</p>
      </div>
    ),
  },
  {
    accessorKey: "status",
    header: "Trạng thái",
    cell: ({ row }) => (
      <StatusBadge status={row.original.status} statusMap={STATUS_MAP} />
    ),
  },
  {
    id: "actions",
    cell: ({ row }) => {
      const p = row.original;
      return (
        <ActionMenu
          actions={[
            { label: "Xem chi tiết", icon: Eye, onClick: () => onViewDetail(p) },
            ...(p.status === "DRAFT"
              ? [{ label: "Chỉnh sửa", icon: Pencil, onClick: () => onEdit(p) }]
              : []),
          ]}
        />
      );
    },
  },
];
