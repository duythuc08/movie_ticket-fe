import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { UserVoucher, PublicPromotion } from "@/types/user-profile";

const DAY_SHORT: Record<string, string> = {
  MONDAY: "T2", TUESDAY: "T3", WEDNESDAY: "T4", THURSDAY: "T5",
  FRIDAY: "T6", SATURDAY: "T7", SUNDAY: "CN",
};

// ─── Owned Voucher Card ───────────────────────────────────────────────────────

interface OwnedVoucherCardProps {
  voucher: UserVoucher;
}

export function OwnedVoucherCard({ voucher }: OwnedVoucherCardProps) {
  const isExpired = new Date(voucher.endTime) < new Date();

  return (
    <div className={cn(
      "border rounded-xl overflow-hidden bg-card shadow-sm transition-all",
      isExpired && "opacity-60"
    )}>
      <div className="flex">
        <div className={cn("w-2 shrink-0", isExpired ? "bg-muted" : "bg-primary")} />
        <div className="flex-1 p-4">
          <div className="flex items-start justify-between gap-3">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <code className="text-sm font-bold font-mono bg-muted px-2 py-0.5 rounded">
                  {voucher.code}
                </code>
                {isExpired && <Badge variant="secondary" className="text-xs">Hết hạn</Badge>}
              </div>
              <p className="text-sm font-medium">{voucher.name}</p>
              {voucher.description && (
                <p className="text-xs text-muted-foreground">{voucher.description}</p>
              )}
            </div>
            <div className="text-right shrink-0">
              <p className="text-xl font-bold text-primary">
                {voucher.type === "PERCENTAGE"
                  ? `${voucher.discountValue}%`
                  : `${voucher.discountValue.toLocaleString("vi-VN")}đ`}
              </p>
              <p className="text-xs text-muted-foreground">
                {voucher.type === "PERCENTAGE" ? "giảm" : "giảm trực tiếp"}
              </p>
            </div>
          </div>

          <div className="mt-3 pt-3 border-t border-border flex flex-wrap gap-2 text-xs text-muted-foreground">
            {voucher.minOrderValue && (
              <span>Đơn tối thiểu: <strong>{voucher.minOrderValue.toLocaleString("vi-VN")}đ</strong></span>
            )}
            {voucher.maxDiscountAmount && (
              <span>Giảm tối đa: <strong>{voucher.maxDiscountAmount.toLocaleString("vi-VN")}đ</strong></span>
            )}
            {voucher.dayOfWeek.length > 0 && (
              <span>Ngày: {voucher.dayOfWeek.map((d) => DAY_SHORT[d] ?? d).join(", ")}</span>
            )}
            <span className="ml-auto">
              HSD: {new Date(voucher.endTime).toLocaleDateString("vi-VN")}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Claimable Promotion Card ─────────────────────────────────────────────────

interface ClaimableCardProps {
  promotion: PublicPromotion;
  onClaim: (id: number) => void;
  isClaiming: boolean;
}

export function ClaimableCard({ promotion, onClaim, isClaiming }: ClaimableCardProps) {
  const remainingPct = promotion.useLimit
    ? Math.round(((promotion.useLimit - promotion.usedCount) / promotion.useLimit) * 100)
    : null;

  return (
    <div className="border rounded-xl overflow-hidden bg-card shadow-sm">
      <div className="flex">
        <div className="w-2 shrink-0 bg-primary/60" />
        <div className="flex-1 p-4">
          <div className="flex items-start justify-between gap-3">
            <div className="space-y-1">
              <code className="text-sm font-bold font-mono bg-muted px-2 py-0.5 rounded">
                {promotion.code}
              </code>
              <p className="text-sm font-medium">{promotion.name}</p>
              {promotion.description && (
                <p className="text-xs text-muted-foreground">{promotion.description}</p>
              )}
            </div>
            <div className="text-right shrink-0">
              <p className="text-xl font-bold text-primary">
                {promotion.type === "PERCENTAGE"
                  ? `${promotion.discountValue}%`
                  : `${promotion.discountValue.toLocaleString("vi-VN")}đ`}
              </p>
            </div>
          </div>

          {remainingPct !== null && (
            <div className="mt-2 space-y-1">
              <div className="flex justify-between text-xs text-muted-foreground">
                <span>Còn lại: {promotion.useLimit! - promotion.usedCount} lượt</span>
                <span>{remainingPct}%</span>
              </div>
              <div className="h-1.5 rounded-full bg-muted overflow-hidden">
                <div
                  className="h-full rounded-full bg-primary transition-all"
                  style={{ width: `${remainingPct}%` }}
                />
              </div>
            </div>
          )}

          <div className="mt-3 pt-3 border-t border-border flex items-center justify-between gap-2">
            <div className="flex flex-wrap gap-2 text-xs text-muted-foreground">
              {promotion.minOrderValue && (
                <span>Đơn tối thiểu: <strong>{promotion.minOrderValue.toLocaleString("vi-VN")}đ</strong></span>
              )}
              {promotion.dayOfWeek.length > 0 && (
                <span>Ngày: {promotion.dayOfWeek.map((d) => DAY_SHORT[d] ?? d).join(", ")}</span>
              )}
              <span>HSD: {new Date(promotion.endTime).toLocaleDateString("vi-VN")}</span>
            </div>
            <Button
              size="sm"
              onClick={() => onClaim(promotion.promotionId)}
              disabled={isClaiming}
              className="h-8 text-xs shrink-0 px-4"
            >
              {isClaiming ? "Đang nhận..." : "Nhận ngay"}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
