"use client";

import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Ticket, DollarSign, CheckCircle2, XCircle, Clock, CalendarX2 } from "lucide-react";
import { adminBookingService } from "../../../../services/admin/admin-booking";
import type { AdminOrderStatsResponse } from "@/types";

function formatVND(amount: number): string {
  return new Intl.NumberFormat("vi-VN", {
    style: "currency",
    currency: "VND",
    maximumFractionDigits: 0,
  }).format(amount || 0);
}

interface StatCardProps {
  title: string;
  value: string;
  icon: React.ReactNode;
  color: string;
}

function StatCard({ title, value, icon, color }: StatCardProps) {
  return (
    <div className="rounded-xl border border-admin-border bg-admin-surface-2 p-5 shadow-sm">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm text-admin-3">{title}</p>
          <p className="mt-2 text-2xl font-bold text-admin">{value}</p>
        </div>
        <div className={`rounded-lg p-2.5 ${color}`}>{icon}</div>
      </div>
    </div>
  );
}

export function AdminBookingStats() {
  const [stats, setStats] = useState<AdminOrderStatsResponse | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const token = localStorage.getItem("token");
        if (!token) return;
        const data = await adminBookingService.getAdminOrderStats(token);
        setStats(data);
      } catch (error: any) {
        toast.error(error.message || "Lỗi tải thống kê đơn hàng");
      } finally {
        setLoading(false);
      }
    };
    fetchStats();
  }, []);

  if (loading) {
    return (
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 animate-pulse">
        {[1, 2, 3, 4, 5, 6].map((i) => (
          <div key={i} className="h-24 rounded-xl bg-admin-surface-3 border border-admin-border"></div>
        ))}
      </div>
    );
  }

  if (!stats) return null;

  return (
    <div className="space-y-4">
      <h2 className="text-lg font-semibold text-admin flex items-center gap-2">
        <Ticket className="w-5 h-5 text-admin-accent" />
        Thống kê Vé & Đơn hàng (30 ngày qua)
      </h2>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
        <div className="sm:col-span-2 lg:col-span-2 xl:col-span-2">
          <StatCard
            title="Tổng Doanh Thu"
            value={formatVND(stats.totalRevenue)}
            icon={<DollarSign size={20} className="text-emerald-300" />}
            color="bg-emerald-600/20"
          />
        </div>
        <StatCard
          title="Tổng Đơn"
          value={String(stats.totalOrders)}
          icon={<Ticket size={20} className="text-indigo-300" />}
          color="bg-indigo-600/20"
        />
        <StatCard
          title="Đã Thanh Toán"
          value={String(stats.paidOrders)}
          icon={<CheckCircle2 size={20} className="text-blue-300" />}
          color="bg-blue-600/20"
        />
        <StatCard
          title="Chờ Thanh Toán"
          value={String(stats.pendingOrders)}
          icon={<Clock size={20} className="text-amber-300" />}
          color="bg-amber-600/20"
        />
        <StatCard
          title="Đã Hủy/Hết Hạn"
          value={String(stats.cancelledOrders + stats.expiredOrders)}
          icon={<CalendarX2 size={20} className="text-rose-300" />}
          color="bg-rose-600/20"
        />
      </div>
    </div>
  );
}
