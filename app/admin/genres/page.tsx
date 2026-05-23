"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import { toast } from "sonner";
import { Plus } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import type { AdminGenre } from "@/types/admin.type";
import type { GenreFormSchema } from "@/lib/validations/admin.schemas";
import {
    fetchAdminGenres,
    createGenre,
    toggleGenreStatus,
} from "@/services/admin/adminGenreService";
import { DataTable, PageHeader } from "@/components/shared";
import { GenreFormDialog } from "@/components/admin/layout/genre/GenreFormDialog";
import { createGenreColumns } from "@/components/admin/layout/genre/GenreColumns";
import { Button } from "@/components/ui/button";

const STATUS_FILTER_OPTIONS = [
    { label: "Hoạt động", value: "ACTIVE" },
    { label: "Vô hiệu", value: "INACTIVE" },
];

export default function AdminGenresPage() {
    const { token } = useAuth();

    const [genres, setGenres] = useState<AdminGenre[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const [selectedGenre, setSelectedGenre] = useState<AdminGenre | null>(null);
    const [isSubmitting, setIsSubmitting] = useState(false);

    const loadGenres = useCallback(async () => {
        if (!token) return;
        setIsLoading(true);
        try {
            const result = await fetchAdminGenres(token, { page: 0, size: 999 });
            setGenres(result.content);
        } catch {
            toast.error("Không thể tải danh sách thể loại");
        } finally {
            setIsLoading(false);
        }
    }, [token]);

    useEffect(() => { loadGenres(); }, [loadGenres]);

    function handleViewDetail(genre: AdminGenre) {
        setSelectedGenre(genre);
        setIsDialogOpen(true);
    }

    function handleOpenCreate() {
        setSelectedGenre(null);
        setIsDialogOpen(true);
    }

    async function handleFormSubmit(data: GenreFormSchema) {
        if (!token) return;
        setIsSubmitting(true);
        try {
            if (selectedGenre) {
                // TODO: Thêm PUT /admin/genres/{id} vào BE nếu cần cập nhật
                toast.info("Tính năng cập nhật đang được phát triển");
            } else {
                await createGenre(token, {
                    name: data.name,
                    description: data.description || undefined,
                });
                toast.success(`Đã tạo thể loại "${data.name}"`);
            }
            setIsDialogOpen(false);
            loadGenres();
        } catch (error) {
            toast.error(error instanceof Error ? error.message : "Thao tác thất bại");
        } finally {
            setIsSubmitting(false);
        }
    }

    async function handleToggleStatus(genre: AdminGenre) {
        if (!token) return;
        const action = genre.entityStatus === "ACTIVE" ? "vô hiệu hóa" : "kích hoạt";
        try {
            await toggleGenreStatus(token, genre.genreId, genre.entityStatus);
            toast.success(`Đã ${action} "${genre.name}"`);
            loadGenres();
        } catch (error) {
            toast.error(error instanceof Error ? error.message : `Không thể ${action}`);
        }
    }

    const columns = useMemo(
        () => createGenreColumns({
            onViewDetail: handleViewDetail,
            onToggleStatus: handleToggleStatus,
        }),
        // eslint-disable-next-line react-hooks/exhaustive-deps
        [token]
    );

    return (
        <div className="space-y-6">
            <PageHeader
                title="Thể loại phim"
                description="Quản lý các thể loại phim trong hệ thống"
            >
                <Button onClick={handleOpenCreate} className="gap-2">
                    <Plus className="h-4 w-4" /> Thêm thể loại
                </Button>
            </PageHeader>

            <DataTable
                columns={columns}
                data={genres}
                searchKey="name"
                searchPlaceholder="Tìm theo tên thể loại..."
                filters={[{
                    key: "entityStatus",
                    label: "Trạng thái",
                    options: STATUS_FILTER_OPTIONS,
                }]}
                isLoading={isLoading}
                emptyText="Chưa có thể loại nào."
            />

            <GenreFormDialog
                open={isDialogOpen}
                onOpenChange={setIsDialogOpen}
                genre={selectedGenre}
                onSubmit={handleFormSubmit}
                isSubmitting={isSubmitting}
            />
        </div>
    );
}