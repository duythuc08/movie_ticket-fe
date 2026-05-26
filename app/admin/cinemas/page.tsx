"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import { toast } from "sonner";
import { Plus } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import type { AdminCinema } from "@/types/admin.type";
import type { CinemaFormSchema } from "@/lib/validations/admin.schemas";
import {
  fetchAdminCinemas,
  createAdminCinema,
  updateAdminCinema,
  toggleCinemaEntityStatus,
} from "@/services/admin/adminCinemaService";
import { DataTable, PageHeader } from "@/components/shared";
import { Button } from "@/components/ui/button";
import { CinemaFormDialog } from "@/components/admin/cinema/CinemaFormDialog";
import { CinemaDetailDialog } from "@/components/admin/cinema/CinemaDetailDialog";
import { createCinemaColumns } from "@/components/admin/cinema/CinemaColumns";

const CINEMA_STATUS_FILTER = [
  { label: "Hoạt động", value: "OPERATIONAL"        },
  { label: "Tạm đóng",  value: "TEMPORARILY_CLOSED" },
];

export default function AdminCinemasPage() {
  const { token } = useAuth();

  const [cinemas,       setCinemas]       = useState<AdminCinema[]>([]);
  const [isLoading,     setIsLoading]     = useState(false);
  const [isFormOpen,    setIsFormOpen]    = useState(false);
  const [isDetailOpen,  setIsDetailOpen]  = useState(false);
  const [selectedCinema, setSelectedCinema] = useState<AdminCinema | null>(null);
  const [isSubmitting,  setIsSubmitting]  = useState(false);

  const loadCinemas = useCallback(async () => {
    if (!token) return;
    setIsLoading(true);
    try {
      const result = await fetchAdminCinemas(token, { page: 0, size: 999 });
      setCinemas(result.content);
    } catch {
      toast.error("Không thể tải danh sách rạp chiếu");
    } finally {
      setIsLoading(false);
    }
  }, [token]);

  useEffect(() => { loadCinemas(); }, [loadCinemas]);

  function handleOpenCreate() {
    setSelectedCinema(null);
    setIsFormOpen(true);
  }

  function handleViewDetail(cinema: AdminCinema) {
    setSelectedCinema(cinema);
    setIsDetailOpen(true);
  }

  function handleEdit(cinema: AdminCinema) {
    setSelectedCinema(cinema);
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
      loadCinemas();
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
      loadCinemas();
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

      <DataTable
        columns={columns}
        data={cinemas}
        searchKey="name"
        searchPlaceholder="Tìm theo tên rạp..."
        filters={[{
          key:     "cinemaStatus",
          label:   "Vận hành",
          options: CINEMA_STATUS_FILTER,
        }]}
        isLoading={isLoading}
        emptyText="Chưa có rạp chiếu nào."
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
      />
    </div>
  );
}
