"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import { toast } from "sonner";
import { Plus } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import type { AdminPerson } from "@/types/admin.type";
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
import { uploadFileAndGetUrl } from "@/services/admin/adminFileService";

const STATUS_FILTER_OPTIONS = [
    { label: "Hoạt động", value: "ACTIVE" },
    { label: "Vô hiệu", value: "INACTIVE" },
];

const ROLE_FILTER_OPTIONS = [
    { label: "Đạo diễn", value: "DIRECTOR" },
    { label: "Diễn viên", value: "ACTOR" },
];

export default function AdminPersonsPage() {
    const { token } = useAuth();

    const [persons, setPersons] = useState<AdminPerson[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [isBulkOpen, setIsBulkOpen] = useState(false);
    const [isEditOpen, setIsEditOpen] = useState(false);
    const [selectedPerson, setSelectedPerson] = useState<AdminPerson | null>(null);
    const [isSubmitting, setIsSubmitting] = useState(false);

    const [movieOptions, setMovieOptions] = useState<{ value: string; label: string }[]>([]);
    const [movieFilterId, setMovieFilterId] = useState<string>("");
    const [fetchedMovieId, setFetchedMovieId] = useState<string>("");
    const [fetchedPersonIds, setFetchedPersonIds] = useState<Set<number>>(new Set());

    const loadPersons = useCallback(async () => {
        if (!token) return;
        setIsLoading(true);
        try {
            const result = await fetchAdminPersons(token, { page: 0, size: 999 });
            setPersons(result.content);
        } catch {
            toast.error("Không thể tải danh sách diễn viên / đạo diễn");
        } finally {
            setIsLoading(false);
        }
    }, [token]);

    useEffect(() => { loadPersons(); }, [loadPersons]);

    useEffect(() => {
        if (!token) return;
        fetchAdminMovies(token, { size: 200 })
            .then(res => {
                setMovieOptions(res.content.map(m => ({ value: String(m.movieId), label: m.title })));
            })
            .catch(() => {});
    }, [token]);

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
            loadPersons();
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
            loadPersons();
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
            loadPersons();
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

            <DataTable
                columns={columns}
                data={displayedPersons}
                searchKey="name"
                searchPlaceholder="Tìm theo tên..."
                filters={[
                    { key: "movieRole", label: "Vai trò", options: ROLE_FILTER_OPTIONS },
                    { key: "entityStatus", label: "Trạng thái", options: STATUS_FILTER_OPTIONS },
                ]}
                isLoading={isLoading}
                emptyText="Chưa có diễn viên / đạo diễn nào."
                onResetFilters={() => setMovieFilterId("")}
            >
                <SingleSelectWithSearch
                    options={movieOptions}
                    value={movieFilterId}
                    onChange={setMovieFilterId}
                    placeholder="Lọc theo phim"
                    searchPlaceholder="Tìm tên phim..."
                    className="w-52"
                />
            </DataTable>

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
