"use client";

import { ColumnDef } from "@tanstack/react-table";
import { Showtime } from "@/types/admin/showtime";
import { Badge } from "@/components/ui/badge";
import { ActionMenu, StatusBadge } from "@/components/shared";
import type { StatusMap } from "@/components/shared";
import { Eye, XCircle } from "lucide-react";

interface ShowtimeColumnsProps {
  onViewDetail: (showtime: Showtime) => void;
  onCancel: (showtime: Showtime) => void;
}

const STATUS_MAP: StatusMap = {
  SCHEDULED:    { label: "Đã lên lịch", variant: "success"   },
  ONGOING:      { label: "Đang chiếu",  variant: "warning"   },
  COMPLETED:    { label: "Đã xong",     variant: "secondary" },
  CANCELLED:    { label: "Đã huỷ",      variant: "destructive" },
  FULLY_BOOKED: { label: "Full ghế",    variant: "default"   },
};

const formatTime = (isoString: string) => {
  const d = new Date(isoString);
  return d.toLocaleString("vi-VN", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false
  });
};

export const createShowtimeColumns = ({
  onViewDetail,
  onCancel,
}: ShowtimeColumnsProps): ColumnDef<Showtime>[] => [
  {
    accessorKey: "showTimeId",
    header: "ID",
    cell: ({ row }) => <span className="text-muted-foreground">#{row.original.showTimeId}</span>,
  },
  {
    accessorKey: "movieTitle",
    header: "Tên Phim",
    cell: ({ row }) => <span className="font-semibold">{row.original.movieTitle}</span>,
  },
  {
    id: "roomInfo",
    header: "Rạp - Phòng",
    cell: ({ row }) => (
      <div className="flex flex-col text-sm">
        <span>{row.original.cinemaName}</span>
        <span className="text-muted-foreground">{row.original.roomName}</span>
      </div>
    ),
  },
  {
    accessorKey: "startTime",
    header: "Bắt đầu",
    cell: ({ row }) => formatTime(row.original.startTime),
  },
  {
    accessorKey: "endTime",
    header: "Kết thúc",
    cell: ({ row }) => formatTime(row.original.endTime),
  },
  {
    accessorKey: "showTimeStatus",
    header: "Trạng thái",
    cell: ({ row }) => <StatusBadge status={row.original.showTimeStatus} statusMap={STATUS_MAP} />,
  },
  {
    id: "actions",
    cell: ({ row }) => {
      const showtime = row.original;
      const canCancel = showtime.showTimeStatus === "SCHEDULED";
      return (
        <ActionMenu
          actions={[
            { label: "Xem chi tiết", icon: Eye, onClick: () => onViewDetail(showtime) },
            ...(canCancel ? [{
              label: "Huỷ suất chiếu",
              icon: XCircle,
              onClick: () => onCancel(showtime),
              variant: "destructive" as const,
            }] : []),
          ]}
        />
      );
    },
  },
];
