import { useEffect, useState, useCallback } from "react";
import { toast } from "sonner";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { ConfirmDialog } from "@/components/shared";
import { Button } from "@/components/ui/button";
import { Badge, type BadgeVariant } from "@/components/ui/badge";
import { adminPromotionService } from "@/services/admin/adminPromotionService";
import { useAuth } from "@/context/AuthContext";
import type { AdminPromotion } from "@/types/admin/promotion";
import { X, Percent, Users, Film, Clock } from "lucide-react";

const STATUS_LABELS: Record<string, string> = {
  DRAFT: "Nháp", PENDING_APPROVAL: "Chờ duyệt",
  PUBLISHED: "Đang chạy", PAUSED: "Tạm dừng", EXPIRED: "Hết hạn",
};

const STATUS_VARIANT: Record<string, BadgeVariant> = {
  DRAFT: "secondary", PENDING_APPROVAL: "outline",
  PUBLISHED: "default", PAUSED: "outline", EXPIRED: "secondary",
};

const DAY_LABELS: Record<string, string> = {
  MONDAY: "Thứ 2", TUESDAY: "Thứ 3", WEDNESDAY: "Thứ 4", THURSDAY: "Thứ 5",
  FRIDAY: "Thứ 6", SATURDAY: "Thứ 7", SUNDAY: "Chủ nhật",
};

const formatDate = (iso: string) =>
  new Date(iso).toLocaleString("vi-VN", { dateStyle: "short", timeStyle: "short", hour12: false });

interface PromotionDetailDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  promotionId: number | null;
  onRefresh: () => void;
}

function InfoRow({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex items-start justify-between gap-4">
      <span className="text-muted-foreground text-xs uppercase tracking-wider shrink-0">{label}</span>
      <span className="font-medium text-right">{value}</span>
    </div>
  );
}

