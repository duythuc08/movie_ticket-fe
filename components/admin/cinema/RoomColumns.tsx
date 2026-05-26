"use client";

import type { ColumnDef } from "@tanstack/react-table";
import type { AdminRoom, RoomType, RoomStatus } from "@/types/admin.type";
import { StatusBadge, ActionMenu, ColumnHeader } from "@/components/shared";
import type { StatusMap } from "@/components/shared";
import { Eye, Pencil, Power, PowerOff } from "lucide-react";
import { Badge } from "@/components/ui/badge";

export const ROOM_TYPE_LABELS: Record<RoomType, string> = {
  STANDARD: "Thường",
  VIP:      "VIP",
  IMAX:     "IMAX",
  THREE_D:  "3D",
};

export const ROOM_TYPE_BADGE_CLASSES: Record<RoomType, string> = {
  STANDARD: "bg-blue-600 text-white border-transparent",
  VIP:      "bg-amber-500 text-white border-transparent",
  IMAX:     "bg-violet-600 text-white border-transparent",
  THREE_D:  "bg-teal-500 text-white border-transparent",
};

export const ROOM_TYPE_OPTIONS: { value: RoomType; label: string }[] = [
  { value: "STANDARD", label: "Phòng thường" },
  { value: "VIP",      label: "Phòng VIP"    },
  { value: "IMAX",     label: "Phòng IMAX"   },
  { value: "THREE_D",  label: "Phòng 3D"     },
];

export const ROOM_STATUS_OPTIONS: { value: RoomStatus; label: string }[] = [
  { value: "OPERATIONAL", label: "Hoạt động"    },
  { value: "MAINTENANCE", label: "Đang bảo trì" },
  { value: "CLEANING",    label: "Vệ sinh"       },
];

const ROOM_STATUS_MAP: StatusMap = {
  OPERATIONAL: { label: "Hoạt động",    variant: "success"   },
  MAINTENANCE: { label: "Đang bảo trì", variant: "warning"   },
  CLEANING:    { label: "Vệ sinh",      variant: "secondary" },
};

const ENTITY_STATUS_MAP: StatusMap = {
  ACTIVE:   { label: "Kích hoạt", variant: "success"   },
  INACTIVE: { label: "Vô hiệu",   variant: "secondary" },
};

interface RoomColumnActions {
  onViewDetail:   (room: AdminRoom) => void;
  onEdit:         (room: AdminRoom) => void;
  onToggleStatus: (room: AdminRoom) => void;
}

export function createRoomColumns(
  actions: RoomColumnActions
): ColumnDef<AdminRoom, unknown>[] {
  return [
    {
      accessorKey: "name",
      header: ({ column }) => <ColumnHeader column={column} title="Tên phòng" />,
      cell: ({ row }) => (
        <span className="font-medium">{row.original.name}</span>
      ),
    },
    {
      id: "cinema",
      header: "Rạp chiếu",
      cell: ({ row }) => (
        <span className="text-sm text-muted-foreground">
          {row.original.cinemas.name}
        </span>
      ),
    },
    {
      accessorKey: "roomType",
      header: "Loại phòng",
      cell: ({ row }) => (
        <Badge variant="outline" className={`text-xs ${ROOM_TYPE_BADGE_CLASSES[row.original.roomType]}`}>
          {ROOM_TYPE_LABELS[row.original.roomType]}
        </Badge>
      ),
    },
    {
      accessorKey: "capacity",
      header: ({ column }) => <ColumnHeader column={column} title="Sức chứa" />,
      cell: ({ row }) => (
        <span className="text-sm">{row.original.capacity} ghế</span>
      ),
    },
    {
      accessorKey: "roomStatus",
      header: "Vận hành",
      cell: ({ row }) => (
        <StatusBadge status={row.original.roomStatus} statusMap={ROOM_STATUS_MAP} />
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
        const room = row.original;
        const isActive = room.entityStatus === "ACTIVE";
        return (
          <ActionMenu
            actions={[
              { label: "Xem chi tiết", icon: Eye,    onClick: () => actions.onViewDetail(room) },
              { label: "Chỉnh sửa",   icon: Pencil,  onClick: () => actions.onEdit(room) },
              {
                label:   isActive ? "Vô hiệu hóa" : "Kích hoạt",
                icon:    isActive ? PowerOff : Power,
                onClick: () => actions.onToggleStatus(room),
                variant: isActive ? "destructive" : "default",
              },
            ]}
          />
        );
      },
    },
  ];
}
