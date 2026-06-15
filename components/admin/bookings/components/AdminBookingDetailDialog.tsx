"use client";

import { X, Film, MapPin, Clock, Armchair, UtensilsCrossed } from "lucide-react";
import Image from "next/image";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import type { Order } from "@/types";

interface Props {
  order: Order | null;
  open: boolean;
  onClose: () => void;
}

const STATUS_MAP: Record<string, { label: string; style: string }> = {
  PENDING: { label: "Chờ thanh toán", style: "bg-amber-500/20 text-amber-500 border-amber-500/30" },
  PAID: { label: "Đã thanh toán", style: "bg-emerald-500/20 text-emerald-400 border-emerald-500/30" },
  CANCELLED: { label: "Đã hủy", style: "bg-rose-500/20 text-rose-500 border-rose-500/30" },
  EXPIRED: { label: "Hết hạn", style: "bg-gray-500/20 text-gray-400 border-gray-500/30" },
  USED: { label: "Đã sử dụng", style: "bg-blue-500/20 text-blue-400 border-blue-500/30" },
};

function fc(n?: number) {
  return new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND" }).format(n || 0);
}

function fdt(v?: string | null) {
  if (!v) return "---";
  const d = new Date(v);
  return `${d.toLocaleDateString("vi-VN")} – ${d.toLocaleTimeString("vi-VN", { hour: "2-digit", minute: "2-digit" })}`;
}

