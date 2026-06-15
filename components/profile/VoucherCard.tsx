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
                <code className="text-sm bg-muted px-2 py-0.5 ">
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
  const usedPct = remainingPct !== null ? 100 - remainingPct : 0;

  return (
    <div className="border border-border/50 rounded-xl overflow-hidden shadow-sm hover:shadow-md transition-shadow relative bg-card">
      <div className="flex items-stretch">
        {/* Left section (Ticket stub) */}
        <div className="w-[100px] shrink-0 bg-primary/5 flex flex-col items-center justify-center p-3 border-r border-dashed border-border/60 relative">
          <div className="absolute -left-2 top-1/2 -translate-y-1/2 w-4 h-4 bg-muted/30 rounded-full border border-border/50" />
          <div className="absolute -right-2 top-1/2 -translate-y-1/2 w-4 h-4 bg-card rounded-full border border-border/50 z-10" />

          <span className={cn(
            "font-black text-primary leading-none mb-1 text-center truncate w-full tracking-tighter",
            promotion.type === "PERCENTAGE" && promotion.discountValue === 100 ? "text-xl" : "text-2xl"
          )}>
            {promotion.type === "PERCENTAGE" ? `${promotion.discountValue}%` : `${promotion.discountValue / 1000}K`}
          </span>
          <span className="text-[9px] uppercase tracking-wider font-semibold text-primary/70 mt-1 text-center">
            {promotion.type === "PERCENTAGE" ? "Giảm giá" : "Tiền mặt"}
          </span>
        </div>

        {/* Right section */}
        <div className="flex-1 p-3.5 flex flex-col justify-between bg-card z-0 relative">
          <div className="space-y-1.5">
            <div className="flex items-start justify-between gap-2">
              <p className="text-sm font-semibold line-clamp-2 leading-tight">
                {promotion.name}
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-1.5">
              <code className="text-[10px] font-bold text-primary bg-primary/10 px-1.5 py-0.5 rounded border border-primary/20">
                {promotion.code}
              </code>
              {promotion.minOrderValue && (
                <span className="text-[10px] text-muted-foreground bg-muted px-1.5 py-0.5 rounded">
                  Đơn từ {(promotion.minOrderValue / 1000)}k
                </span>
              )}
            </div>
          </div>

          <div className="mt-4 flex items-end justify-between gap-2">
            <div className="space-y-1.5 flex-1">
              {remainingPct !== null && (
                <div className="w-full max-w-[130px]">
                  <div className="flex justify-between text-[10px] text-muted-foreground mb-1 font-medium">
                    <span>Đã dùng {usedPct}%</span>
                  </div>
                  <div className="h-1.5 rounded-full bg-muted overflow-hidden">
                    <div
                      className="h-full rounded-full bg-primary transition-all"
                      style={{ width: `${usedPct}%` }}
                    />
                  </div>
                </div>
              )}
              <div className="text-[10px] text-muted-foreground flex items-center gap-1">
                <span>HSD: {new Date(promotion.endTime).toLocaleDateString("vi-VN")}</span>
              </div>
            </div>
            
            <Button
              size="sm"
              onClick={() => onClaim(promotion.promotionId)}
              disabled={isClaiming || remainingPct === 0}
              className="h-8 text-xs shrink-0 px-4 rounded-full font-semibold shadow-sm"
            >
              {isClaiming ? "Đang lưu..." : (remainingPct === 0 ? "Đã hết" : "Lưu")}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
