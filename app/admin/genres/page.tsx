"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import { toast } from "sonner";
import { Plus, Search } from "lucide-react";
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
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

const STATUS_FILTER_OPTIONS = [
    { label: "Hoạt động", value: "ACTIVE" },
    { label: "Vô hiệu", value: "INACTIVE" },
];

const PAGE_SIZE = 10;

export default function AdminGenresPage() {
    const { token } = useAuth();

    const [genres, setGenres] = useState<AdminGenre[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const [selectedGenre, setSelectedGenre] = useState<AdminGenre | null>(null);
    const [isSubmitting, setIsSubmitting] = useState(false);

    const [page, setPage] = useState(0);
    const [totalPages, setTotalPages] = useState(1);
    const [totalElements, setTotalElements] = useState(0);
    const [entityStatus, setEntityStatus] = useState<string | undefined>(undefined);
    const [keywordInput, setKeywordInput] = useState("");
    const [keyword, setKeyword] = useState("");

    useEffect(() => {
        const t = setTimeout(() => setKeyword(keywordInput), 500);
        return () => clearTimeout(t);
    }, [keywordInput]);

    const loadGenres = useCallback(async (targetPage = 0) => {
        if (!token) return;
        setIsLoading(true);
        try {
            const result = await fetchAdminGenres(token, {
                page: targetPage,
                size: PAGE_SIZE,
                entityStatus: entityStatus as AdminGenre["entityStatus"] | undefined,
                name: keyword || undefined,
            });
            setGenres(result.content);
            setTotalPages(result.totalPages);
            setTotalElements(result.totalElements);
        } catch {
            toast.error("Không thể tải danh sách thể loại");
        } finally {
            setIsLoading(false);
        }
    }, [token, entityStatus, keyword]);

    useEffect(() => { setPage(0); loadGenres(0); }, [loadGenres]);

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
            loadGenres(page);
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
            loadGenres(page);
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

            <div className="flex flex-wrap items-center gap-4 bg-card p-4 rounded-lg border shadow-sm">
                <div className="relative flex-1 min-w-50 max-w-sm">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                        placeholder="Tìm theo tên thể loại..."
                        value={keywordInput}
                        onChange={(e) => setKeywordInput(e.target.value)}
                        className="pl-9"
                    />
                </div>

                <Select
                    value={entityStatus ?? "__all__"}
                    onValueChange={(value) => setEntityStatus(value === "__all__" ? undefined : value)}
                >
                    <SelectTrigger className="w-45">
                        <SelectValue placeholder="Trạng thái" />
                    </SelectTrigger>
                    <SelectContent data-admin="">
                        {STATUS_FILTER_OPTIONS.map((opt) => (
                            <SelectItem key={opt.value} value={opt.value}>
                                {opt.label}
                            </SelectItem>
                        ))}
                        <SelectItem value="__all__">Tất cả</SelectItem>
                    </SelectContent>
                </Select>
            </div>

            <DataTable
                columns={columns}
                data={genres}
                isLoading={isLoading}
                emptyText="Chưa có thể loại nào."
                serverPagination={{
                    page,
                    pageCount: totalPages,
                    total: totalElements,
                    onChange: (newPage) => {
                        setPage(newPage);
                        loadGenres(newPage);
                    },
                }}
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