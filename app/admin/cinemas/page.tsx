"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import { toast } from "sonner";
import { Plus, Search } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import type { AdminCinema, AdminCinemaDetail } from "@/types/admin.type";
import type { CinemaFormSchema } from "@/lib/validations/admin.schemas";
import {
  fetchAdminCinemas,
  fetchAdminCinemaById,
  createAdminCinema,
  updateAdminCinema,
  toggleCinemaEntityStatus,
} from "@/services/admin/adminCinemaService";
import { DataTable, PageHeader } from "@/components/shared";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { CinemaFormDialog } from "@/components/admin/cinema/CinemaFormDialog";
import { CinemaDetailDialog } from "@/components/admin/cinema/CinemaDetailDialog";
import { createCinemaColumns } from "@/components/admin/cinema/CinemaColumns";

const CINEMA_STATUS_FILTER = [
  { label: "Hoạt động", value: "OPERATIONAL"        },
  { label: "Tạm đóng",  value: "TEMPORARILY_CLOSED" },
];

const PAGE_SIZE = 10;

export default function AdminCinemasPage() {
  const { token } = useAuth();

  const [cinemas,       setCinemas]       = useState<AdminCinema[]>([]);
  const [isLoading,     setIsLoading]     = useState(false);
  const [isFormOpen,    setIsFormOpen]    = useState(false);
  const [isDetailOpen,  setIsDetailOpen]  = useState(false);
  const [selectedCinema, setSelectedCinema] = useState<AdminCinemaDetail | AdminCinema | null>(null);
  const [isSubmitting,  setIsSubmitting]  = useState(false);

  const [page, setPage] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [totalElements, setTotalElements] = useState(0);
  const [cinemaStatus, setCinemaStatus] = useState<string | undefined>(undefined);
  const [keywordInput, setKeywordInput] = useState("");
  const [keyword, setKeyword] = useState("");

  useEffect(() => {
    const t = setTimeout(() => setKeyword(keywordInput), 500);
    return () => clearTimeout(t);
  }, [keywordInput]);

  const loadCinemas = useCallback(async (targetPage = 0) => {
    if (!token) return;
    setIsLoading(true);
    try {
      const result = await fetchAdminCinemas(token, {
        page: targetPage,
        size: PAGE_SIZE,
        cinemaStatus: cinemaStatus as AdminCinema["cinemaStatus"] | undefined,
        name: keyword || undefined,
      });
      setCinemas(result.content);
      setTotalPages(result.totalPages);
      setTotalElements(result.totalElements);
    } catch {
      toast.error("Không thể tải danh sách rạp chiếu");
    } finally {
      setIsLoading(false);
    }
  }, [token, cinemaStatus, keyword]);

  useEffect(() => { setPage(0); loadCinemas(0); }, [loadCinemas]);

  function handleOpenCreate() {
    setSelectedCinema(null);
    setIsFormOpen(true);
  }

  function handleViewDetail(cinema: AdminCinema) {
    setSelectedCinema(cinema);
    setIsDetailOpen(true);
  }

  async function handleEdit(cinema: AdminCinema) {
    if (!token) return;
    setIsLoading(true);
    try {
      const detail = await fetchAdminCinemaById(token, cinema.cinemaId);
      setSelectedCinema(detail);
      setIsFormOpen(true);
    } catch {
      toast.error("Không thể tải chi tiết rạp");
    } finally {
      setIsLoading(false);
    }
  }

  function handleEditFromDetail(detail: any) {
    setIsDetailOpen(false);
    setSelectedCinema(detail);
    setIsFormOpen(true);
  }

  async function handleFormSubmit(data: CinemaFormSchema) {
    if (!token) return;
    setIsSubmitting(true);
    try {
      if (selectedCinema) {
        await updateAdminCinema(token, selectedCinema.cinemaId, data);
        toast.success(`Đã cập nhật rạp "${data.name}"`);
      } else {
        await createAdminCinema(token, data);
        toast.success(`Đã thêm rạp "${data.name}"`);
      }
      setIsFormOpen(false);
      setSelectedCinema(null);
      loadCinemas(page);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Lưu rạp chiếu thất bại");
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handleToggleStatus(cinema: AdminCinema) {
    if (!token) return;
    const action = cinema.entityStatus === "ACTIVE" ? "vô hiệu hóa" : "kích hoạt";
    try {
      await toggleCinemaEntityStatus(token, cinema.cinemaId, cinema.entityStatus);
      toast.success(`Đã ${action} rạp "${cinema.name}"`);
      loadCinemas(page);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : `Không thể ${action} rạp`);
    }
  }

  const columns = useMemo(
    () => createCinemaColumns({
      onViewDetail:   handleViewDetail,
      onEdit:         handleEdit,
      onToggleStatus: handleToggleStatus,
    }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [token]
  );

  return (
    <div className="space-y-6">
      <PageHeader
        title="Quản lý Rạp chiếu"
        description="Thêm, chỉnh sửa và quản lý các cụm rạp trong hệ thống"
      >
        <Button onClick={handleOpenCreate} className="gap-2">
          <Plus className="h-4 w-4" /> Thêm rạp mới
        </Button>
      </PageHeader>

      <div className="flex flex-wrap items-center gap-4 bg-card p-4 rounded-lg border shadow-sm">
        <div className="relative flex-1 min-w-50 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Tìm theo tên rạp..."
            value={keywordInput}
            onChange={(e) => setKeywordInput(e.target.value)}
            className="pl-9"
          />
        </div>

        <Select
          value={cinemaStatus ?? "__all__"}
          onValueChange={(value) => setCinemaStatus(value === "__all__" ? undefined : value)}
        >
          <SelectTrigger className="w-45">
            <SelectValue placeholder="Vận hành" />
          </SelectTrigger>
          <SelectContent data-admin="">
            {CINEMA_STATUS_FILTER.map((opt) => (
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
        data={cinemas}
        isLoading={isLoading}
        emptyText="Chưa có rạp chiếu nào."
        serverPagination={{
          page,
          pageCount: totalPages,
          total: totalElements,
          onChange: (newPage) => {
            setPage(newPage);
            loadCinemas(newPage);
          },
        }}
      />

      <CinemaFormDialog
        open={isFormOpen}
        onOpenChange={(isOpen) => {
          setIsFormOpen(isOpen);
          if (!isOpen) setSelectedCinema(null);
        }}
        cinema={selectedCinema}
        onSubmit={handleFormSubmit}
        isSubmitting={isSubmitting}
      />

      <CinemaDetailDialog
        open={isDetailOpen}
        onOpenChange={(isOpen) => {
          setIsDetailOpen(isOpen);
          if (!isOpen) setSelectedCinema(null);
        }}
        cinemaId={selectedCinema?.cinemaId ?? null}
        onEdit={handleEditFromDetail}
      />
    </div>
  );
}
