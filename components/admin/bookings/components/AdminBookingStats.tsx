"use client";

import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Ticket, DollarSign, CheckCircle2, CalendarX2 } from "lucide-react";
import { getStoredToken } from "@/components/auth/utils/auth.utils";
import { adminBookingService } from "../../../../services/admin/admin-booking";
import type { AdminOrderStatsResponse } from "@/types";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { getDaysInMonth } from "date-fns";

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
  className?: string;
}

function StatCard({ title, value, icon, color, className }: StatCardProps) {
  return (
    <Card className={cn("overflow-hidden border-admin-border bg-admin-surface-2 transition-all hover:scale-[1.02] hover:shadow-lg", className)}>
      <CardContent className="p-5 flex items-start justify-between relative">
        <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-br from-white/5 to-transparent rounded-bl-full opacity-20 pointer-events-none" />
        <div className="z-10">
          <p className="text-sm font-medium text-admin-3 mb-1">{title}</p>
          <p className="text-2xl font-bold text-admin tracking-tight">{value}</p>
        </div>
        <div className={`rounded-xl p-3 z-10 shadow-inner ${color}`}>
          {icon}
        </div>
      </CardContent>
    </Card>
  );
}

export function AdminBookingStats({ year, month }: { year: number; month: number }) {
  const [stats, setStats] = useState<AdminOrderStatsResponse | null>(null);
  const [loading, setLoading] = useState(true);

  const currentMonthDays = getDaysInMonth(new Date(year, month - 1));

  useEffect(() => {
    const fetchStats = async () => {
      try {
        setLoading(true);
        const token = getStoredToken();
        if (!token) return;
        
        // format dates
        const fromDateStr = `${year}-${String(month).padStart(2, '0')}-01`;
        const toDateStr = `${year}-${String(month).padStart(2, '0')}-${currentMonthDays}`;
        
        const data = await adminBookingService.getAdminOrderStats(token, fromDateStr, toDateStr);
        setStats(data);
      } catch (error: any) {
        toast.error(error.message || "Lỗi tải thống kê đơn hàng");
      } finally {
        setLoading(false);
      }
    };
    fetchStats();
  }, [year, month, currentMonthDays]);

  if (loading) {
    return (
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4 animate-pulse">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="h-28 rounded-xl bg-admin-surface-3 border border-admin-border"></div>
        ))}
      </div>
    );
  }

  if (!stats) return null;

  return (
    <div className="space-y-4">
      <h2 className="text-xl font-semibold text-admin flex items-center gap-2 mb-4">
        <Ticket className="w-5 h-5 text-indigo-400" />
        Thống kê Đơn hàng (từ ngày 1 đến {currentMonthDays} tháng {month})
      </h2>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          title="Tổng Doanh Thu"
          value={formatVND(stats.totalRevenue)}
          icon={<DollarSign size={24} className="text-emerald-400" />}
          color="bg-emerald-500/20 ring-1 ring-emerald-500/30"
        />
        <StatCard
          title="Tổng Đơn"
          value={String(stats.totalOrders)}
          icon={<Ticket size={24} className="text-indigo-400" />}
          color="bg-indigo-500/20 ring-1 ring-indigo-500/30"
        />
        <StatCard
          title="Thành công"
          value={String(stats.successfulOrders)}
          icon={<CheckCircle2 size={24} className="text-blue-400" />}
          color="bg-blue-500/20 ring-1 ring-blue-500/30"
        />
        <StatCard
          title="Thất bại/Hết hạn"
          value={String(stats.failedOrExpiredOrders)}
          icon={<CalendarX2 size={24} className="text-rose-400" />}
          color="bg-rose-500/20 ring-1 ring-rose-500/30"
        />
      </div>
    </div>
  );
}
