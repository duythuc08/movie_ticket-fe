"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import { toast } from "sonner";
import { Plus, Search } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import type { AdminPerson, MovieRole } from "@/types/admin.type";
import type { PersonFormSchema } from "@/lib/validations/admin.schemas";
import {
    fetchAdminPersons,
    createPersonsBulk,
    updatePerson,
    togglePersonStatus,
} from "@/services/admin/adminPersonService";
import { fetchAdminMovies, fetchAdminMovieById } from "@/services/admin/adminMovieService";
import { DataTable, PageHeader, SingleSelectWithSearch } from "@/components/shared";
import { PersonFormDialog } from "@/components/admin/layout/person/PersonFormDialog";
import { PersonBulkDialog, type PersonBulkPayload } from "@/components/admin/layout/person/PersonBulkDialog";
import { createPersonColumns } from "@/components/admin/layout/person/PersonColumns";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { uploadFileAndGetUrl } from "@/services/admin/adminFileService";

const STATUS_FILTER_OPTIONS = [
    { label: "Hoạt động", value: "ACTIVE" },
    { label: "Vô hiệu", value: "INACTIVE" },
];

const ROLE_FILTER_OPTIONS = [
    { label: "Đạo diễn", value: "DIRECTOR" },
    { label: "Diễn viên", value: "ACTOR" },
];

const PAGE_SIZE = 10;
const MOVIE_OPTIONS_PAGE_SIZE = 20;

