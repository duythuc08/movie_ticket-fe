"use client";

import { Ticket } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Badge, BadgeProps } from "@/components/ui/badge";
import { getStoredToken } from "@/components/auth/utils/auth.utils";
import { Skeleton } from "@/components/ui/skeleton";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { retryPaymentUrl } from "@/components/profile/service/user.service";
import type { Order } from "@/types";
import { useState } from "react";

interface Props {
  orders: Order[];
  loading: boolean;
  onSelectOrder: (order: Order) => void;
}

const STATUS_MAP: Record<string, { label: string; variant: BadgeProps["variant"] }> = {
  PENDING: { label: "Chờ thanh toán", variant: "pending" },
  IN_PROGRESS: { label: "Đang xử lý", variant: "in_progress" },
  CANCELLED: { label: "Đã hủy", variant: "cancelled" },
  PAID: { label: "Đã thanh toán", variant: "paid" },
  EXPIRED: { label: "Hết hạn", variant: "expired" },
  USED: { label: "Đã sử dụng", variant: "used" },
};

const getStatus = (status: string) =>
  STATUS_MAP[status] ?? {
    label: status,
    variant: "default",
  };

const formatCurrency = (n?: number) =>
  new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND" }).format(n || 0);

const formatDate = (v?: string) =>
  v
    ? new Date(v).toLocaleDateString("vi-VN", { day: "2-digit", month: "2-digit", year: "numeric" })
    : "---";

