"use client";

import { useEffect, useState } from "react";
import { Film, Users } from "lucide-react";
import { AdminBookingStats } from "@/components/admin/bookings/components/AdminBookingStats";
import { fetchAdminMovies } from "@/services/admin/adminMovieService";
import { adminUserService } from "@/services/admin/adminUserService";
import { getStoredToken } from "@/components/auth/utils/auth.utils";

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

export default function AdminDashboardPage() {
  const [totalMovies, setTotalMovies] = useState<number>(0);
  const [totalUsers, setTotalUsers] = useState<number>(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const token = getStoredToken();
        if (!token) return;

        const [moviesRes, usersRes] = await Promise.all([
          fetchAdminMovies(token, { page: 0, size: 1 }),
          adminUserService.getUsers(token, 0, 1),
        ]);

        setTotalMovies(moviesRes.totalElements || 0);
        setTotalUsers(usersRes.totalElements || 0);
      } catch (error) {
        console.error("Failed to fetch dashboard stats", error);
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
  }, []);

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-white">Dashboard</h1>

      <AdminBookingStats />

      <h2 className="text-lg font-semibold text-admin mt-8 flex items-center gap-2">
        <Film className="w-5 h-5 text-indigo-400" />
        Thống kê Hệ thống
      </h2>

      {loading ? (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 animate-pulse">
          <div className="h-24 rounded-xl bg-admin-surface-3 border border-admin-border"></div>
          <div className="h-24 rounded-xl bg-admin-surface-3 border border-admin-border"></div>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <StatCard
            title="Tổng số phim"
            value={totalMovies.toString()}
            icon={<Film size={20} className="text-indigo-300" />}
            color="bg-indigo-600/20"
          />
          <StatCard
            title="Tổng người dùng"
            value={totalUsers.toLocaleString("vi-VN")}
            icon={<Users size={20} className="text-sky-300" />}
            color="bg-sky-600/20"
          />
        </div>
      )}
    </div>
  );
}