export default function AdminPersonsPage() {
    const { token } = useAuth();

    const [persons, setPersons] = useState<AdminPerson[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [isBulkOpen, setIsBulkOpen] = useState(false);
    const [isEditOpen, setIsEditOpen] = useState(false);
    const [selectedPerson, setSelectedPerson] = useState<AdminPerson | null>(null);
    const [isSubmitting, setIsSubmitting] = useState(false);

    const [page, setPage] = useState(0);
    const [totalPages, setTotalPages] = useState(1);
    const [totalElements, setTotalElements] = useState(0);
    const [movieRole, setMovieRole] = useState<string | undefined>(undefined);
    const [entityStatus, setEntityStatus] = useState<string | undefined>(undefined);
    const [keywordInput, setKeywordInput] = useState("");
    const [keyword, setKeyword] = useState("");

    const [movieOptions, setMovieOptions] = useState<{ value: string; label: string }[]>([]);
    const [movieOptionsPage, setMovieOptionsPage] = useState(0);
    const [movieOptionsTotalPages, setMovieOptionsTotalPages] = useState(1);
    const [isLoadingMovieOptions, setIsLoadingMovieOptions] = useState(false);
    const [isLoadingMoreMovieOptions, setIsLoadingMoreMovieOptions] = useState(false);
    const [movieFilterId, setMovieFilterId] = useState<string>("");
    const [fetchedMovieId, setFetchedMovieId] = useState<string>("");
    const [fetchedPersonIds, setFetchedPersonIds] = useState<Set<number>>(new Set());

    useEffect(() => {
        const t = setTimeout(() => setKeyword(keywordInput), 500);
        return () => clearTimeout(t);
    }, [keywordInput]);

    // Khi loc theo phim duoc chon: tam tat server pagination, tai het person
    // (139 dong, chap nhan duoc) de loc client theo castPersons/directors cua
    // phim do -- backend khong ho tro filter person theo movieId truc tiep.
    const isFilteringByMovie = !!movieFilterId;

    const loadPersons = useCallback(async (targetPage = 0) => {
        if (!token) return;
        setIsLoading(true);
        try {
            const result = await fetchAdminPersons(token, {
                page: targetPage,
                size: isFilteringByMovie ? 999 : PAGE_SIZE,
                movieRole: movieRole as MovieRole | undefined,
                entityStatus: entityStatus as AdminPerson["entityStatus"] | undefined,
                name: keyword || undefined,
            });
            setPersons(result.content);
            setTotalPages(result.totalPages);
            setTotalElements(result.totalElements);
        } catch {
            toast.error("Không thể tải danh sách diễn viên / đạo diễn");
        } finally {
            setIsLoading(false);
        }
    }, [token, movieRole, entityStatus, keyword, isFilteringByMovie]);

    useEffect(() => { setPage(0); loadPersons(0); }, [loadPersons]);

    const loadMovieOptions = useCallback(async (targetPage: number, append: boolean) => {
        if (!token) return;
        if (append) setIsLoadingMoreMovieOptions(true); else setIsLoadingMovieOptions(true);
        try {
            const result = await fetchAdminMovies(token, {
                page: targetPage,
                size: MOVIE_OPTIONS_PAGE_SIZE,
                sort: "title,asc",
            });
            const newOptions = result.content.map((m) => ({ value: String(m.movieId), label: m.title }));
            setMovieOptions((prev) => (append ? [...prev, ...newOptions] : newOptions));
            setMovieOptionsPage(result.currentPage);
            setMovieOptionsTotalPages(result.totalPages);
        } catch {
            // dropdown loc theo phim la tuy chon, khong chan trang neu loi
        } finally {
            if (append) setIsLoadingMoreMovieOptions(false); else setIsLoadingMovieOptions(false);
        }
    }, [token]);

    useEffect(() => { loadMovieOptions(0, false); }, [loadMovieOptions]);

    const handleLoadMoreMovieOptions = useCallback(() => {
        if (movieOptionsPage + 1 < movieOptionsTotalPages) {
            loadMovieOptions(movieOptionsPage + 1, true);
        }
    }, [loadMovieOptions, movieOptionsPage, movieOptionsTotalPages]);

    useEffect(() => {
        if (!movieFilterId || !token) return;
        fetchAdminMovieById(token, Number(movieFilterId))
            .then(movie => {
                const ids = new Set([
                    ...(movie.castPersons || []).map((p) => p.id),
                    ...(movie.directors || []).map((p) => p.id),
                ]);
                setFetchedMovieId(movieFilterId);
                setFetchedPersonIds(ids);
            })
            .catch(() => {});
    }, [movieFilterId, token]);

    const displayedPersons = useMemo(
        () => (movieFilterId && movieFilterId === fetchedMovieId
            ? persons.filter(p => fetchedPersonIds.has(p.id))
            : persons),
        [persons, movieFilterId, fetchedMovieId, fetchedPersonIds]
    );

    function handleEdit(person: AdminPerson) {
        setSelectedPerson(person);
        setIsEditOpen(true);
    }

    async function handleBulkSubmit(items: PersonBulkPayload[]) {
        if (!token) return;
        setIsSubmitting(true);
        try {
            const payloads = await Promise.all(
                items.map(async (item) => ({
                    name: item.name,
                    movieRole: item.movieRole,
                    avatarUrl: item.avatarFile
                        ? await uploadFileAndGetUrl(token, item.avatarFile)
                        : undefined,
                }))
            );
            const created = await createPersonsBulk(token, payloads);
            toast.success(`Đã thêm ${created.length} nhân sự thành công`);
            setIsBulkOpen(false);
            loadPersons(page);
        } catch (error) {
            toast.error(error instanceof Error ? error.message : "Thêm nhân sự thất bại");
        } finally {
            setIsSubmitting(false);
        }
    }

    async function handleEditSubmit(data: PersonFormSchema) {
        if (!token || !selectedPerson) return;
        setIsSubmitting(true);
        try {
            let avatarUrl: string | undefined;
            if (data.avatarUrl instanceof File) {
                avatarUrl = await uploadFileAndGetUrl(token, data.avatarUrl);
            } else if (typeof data.avatarUrl === "string" && data.avatarUrl) {
                avatarUrl = data.avatarUrl;
            }
            const updated = await updatePerson(token, selectedPerson.id, {
                name: data.name,
                avatarUrl,
                movieRole: data.movieRole,
            });
            toast.success(`Đã cập nhật "${updated.name}" thành công`);
            setIsEditOpen(false);
            loadPersons(page);
        } catch (error) {
            toast.error(error instanceof Error ? error.message : "Cập nhật thất bại");
        } finally {
            setIsSubmitting(false);
        }
    }

    async function handleToggleStatus(person: AdminPerson) {
        if (!token) return;
        const action = person.entityStatus === "ACTIVE" ? "vô hiệu hóa" : "kích hoạt";
        try {
            await togglePersonStatus(token, person.id, person.entityStatus);
            toast.success(`Đã ${action} "${person.name}"`);
            loadPersons(page);
        } catch (error) {
            toast.error(error instanceof Error ? error.message : `Không thể ${action}`);
        }
    }

    const columns = useMemo(
        () => createPersonColumns({
            onEdit: handleEdit,
            onToggleStatus: handleToggleStatus,
        }),
        // eslint-disable-next-line react-hooks/exhaustive-deps
        [token]
    );

    return (
        <div className="space-y-6">
            <PageHeader
                title="Diễn viên & Đạo diễn"
                description="Quản lý thông tin diễn viên và đạo diễn trong hệ thống"
            >
                <Button onClick={() => setIsBulkOpen(true)} className="gap-2">
                    <Plus className="h-4 w-4" /> Thêm mới
                </Button>
            </PageHeader>

            <div className="flex flex-wrap items-center gap-4 bg-card p-4 rounded-lg border shadow-sm">
                <div className="relative flex-1 min-w-50 max-w-sm">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                        placeholder="Tìm theo tên..."
                        value={keywordInput}
                        onChange={(e) => setKeywordInput(e.target.value)}
                        className="pl-9"
                    />
                </div>

                <Select
                    value={movieRole ?? "__all__"}
                    onValueChange={(value) => setMovieRole(value === "__all__" ? undefined : value)}
                >
                    <SelectTrigger className="w-40">
                        <SelectValue placeholder="Vai trò" />
                    </SelectTrigger>
                    <SelectContent data-admin="">
                        {ROLE_FILTER_OPTIONS.map((opt) => (
                            <SelectItem key={opt.value} value={opt.value}>
                                {opt.label}
                            </SelectItem>
                        ))}
                        <SelectItem value="__all__">Tất cả</SelectItem>
                    </SelectContent>
                </Select>

                <Select
                    value={entityStatus ?? "__all__"}
                    onValueChange={(value) => setEntityStatus(value === "__all__" ? undefined : value)}
                >
                    <SelectTrigger className="w-40">
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

                <SingleSelectWithSearch
                    options={movieOptions}
                    value={movieFilterId}
                    onChange={setMovieFilterId}
                    placeholder="Lọc theo phim"
                    searchPlaceholder="Tìm tên phim..."
                    isLoading={isLoadingMovieOptions}
                    hasMore={movieOptionsPage + 1 < movieOptionsTotalPages}
                    isLoadingMore={isLoadingMoreMovieOptions}
                    onLoadMore={handleLoadMoreMovieOptions}
                    className="w-52"
                />
            </div>

            <DataTable
                columns={columns}
                data={displayedPersons}
                isLoading={isLoading}
                emptyText="Chưa có diễn viên / đạo diễn nào."
                serverPagination={isFilteringByMovie ? undefined : {
                    page,
                    pageCount: totalPages,
                    total: totalElements,
                    onChange: (newPage) => {
                        setPage(newPage);
                        loadPersons(newPage);
                    },
                }}
            />

            <PersonBulkDialog
                open={isBulkOpen}
                onOpenChange={setIsBulkOpen}
                onSubmit={handleBulkSubmit}
                isSubmitting={isSubmitting}
            />

            <PersonFormDialog
                open={isEditOpen}
                onOpenChange={setIsEditOpen}
                person={selectedPerson}
                onSubmit={handleEditSubmit}
                isSubmitting={isSubmitting}
            />
        </div>
    );
}
