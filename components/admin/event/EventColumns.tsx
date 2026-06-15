"use client";

import type { ColumnDef } from "@tanstack/react-table";
import type { AdminEvent } from "@/types/admin/promotion";
import { ActionMenu } from "@/components/shared";
import { Pencil, Trash2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";

interface EventColumnsProps {
  onEdit: (e: AdminEvent) => void;
  onDelete: (e: AdminEvent) => void;
}

const EVENT_TYPE_LABELS: Record<string, string> = {
  PREMIERE: "Ra mắt",
  FESTIVAL: "Liên hoan",
  SPECIAL_SCREENING: "Đặc biệt",
  PROMOTION: "Khuyến mãi",
};

const EVENT_TYPE_VARIANT: Record<string, "default" | "secondary" | "outline"> = {
  PREMIERE: "default",
  FESTIVAL: "secondary",
  SPECIAL_SCREENING: "outline",
  PROMOTION: "secondary",
};

const formatDate = (iso: string) =>
  new Date(iso).toLocaleString("vi-VN", {
    day: "2-digit", month: "2-digit", year: "numeric",
    hour: "2-digit", minute: "2-digit", hour12: false,
  });

export const createEventColumns = ({
  onEdit,
  onDelete,
}: EventColumnsProps): ColumnDef<AdminEvent>[] => [
    {
      accessorKey: "eventId",
      header: "ID",
      cell: ({ row }) => (
        <span className=" text-xs text-muted-foreground">#{row.original.eventId}</span>
      ),
    },
    {
      id: "info",
      header: "Sự kiện",
      cell: ({ row }) => (
        <div className="space-y-1">
          <p className="font-semibold">{row.original.title}</p>
          {row.original.movieTitle && (
            <p className="text-xs text-muted-foreground">Phim: {row.original.movieTitle}</p>
          )}
        </div>
      ),
    },
    {
      accessorKey: "eventType",
      header: "Loại",
      cell: ({ row }) => (
        <Badge variant={EVENT_TYPE_VARIANT[row.original.eventType]}>
          {EVENT_TYPE_LABELS[row.original.eventType] ?? row.original.eventType}
        </Badge>
      ),
    },
    {
      id: "period",
      header: "Thời gian",
      cell: ({ row }) => (
        <div className="text-xs space-y-0.5">
          <p><span className="text-muted-foreground">Bắt đầu: </span>{formatDate(row.original.startTime)}</p>
          <p><span className="text-muted-foreground">Kết thúc: </span>{formatDate(row.original.endTime)}</p>
        </div>
      ),
    },
    {
      id: "actions",
      cell: ({ row }) => (
        <ActionMenu
          actions={[
            { label: "Chỉnh sửa", icon: Pencil, onClick: () => onEdit(row.original) },
            { label: "Xóa", icon: Trash2, onClick: () => onDelete(row.original), variant: "destructive" },
          ]}
        />
      ),
    },
  ];
