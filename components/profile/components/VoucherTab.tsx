"use client";

import { useState, useEffect, useCallback } from "react";
import { toast } from "sonner";
import { Loader2, BadgePlus, X } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { userProfileService } from "@/services/userProfileService";
import { OwnedVoucherCard, ClaimableCard } from "@/components/profile/VoucherCard";
import { getErrorMessage } from "@/lib/errors";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import type { UserVoucher, PublicPromotion } from "@/types/user-profile";

export function VoucherTab() {
  const { token } = useAuth();

  const [vouchers,          setVouchers]          = useState<UserVoucher[]>([]);
  const [promotions,        setPromotions]         = useState<PublicPromotion[]>([]);
  const [loadingVouchers,   setLoadingVouchers]    = useState(true);
  const [loadingPromotions, setLoadingPromotions]  = useState(false);
  const [claimingId,        setClaimingId]         = useState<number | null>(null);
  const [claimingCode,      setClaimingCode]       = useState(false);
  const [showClaimable,     setShowClaimable]      = useState(false);
  const [voucherCode,       setVoucherCode]        = useState("");

  const loadVouchers = useCallback(async () => {
    if (!token) return;
    setLoadingVouchers(true);
    try {
      const res = await userProfileService.getMyVouchers(token);
      setVouchers(Array.isArray(res) ? res : []);
    } catch {
      toast.error("Không thể tải danh sách voucher.");
    } finally {
      setLoadingVouchers(false);
    }
  }, [token]);

  const loadPromotions = useCallback(async () => {
    if (!token) return;
    setLoadingPromotions(true);
    try {
      const res = await userProfileService.getAvailablePromotions(token);
      setPromotions(Array.isArray(res) ? res : []);
    } catch {
      toast.error("Không thể tải danh sách ưu đãi.");
    } finally {
      setLoadingPromotions(false);
    }
  }, [token]);

  useEffect(() => { loadVouchers(); }, [loadVouchers]);

  const handleOpenClaimable = () => {
    setShowClaimable(true);
    loadPromotions();
  };

  const handleClaim = async (promotionId: number) => {
    if (!token) return;
    setClaimingId(promotionId);
    try {
      await userProfileService.claimPromotion(token, promotionId);
      toast.success("Nhận voucher thành công!");
      await loadVouchers();
      await loadPromotions();
    } catch (err: unknown) {
      const code = (err as { code?: number } | null)?.code;
      toast.error(getErrorMessage(code, "Không thể nhận voucher."));
    } finally {
      setClaimingId(null);
    }
  };

  const handleClaimByCode = async () => {
    if (!token || !voucherCode.trim()) return;
    setClaimingCode(true);
    try {
      await userProfileService.claimPromotionByCode(token, voucherCode.trim());
      toast.success("Lưu voucher thành công");
      setVoucherCode("");
      await loadVouchers();
      await loadPromotions();
    } catch (err: unknown) {
      const code = (err as { code?: number } | null)?.code;
      toast.error(getErrorMessage(code, "Mã giảm giá không hợp lệ hoặc đã hết hạn."));
    } finally {
      setClaimingCode(false);
    }
  };

  return (
    <section className="bg-card border border-border rounded-xl shadow-sm p-6">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-base font-semibold">Voucher của tôi</h2>
        <Button size="sm" variant="outline" onClick={handleOpenClaimable}>
          <BadgePlus className="h-4 w-4 mr-1.5" />
          Voucher có thể nhận
        </Button>
      </div>

      {loadingVouchers ? (
        <div className="flex items-center gap-2 text-muted-foreground text-sm py-10 justify-center">
          <Loader2 className="h-4 w-4 animate-spin" />
          Đang tải...
        </div>
      ) : vouchers.length === 0 ? (
        <p className="text-sm text-muted-foreground text-center py-10">
          Bạn chưa có voucher nào.
        </p>
      ) : (
        <div className="space-y-3">
          {vouchers.map((v) => (
            <OwnedVoucherCard key={v.voucherId} voucher={v} />
          ))}
        </div>
      )}

      <Dialog open={showClaimable} onOpenChange={setShowClaimable}>
        <DialogContent className="max-w-xl max-h-[85vh] flex flex-col gap-0 overflow-hidden p-0 bg-slate-50/50 dark:bg-slate-900/50">
          <DialogHeader className="px-5 py-4 border-b border-border/40 shrink-0 flex flex-row items-center justify-between bg-card">
            <DialogTitle className="text-lg font-bold">Thêm mã giảm giá</DialogTitle>
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 rounded-full text-muted-foreground hover:bg-muted hover:text-foreground"
              onClick={() => setShowClaimable(false)}
            >
              <X className="h-4 w-4" />
            </Button>
          </DialogHeader>

          <div className="px-5 py-4 bg-card border-b border-border/40 flex items-center gap-3 shrink-0 shadow-sm z-10 relative">
            <Input 
              placeholder="Nhập mã voucher" 
              className="bg-muted/50 uppercase h-10 font-medium"
              value={voucherCode}
              onChange={(e) => setVoucherCode(e.target.value)}
            />
            <Button 
              disabled={!voucherCode.trim() || claimingCode} 
              className="h-10 px-6 shrink-0 font-semibold"
              onClick={handleClaimByCode}
            >
              {claimingCode ? "Đang xử lý..." : "Lưu"}
            </Button>
          </div>

          <div className="overflow-y-auto flex-1 px-5 py-4 bg-muted/70">
            {loadingPromotions ? (
              <div className="flex items-center gap-2 text-muted-foreground text-sm py-8 justify-center">
                <Loader2 className="h-4 w-4 animate-spin" />
                Đang tải...
              </div>
            ) : promotions.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-8">
                Không có ưu đãi nào khả dụng.
              </p>
            ) : (
              <div className="space-y-4 pb-4">
                {promotions.map((p) => (
                  <ClaimableCard
                    key={p.promotionId}
                    promotion={p}
                    onClaim={handleClaim}
                    isClaiming={claimingId === p.promotionId}
                  />
                ))}
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </section>
  );
}
