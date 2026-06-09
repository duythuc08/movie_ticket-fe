"use client";

import { useState, useEffect, useCallback } from "react";
import { toast } from "sonner";
import { Loader2, BadgePlus } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { userProfileService } from "@/services/userProfileService";
import { OwnedVoucherCard, ClaimableCard } from "@/components/profile/VoucherCard";
import { getErrorMessage } from "@/lib/errors";
import { Button } from "@/components/ui/button";
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
  const [showClaimable,     setShowClaimable]      = useState(false);

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
        <DialogContent className="max-w-lg max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Voucher có thể nhận</DialogTitle>
          </DialogHeader>

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
            <div className="space-y-3 pb-1">
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
        </DialogContent>
      </Dialog>
    </section>
  );
}
