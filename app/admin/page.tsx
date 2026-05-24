"use client";

import {
  Film,
  CalendarClock,
  TrendingUp,
  Users,
  Activity,
} from "lucide-react";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

const MOCK_STATS = {
  totalMovies: 42,
  showingToday: 8,
  weeklyRevenue: 125_000_000,
  totalUsers: 3_120,
};

const MOCK_WEEKLY_REVENUE = [
  { day: "T2", revenue: 18_000_000 },
  { day: "T3", revenue: 22_000_000 },
  { day: "T4", revenue: 15_000_000 },
  { day: "T5", revenue: 25_000_000 },
  { day: "T6", revenue: 30_000_000 },
  { day: "T7", revenue: 42_000_000 },
  { day: "CN", revenue: 38_000_000 },
];

const MOCK_RECENT_ACTIVITIES = [
  { id: 1, description: "Phim mới 'Avengers: Doomsday' được thêm vào hệ thống", timestamp: "5 phút trước" },
  { id: 2, description: "Đơn hàng #ORD-2025 được tạo bởi user nguyenvan@email.com", timestamp: "12 phút trước" },
  { id: 3, description: "Banner 'Khuyến mãi hè 2025' đã được kích hoạt", timestamp: "30 phút trước" },
  { id: 4, description: "Người dùng mới tranthib@email.com đăng ký thành công", timestamp: "1 giờ trước" },
  { id: 5, description: "Phim 'The Dark Knight' được vô hiệu hóa", timestamp: "2 giờ trước" },
];

interface StatCardProps {
  title: string;
  value: string;
  icon: React.ReactNode;
  color: string;
}

function StatCard({ title, value, icon, color }: StatCardProps) {
  return (
    <div className="rounded-xl border border-gray-800 bg-gray-900 p-5">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm text-gray-400">{title}</p>
          <p className="mt-2 text-2xl font-bold text-white">{value}</p>
        </div>
        <div className={`rounded-lg p-2.5 ${color}`}>{icon}</div>
      </div>
    </div>
  );
}

function formatVND(amount: number): string {
  return new Intl.NumberFormat("vi-VN", {
    style: "currency",
    currency: "VND",
    maximumFractionDigits: 0,
  }).format(amount);
}

export default function AdminDashboardPage() {
  const stats = MOCK_STATS;

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-white">Dashboard</h1>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          title="Tổng số phim"
          value={String(stats.totalMovies)}
          icon={<Film size={20} className="text-indigo-300" />}
          color="bg-indigo-600/20"
        />
        <StatCard
          title="Suất chiếu hôm nay"
          value={String(stats.showingToday)}
          icon={<CalendarClock size={20} className="text-emerald-300" />}
          color="bg-emerald-600/20"
        />
        <StatCard
          title="Doanh thu tuần này"
          value={formatVND(stats.weeklyRevenue)}
          icon={<TrendingUp size={20} className="text-amber-300" />}
          color="bg-amber-600/20"
        />
        <StatCard
          title="Tổng người dùng"
          value={stats.totalUsers.toLocaleString("vi-VN")}
          icon={<Users size={20} className="text-sky-300" />}
          color="bg-sky-600/20"
        />
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2 rounded-xl border border-gray-800 bg-gray-900 p-5">
          <h2 className="mb-4 text-base font-semibold text-white">
            Doanh thu 7 ngày qua
          </h2>
          <ResponsiveContainer width="100%" height={240}>
            <AreaChart
              data={MOCK_WEEKLY_REVENUE}
              margin={{ top: 5, right: 10, left: 10, bottom: 0 }}
            >
              <defs>
                <linearGradient id="revenueGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#6366f1" stopOpacity={0.4} />
                  <stop offset="95%" stopColor="#6366f1" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
              <XAxis
                dataKey="day"
                stroke="#6b7280"
                tick={{ fill: "#9ca3af", fontSize: 12 }}
              />
              <YAxis
                stroke="#6b7280"
                tick={{ fill: "#9ca3af", fontSize: 11 }}
                tickFormatter={(value: number) =>
                  `${(value / 1_000_000).toFixed(0)}M`
                }
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: "#1f2937",
                  border: "1px solid #374151",
                  borderRadius: "8px",
                  color: "#f9fafb",
                }}
                formatter={(value) => [formatVND(typeof value === "number" ? value : 0), "Doanh thu"]}
              />
              <Area
                type="monotone"
                dataKey="revenue"
                stroke="#6366f1"
                strokeWidth={2}
                fill="url(#revenueGradient)"
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        <div className="rounded-xl border border-gray-800 bg-gray-900 p-5">
          <h2 className="mb-4 flex items-center gap-2 text-base font-semibold text-white">
            <Activity size={16} className="text-indigo-400" />
            Hoạt động gần đây
          </h2>
          <ul className="space-y-3">
            {MOCK_RECENT_ACTIVITIES.map((activity) => (
              <li key={activity.id} className="border-b border-gray-800 pb-3 last:border-0 last:pb-0">
                <p className="text-sm text-gray-300 leading-snug">
                  {activity.description}
                </p>
                <p className="mt-1 text-xs text-gray-500">{activity.timestamp}</p>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
}
