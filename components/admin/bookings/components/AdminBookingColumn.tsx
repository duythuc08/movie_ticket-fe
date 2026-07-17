"use client";

import type { ColumnDef } from "@tanstack/react-table";
import type { AdminOrderSummaryResponse } from "@/types";
import { ActionMenu, ColumnHeader } from "@/components/shared";
import { Eye } from "lucide-react";

const STATUS_MAP: Record<string, { label: string; style: string }> = {
  PENDING: { label: "Chờ thanh toán", style: "bg-amber-500/20 text-amber-500 border-amber-500/30" },
  IN_PROGRESS: { label: "Đang xử lý", style: "bg-blue-500/20 text-blue-500 border-blue-500/30" },
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

interface AdminBookingColumnActions {
  onViewDetail: (orderId: number) => void;
}

export function createAdminBookingColumns(
  actions: AdminBookingColumnActions
): ColumnDef<AdminOrderSummaryResponse, unknown>[] {
  return [
    {
      accessorKey: "orderId",
      header: "Mã Đơn",
      cell: ({ row }) => {
        const shortId = String(row.original.orderId).slice(0, 8).toUpperCase();
        return <span className=" text-admin-2">#{shortId}</span>;
      },
    },
    {
      accessorKey: "fullName",
      header: ({ column }) => <ColumnHeader column={column} title="Khách Hàng" />,
      cell: ({ row }) => <span className="font-medium text-admin">{row.original.fullName}</span>,
    },
    {
      id: "movieAndCinema",
      header: "Phim / Rạp",
      cell: ({ row }) => (
        <div>
          <div className="text-admin line-clamp-1">{row.original.movieName || "---"}</div>
          <div className="text-xs text-admin-4 mt-0.5">{row.original.cinemaName || "---"}</div>
        </div>
      ),
    },
    {
      accessorKey: "showTime",
      header: "Suất Chiếu",
      cell: ({ row }) => <span className="text-admin-3 whitespace-nowrap">{fdt(row.original.showTime || "")}</span>,
    },
    {
      accessorKey: "ticketCount",
      header: "Tổng vé",
      cell: ({ row }) => <span className="text-admin-3 whitespace-nowrap">{row.original.ticketCount}</span>
    },
    {
      accessorKey: "finalPrice",
      header: ({ column }) => <ColumnHeader column={column} title="Tổng Tiền" />,
      cell: ({ row }) => <div className="font-medium text-admin tabular-nums">{formatVND(row.original.finalPrice)}</div>,
    },
    {
      accessorKey: "orderStatus",
      header: "Trạng Thái",
      filterFn: (row, columnId, filterValue) => {
        const val = row.getValue(columnId) as string;
        if (filterValue === "PENDING_OR_PAID") {
          return val === "PENDING" || val === "PAID" || val === "IN_PROGRESS";
        }
        return val === filterValue;
      },
      cell: ({ row }) => {
        const st = row.original.orderStatus;
        const statusInfo = STATUS_MAP[st] || { label: st, style: "bg-admin-surface-3 text-admin-3" };
        return (
          <div>
            <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold tracking-wide border ${statusInfo.style}`}>
              {statusInfo.label}
            </span>
          </div>
        );
      },
    },
    {
      id: "actions",
      cell: ({ row }) => {
        const order = row.original;
        return (
          <ActionMenu
            actions={[
              { label: "Xem chi tiết", icon: Eye, onClick: () => actions.onViewDetail(order.orderId) },
            ]}
          />
        );
      },
    },
  ];
}
