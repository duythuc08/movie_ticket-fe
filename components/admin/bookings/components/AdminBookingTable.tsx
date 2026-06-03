"use client";

import { useState } from "react";
import { ActionMenu } from "@/components/shared";
import { Eye, QrCode } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import type { AdminOrderSummaryResponse } from "@/types";

interface Props {
  orders: AdminOrderSummaryResponse[];
  onViewDetail: (orderId: number) => void;
  onCheckin: (orderId: number) => void;
}

const STATUS_MAP: Record<string, { label: string; style: string }> = {
  PENDING: { label: "Chờ thanh toán", style: "bg-amber-500/20 text-amber-500 border-amber-500/30" },
  PAID: { label: "Đã thanh toán", style: "bg-emerald-500/20 text-emerald-400 border-emerald-500/30" },
  CANCELLED: { label: "Đã hủy", style: "bg-rose-500/20 text-rose-500 border-rose-500/30" },
  EXPIRED: { label: "Hết hạn", style: "bg-gray-500/20 text-gray-400 border-gray-500/30" },
  USED: { label: "Đã sử dụng", style: "bg-blue-500/20 text-blue-400 border-blue-500/30" },
};

function formatVND(amount: number): string {
  return new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND", maximumFractionDigits: 0 }).format(amount || 0);
}

function fdt(dStr: string) {
  if (!dStr) return "---";
  const d = new Date(dStr);
  if (isNaN(d.getTime())) return dStr;
  return `${d.toLocaleDateString("vi-VN")} ${d.toLocaleTimeString("vi-VN", { hour: "2-digit", minute: "2-digit" })}`;
}

export function AdminBookingTable({ orders, onViewDetail, onCheckin }: Props) {
  if (orders.length === 0) {
    return (
      <div className="text-center py-16 bg-admin-surface-2 rounded-xl border border-admin-border">
        <p className="text-admin-3">Không tìm thấy đơn hàng nào.</p>
      </div>
    );
  }

  return (
    <div className="bg-admin-surface-2 rounded-xl border border-admin-border overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-sm text-left">
          <thead className="text-xs text-admin-3 uppercase bg-admin-surface border-b border-admin-border">
            <tr>
              <th className="px-4 py-3 font-medium">Mã Đơn</th>
              <th className="px-4 py-3 font-medium">Khách Hàng</th>
              <th className="px-4 py-3 font-medium">Phim / Rạp</th>
              <th className="px-4 py-3 font-medium">Suất Chiếu</th>
              <th className="px-4 py-3 font-medium text-right">Tổng Tiền</th>
              <th className="px-4 py-3 font-medium text-center">Trạng Thái</th>
              <th className="px-4 py-3 font-medium text-right">Hành Động</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-admin-border">
            {orders.map((order) => {
              const status = STATUS_MAP[order.orderStatus] || { label: order.orderStatus, style: "bg-admin-surface-3 text-admin-3" };
              const shortId = String(order.orderId).slice(0, 8).toUpperCase();

              return (
                <tr key={order.orderId} className="hover:bg-admin-surface-3 transition-colors">
                  <td className="px-4 py-3 font-mono text-admin-2">#{shortId}</td>
                  <td className="px-4 py-3 text-admin font-medium">
                    {order.fullName}
                  </td>
                  <td className="px-4 py-3">
                    <div className="text-admin line-clamp-1">{order.movieName || "---"}</div>
                    <div className="text-xs text-admin-4 mt-0.5">{order.cinemaName || "---"}</div>
                  </td>
                  <td className="px-4 py-3 text-admin-3 whitespace-nowrap">
                    {fdt(order.showTime || "")}
                  </td>
                  <td className="px-4 py-3 text-right font-medium text-admin tabular-nums">
                    {formatVND(order.finalPrice)}
                  </td>
                  <td className="px-4 py-3 text-center">
                    <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold tracking-wide border ${status.style}`}>
                      {status.label}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <ActionMenu
                      actions={[
                        { label: "Xem chi tiết", icon: Eye, onClick: () => onViewDetail(order.orderId) },
                        ...(order.orderStatus === "PAID"
                          ? [{ label: "Check-in", icon: QrCode, onClick: () => onCheckin(order.orderId), variant: "default" as const }]
                          : [])
                      ]}
                    />
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
