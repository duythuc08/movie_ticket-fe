"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import { useParams, useRouter } from "next/navigation";
import { toast } from "sonner";
import { ArrowLeft, Plus } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { DataTable, PageHeader, ConfirmDialog } from "@/components/shared";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { adminPricePolicyService } from "@/services/admin/adminPricePolicyService";
import { adminHolidayService } from "@/services/admin/adminHolidayService";
import { createPricePolicyRuleColumns } from "@/components/admin/price-policy/PricePolicyRuleColumns";
import { PriceRuleFormDialog } from "@/components/admin/price-policy/PriceRuleFormDialog";
import type { PricePolicy, PricePolicyRule, Holiday } from "@/types/admin/pricePolicy";
import type { FilterConfig } from "@/components/shared";

const ROOM_TYPE_OPTIONS: FilterConfig["options"] = [
  { label: "2D", value: "TWO_D" },
  { label: "3D", value: "THREE_D" },
  { label: "IMAX", value: "IMAX" },
  { label: "Premium", value: "PREMIUM" },
];

const SEAT_TYPE_OPTIONS: FilterConfig["options"] = [
  { label: "Thường", value: "STANDARD" },
  { label: "VIP", value: "VIP" },
  { label: "Đôi", value: "COUPLE" },
];

const RULE_TYPE_OPTIONS: FilterConfig["options"] = [
  { label: "Theo ngày trong tuần", value: "WEEKDAY_LIST" },
  { label: "Ngày lễ", value: "HOLIDAY" },
  { label: "Giá mặc định", value: "DEFAULT" },
];

export default function AdminPricePolicyDetailPage() {
  const { token } = useAuth();
  const router = useRouter();
  const params = useParams();
  const policyId = Number(params.id);

  const [policy, setPolicy] = useState<PricePolicy | null>(null);
  const [rules, setRules] = useState<PricePolicyRule[]>([]);
  const [holidays, setHolidays] = useState<Holiday[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [deletingRule, setDeletingRule] = useState<PricePolicyRule | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const load = useCallback(async () => {
    if (!token || !policyId) return;
    setIsLoading(true);
    try {
      const [policyRes, rulesRes, holidaysRes] = await Promise.all([
        adminPricePolicyService.getPricePolicyById(token, policyId),
        adminPricePolicyService.getRules(token, policyId),
        adminHolidayService.getHolidays(token, 0, 200),
      ]);
      setPolicy(policyRes);
      setRules(rulesRes);
      setHolidays(holidaysRes.content);
    } catch {
      toast.error("Không thể tải chi tiết chính sách giá");
      router.push("/admin/price-policies");
    } finally {
      setIsLoading(false);
    }
  }, [token, policyId, router]);

  useEffect(() => { load(); }, [load]);

  const handleDeleteRule = async () => {
    if (!token || !deletingRule) return;
    setIsDeleting(true);
    try {
      await adminPricePolicyService.deleteRule(token, policyId, deletingRule.pricePolicyRuleId);
      toast.success("Xóa rule thành công");
      setDeletingRule(null);
      load();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Lỗi khi xóa rule");
    } finally {
      setIsDeleting(false);
    }
  };

  const columns = useMemo(() => createPricePolicyRuleColumns({
    onDelete: (rule) => setDeletingRule(rule),
  }), []);

  return (
    <div className="space-y-6">
      <Button variant="ghost" size="sm" className="text-muted-foreground -ml-2" onClick={() => router.push("/admin/price-policies")}>
        <ArrowLeft className="h-4 w-4" /> Quay lại danh sách chính sách giá
      </Button>

      <PageHeader
        title={policy?.name ?? "Chi tiết chính sách giá"}
        description={policy ? `${policy.cinemaName} — ${policy.isActive ? "Đang áp dụng" : "Chưa áp dụng"}` : undefined}
      >
        <Button onClick={() => setIsFormOpen(true)}>
          <Plus className="h-4 w-4" /> Thêm rule
        </Button>
      </PageHeader>

      {rules.length === 0 && !isLoading && (
        <div className="rounded-lg border border-dashed border-border bg-muted/20 p-3 text-sm text-muted-foreground">
          Chính sách này chưa có rule nào. Nếu không có rule <Badge variant="secondary" className="text-xs mx-1">Giá mặc định</Badge>
          hệ thống sẽ báo lỗi thiếu cấu hình khi tạo suất chiếu tự động theo chính sách này.
        </div>
      )}

      <DataTable
        columns={columns}
        data={rules}
        isLoading={isLoading}
        emptyText="Chưa có rule nào trong chính sách này."
        filters={[
          { key: "roomType", label: "Loại phòng", options: ROOM_TYPE_OPTIONS },
          { key: "seatType", label: "Loại ghế", options: SEAT_TYPE_OPTIONS },
          { key: "ruleType", label: "Loại rule", options: RULE_TYPE_OPTIONS },
        ]}
      />

      <PriceRuleFormDialog
        open={isFormOpen}
        onOpenChange={setIsFormOpen}
        onSuccess={load}
        pricePolicyId={policyId}
        holidays={holidays}
      />

      <ConfirmDialog
        open={!!deletingRule}
        onOpenChange={(o) => { if (!o) setDeletingRule(null); }}
        title="Xóa rule"
        description="Bạn có chắc chắn muốn xóa rule giá này?"
        confirmLabel="Xóa"
        confirmVariant="destructive"
        isLoading={isDeleting}
        onConfirm={handleDeleteRule}
      />
    </div>
  );
}
