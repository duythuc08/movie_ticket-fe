"use client";

import { useEffect, useState, useCallback } from "react";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Ticket, X, Check, AlertCircle } from "lucide-react";
import { getApplicableVouchers } from "@/components/booking/service/booking.service";
import type { UserVoucher } from "@/types";
import { cn } from "@/lib/utils";

const DAY_SHORT: Record<string, string> = {
  MONDAY: "T2", TUESDAY: "T3", WEDNESDAY: "T4",
  THURSDAY: "T5", FRIDAY: "T6", SATURDAY: "T7", SUNDAY: "CN",
};

export function estimateVoucherDiscount(v: UserVoucher, total: number): number {
  if (!v.eligible) return 0;
  let d =
    v.type === "PERCENTAGE"
      ? (total * v.discountValue) / 100
      : v.discountValue;
  if (v.maxDiscountAmount && d > v.maxDiscountAmount) d = v.maxDiscountAmount;
  return Math.floor(d);
}

interface VoucherSelectDialogProps {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  token: string;
  totalAmount: number;
  selectedCode: string | null;
  onSelect: (voucher: UserVoucher | null) => void;
}

export function VoucherSelectDialog({
  open,
  onOpenChange,
  token,
  totalAmount,
  selectedCode,
  onSelect,
}: VoucherSelectDialogProps) {
  const [vouchers, setVouchers] = useState<UserVoucher[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [pending, setPending] = useState<string | null>(selectedCode);

  useEffect(() => {
    if (open) setPending(selectedCode);
  }, [open, selectedCode]);

  const load = useCallback(async () => {
    if (!open || !token) return;
    setIsLoading(true);
    try {
      const data = await getApplicableVouchers(token, totalAmount);
      setVouchers(data);
    } catch {
      toast.error("Không thể tải danh sách voucher");
    } finally {
      setIsLoading(false);
    }
  }, [open, token, totalAmount]);

  useEffect(() => {
    load();
  }, [load]);

  const handleConfirm = () => {
    const found = pending
      ? (vouchers.find((v) => v.code === pending) ?? null)
      : null;
    onSelect(found);
    onOpenChange(false);
  };

  const pendingVoucher = pending
    ? (vouchers.find((v) => v.code === pending) ?? null)
    : null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md w-[95vw] max-h-[80vh] overflow-hidden flex flex-col gap-0 p-0 rounded-2xl border border-border shadow-2xl [&>button]:hidden">
        <div className="flex flex-col flex-1 overflow-hidden">
          {/* HEADER */}
          <DialogHeader className="border-b border-border px-5 py-4 shrink-0 flex flex-row items-center justify-between space-y-0">
            <div>
              <DialogTitle className="text-base font-bold flex items-center gap-2">
                <Ticket className="w-4 h-4 text-primary" /> Chọn voucher
              </DialogTitle>
              <p className="text-xs text-muted-foreground mt-0.5">
                Tổng đơn:{" "}
                <strong>{totalAmount.toLocaleString("vi-VN")}đ</strong>
              </p>
            </div>
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 rounded-lg text-muted-foreground hover:bg-muted"
              onClick={() => onOpenChange(false)}
            >
              <X size={16} />
            </Button>
          </DialogHeader>

          {/* LIST */}
          <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-background">
            {isLoading && (
              <p className="py-10 text-center text-sm text-muted-foreground">
                Đang tải...
              </p>
            )}

            {!isLoading && vouchers.length === 0 && (
              <div className="py-10 text-center text-muted-foreground space-y-1">
                <Ticket className="w-7 h-7 mx-auto opacity-30" />
                <p className="text-sm">Không có voucher phù hợp</p>
                <p className="text-xs">
                  Nhận thêm tại trang{" "}
                  <strong>Voucher của tôi</strong>.
                </p>
              </div>
            )}

            {vouchers.map((v) => {
              const isSelected = pending === v.code;
              const ok = v.eligible === true;
              const est = ok ? estimateVoucherDiscount(v, totalAmount) : 0;

              return (
                <button
                  key={v.voucherId}
                  type="button"
                  disabled={!ok}
                  onClick={() =>
                    ok && setPending(isSelected ? null : v.code)
                  }
                  className={cn(
                    "w-full text-left rounded-xl border transition-all overflow-hidden",
                    isSelected
                      ? "border-primary ring-2 ring-primary/20 bg-primary/5"
                      : ok
                        ? "border-border hover:border-primary/40 bg-card"
                        : "border-border bg-muted/30 opacity-55 cursor-not-allowed",
                  )}
                >
                  <div className="flex">
                    <div
                      className={cn(
                        "w-1 shrink-0",
                        isSelected
                          ? "bg-primary"
                          : ok
                            ? "bg-primary/30"
                            : "bg-muted",
                      )}
                    />
                    <div className="flex-1 p-3 flex items-start justify-between gap-3">
                      <div className="space-y-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <code
                            className={cn(
                              "text-xs font-bold font-mono px-1.5 py-0.5 rounded",
                              isSelected
                                ? "bg-primary/20 text-primary"
                                : "bg-muted",
                            )}
                          >
                            {v.code}
                          </code>
                          {!ok && (
                            <span className="flex items-center gap-1 text-xs text-muted-foreground">
                              <AlertCircle className="w-3 h-3" /> Không đủ
                              điều kiện
                            </span>
                          )}
                        </div>
                        <p className="text-sm font-medium leading-tight">
                          {v.name}
                        </p>
                        <div className="flex flex-wrap gap-x-3 text-xs text-muted-foreground">
                          {v.minOrderValue ? (
                            <span>
                              Tối thiểu{" "}
                              {v.minOrderValue.toLocaleString("vi-VN")}đ
                            </span>
                          ) : null}
                          {v.maxDiscountAmount ? (
                            <span>
                              Tối đa{" "}
                              {v.maxDiscountAmount.toLocaleString("vi-VN")}đ
                            </span>
                          ) : null}
                          {v.dayOfWeek?.length ? (
                            <span>
                              {v.dayOfWeek
                                .map((d) => DAY_SHORT[d] ?? d)
                                .join(", ")}
                            </span>
                          ) : null}
                        </div>
                      </div>
                      <div className="shrink-0 text-right">
                        <p
                          className={cn(
                            "text-base font-bold",
                            ok ? "text-foreground" : "text-muted-foreground",
                          )}
                        >
                          {v.type === "PERCENTAGE"
                            ? `${v.discountValue}%`
                            : `${v.discountValue.toLocaleString("vi-VN")}đ`}
                        </p>
                        {ok && est > 0 && (
                          <p className="text-xs text-emerald-600 dark:text-emerald-400">
                            ~−{est.toLocaleString("vi-VN")}đ
                          </p>
                        )}
                        {isSelected && (
                          <div className="mt-1 w-5 h-5 rounded-full bg-primary flex items-center justify-center ml-auto">
                            <Check className="w-3 h-3 text-primary-foreground" />
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </button>
              );
            })}
          </div>

          {/* FOOTER */}
          <div className="border-t border-border bg-card px-5 py-3 flex items-center justify-between gap-3 shrink-0">
            <p className="text-sm">
              {pendingVoucher ? (
                <span className="text-emerald-600 dark:text-emerald-400 font-medium">
                  ~−
                  {estimateVoucherDiscount(
                    pendingVoucher,
                    totalAmount,
                  ).toLocaleString("vi-VN")}
                  đ
                </span>
              ) : (
                <span className="text-muted-foreground text-xs">
                  Chưa chọn
                </span>
              )}
            </p>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => onOpenChange(false)}
                className="h-8 text-xs"
              >
                Hủy
              </Button>
              <Button
                size="sm"
                onClick={handleConfirm}
                className="h-8 text-xs px-5"
              >
                {pending ? "Áp dụng" : "Bỏ qua"}
              </Button>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
