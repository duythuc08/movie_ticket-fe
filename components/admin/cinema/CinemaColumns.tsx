"use client";

import type { ColumnDef } from "@tanstack/react-table";
import type { AdminCinema, CinemaStatus, RoomType, RoomStatus } from "@/types/admin.type";
import { StatusBadge, ActionMenu, ColumnHeader } from "@/components/shared";
import type { StatusMap } from "@/components/shared";
import { Eye, Pencil, Power, PowerOff } from "lucide-react";

const CINEMA_OPERATIONAL_STATUS_MAP: StatusMap = {
  OPERATIONAL: { label: "Hoạt động", variant: "success" },
  TEMPORARILY_CLOSED: { label: "Tạm đóng", variant: "warning" },
};

const ENTITY_STATUS_MAP: StatusMap = {
  ACTIVE: { label: "Kích hoạt", variant: "success" },
  INACTIVE: { label: "Vô hiệu", variant: "secondary" },
};

interface CinemaColumnActions {
  onViewDetail: (cinema: AdminCinema) => void;
  onEdit: (cinema: AdminCinema) => void;
  onToggleStatus: (cinema: AdminCinema) => void;
}

export function createCinemaColumns(
  actions: CinemaColumnActions
): ColumnDef<AdminCinema, unknown>[] {
  return [
    {
      accessorKey: "cinemaId",
      header: "ID",
      cell: ({ row }) => (
        <span className=" text-xs text-muted-foreground">
          #{row.original.cinemaId}
        </span>
      ),
    },
    {
      accessorKey: "name",
      header: ({ column }) => <ColumnHeader column={column} title="Tên rạp" />,
      cell: ({ row }) => (
        <span className="font-medium">{row.original.name}</span>
      ),
    },
    {
      accessorKey: "address",
      header: "Địa chỉ",
      cell: ({ row }) => (
        <span className="line-clamp-2 max-w-xs text-sm text-muted-foreground">
          {row.original.address}
        </span>
      ),
    },
    {
      accessorKey: "phoneNumber",
      header: "Điện thoại",
    },
    {
      accessorKey: "cinemaStatus",
      header: "Vận hành",
      cell: ({ row }) => (
        <StatusBadge status={row.original.cinemaStatus} statusMap={CINEMA_OPERATIONAL_STATUS_MAP} />
      ),
    },
    {
      accessorKey: "entityStatus",
      header: "Trạng thái",
      cell: ({ row }) => (
        <StatusBadge status={row.original.entityStatus} statusMap={ENTITY_STATUS_MAP} />
      ),
    },
    {
      id: "actions",
      cell: ({ row }) => {
        const cinema = row.original;
        const isActive = cinema.entityStatus === "ACTIVE";
        return (
          <ActionMenu
            actions={[
              { label: "Xem chi tiết", icon: Eye, onClick: () => actions.onViewDetail(cinema) },
              { label: "Chỉnh sửa", icon: Pencil, onClick: () => actions.onEdit(cinema) },
              {
                label: isActive ? "Vô hiệu hóa" : "Kích hoạt",
                icon: isActive ? PowerOff : Power,
                onClick: () => actions.onToggleStatus(cinema),
                variant: isActive ? "destructive" : "default",
              },
            ]}
          />
        );
      },
    },
  ];
}

export const CINEMA_STATUS_OPTIONS: { value: CinemaStatus; label: string }[] = [
  { value: "OPERATIONAL", label: "Hoạt động" },
  { value: "TEMPORARILY_CLOSED", label: "Tạm đóng" },
];

export const ROOM_TYPE_LABELS: Record<RoomType, string> = {
  STANDARD: "Thường",
  VIP: "VIP",
  IMAX: "IMAX",
  THREE_D: "3D",
};

export const ROOM_STATUS_LABELS: Record<RoomStatus, string> = {
  OPERATIONAL: "Hoạt động",
  MAINTENANCE: "Bảo trì",
  CLEANING: "Vệ sinh",
};
