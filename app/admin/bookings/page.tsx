"use client";

import React, { useEffect, useState, useCallback } from "react";
import { Ticket, QrCode } from "lucide-react";
import { toast } from "sonner";
import { DataTable } from "@/components/shared";
import { createAdminBookingColumns } from "@/components/admin/bookings/components/AdminBookingColumn";
import { AdminBookingStats } from "@/components/admin/bookings/components/AdminBookingStats";
import { getStoredToken } from "@/components/auth/utils/auth.utils";
import { AdminBookingDetailDialog } from "@/components/admin/bookings/components/AdminBookingDetailDialog";
import { QrCheckinDialog } from "@/components/admin/bookings/components/QrCheckinDialog";
import { Input } from "@/components/ui/input";
import { adminBookingService } from "@/services/admin/admin-booking";
import type { AdminOrderSummaryResponse, Order } from "@/types";


export default function AdminBookingsPage() {
  const [orders, setOrders] = useState<AdminOrderSummaryResponse[]>([]);
  const [loading, setLoading] = useState(true);

  // Filters (server-side for dates)
  const todayStr = new Date().toISOString().split("T")[0];
  const [fromDate, setFromDate] = useState(todayStr);
  const [toDate, setToDate] = useState(todayStr);

  // Dialogs
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [isDetailOpen, setIsDetailOpen] = useState(false);

  // Check-in
  const [isCheckinOpen, setIsCheckinOpen] = useState(false);

  const fetchOrders = useCallback(async () => {
    try {
      setLoading(true);
      const token = getStoredToken() ?? "";
      const res = await adminBookingService.getAdminOrders(
        token,
        0,
        1000,
        undefined,
        undefined,
        fromDate,
        toDate
      );
      setOrders(res.content);
    } catch (error: any) {
      toast.error(error.message || "Lỗi khi tải danh sách đơn hàng");
    } finally {
      setLoading(false);
    }
  }, [fromDate, toDate]);

  useEffect(() => {
    fetchOrders();
  }, [fetchOrders]);

  const handleViewDetail = async (orderId: number) => {
    try {
      const token = getStoredToken() ?? "";
      const detail = await adminBookingService.getAdminOrderDetail(token, orderId);
      setSelectedOrder(detail);
      setIsDetailOpen(true);
    } catch (error: any) {
      toast.error(error.message);
    }
  };

  const handleCheckinScan = async (qrCode: string) => {
    const token = getStoredToken() ?? "";
    await adminBookingService.checkinOrder(token, qrCode);
    fetchOrders();
  };

  const columns = React.useMemo(() => createAdminBookingColumns({
    onViewDetail: handleViewDetail,
  }), []);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-2xl font-bold text-admin flex items-center gap-2">
          <Ticket className="w-6 h-6 text-admin-accent" />
          Quản lý Đơn hàng
        </h1>
        <button
          onClick={() => setIsCheckinOpen(true)}
          className="flex items-center gap-2 px-4 py-2 rounded-lg bg-admin-accent text-white text-sm font-semibold hover:opacity-90 transition-opacity"
        >
          <QrCode className="w-4 h-4" />
          Quét QR Check-in
        </button>
      </div>

      <DataTable
        columns={columns}
        data={orders}
        searchKey="fullName"
        searchPlaceholder="Tìm theo tên khách..."
        filters={[{
          key: "orderStatus",
          label: "Trạng thái",
          options: [
            { label: "(Mặc định)", value: "PENDING_OR_PAID" },
            { label: "Chờ thanh toán", value: "PENDING" },
            { label: "Đang xử lý", value: "IN_PROGRESS" },
            { label: "Đã thanh toán", value: "PAID" },
            { label: "Đã hủy", value: "CANCELLED" },
            { label: "Hết hạn", value: "EXPIRED" },
            { label: "Đã sử dụng", value: "USED" },
          ],
        }]}
        initialFilters={[{ id: "orderStatus", value: "PENDING_OR_PAID" }]}
        isLoading={loading}
        emptyText="Không tìm thấy đơn hàng nào."
        onResetFilters={() => {
          setFromDate(todayStr);
          setToDate(todayStr);
        }}
      >
        <div className="flex items-center gap-2 text-sm">
          <Input
            type="date"
            className="w-36 bg-admin-surface border-admin-border text-admin h-9"
            value={fromDate}
            onChange={(e) => setFromDate(e.target.value)}
          />
          <span className="text-admin-4">-</span>
          <Input
            type="date"
            className="w-36 bg-admin-surface border-admin-border text-admin h-9"
            value={toDate}
            onChange={(e) => setToDate(e.target.value)}
          />
        </div>
      </DataTable>

      <AdminBookingDetailDialog
        open={isDetailOpen}
        onClose={() => setIsDetailOpen(false)}
        order={selectedOrder}
      />

      <QrCheckinDialog
        open={isCheckinOpen}
        onClose={() => setIsCheckinOpen(false)}
        onScan={handleCheckinScan}
      />

    </div>
  );
}
