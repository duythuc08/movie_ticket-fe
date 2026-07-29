"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { ArrowLeft, Plus } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { DataTable, PageHeader, ConfirmDialog } from "@/components/shared";
import { Button } from "@/components/ui/button";
import { adminHolidayService } from "@/services/admin/adminHolidayService";
import { createHolidayColumns } from "@/components/admin/price-policy/HolidayColumns";
import { HolidayFormDialog } from "@/components/admin/price-policy/HolidayFormDialog";
import type { Holiday } from "@/types/admin/pricePolicy";

export default function AdminHolidaysPage() {
  const { token } = useAuth();
  const router = useRouter();
  const [items, setItems] = useState<Holiday[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editHoliday, setEditHoliday] = useState<Holiday | null>(null);
  const [deletingHoliday, setDeletingHoliday] = useState<Holiday | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const load = useCallback(async () => {
    if (!token) return;
    setIsLoading(true);
    try {
      const result = await adminHolidayService.getHolidays(token, 0, 200);
      setItems(result.content);
    } catch {
      toast.error("Không thể tải danh sách ngày lễ");
    } finally {
      setIsLoading(false);
    }
  }, [token]);

  useEffect(() => { load(); }, [load]);

  const handleDelete = async () => {
    if (!token || !deletingHoliday) return;
    setIsDeleting(true);
    try {
      await adminHolidayService.deleteHoliday(token, deletingHoliday.holidayId);
      toast.success("Xóa ngày lễ thành công");
      setDeletingHoliday(null);
      load();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Lỗi khi xóa ngày lễ");
    } finally {
      setIsDeleting(false);
    }
  };

  const columns = useMemo(() => createHolidayColumns({
    onEdit: (h) => { setEditHoliday(h); setIsFormOpen(true); },
    onDelete: (h) => setDeletingHoliday(h),
  }), []);

  return (
    <div className="space-y-6">
      <Button variant="ghost" size="sm" className="text-muted-foreground -ml-2" onClick={() => router.push("/admin/price-policies")}>
        <ArrowLeft className="h-4 w-4" /> Quay lại danh sách chính sách giá
      </Button>

      <PageHeader title="Quản lý ngày lễ" description="Danh sách kỳ nghỉ dùng chung cho toàn hệ thống, áp dụng cho rule Ngày lễ trong các chính sách giá">
        <Button onClick={() => { setEditHoliday(null); setIsFormOpen(true); }}>
          <Plus className="h-4 w-4" /> Thêm ngày lễ
        </Button>
      </PageHeader>

      <DataTable
        columns={columns}
        data={items}
        isLoading={isLoading}
        emptyText="Chưa có ngày lễ nào."
      />

      <HolidayFormDialog
        open={isFormOpen}
        onOpenChange={(o) => { setIsFormOpen(o); if (!o) setEditHoliday(null); }}
        onSuccess={load}
        holiday={editHoliday}
      />

      <ConfirmDialog
        open={!!deletingHoliday}
        onOpenChange={(o) => { if (!o) setDeletingHoliday(null); }}
        title="Xóa ngày lễ"
        description={`Bạn có chắc chắn muốn xóa "${deletingHoliday?.name}"? Rule nào đang tham chiếu kỳ nghỉ này sẽ tự động gỡ tham chiếu.`}
        confirmLabel="Xóa"
        confirmVariant="destructive"
        isLoading={isDeleting}
        onConfirm={handleDelete}
      />
    </div>
  );
}
