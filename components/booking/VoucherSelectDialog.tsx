"use client";

import { Button } from "@/components/ui/button";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { cn } from "@/lib/utils";
import type { UserVoucher } from "@/types";
import { AlertCircle, Check, Ticket, X } from "lucide-react";
import { useState } from "react";

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
  totalAmount: number;
  vouchers: UserVoucher[];
  isLoading: boolean;
  selectedCode: string | null;
  onSelect: (voucher: UserVoucher | null) => void;
}

export function VoucherSelectDialog({
  open,
  onOpenChange,
  totalAmount,
  vouchers,
  isLoading,
  selectedCode,
  onSelect,
}: VoucherSelectDialogProps) {
  const [pending, setPending] = useState<string | null>(selectedCode);

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
          <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-muted/30">
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

              return (
                <button
                  key={v.voucherId}
                  type="button"
                  disabled={!ok}
                  onClick={() =>
                    ok && setPending(isSelected ? null : v.code)
                  }
                  className={cn(
                    "w-full text-left rounded-xl border transition-all overflow-hidden relative bg-card",
                    isSelected
                      ? "border-primary ring-2 ring-primary/20"
                      : ok
                        ? "border-border/50 hover:shadow-md"
                        : "border-border/50 opacity-60 cursor-not-allowed",
                  )}
                >
                  <div className="flex items-stretch h-27.5">
                    <div className={cn(
                      "w-25 shrink-0 flex flex-col items-center justify-center p-3 border-r border-dashed relative",
                      isSelected ? "bg-primary/10 border-primary/40" : "bg-primary/5 border-border/60"
                    )}>
                      <div className="absolute -left-2 top-1/2 -translate-y-1/2 w-4 h-4 bg-muted/30 rounded-full border border-border/50" />
                      <div className="absolute -right-2 top-1/2 -translate-y-1/2 w-4 h-4 bg-card rounded-full border border-border/50 z-10" />

                      <span className={cn(
                        "font-black leading-none mb-1 text-center truncate w-full tracking-tighter", 
                        isSelected ? "text-primary" : "text-primary/80",
                        v.type === "PERCENTAGE" && v.discountValue === 100 ? "text-xl" : "text-2xl"
                      )}>
                        {v.type === "PERCENTAGE" ? `${v.discountValue}%` : `${v.discountValue / 1000}K`}
                      </span>
                      <span className="text-[9px] uppercase tracking-wider font-semibold text-primary/70 mt-1 text-center">
                        {v.type === "PERCENTAGE" ? "Giảm giá" : "Tiền mặt"}
                      </span>
                    </div>

                    <div className="flex-1 p-3.5 flex flex-col justify-between bg-card z-0 relative">
                      <div className="space-y-1.5 pr-6">
                        <p className="text-sm font-semibold line-clamp-2 leading-tight">
                          {v.name}
                        </p>
                        <div className="flex flex-wrap items-center gap-1.5">
                          <code className="text-[10px] font-bold text-primary bg-primary/10 px-1.5 py-0.5 rounded border border-primary/20">
                            {v.code}
                          </code>
                          {v.minOrderValue && (
                            <span className="text-[10px] text-muted-foreground bg-muted px-1.5 py-0.5 rounded">
                              Đơn từ {(v.minOrderValue / 1000)}k
                            </span>
                          )}
                          {!ok && (
                            <span className="flex items-center gap-1 text-[10px] text-destructive font-medium ml-1">
                              <AlertCircle className="w-3 h-3" /> Không đủ ĐK
                            </span>
                          )}
                        </div>
                      </div>

                      <div className="mt-2 flex items-end justify-between gap-2">
                        <div className="text-[10px] text-muted-foreground flex items-center gap-1">
                           HSD: {new Date(v.endTime).toLocaleDateString("vi-VN")}
                        </div>
                        
                        <div className="shrink-0 flex flex-col items-end">
                          <div className={cn(
                            "w-5 h-5 rounded-full border flex items-center justify-center transition-all",
                            isSelected ? "bg-primary border-primary" : "border-border"
                          )}>
                            {isSelected && <Check className="w-3 h-3 text-primary-foreground" />}
                          </div>
                        </div>
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
                <span className="text-muted-foreground text-xs">
                  Đã chọn
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
