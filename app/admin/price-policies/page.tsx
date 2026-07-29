"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Plus, CalendarHeart } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { DataTable, PageHeader, ConfirmDialog } from "@/components/shared";
import { Button } from "@/components/ui/button";
import { adminPricePolicyService } from "@/services/admin/adminPricePolicyService";
import { adminHolidayService } from "@/services/admin/adminHolidayService";
import { createPricePolicyColumns } from "@/components/admin/price-policy/PricePolicyColumns";
import { PricePolicyFilters } from "@/components/admin/price-policy/PricePolicyFilters";
import { PricePolicyFormDialog } from "@/components/admin/price-policy/PricePolicyFormDialog";
import { createHolidayColumns } from "@/components/admin/price-policy/HolidayColumns";
import { HolidayFormDialog } from "@/components/admin/price-policy/HolidayFormDialog";
import type { PricePolicy, Holiday } from "@/types/admin/pricePolicy";

export default function AdminPricePoliciesPage() {
  const { token } = useAuth();
  const router = useRouter();

  // --- Chính sách giá ---
  const [items, setItems] = useState<PricePolicy[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [filters, setFilters] = useState<{ keyword?: string; isActive?: string }>({});

  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editPolicy, setEditPolicy] = useState<PricePolicy | null>(null);
  const [deletingPolicy, setDeletingPolicy] = useState<PricePolicy | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [page, setPage] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [totalElements, setTotalElements] = useState(0);

  const load = useCallback(async (targetPage = 0) => {
    if (!token) return;
    setIsLoading(true);
    try {
      const parts: string[] = [];
      if (filters.keyword) parts.push(`name~'${filters.keyword}'`);
      if (filters.isActive) parts.push(`isActive:'${filters.isActive}'`);
      const result = await adminPricePolicyService.getPricePolicies(token, targetPage, 10, parts.join(" and ") || undefined);
      setItems(result.content);
      setTotalPages(result.totalPages);
      setTotalElements(result.totalElements);
    } catch {
      toast.error("Không thể tải danh sách chính sách giá");
    } finally {
      setIsLoading(false);
    }
  }, [token, filters]);

  const handleFilterChange = useCallback((newFilters: { keyword?: string; isActive?: string }) => {
    setFilters(newFilters);
    setPage(0);
  }, []);

  useEffect(() => { load(0); }, [load]);

  const handleDelete = async () => {
    if (!token || !deletingPolicy) return;
    setIsDeleting(true);
    try {
      await adminPricePolicyService.deletePricePolicy(token, deletingPolicy.pricePolicyId);
      toast.success("Xóa chính sách giá thành công");
      setDeletingPolicy(null);
      load(page);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Lỗi khi xóa chính sách giá");
    } finally {
      setIsDeleting(false);
    }
  };

  const columns = useMemo(() => createPricePolicyColumns({
    onManageRules: (p) => router.push(`/admin/price-policies/${p.pricePolicyId}`),
    onEdit: (p) => { setEditPolicy(p); setIsFormOpen(true); },
    onDelete: (p) => setDeletingPolicy(p),
  }), [router]);

  // --- Ngày lễ ---
  const [holidays, setHolidays] = useState<Holiday[]>([]);
  const [isHolidayLoading, setIsHolidayLoading] = useState(false);
  const [isHolidayFormOpen, setIsHolidayFormOpen] = useState(false);
  const [editHoliday, setEditHoliday] = useState<Holiday | null>(null);
  const [deletingHoliday, setDeletingHoliday] = useState<Holiday | null>(null);
  const [isDeletingHoliday, setIsDeletingHoliday] = useState(false);

  const loadHolidays = useCallback(async () => {
    if (!token) return;
    setIsHolidayLoading(true);
    try {
      const result = await adminHolidayService.getHolidays(token, 0, 200);
      setHolidays(result.content);
    } catch {
      toast.error("Không thể tải danh sách ngày lễ");
    } finally {
      setIsHolidayLoading(false);
    }
  }, [token]);

  useEffect(() => { loadHolidays(); }, [loadHolidays]);

  const handleDeleteHoliday = async () => {
    if (!token || !deletingHoliday) return;
    setIsDeletingHoliday(true);
    try {
      await adminHolidayService.deleteHoliday(token, deletingHoliday.holidayId);
      toast.success("Xóa ngày lễ thành công");
      setDeletingHoliday(null);
      loadHolidays();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Lỗi khi xóa ngày lễ");
    } finally {
      setIsDeletingHoliday(false);
    }
  };

  const holidayColumns = useMemo(() => createHolidayColumns({
    onEdit: (h) => { setEditHoliday(h); setIsHolidayFormOpen(true); },
    onDelete: (h) => setDeletingHoliday(h),
  }), []);

  return (
    <div className="space-y-6">
      <PageHeader title="Chính sách giá vé" description="Cấu hình giá vé tự động theo ngày trong tuần, khung giờ và ngày lễ">
        <Button onClick={() => { setEditPolicy(null); setIsFormOpen(true); }}>
          <Plus className="h-4 w-4" /> Thêm chính sách
        </Button>
      </PageHeader>

      <PricePolicyFilters onFilterChange={handleFilterChange} />

      <DataTable
        columns={columns}
        data={items}
        isLoading={isLoading}
        emptyText="Chưa có chính sách giá nào."
        onRowClick={(p) => router.push(`/admin/price-policies/${p.pricePolicyId}`)}
        serverPagination={{
          page,
          pageCount: totalPages,
          total: totalElements,
          onChange: (newPage) => { setPage(newPage); load(newPage); },
        }}
      />

      <div className="space-y-4 border-t border-border/60 pt-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div className="flex items-start gap-3">
            <span className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
              <CalendarHeart size={18} />
            </span>
            <div>
              <h2 className="text-base font-bold tracking-tight text-foreground">Ngày lễ</h2>
              <p className="text-sm text-muted-foreground">
                Danh sách kỳ nghỉ dùng chung toàn hệ thống, áp dụng cho rule &quot;Ngày lễ&quot; trong các chính sách giá
              </p>
            </div>
          </div>
          <Button variant="outline" onClick={() => { setEditHoliday(null); setIsHolidayFormOpen(true); }}>
            <Plus className="h-4 w-4" /> Thêm ngày lễ
          </Button>
        </div>

        <DataTable
          columns={holidayColumns}
          data={holidays}
          isLoading={isHolidayLoading}
          emptyText="Chưa có ngày lễ nào."
        />
      </div>

      <PricePolicyFormDialog
        open={isFormOpen}
        onOpenChange={(o) => { setIsFormOpen(o); if (!o) setEditPolicy(null); }}
        onSuccess={() => load(page)}
        policy={editPolicy}
      />

      <ConfirmDialog
        open={!!deletingPolicy}
        onOpenChange={(o) => { if (!o) setDeletingPolicy(null); }}
        title="Xóa chính sách giá"
        description={`Bạn có chắc chắn muốn xóa chính sách "${deletingPolicy?.name}"? Toàn bộ rule thuộc chính sách này sẽ bị xóa.`}
        confirmLabel="Xóa"
        confirmVariant="destructive"
        isLoading={isDeleting}
        onConfirm={handleDelete}
      />

      <HolidayFormDialog
        open={isHolidayFormOpen}
        onOpenChange={(o) => { setIsHolidayFormOpen(o); if (!o) setEditHoliday(null); }}
        onSuccess={loadHolidays}
        holiday={editHoliday}
      />

      <ConfirmDialog
        open={!!deletingHoliday}
        onOpenChange={(o) => { if (!o) setDeletingHoliday(null); }}
        title="Xóa ngày lễ"
        description={`Bạn có chắc chắn muốn xóa "${deletingHoliday?.name}"? Rule nào đang tham chiếu kỳ nghỉ này sẽ tự động gỡ tham chiếu.`}
        confirmLabel="Xóa"
        confirmVariant="destructive"
        isLoading={isDeletingHoliday}
        onConfirm={handleDeleteHoliday}
      />
    </div>
  );
}
