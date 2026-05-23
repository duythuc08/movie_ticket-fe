"use client";

import type { ColumnDef } from "@tanstack/react-table";
import type { AdminGenre } from "@/types/admin.type";
import { StatusBadge, ActionMenu, ColumnHeader } from "@/components/shared";
import type { StatusMap } from "@/components/shared";
import { Eye, Power, PowerOff } from "lucide-react";

const GENRE_STATUS_MAP: StatusMap = {
    ACTIVE: { label: "Hoạt động", variant: "success" },
    INACTIVE: { label: "Vô hiệu", variant: "secondary" },
};
interface GenreColumnActions {
    onViewDetail: (genre: AdminGenre) => void;
    onToggleStatus: (genre: AdminGenre) => void;
}

export function createGenreColumns(
    actions: GenreColumnActions
): ColumnDef<AdminGenre, unknown>[] {
    return [
        {
            accessorKey: "genreId",
            header: "ID",
            cell: ({ row }) => (
                <span className="font-mono text-xs text-muted-foreground">
                    #{row.original.genreId}
                </span>
            ),
        },
        {
            accessorKey: "name",
            header: ({ column }) => <ColumnHeader column={column} title="Tên thể loại" />,
        },
        {
            accessorKey: "description",
            header: "Mô tả",
            cell: ({ row }) => (
                <span className="line-clamp-2 max-w-xs text-muted-foreground">
                    {row.original.description ?? "—"}
                </span>
            ),
        },
        {
            accessorKey: "entityStatus",
            header: "Trạng thái",
            cell: ({ row }) => (
                <StatusBadge status={row.original.entityStatus} statusMap={GENRE_STATUS_MAP} />
            ),
        },
        {
            id: "actions",
            cell: ({ row }) => {
                const genre = row.original;
                const isActive = genre.entityStatus === "ACTIVE";
                return (
                    <ActionMenu
                        actions={[
                            {
                                label: "Xem chi tiết",
                                icon: Eye,
                                onClick: () => actions.onViewDetail(genre),
                            },
                            {
                                label: isActive ? "Vô hiệu hóa" : "Kích hoạt",
                                icon: isActive ? PowerOff : Power,
                                onClick: () => actions.onToggleStatus(genre),
                                variant: isActive ? "destructive" : "default",
                            },
                        ]}
                    />
                );
            },
        },
    ];
}