export const PromotionDetailDialog = ({
  open, onOpenChange, promotionId, onRefresh,
}: PromotionDetailDialogProps) => {
  const { token } = useAuth();
  const [detail, setDetail] = useState<AdminPromotion | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isActioning, setIsActioning] = useState(false);
  const [pendingAction, setPendingAction] = useState<{
    action: "submit" | "approve" | "pause" | "resume";
    label: string;
  } | null>(null);

  const load = useCallback(async () => {
    if (!token || !promotionId) return;
    setIsLoading(true);
    try {
      setDetail(await adminPromotionService.getPromotionById(token, promotionId));
    } catch {
      toast.error("Không thể tải chi tiết khuyến mãi");
      onOpenChange(false);
    } finally {
      setIsLoading(false);
    }
  }, [token, promotionId, onOpenChange]);

  useEffect(() => {
    if (open && promotionId) load();
    else setDetail(null);
  }, [open, promotionId, load]);

  const handleAction = (action: "submit" | "approve" | "pause" | "resume", label: string) => {
    setPendingAction({ action, label });
  };

  const executeAction = async () => {
    if (!token || !detail || !pendingAction) return;
    setIsActioning(true);
    try {
      const { action, label } = pendingAction;
      const svc = adminPromotionService;
      if (action === "submit")  await svc.submitPromotion(token, detail.promotionId);
      if (action === "approve") await svc.approvePromotion(token, detail.promotionId);
      if (action === "pause")   await svc.pausePromotion(token, detail.promotionId);
      if (action === "resume")  await svc.resumePromotion(token, detail.promotionId);
      toast.success(`${label} thành công`);
      setPendingAction(null);
      onRefresh();
      load();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Lỗi thao tác");
    } finally {
      setIsActioning(false);
    }
  };

  if (!open) return null;

  const usagePct = detail?.useLimit
    ? Math.min(100, Math.round(((detail.usedCount ?? 0) / detail.useLimit) * 100))
    : null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent data-admin="" className="max-w-4xl w-[95vw] max-h-[90vh] overflow-hidden flex flex-col gap-0 p-0 rounded-xl border border-border shadow-2xl [&>button]:hidden">
        <div className="flex flex-col flex-1 overflow-hidden">

          <DialogHeader className="bg-muted/40 border-b border-border px-6 py-4 shrink-0 flex flex-row items-center justify-between space-y-0">
            <div className="space-y-1 min-w-0 flex-1">
              <DialogTitle className="text-base font-bold tracking-tight text-foreground flex items-center gap-2">
                <Percent className="w-5 h-5 text-primary" />
                {detail?.name ?? "Chi tiết khuyến mãi"}
              </DialogTitle>
              <div className="flex items-center gap-2">
                <code className="text-xs bg-muted px-1.5 py-0.5 rounded font-mono">{detail?.code}</code>
                {detail && (
                  <Badge variant={STATUS_VARIANT[detail.status]}>
                    {STATUS_LABELS[detail.status]}
                  </Badge>
                )}
              </div>
            </div>
            <Button
              type="button" variant="ghost" size="icon"
              className="shrink-0 h-8 w-8 rounded-lg text-muted-foreground hover:bg-muted hover:text-foreground border border-transparent hover:border-border transition-all"
              onClick={() => onOpenChange(false)}
            >
              <X size={16} />
            </Button>
          </DialogHeader>

          <div className="flex-1 overflow-y-auto p-6 bg-background">
            {isLoading ? (
              <div className="p-12 text-center text-muted-foreground">Đang tải...</div>
            ) : detail ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

                <div className="border rounded-xl bg-card shadow-sm overflow-hidden">
                  <div className="p-4 border-b bg-muted/20">
                    <h3 className="font-semibold text-sm flex items-center gap-2">
                      <Percent className="w-4 h-4 text-primary" /> Thông tin giảm giá
                    </h3>
                  </div>
                  <div className="p-4 space-y-4 text-sm">
                    <InfoRow label="Loại giảm" value={detail.type === "PERCENTAGE" ? "Phần trăm (%)" : "Cố định (đ)"} />
                    <InfoRow
                      label="Giá trị giảm"
                      value={
                        <span className="font-bold text-primary text-lg">
                          {detail.type === "PERCENTAGE" ? `${detail.discountValue}%` : `${detail.discountValue.toLocaleString("vi-VN")} đ`}
                        </span>
                      }
                    />
                    <InfoRow label="Đơn hàng tối thiểu" value={detail.minOrderValue ? `${detail.minOrderValue.toLocaleString("vi-VN")} đ` : "Không giới hạn"} />
                    <InfoRow label="Giảm tối đa" value={detail.maxDiscountAmount ? `${detail.maxDiscountAmount.toLocaleString("vi-VN")} đ` : "Không giới hạn"} />

                    <div className="pt-2 border-t border-border space-y-2">
                      <div className="flex justify-between text-xs">
                        <span className="text-muted-foreground flex items-center gap-1.5"><Users className="w-3 h-3" /> Lượt sử dụng</span>
                        <span className="font-semibold">{detail.usedCount} / {detail.useLimit ?? "∞"}</span>
                      </div>
                      {usagePct !== null && (
                        <div className="h-2 rounded-full bg-muted overflow-hidden">
                          <div
                            className={`h-full rounded-full transition-all ${usagePct >= 90 ? "bg-destructive" : "bg-primary"}`}
                            style={{ width: `${usagePct}%` }}
                          />
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                <div className="border rounded-xl bg-card shadow-sm overflow-hidden">
                  <div className="p-4 border-b bg-muted/20">
                    <h3 className="font-semibold text-sm flex items-center gap-2">
                      <Clock className="w-4 h-4 text-primary" /> Điều kiện áp dụng
                    </h3>
                  </div>
                  <div className="p-4 space-y-4 text-sm">
                    <InfoRow label="Bắt đầu" value={formatDate(detail.startTime)} />
                    <InfoRow label="Kết thúc" value={formatDate(detail.endTime)} />

                    <div className="pt-2 border-t border-border space-y-2">
                      <p className="text-xs text-muted-foreground">Ngày áp dụng</p>
                      {detail.dayOfWeek.length === 0 ? (
                        <p className="text-sm text-muted-foreground italic">Tất cả ngày trong tuần</p>
                      ) : (
                        <div className="flex flex-wrap gap-1">
                          {detail.dayOfWeek.map((d) => (
                            <Badge key={d} variant="secondary" className="text-xs">{DAY_LABELS[d]}</Badge>
                          ))}
                        </div>
                      )}
                    </div>

                    <div className="space-y-2">
                      <p className="text-xs text-muted-foreground flex items-center gap-1.5"><Film className="w-3 h-3" /> Phim áp dụng</p>
                      {detail.applicableMovieIds.length === 0 ? (
                        <p className="text-sm text-muted-foreground italic">Tất cả phim</p>
                      ) : (
                        <p className="text-sm font-medium">{detail.applicableMovieIds.length} phim được chọn</p>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ) : null}
          </div>

          <div className="sticky bottom-0 z-10 border-t border-border bg-card px-6 py-3.5 flex items-center justify-between gap-4 shrink-0">
            <div className="flex items-center gap-2">
              {detail?.status === "DRAFT" && (
                <Button
                  variant="outline" size="sm"
                  onClick={() => handleAction("submit", "Gửi duyệt")}
                  disabled={isActioning}
                  className="text-xs border-primary/50 text-primary hover:bg-primary hover:text-primary-foreground"
                >
                  Gửi duyệt
                </Button>
              )}
              {detail?.status === "PENDING_APPROVAL" && (
                <Button
                  size="sm"
                  onClick={() => handleAction("approve", "Phê duyệt")}
                  disabled={isActioning}
                  className="text-xs"
                >
                  Phê duyệt & Xuất bản
                </Button>
              )}
              {detail?.status === "PUBLISHED" && (
                <Button
                  variant="outline" size="sm"
                  onClick={() => handleAction("pause", "Tạm dừng")}
                  disabled={isActioning}
                  className="text-xs border-destructive/50 text-destructive hover:bg-destructive hover:text-destructive-foreground"
                >
                  Tạm dừng
                </Button>
              )}
              {detail?.status === "PAUSED" && (
                <Button
                  variant="outline" size="sm"
                  onClick={() => handleAction("resume", "Tiếp tục")}
                  disabled={isActioning}
                  className="text-xs border-primary/50 text-primary hover:bg-primary hover:text-primary-foreground"
                >
                  Tiếp tục
                </Button>
              )}
            </div>
            <Button variant="outline" onClick={() => onOpenChange(false)} className="h-9 text-xs font-semibold px-6">
              Đóng
            </Button>
          </div>
        </div>
      </DialogContent>

      <ConfirmDialog
        open={!!pendingAction}
        onOpenChange={(o) => { if (!o) setPendingAction(null); }}
        title={`${pendingAction?.label ?? ""} khuyến mãi`}
        description={`Bạn có chắc chắn muốn ${pendingAction?.label?.toLowerCase() ?? ""} khuyến mãi này?`}
        confirmLabel={pendingAction?.label}
        confirmVariant={pendingAction?.action === "pause" ? "destructive" : "default"}
        isLoading={isActioning}
        onConfirm={executeAction}
      />
    </Dialog>
  );
};
