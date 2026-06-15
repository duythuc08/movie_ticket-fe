"use client";

import { toast } from "sonner";

import { getStoredToken } from "@/components/auth/utils/auth.utils";
import { Film, MapPin, Clock, Armchair, UtensilsCrossed, X } from "lucide-react";
import Image from "next/image";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge, BadgeProps } from "@/components/ui/badge";
import { createVnpayRepaymentUrl } from "@/components/profile/service/user.service";
import type { Order } from "@/types";

interface Props {
  order: Order | null;
  open: boolean;
  onClose: () => void;
}

const STATUS_MAP: Record<string, { label: string; variant: BadgeProps["variant"] }> = {
  PENDING: { label: "Chờ thanh toán", variant: "pending" },
  CANCELLED: { label: "Đã hủy", variant: "cancelled" },
  PAID: { label: "Đã thanh toán", variant: "paid" },
};

const SEAT_TYPE_STYLE: Record<string, string> = {
  STANDARD: "bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20",
  VIP: "bg-yellow-500/10 text-yellow-600 dark:text-yellow-400 border border-yellow-500/20",
  COUPLE: "bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/20",
};

const getStatus = (s: string) =>
  STATUS_MAP[s] ?? { label: s, variant: "default" as BadgeProps["variant"] };

const fc = (n?: number) =>
  new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND" }).format(n || 0);

const fdt = (v?: string | null) => {
  if (!v) return "---";
  const d = new Date(v);
  return `${d.toLocaleDateString("vi-VN")} – ${d.toLocaleTimeString("vi-VN", { hour: "2-digit", minute: "2-digit" })}`;
};

const fShowtime = (v?: string | null) => {
  if (!v) return "---";
  const d = new Date(v);
  if (isNaN(d.getTime())) return v;
  return `${d.toLocaleDateString("vi-VN")} – ${d.toLocaleTimeString("vi-VN", { hour: "2-digit", minute: "2-digit" })}`;
};

const isCompleted = (s: string) => s !== "PENDING" && s !== "CANCELLED";

/** Group tickets by seatType — seats same type share one row */
function groupTicketsByType(tickets?: Order["tickets"]) {
  if (!tickets?.length) return [];
  const map = new Map<string, { seatType: string; seats: string[]; totalPrice: number }>();
  for (const t of tickets) {
    const entry = map.get(t.seatType);
    if (entry) {
      entry.seats.push(t.seatName);
      entry.totalPrice += t.price;
    } else {
      map.set(t.seatType, { seatType: t.seatType, seats: [t.seatName], totalPrice: t.price });
    }
  }
  return Array.from(map.values());
}

function groupFoods(foods?: Order["foods"]) {
  if (!foods?.length) return [];
  return Object.values(
    foods.reduce<Record<string, { name: string; quantity: number; totalPrice: number }>>((acc, f) => {
      if (!acc[f.name]) acc[f.name] = { name: f.name, quantity: 0, totalPrice: 0 };
      acc[f.name].quantity += f.quantity;
      acc[f.name].totalPrice += f.totalPrice;
      return acc;
    }, {}),
  );
}