export function OrderHistory({ orders, loading, onSelectOrder }: Props) {
  const sorted = [...orders].sort(
    (a, b) => new Date(b.bookingTime).getTime() - new Date(a.bookingTime).getTime()
  );

  const [retryOrder, setRetryOrder] = useState<Order | null>(null);
  const [retryMethod, setRetryMethod] = useState<"VNPAY" | "MOMO">("MOMO");
  const [isRetrying, setIsRetrying] = useState(false);

  const handleRepayment = async () => {
    if (!retryOrder) return;
    setIsRetrying(true);
    try {
      const token = getStoredToken() ?? "";
      const url = await retryPaymentUrl(token, String(retryOrder.orderId), retryMethod);
      window.location.href = url;
    } catch {
      toast.error("Không thể kết nối đến máy chủ thanh toán. Vui lòng thử lại.");
      setIsRetrying(false);
      setRetryOrder(null);
    }
  };

  return (
    <div className="bg-card border border-border rounded-xl shadow-sm">
      {/* Header */}
      <div className="flex items-center justify-between px-6 py-5 border-b border-border">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-blue-500/10 flex items-center justify-center flex-shrink-0">
            <Ticket className="w-4 h-4 text-blue-500" />
          </div>
          <h2 className="text-base font-bold text-foreground">Đơn hàng &amp; Vé</h2>
        </div>
        {!loading && (
          <span className="text-xs text-muted-foreground bg-secondary px-2.5 py-1 rounded-full">
            {sorted.length} đơn
          </span>
        )}
      </div>

      <div className="p-5">
        {loading ? (
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <div
                key={i}
                className="flex items-center justify-between gap-4 p-4 border border-border rounded-xl"
              >
                <div className="flex-1 space-y-2">
                  <Skeleton className="h-4 w-32 rounded" />
                  <Skeleton className="h-3 w-24 rounded" />
                </div>
                <Skeleton className="h-5 w-24 rounded-full" />
                <Skeleton className="h-4 w-20 rounded" />
                <Skeleton className="h-8 w-20 rounded-md" />
              </div>
            ))}
          </div>
        ) : sorted.length === 0 ? (
          <div className="text-center py-16 border border-dashed border-border rounded-xl bg-secondary/20">
            <Ticket className="w-10 h-10 text-muted-foreground/30 mx-auto mb-3" />
            <p className="text-sm text-muted-foreground">Bạn chưa có đơn hàng nào thành công !.</p>
          </div>
        ) : (
          /* ── Table-style header + rows ── */
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border text-left">
                  <th className="pb-3 font-semibold text-muted-foreground text-xs uppercase tracking-wider">Mã đơn</th>
                  <th className="pb-3 font-semibold text-muted-foreground text-xs uppercase tracking-wider">Tên Phim</th>
                  <th className="pb-3 font-semibold text-muted-foreground text-xs uppercase tracking-wider hidden sm:table-cell">Chi nhánh</th>
                  <th className="pb-3 font-semibold text-muted-foreground text-xs uppercase tracking-wider">Ngày</th>
                  <th className="pb-3 font-semibold text-muted-foreground text-xs uppercase tracking-wider text-right">Tổng cộng</th>
                  <th className="pb-3 font-semibold text-muted-foreground text-xs uppercase tracking-wider text-right hidden md:table-cell">Điểm</th>
                  <th className="pb-3 font-semibold text-muted-foreground text-xs uppercase tracking-wider text-center">Trạng thái</th>
                  <th className="pb-3"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {sorted.map((order) => {
                  const status = getStatus(order.orderStatus || "");
                  const shortId = String(order.orderId ?? "").slice(0, 8).toUpperCase();
                  const ticketCount = order.tickets?.length ?? 0;

                  return (
                    <tr
                      key={String(order.orderId)}
                      className="hover:bg-secondary/30 transition-colors"
                    >
                      <td className="py-3.5 pr-3">
                        <span className="font-bold text-foreground  text-xs">#{shortId}</span>
                      </td>
                      <td className="py-3.5 pr-3">
                        <div className="min-w-0">
                          <p className="text-foreground font-medium truncate max-w-[180px]">
                            {order.showTimeInfo?.movieName || `---`}
                          </p>
                        </div>
                      </td>
                      <td className="py-3.5 pr-3 hidden sm:table-cell">
                        <span className="text-muted-foreground text-xs truncate max-w-[140px] block">
                          {order.showTimeInfo?.cinemaName || "---"}
                        </span>
                      </td>
                      <td className="py-3.5 pr-3">
                        <span className="text-muted-foreground text-xs whitespace-nowrap">
                          {formatDate(order.bookingTime)}
                        </span>
                      </td>
                      <td className="py-3.5 pr-3 text-right">
                        <span className="font-bold text-foreground tabular-nums text-xs whitespace-nowrap">
                          {formatCurrency(order.finalPrice)}
                        </span>
                      </td>
                      <td className="py-3.5 pr-3 text-right hidden md:table-cell">
                        <span className="text-primary font-semibold text-xs tabular-nums">
                          +{(order.pointsEarned ?? 0).toLocaleString("vi-VN")}
                        </span>
                      </td>
                      <td className="py-3.5 pr-3 text-center">
                        <Badge variant={status.variant} className="text-xs font-semibold px-2 py-0.5 rounded-full">
                          {status.label}
                        </Badge>
                      </td>
                      <td className="py-3.5 text-right">
                        <div className="flex items-center justify-end gap-1">
                          {(order.orderStatus === "PENDING" || order.orderStatus === "IN_PROGRESS") && (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => setRetryOrder(order)}
                              className="cursor-pointer text-yellow-700 hover:text-yellow-800 hover:bg-yellow-500/10 dark:text-yellow-400 dark:hover:text-yellow-300 rounded-lg font-semibold text-xs shrink-0"
                            >
                              Thanh toán
                            </Button>
                          )}
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => onSelectOrder(order)}
                            className="cursor-pointer text-primary hover:text-primary hover:bg-primary/10 rounded-lg font-semibold text-xs shrink-0"
                          >
                            Chi tiết
                          </Button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <Dialog open={!!retryOrder} onOpenChange={(o) => !o && setRetryOrder(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Chọn phương thức thanh toán</DialogTitle>
          </DialogHeader>
          <div className="p-6 space-y-4">
            <p className="text-sm text-muted-foreground">Vui lòng chọn cổng thanh toán bạn muốn sử dụng để hoàn tất đơn hàng này.</p>
            <div className="space-y-3">
              <label className={`flex items-center gap-4 p-4 rounded-xl border-2 cursor-pointer transition-all ${retryMethod === "MOMO" ? "border-[#d82d8b] bg-[#d82d8b]/10" : "border-border hover:bg-secondary"}`}>
                <input type="radio" className="hidden" checked={retryMethod === "MOMO"} onChange={() => setRetryMethod("MOMO")} />
                <div className="w-10 h-10 rounded-lg bg-[#d82d8b]/20 flex items-center justify-center font-bold text-[#d82d8b]">M</div>
                <div className="font-semibold text-[#d82d8b]">Ví MoMo</div>
              </label>
              <label className={`flex items-center gap-4 p-4 rounded-xl border-2 cursor-pointer transition-all ${retryMethod === "VNPAY" ? "border-[#0066b3] bg-[#0066b3]/10" : "border-border hover:bg-secondary"}`}>
                <input type="radio" className="hidden" checked={retryMethod === "VNPAY"} onChange={() => setRetryMethod("VNPAY")} />
                <div className="w-10 h-10 rounded-lg bg-[#0066b3]/20 flex items-center justify-center font-bold text-[#0066b3]">V</div>
                <div className="font-semibold text-[#0066b3]">VNPAY (ATM/QR)</div>
              </label>
            </div>
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setRetryOrder(null)} disabled={isRetrying}>Hủy</Button>
            <Button onClick={handleRepayment} disabled={isRetrying} className="bg-primary text-primary-foreground">
              {isRetrying ? "Đang xử lý..." : "Tiếp tục thanh toán"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