export function AdminBookingDetailDialog({ order, open, onClose }: Props) {
  if (!order) return null;

  const status = STATUS_MAP[order.orderStatus] || { label: order.orderStatus, style: "bg-admin-surface-3 text-admin-3 border-admin-border" };
  const shortId = String(order.orderId).slice(0, 8).toUpperCase();
  const movieName = order.showTimeInfo?.movieName || "---";
  const roomName = order.showTimeInfo?.roomName || "---";
  const cinemaName = order.showTimeInfo?.cinemaName || "";
  const showTime = order.showTimeInfo?.showTime;

  // Group tickets
  const ticketMap = new Map<string, { count: number; total: number; seats: string[] }>();
  (order.tickets || []).forEach(t => {
    const entry = ticketMap.get(t.seatType) || { count: 0, total: 0, seats: [] };
    entry.count += 1;
    entry.total += t.price;
    entry.seats.push(t.seatName);
    ticketMap.set(t.seatType, entry);
  });
  const ticketGroups = Array.from(ticketMap.entries()).map(([type, data]) => ({ type, ...data }));

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent data-admin="" className="max-w-3xl p-0 overflow-hidden gap-0 bg-admin-surface border border-admin-border text-admin">
        <div className="px-6 pt-5 pb-4 border-b border-admin-border">
          <div className="flex items-start justify-between gap-4">
            <div>
              <div className="flex items-center gap-3">
                <h2 className="text-lg font-bold text-admin tracking-tight">Chi tiết đơn #{shortId}</h2>
                <Badge variant="outline" className={`text-xs font-semibold px-2.5 py-0.5 rounded-full ${status.style}`}>
                  {status.label}
                </Badge>
              </div>
              <p className="text-sm text-admin-3 mt-1">Khách hàng: <span className="text-admin-2 font-medium">{order.fullName}</span></p>
            </div>
            <button
              onClick={onClose}
              className="p-1.5 rounded-md text-admin-3 hover:text-admin hover:bg-admin-surface-2 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <div className="flex flex-wrap gap-x-6 gap-y-2 mt-4 bg-admin-surface-2 p-3 rounded-xl border border-admin-border-2">
            <div className="w-full font-semibold text-admin-accent">{movieName}</div>
            <div className="flex items-center gap-1.5 text-xs text-admin-3">
              <Clock className="w-3.5 h-3.5 text-admin-accent" />
              <span>{fdt(showTime)}</span>
            </div>
            <div className="flex items-center gap-1.5 text-xs text-admin-3">
              <MapPin className="w-3.5 h-3.5 text-admin-accent" />
              <span>{roomName} {cinemaName ? `– ${cinemaName}` : ""}</span>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-[1fr_200px] max-h-[55vh] overflow-y-auto">
          <div className="p-5 border-r border-admin-border">
            <div className="mb-4">
              <h3 className="flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-admin-4 mb-3">
                <Armchair className="w-4 h-4 text-admin-accent" /> Vé ({order.tickets?.length || 0})
              </h3>
              <div className="space-y-2">
                {ticketGroups.map(g => (
                  <div key={g.type} className="flex justify-between items-center bg-admin-surface-2 p-3 rounded-lg border border-admin-border-2">
                    <div>
                      <span className="text-xs font-bold text-admin-accent mr-2 bg-admin-accent-sub px-2 py-0.5 rounded">{g.type}</span>
                      <span className="text-sm  text-admin-2">{g.seats.join(", ")}</span>
                    </div>
                    <span className="text-sm font-semibold text-admin-2">{fc(g.total)}</span>
                  </div>
                ))}
              </div>
            </div>

            {order.foods && order.foods.length > 0 && (
              <div>
                <h3 className="flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-admin-4 mb-3">
                  <UtensilsCrossed className="w-4 h-4 text-admin-accent" /> Đồ ăn ({order.foods.length})
                </h3>
                <div className="space-y-2">
                  {order.foods.map((f, i) => (
                    <div key={i} className="flex justify-between items-center bg-admin-surface-2 p-3 rounded-lg border border-admin-border-2">
                      <div className="text-sm text-admin-2">
                        <span className="font-bold text-admin-4 mr-2">{f.quantity}x</span> {f.name}
                      </div>
                      <span className="text-sm font-semibold text-admin-2">{fc(f.totalPrice)}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          <div className="p-5 bg-admin-surface-3 flex flex-col items-center justify-center">
            {order.orderStatus === "PAID" || order.orderStatus === "USED" ? (
              <div className="text-center">
                <div className="bg-white p-2 rounded-xl mb-3 inline-block">
                  <Image
                    alt="QR"
                    width={120}
                    height={120}
                    src={order.qrCode?.startsWith("data:image") ? order.qrCode : `https://api.qrserver.com/v1/create-qr-code/?size=220x220&data=${encodeURIComponent(order.qrCode || String(order.orderId))}`}
                  />
                </div>
                <p className="text-xs text-admin-4 uppercase tracking-widest mb-1">Mã QR</p>
                <p className="text-sm  font-bold text-admin-2">{order.qrCode}</p>
              </div>
            ) : (
              <div className="text-center text-admin-4">
                <div className="w-[120px] h-[120px] border-2 border-dashed border-admin-border-2 rounded-xl flex items-center justify-center mx-auto mb-3">
                  <span className="text-xs">{status.label}</span>
                </div>
                <p className="text-xs">Không có QR</p>
              </div>
            )}
          </div>
        </div>

        <div className="px-6 py-4 bg-admin-surface-2 border-t border-admin-border flex justify-between items-end">
          <div className="space-y-1">
            <p className="text-xs text-admin-4">Tiền vé: <span className="text-admin-2">{fc(order.totalTicketPrice)}</span></p>
            {(order.totalFoodPrice || 0) > 0 && <p className="text-xs text-admin-4">Tiền đồ ăn: <span className="text-admin-2">{fc(order.totalFoodPrice)}</span></p>}
            {(order.discountAmount || order.memberDiscountAmount) ? (
              <p className="text-xs text-admin-success">Giảm giá: -{fc((order.discountAmount || 0) + (order.memberDiscountAmount || 0))}</p>
            ) : null}
            {order.payment && (
              <p className="text-[10px] text-admin-4 uppercase mt-2">Thanh toán: {order.payment.paymentType} - {order.payment.transactionId}</p>
            )}
          </div>
          <div className="text-right">
            <p className="text-xs text-admin-4 uppercase tracking-widest mb-1">Tổng thanh toán</p>
            <p className="text-2xl font-black text-admin-accent">{fc(order.finalPrice)}</p>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
