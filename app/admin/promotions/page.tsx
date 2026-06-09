"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import { toast } from "sonner";
import { Plus } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { DataTable, PageHeader } from "@/components/shared";
import { Button } from "@/components/ui/button";
import { adminPromotionService } from "@/services/admin/adminPromotionService";
import { createPromotionColumns } from "@/components/admin/promotion/PromotionColumns";
import { PromotionFilters } from "@/components/admin/promotion/PromotionFilters";
import { PromotionFormDialog } from "@/components/admin/promotion/PromotionFormDialog";
import { PromotionDetailDialog } from "@/components/admin/promotion/PromotionDetailDialog";
import type { AdminPromotion } from "@/types/admin/promotion";

export default function AdminPromotionsPage() {
  const { token } = useAuth();
  const [items, setItems] = useState<AdminPromotion[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [filters, setFilters] = useState<{ keyword?: string; status?: string; type?: string }>({});

  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editPromotion, setEditPromotion] = useState<AdminPromotion | null>(null);
  const [detailId, setDetailId] = useState<number | null>(null);

  const load = useCallback(async () => {
    if (!token) return;
    setIsLoading(true);
    try {
      const parts: string[] = [];
      if (filters.keyword) parts.push(`name~'${filters.keyword}'`);
      if (filters.status)  parts.push(`status:'${filters.status}'`);
      if (filters.type)    parts.push(`type:'${filters.type}'`);
      const result = await adminPromotionService.getPromotions(token, 0, 50, parts.join(" and ") || undefined);
      setItems(result.content);
    } catch {
      toast.error("Không thể tải danh sách khuyến mãi");
    } finally {
      setIsLoading(false);
    }
  }, [token, filters]);

  useEffect(() => { load(); }, [load]);

  const columns = useMemo(() => createPromotionColumns({
    onViewDetail: (p) => setDetailId(p.promotionId),
    onEdit:       (p) => { setEditPromotion(p); setIsFormOpen(true); },
  }), []);

  return (
    <div className="space-y-6">
      <PageHeader title="Quản lý Khuyến mãi" description="Tạo và quản lý mã giảm giá, voucher">
        <Button onClick={() => { setEditPromotion(null); setIsFormOpen(true); }}>
          <Plus className="h-4 w-4" /> Thêm khuyến mãi
        </Button>
      </PageHeader>

      <PromotionFilters onFilterChange={setFilters} />

      <DataTable columns={columns} data={items} isLoading={isLoading} emptyText="Chưa có khuyến mãi nào." />

      <PromotionFormDialog
        open={isFormOpen}
        onOpenChange={(o) => { setIsFormOpen(o); if (!o) setEditPromotion(null); }}
        onSuccess={load}
        promotion={editPromotion}
      />

      <PromotionDetailDialog
        open={!!detailId}
        onOpenChange={(o) => { if (!o) setDetailId(null); }}
        promotionId={detailId}
        onRefresh={load}
      />
    </div>
  );
}
