"use client";

import type { ColumnDef } from "@tanstack/react-table";
import type { AdminMovie } from "@/types/admin.type";
import { StatusBadge, ActionMenu, ColumnHeader } from "@/components/shared";
import type { StatusMap } from "@/components/shared";
import { Eye, Pencil, Power, PowerOff } from "lucide-react";
import Image from "next/image";

const MOVIE_STATUS_MAP: StatusMap = {
  NOW_SHOWING: { label: "Đang chiếu",  variant: "success"   },
  COMING_SOON: { label: "Sắp chiếu",   variant: "default"   },
  STOPPED:     { label: "Ngừng chiếu", variant: "secondary" },
};

const ENTITY_STATUS_MAP: StatusMap = {
  ACTIVE:   { label: "Hoạt động", variant: "success"   },
  INACTIVE: { label: "Vô hiệu",   variant: "secondary" },
};

interface MovieColumnActions {
  onViewDetail:   (movie: AdminMovie) => void;
  onEdit:         (movie: AdminMovie) => void;
  onToggleStatus: (movie: AdminMovie) => void;
}

export function createMovieColumns(
  actions: MovieColumnActions
): ColumnDef<AdminMovie, unknown>[] {
  return [
    {
      id: "poster",
      header: "Poster",
      cell: ({ row }) => {
        const { posterUrl, title } = row.original;
        return (
          <div className="h-14 w-10 overflow-hidden rounded border border-border bg-muted flex items-center justify-center shrink-0">
            {posterUrl ? (
              <Image src={posterUrl} alt={title} width={40} height={56} className="h-full w-full object-cover" />
            ) : (
              <span className="text-xs text-muted-foreground text-center px-1">No img</span>
            )}
          </div>
        );
      },
    },
    {
      accessorKey: "title",
      header: ({ column }) => <ColumnHeader column={column} title="Tên phim" />,
      cell: ({ row }) => (
        <div className="max-w-xs">
          <p className="font-medium line-clamp-1">{row.original.title}</p>
          <p className="text-xs text-muted-foreground mt-0.5">
            {row.original.duration} phút • {row.original.language}
          </p>
        </div>
      ),
    },
    {
      id: "genre",
      header: "Thể loại",
      cell: ({ row }) => {
        const genres = row.original.genre ?? [];
        return (
          <div className="flex flex-wrap gap-1 max-w-[160px]">
            {genres.slice(0, 2).map((g) => (
              <span
                key={g.genreId}
                className="rounded-full bg-primary/10 px-2 py-0.5 text-xs text-primary border border-primary/20"
              >
                {g.name}
              </span>
            ))}
            {genres.length > 2 && (
              <span className="text-xs text-muted-foreground">+{genres.length - 2}</span>
            )}
          </div>
        );
      },
    },
    {
      accessorKey: "movieStatus",
      header: "Trạng thái chiếu",
      cell: ({ row }) => (
        <StatusBadge status={row.original.movieStatus} statusMap={MOVIE_STATUS_MAP} />
      ),
    },
    {
      accessorKey: "entityStatus",
      header: "Hoạt động",
      cell: ({ row }) => (
        <StatusBadge status={row.original.entityStatus} statusMap={ENTITY_STATUS_MAP} />
      ),
    },
    {
      id: "releaseDate",
      header: "Ngày chiếu",
      cell: ({ row }) => {
        const date = row.original.releaseDate;
        if (!date) return <span className="text-muted-foreground">—</span>;
        return (
          <span className="text-sm text-muted-foreground">
            {new Date(date).toLocaleDateString("vi-VN")}
          </span>
        );
      },
    },
    {
      id: "actions",
      cell: ({ row }) => {
        const movie = row.original;
        const isActive = movie.entityStatus === "ACTIVE";
        return (
          <ActionMenu
            actions={[
              { label: "Xem chi tiết", icon: Eye,    onClick: () => actions.onViewDetail(movie) },
              { label: "Chỉnh sửa",   icon: Pencil,  onClick: () => actions.onEdit(movie) },
              {
                label: isActive ? "Vô hiệu hóa" : "Kích hoạt",
                icon:  isActive ? PowerOff : Power,
                onClick: () => actions.onToggleStatus(movie),
                variant: isActive ? "destructive" : "default",
              },
            ]}
          />
        );
      },
    },
  ];
}
