"use client";

import type { ColumnDef } from "@tanstack/react-table";
import type { AdminUser } from "@/types/admin/user";
import { ActionMenu, StatusBadge } from "@/components/shared";
import type { StatusMap } from "@/components/shared";
import { Eye, Pencil, ShieldBan, Power, PowerOff, AlertTriangle } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

interface UserColumnsProps {
  onViewDetail:   (u: AdminUser) => void;
  onEdit:         (u: AdminUser) => void;
  onBan:          (u: AdminUser) => void;
  onToggleStatus: (u: AdminUser) => void;
}

const USER_STATUS_MAP: StatusMap = {
  UNVERIFIED: { label: "Chưa xác minh", variant: "warning"     },
  VERIFIED:   { label: "Đã xác minh",   variant: "success"     },
  BANNED:     { label: "Bị cấm",        variant: "destructive" },
};

export const createUserColumns = ({
  onViewDetail, onEdit, onBan, onToggleStatus,
}: UserColumnsProps): ColumnDef<AdminUser>[] => [
  {
    accessorKey: "userId",
    header: "ID",
    cell: ({ row }) => (
      <span className="text-xs text-muted-foreground" title={row.original.userId}>
        {row.original.userId.slice(0, 8)}…
      </span>
    ),
  },
  {
    id: "identity",
    header: "Tài khoản",
    cell: ({ row }) => {
      const u = row.original;
      const name = [u.firstname, u.lastname].filter(Boolean).join(" ");
      return (
        <div className="space-y-0.5">
          <p className="font-medium text-sm">{u.username}</p>
          {name && <p className="text-xs text-muted-foreground">{name}</p>}
        </div>
      );
    },
  },
  {
    id: "membership",
    header: "Hạng / Điểm",
    cell: ({ row }) => {
      const u = row.original;
      return (
        <div className="space-y-1">
          {u.memberShipTierName ? (
            <Badge variant="secondary" className="text-xs ">{u.memberShipTierName}</Badge>
          ) : (
            <span className="text-xs text-muted-foreground italic">Chưa có hạng</span>
          )}
        </div>
      );
    },
  },
  {
    id: "roles",
    header: "Vai trò",
    cell: ({ row }) => (
      <div className="flex flex-wrap gap-1">
        {row.original.roles.map((r) => (
          <Badge key={r.name} variant={r.name === "ADMIN" ? "default" : "outline"} className="text-xs">
            {r.name}
          </Badge>
        ))}
      </div>
    ),
  },
  {
    id: "status",
    header: "Trạng thái",
    cell: ({ row }) => {
      const u = row.original;
      return (
        <TooltipProvider>
          <div className="relative inline-flex pt-2 pr-2">
            <StatusBadge status={u.userStatus} statusMap={USER_STATUS_MAP} />
            {u.entityStatus === "INACTIVE" && (
              <Tooltip>
                <TooltipTrigger asChild>
                  <span className="absolute top-0 right-0 flex h-4 w-4 cursor-default items-center justify-center rounded-full bg-amber-300 text-white shadow-sm">
                    <AlertTriangle className="h-2.5 w-2.5" />
                  </span>
                </TooltipTrigger>
                <TooltipContent side="top">Ngưng hoạt động</TooltipContent>
              </Tooltip>
            )}
          </div>
        </TooltipProvider>
      );
    },
  },
  {
    id: "actions",
    cell: ({ row }) => {
      const u = row.original;
      return (
        <ActionMenu
          actions={[
            { label: "Xem chi tiết",  icon: Eye,      onClick: () => onViewDetail(u) },
            { label: "Chỉnh sửa",     icon: Pencil,   onClick: () => onEdit(u) },
            {
              label: u.entityStatus === "ACTIVE" ? "Vô hiệu hóa" : "Kích hoạt",
              icon: u.entityStatus === "ACTIVE" ? PowerOff : Power,
              onClick: () => onToggleStatus(u),
            },
            { label: "Khóa tài khoản", icon: ShieldBan, onClick: () => onBan(u), variant: "destructive" },
          ]}
        />
      );
    },
  },
];
