"use client";

import type { ColumnDef } from "@tanstack/react-table";
import type { AdminPerson } from "@/types/admin.type";
import { StatusBadge, ActionMenu, ColumnHeader } from "@/components/shared";
import type { StatusMap } from "@/components/shared";
import { Eye, Power, PowerOff } from "lucide-react";
import Image from "next/image";

const PERSON_STATUS_MAP: StatusMap = {
    ACTIVE: { label: "Hoạt động", variant: "success" },
    INACTIVE: { label: "Vô hiệu", variant: "secondary" },
};

const ROLE_MAP: StatusMap = {
    DIRECTOR: { label: "Đạo diễn", variant: "default" },
    ACTOR: { label: "Diễn viên", variant: "secondary" },
};

interface PersonColumnActions {
    onEdit: (person: AdminPerson) => void;
    onToggleStatus: (person: AdminPerson) => void;
}

export function createPersonColumns(
    actions: PersonColumnActions
): ColumnDef<AdminPerson, unknown>[] {
    return [
        {
            accessorKey: "id",
            header: "ID",
            cell: ({ row }) => (
                <span className="font-mono text-xs text-muted-foreground">#{row.original.id}</span>
            ),
        },
        {
            id: "avatar",
            header: "Ảnh",
            cell: ({ row }) => {
                const { avatarUrl, name } = row.original;
                return (
                    <div className="h-10 w-10 overflow-hidden rounded-full border border-border bg-muted flex items-center justify-center">
                        {avatarUrl ? (
                            <Image src={avatarUrl} alt={name} width={40} height={40} className="h-full w-full object-cover" />
                        ) : (
                            <span className="text-lg text-muted-foreground">
                                {name.charAt(0).toUpperCase()}
                            </span>
                        )}
                    </div>
                );
            },
        },
        {
            accessorKey: "name",
            header: ({ column }) => <ColumnHeader column={column} title="Họ và tên" />,
        },
        {
            accessorKey: "movieRole",
            header: "Vai trò",
            cell: ({ row }) => (
                <StatusBadge status={row.original.movieRole} statusMap={ROLE_MAP} />
            ),
        },
        {
            accessorKey: "entityStatus",
            header: "Trạng thái",
            cell: ({ row }) => (
                <StatusBadge status={row.original.entityStatus} statusMap={PERSON_STATUS_MAP} />
            ),
        },
        {
            id: "actions",
            cell: ({ row }) => {
                const person = row.original;
                const isActive = person.entityStatus === "ACTIVE";
                return (
                    <ActionMenu
                        actions={[
                            {
                                label: "Xem chi tiết",
                                icon: Eye,
                                onClick: () => actions.onEdit(person),
                            },
                            {
                                label: isActive ? "Vô hiệu hóa" : "Kích hoạt",
                                icon: isActive ? PowerOff : Power,
                                onClick: () => actions.onToggleStatus(person),
                                variant: isActive ? "destructive" : "default",
                            },
                        ]}
                    />
                );
            },
        },
    ];
}