export function OrderDetailDialog({ order, open, onClose }: Props) {
  if (!order) return null;

  const status = getStatus(order.orderStatus || "");
  const shortId = String(order.orderId ?? "").slice(0, 8).toUpperCase();
  const completed = isCompleted(order.orderStatus || "");
  const ticketGroups = groupTicketsByType(order.tickets);
  const foods = groupFoods(order.foods);
  const hasFoods = foods.length > 0;

  const movieName = order.showTimeInfo?.movieName;
  const roomName = order.showTimeInfo?.roomName || "---";
  const showTime = order.showTimeInfo?.showTime;

  const totalDiscount = (order.discountAmount || 0) + (order.memberDiscountAmount || 0);

  const handleRePayment = async () => {
    try {
      const token = getStoredToken() ?? "";
      const url = await createVnpayRepaymentUrl(token, String(order.orderId));
      window.location.href = url;
    } catch {
      toast.error("Không thể kết nối đến máy chủ thanh toán.");
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-3xl p-0 overflow-hidden gap-0">

        <div className="px-6 pt-5 pb-4 border-b border-border">
          <div className="flex items-start justify-between gap-4">
            <div className="flex-1 min-w-0">
              <div className="flex flex-wrap items-center gap-2.5">
                <span className="text-base font-black text-foreground tracking-tight">Thông tin đơn đặt vé #{shortId}</span>
                <Badge variant={status.variant} className="text-xs font-semibold px-2.5 py-0.5 rounded-full shrink-0">
                  {status.label}
                </Badge>
              </div>
            </div>
            <button
              onClick={onClose}
              className="shrink-0 w-7 h-7 rounded-full flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <div className="flex flex-wrap gap-x-6 gap-y-1.5 mt-3">
            {movieName && (
              <p className="text-sm font-semibold text-foreground mt-1 leading-snug line-clamp-1"> {movieName}</p>
            )}
            <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
              <Clock className="w-3.5 h-3.5 text-primary shrink-0" />
              <span className="font-medium text-foreground">{fShowtime(showTime)}</span>
            </div>
            <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
              <MapPin className="w-3.5 h-3.5 text-primary shrink-0" />
              <span className="font-medium text-foreground">{roomName}</span>
              {order.showTimeInfo?.cinemaName && <span className="text-muted-foreground">– {order.showTimeInfo.cinemaName} </span>}
            </div>
          </div>
        </div>

        <div className="grid grid-cols-[1fr_160px] overflow-y-auto max-h-[55vh]">
          <div className="border-r border-dashed border-border overflow-y-auto">
            <div className="px-5 py-4">
              <div className="flex items-center gap-2 mb-3">
                <Armchair className="w-4 h-4 text-primary shrink-0" />
                <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
                  Vé ({order.tickets?.length ?? 0})
                </p>
              </div>
              <div className="space-y-2">
                {ticketGroups.map((g) => (
                  <div
                    key={g.seatType}
                    className="flex items-center justify-between gap-3 px-3 py-2 rounded-xl bg-secondary/50"
                  >
                    <div className="flex items-center gap-2 min-w-0">
                      <span className=" font-black text-sm text-foreground shrink-0">
                        {g.seats.join(", ")}
                      </span>
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-md shrink-0 ${SEAT_TYPE_STYLE[g.seatType] ?? "bg-secondary text-muted-foreground"}`}>
                        {g.seatType}
                      </span>
                    </div>
                    <span className="text-sm font-semibold tabular-nums text-foreground shrink-0">{fc(g.totalPrice)}</span>
                  </div>
                ))}
              </div>
            </div>

            {hasFoods && (
              <div className="px-5 py-4 border-t border-dashed border-border">
                <div className="flex items-center gap-2 mb-3">
                  <UtensilsCrossed className="w-4 h-4 text-primary shrink-0" />
                  <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
                    Đồ ăn &amp; Thức uống
                  </p>
                </div>
                <div className="space-y-2">
                  {foods.map((f, i) => (
                    <div key={i} className="flex items-center justify-between gap-3 px-3 py-2 rounded-xl bg-secondary/50">
                      <div className="flex items-center gap-2 min-w-0">
                        <span className="w-5 h-5 rounded-md bg-primary/10 flex items-center justify-center text-[10px] font-black text-primary shrink-0">
                          {f.quantity}
                        </span>
                        <span className="text-sm text-foreground truncate">{f.name}</span>
                      </div>
                      <span className="text-sm font-semibold tabular-nums text-foreground shrink-0">{fc(f.totalPrice)}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          <div className="flex flex-col items-center justify-center gap-3 p-4 bg-secondary/20">
            {completed ? (
              <>
                <div className="bg-white p-2 rounded-xl shadow border border-border">
                  <Image
                    alt="QR Code"
                    width={108}
                    height={108}
                    className="object-contain block"
                    src={
                      order.qrCode?.startsWith("data:image")
                        ? order.qrCode
                        : `https://api.qrserver.com/v1/create-qr-code/?size=220x220&data=${encodeURIComponent(order.qrCode || String(order.orderId))}`
                    }
                  />
                </div>
                <div className="text-center">
                  <p className="text-[9px] font-bold uppercase tracking-widest text-muted-foreground">Mã vé</p>
                  <p className="text-xs  font-black text-foreground mt-0.5">#{shortId}</p>
                  {order.fullName && (
                    <p className="text-[10px] text-muted-foreground mt-1 leading-tight line-clamp-2">{order.fullName}</p>
                  )}
                </div>
              </>
            ) : (
              <>
                <div className="w-[108px] h-[108px] rounded-xl border-2 border-dashed border-border flex items-center justify-center">
                  <p className="text-[10px] text-muted-foreground text-center leading-tight px-3">
                    {order.orderStatus === "CANCELLED" ? "Đã hủy" : "Chờ thanh toán"}
                  </p>
                </div>
                <p className="text-[9px] text-muted-foreground text-center leading-tight">Mã QR chưa có</p>
              </>
            )}
          </div>
        </div>

        <div className="px-6 py-4 border-t border-border bg-secondary/20 flex flex-wrap items-center justify-between gap-3">
          <div>
            <div className="flex items-center gap-2 text-xs text-muted-foreground mb-1.5">
              <Film className="w-3.5 h-3.5 shrink-0" />
              <span>Đặt lúc: <span className="text-foreground font-medium">{fdt(order.bookingTime)}</span></span>
              <div className="flex flex-wrap gap-x-4 text-xs text-muted-foreground">
                <span>Vé: <span className="text-foreground font-semibold tabular-nums">{fc(order.totalTicketPrice)}</span></span>
                {(order.totalFoodPrice || 0) > 0 && (
                  <span>Đồ ăn: <span className="text-foreground font-semibold tabular-nums">{fc(order.totalFoodPrice)}</span></span>
                )}
                {totalDiscount > 0 && (
                  <span>Giảm: <span className="text-emerald-500 font-semibold tabular-nums">−{fc(totalDiscount)}</span></span>
                )}
                {(order.pointsEarned || 0) > 0 && (
                  <span>Điểm: <span className="text-primary font-semibold">+{order.pointsEarned.toLocaleString("vi-VN")}</span></span>
                )}
              </div>
            </div>

            <div className="flex items-baseline gap-1.5 mt-1">
              <span className="text-xs text-muted-foreground">Tổng cộng:</span>
              <span className="text-xl font-black text-primary tabular-nums">{fc(order.finalPrice)}</span>
            </div>
            {order.payment && (
              <div className="flex items-center gap-2 text-xs text-muted-foreground mt-2">
                <Badge variant="outline" className="text-[10px] uppercase font-bold">{order.payment.paymentType}</Badge>
                {order.payment.transactionId && <span>MGD: {order.payment.transactionId}</span>}
              </div>
            )}
          </div>

          {order.orderStatus === "PENDING" && (
            <Button
              size="sm"
              onClick={handleRePayment}
              className="cursor-pointer font-bold rounded-xl hover:-translate-y-0.5 transition-all shadow-md shadow-primary/20 shrink-0"
            >
              Thanh toán ngay
            </Button>
          )}
        </div>

      </DialogContent>
    </Dialog>
  );
}
