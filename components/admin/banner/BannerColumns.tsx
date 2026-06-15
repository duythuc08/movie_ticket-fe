"use client";

import Image from "next/image";
import type { ColumnDef } from "@tanstack/react-table";
import type { AdminBanner } from "@/types/admin.type";
import { StatusBadge, ActionMenu, ColumnHeader } from "@/components/shared";
import type { StatusMap } from "@/components/shared";
import { Switch } from "@/components/ui/switch";
import { Eye, Pencil, Power, PowerOff } from "lucide-react";

const BANNER_TYPE_MAP: StatusMap = {
  MOVIE: { label: "Phim", variant: "default" },
  EVENT: { label: "Sự kiện", variant: "warning" },
};

interface BannerColumnActions {
  onViewDetail: (banner: AdminBanner) => void;
  onEdit: (banner: AdminBanner) => void;
  onDelete: (banner: AdminBanner) => void;
  onToggleActive: (banner: AdminBanner) => void;
}

export function createBannerColumns(
  actions: BannerColumnActions
): ColumnDef<AdminBanner, unknown>[] {
  return [
    {
      accessorKey: "id",
      header: "ID",
      cell: ({ row }) => (
        <span className=" text-xs text-muted-foreground">
          #{row.original.id}
        </span>
      ),
    },
    {
      accessorKey: "imageUrl",
      header: "Ảnh",
      cell: ({ row }) => {
        const url = row.original.imageUrl;
        return url ? (
          <div className="relative h-12 w-20 overflow-hidden rounded-md border border-border bg-muted">
            <Image
              src={url}
              alt={row.original.title}
              fill
              className="object-cover"
              sizes="80px"
              unoptimized
            />
          </div>
        ) : (
          <div className="h-12 w-20 rounded-md border border-border bg-muted flex items-center justify-center text-xs text-muted-foreground">
            Chưa có
          </div>
        );
      },
    },
    {
      accessorKey: "title",
      header: ({ column }) => <ColumnHeader column={column} title="Tiêu đề" />,
      cell: ({ row }) => (
        <div className="max-w-[200px]">
          <p className="truncate font-medium">{row.original.title}</p>
          {row.original.description && (
            <p className="truncate text-xs text-muted-foreground">{row.original.description}</p>
          )}
        </div>
      ),
    },
    {
      accessorKey: "priority",
      header: ({ column }) => <ColumnHeader column={column} title="Ưu tiên" />,
      cell: ({ row }) => (
        <span className=" text-sm">{row.original.priority}</span>
      ),
    },
    {
      accessorKey: "bannerType",
      header: "Loại",
      cell: ({ row }) => (
        <StatusBadge status={row.original.bannerType} statusMap={BANNER_TYPE_MAP} />
      ),
    },
    {
      accessorKey: "active",
      header: "Hoạt động",
      cell: ({ row }) => {
        const banner = row.original;
        return (
          <Switch
            checked={banner.active}
            onCheckedChange={() => actions.onToggleActive(banner)}
          />
        );
      },
    },
    {
      id: "actions",
      cell: ({ row }) => {
        const banner = row.original;
        return (
          <ActionMenu
            actions={[
              {
                label: "Xem chi tiết",
                icon: Eye,
                onClick: () => actions.onViewDetail(banner),
              },
              {
                label: "Chỉnh sửa",
                icon: Pencil,
                onClick: () => actions.onEdit(banner),
              },
              {
                label: banner.active ? "Ẩn banner" : "Hiển thị banner",
                icon: banner.active ? PowerOff : Power,
                onClick: () => actions.onToggleActive(banner),
                variant: banner.active ? "destructive" : "default",
              },
            ]}
          />
        );
      },
    },
  ];
}
