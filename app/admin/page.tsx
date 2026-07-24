"use client";

import { useEffect, useState, useMemo } from "react";
import { Film, Users, PlusCircle, Megaphone, Activity, ChevronRight, ReceiptText, BarChart3, MessageSquare } from "lucide-react";
import { AdminBookingStats } from "@/components/admin/bookings/components/AdminBookingStats";
import { fetchAdminMovies } from "@/services/admin/adminMovieService";
import { adminUserService } from "@/services/admin/adminUserService";
import { adminBookingService } from "@/services/admin/admin-booking";
import { fetchAdminReviews } from "@/services/admin/adminReviewService";
import { adminStatisticService } from "@/services/admin/adminStatisticService";
import { getStoredToken } from "@/components/auth/utils/auth.utils";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { format } from "date-fns";
import { vi } from "date-fns/locale/vi";
import type { AdminOrderSummaryResponse } from "@/types";
import type { AdminReview } from "@/types/admin.type";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

interface StatCardProps {
  title: string;
  value: string;
  icon: React.ReactNode;
  color: string;
}

function StatCard({ title, value, icon, color }: StatCardProps) {
  return (
    <Card className="overflow-hidden border-admin-border bg-admin-surface-2 transition-all hover:scale-[1.02] hover:shadow-lg">
      <CardContent className="p-5 flex items-start justify-between relative">
        <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-br from-white/5 to-transparent rounded-bl-full opacity-20 pointer-events-none" />
        <div className="z-10">
          <p className="text-sm font-medium text-admin-3 mb-1">{title}</p>
          <p className="text-2xl font-bold text-admin tracking-tight">{value}</p>
        </div>
        <div className={`rounded-xl p-3 z-10 shadow-inner ${color}`}>{icon}</div>
      </CardContent>
    </Card>
  );
}

function formatVND(amount: number): string {
  return new Intl.NumberFormat("vi-VN", {
    style: "currency",
    currency: "VND",
  }).format(amount || 0);
}

export default function AdminDashboardPage() {
  const currentDate = new Date();
  const [selectedYear, setSelectedYear] = useState<number>(currentDate.getFullYear());
  const [selectedMonth, setSelectedMonth] = useState<number>(currentDate.getMonth() + 1);

  const [showingMovies, setShowingMovies] = useState<number>(0);
  const [comingMovies, setComingMovies] = useState<number>(0);
  const [totalUsers, setTotalUsers] = useState<number>(0);
  const [recentOrders, setRecentOrders] = useState<AdminOrderSummaryResponse[]>([]);
  const [pendingReviews, setPendingReviews] = useState<AdminReview[]>([]);
  const [loading, setLoading] = useState(true);
  const [chartData, setChartData] = useState<any[]>([]);

  useEffect(() => {
    const fetchChartData = async () => {
      try {
        const token = getStoredToken();
        if (!token) return;
        const res = await adminStatisticService.getMonthlyStatistics(token, selectedYear, selectedMonth);
        setChartData(res.dailyData || []);
      } catch (error) {
        console.error("Failed to fetch chart stats", error);
      }
    };
    fetchChartData();
  }, [selectedYear, selectedMonth]);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const token = getStoredToken();
        if (!token) return;

        const todayStr = format(new Date(), 'yyyy-MM-dd');

        const [showingRes, comingRes, usersRes, ordersRes, reviewsRes] = await Promise.all([
          fetchAdminMovies(token, { page: 0, size: 1, movieStatus: "NOW_SHOWING" }),
          fetchAdminMovies(token, { page: 0, size: 1, movieStatus: "COMING_SOON" }),
          adminUserService.getUsers(token, 0, 1),
          adminBookingService.getAdminOrders(token, 0, 5, undefined, undefined, todayStr, todayStr),
          fetchAdminReviews(token, { page: 0, size: 5, status: "PENDING" })
        ]);

        setShowingMovies(showingRes.totalElements || 0);
        setComingMovies(comingRes.totalElements || 0);
        setTotalUsers(usersRes.totalElements || 0);
        setRecentOrders(ordersRes.content || []);
        setPendingReviews(reviewsRes.content || []);
      } catch (error) {
        console.error("Failed to fetch dashboard stats", error);
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
  }, []);

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500 ease-out">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-white">Tổng quan</h1>
          <p className="text-admin-3 mt-1 text-sm">Quản lý và theo dõi hiệu suất hệ thống rạp chiếu phim.</p>
        </div>
        
        <div className="flex gap-2">
          <Link href="/admin/movies?action=add">
            <Button className="bg-indigo-600 hover:bg-indigo-700 text-white gap-2 transition-all">
              <PlusCircle className="w-4 h-4" />
              Thêm Phim Mới
            </Button>
          </Link>
          <Link href="/admin/promotions">
            <Button variant="outline" className="border-admin-border hover:bg-admin-surface-3 text-admin gap-2">
              <Megaphone className="w-4 h-4" />
              Khuyến mãi
            </Button>
          </Link>
        </div>
      </div>

      <AdminBookingStats year={selectedYear} month={selectedMonth} />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          
          {/* Chart Section */}
          <Card className="border-admin-border bg-admin-surface-2 overflow-hidden shadow-sm">
            <CardHeader className="bg-admin-surface-3/50 border-b border-admin-border flex flex-row items-center justify-between pb-4">
              <div className="flex items-center gap-2">
                <BarChart3 className="w-5 h-5 text-indigo-400" />
                <CardTitle className="text-lg font-semibold text-admin">Biểu đồ doanh thu</CardTitle>
              </div>
              <div className="flex items-center gap-2">
                <select 
                  className="bg-admin-surface-1 border border-admin-border text-admin-3 text-sm rounded-md px-3 py-1.5 focus:outline-none focus:border-indigo-500"
                  value={selectedMonth}
                  onChange={(e) => setSelectedMonth(Number(e.target.value))}
                >
                  {Array.from({ length: 12 }, (_, i) => i + 1).map(m => (
                    <option key={m} value={m}>Tháng {m}</option>
                  ))}
                </select>
                <select 
                  className="bg-admin-surface-1 border border-admin-border text-admin-3 text-sm rounded-md px-3 py-1.5 focus:outline-none focus:border-indigo-500"
                  value={selectedYear}
                  onChange={(e) => setSelectedYear(Number(e.target.value))}
                >
                  {[currentDate.getFullYear() - 1, currentDate.getFullYear(), currentDate.getFullYear() + 1].map(y => (
                    <option key={y} value={y}>Năm {y}</option>
                  ))}
                </select>
              </div>
            </CardHeader>
            <CardContent className="pt-6">
              <div className="h-[300px] w-full mt-4">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={chartData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#374151" vertical={false} />
                    <XAxis 
                      dataKey="day" 
                      stroke="#9CA3AF" 
                      fontSize={12} 
                      tickLine={false} 
                      axisLine={false} 
                      tickFormatter={(value) => `Ngày ${value}`}
                    />
                    <YAxis 
                      stroke="#9CA3AF" 
                      fontSize={12} 
                      tickLine={false} 
                      axisLine={false} 
                      tickFormatter={(value) => `${value / 1000000}M`}
                    />
                    <Tooltip 
                      contentStyle={{ backgroundColor: '#1F2937', borderColor: '#374151', color: '#F3F4F6' }}
                      formatter={(value: any) => [formatVND(Number(value) || 0), "Doanh thu"]}
                      labelFormatter={(label) => `Ngày ${label}`}
                    />
                    <Line 
                      type="monotone" 
                      dataKey="revenue" 
                      stroke="#818CF8" 
                      strokeWidth={3}
                      dot={{ r: 4, fill: '#818CF8', strokeWidth: 2, stroke: '#1F2937' }}
                      activeDot={{ r: 6, fill: '#818CF8', strokeWidth: 0 }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>

          {/* Recent Orders Section (Today's Orders) */}
          <div className="flex items-center gap-2 mt-4">
            <Activity className="w-5 h-5 text-indigo-400" />
            <h2 className="text-xl font-semibold text-admin">Đơn Hàng Hôm Nay</h2>
          </div>
          
          <Card className="border-admin-border bg-admin-surface-2 overflow-hidden shadow-sm">
            <div className="overflow-x-auto">
              <table className="w-full text-sm text-left">
                <thead className="text-xs text-admin-3 uppercase bg-admin-surface-3/50 border-b border-admin-border">
                  <tr>
                    <th className="px-6 py-4 font-medium">Khách hàng</th>
                    <th className="px-6 py-4 font-medium">Phim & Rạp</th>
                    <th className="px-6 py-4 font-medium">Thời gian</th>
                    <th className="px-6 py-4 font-medium text-right">Tổng tiền</th>
                    <th className="px-6 py-4 font-medium text-center">Trạng thái</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-admin-border">
                  {loading ? (
                    Array(5).fill(0).map((_, i) => (
                      <tr key={i} className="animate-pulse">
                        <td className="px-6 py-4"><div className="h-4 bg-admin-surface-3 rounded w-24"></div></td>
                        <td className="px-6 py-4"><div className="h-4 bg-admin-surface-3 rounded w-32"></div></td>
                        <td className="px-6 py-4"><div className="h-4 bg-admin-surface-3 rounded w-20"></div></td>
                        <td className="px-6 py-4"><div className="h-4 bg-admin-surface-3 rounded w-16 ml-auto"></div></td>
                        <td className="px-6 py-4"><div className="h-6 bg-admin-surface-3 rounded-full w-20 mx-auto"></div></td>
                      </tr>
                    ))
                  ) : recentOrders.length > 0 ? (
                    recentOrders.map((order) => (
                      <tr key={order.orderId} className="hover:bg-admin-surface-3/30 transition-colors">
                        <td className="px-6 py-4 font-medium text-white">{order.fullName}</td>
                        <td className="px-6 py-4">
                          <div className="text-white truncate max-w-[200px]">{order.movieName || "N/A"}</div>
                          <div className="text-xs text-admin-3 truncate max-w-[200px]">{order.cinemaName || "N/A"}</div>
                        </td>
                        <td className="px-6 py-4 text-admin-2">
                          {format(new Date(order.bookingTime), "dd/MM/yyyy HH:mm", { locale: vi })}
                        </td>
                        <td className="px-6 py-4 text-right font-medium text-emerald-400">
                          {formatVND(order.finalPrice)}
                        </td>
                        <td className="px-6 py-4 text-center">
                          <span className={`px-2.5 py-1 text-xs rounded-full font-medium border ${
                            order.orderStatus === 'PAID' ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' :
                            order.orderStatus === 'PENDING' ? 'bg-amber-500/10 text-amber-400 border-amber-500/20' :
                            'bg-rose-500/10 text-rose-400 border-rose-500/20'
                          }`}>
                            {order.orderStatus}
                          </span>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={5} className="px-6 py-8 text-center text-admin-3">
                        <ReceiptText className="w-12 h-12 mx-auto mb-3 opacity-20" />
                        Hôm nay chưa có đơn hàng nào
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
            {!loading && recentOrders.length > 0 && (
              <div className="p-4 border-t border-admin-border bg-admin-surface-3/30 text-center">
                <Link href="/admin/bookings" className="text-sm font-medium text-indigo-400 hover:text-indigo-300 inline-flex items-center gap-1 transition-colors">
                  Xem tất cả đơn hàng
                  <ChevronRight className="w-4 h-4" />
                </Link>
              </div>
            )}
          </Card>

          {/* Pending Reviews Section */}
          <div className="flex items-center gap-2 mt-4">
            <MessageSquare className="w-5 h-5 text-indigo-400" />
            <h2 className="text-xl font-semibold text-admin">Bình luận chờ duyệt</h2>
          </div>

          <Card className="border-admin-border bg-admin-surface-2 overflow-hidden shadow-sm">
            <CardContent className="p-0">
              <div className="divide-y divide-admin-border">
                {loading ? (
                  Array(3).fill(0).map((_, i) => (
                    <div key={i} className="p-4 animate-pulse">
                      <div className="h-4 bg-admin-surface-3 rounded w-1/3 mb-2"></div>
                      <div className="h-3 bg-admin-surface-3 rounded w-full"></div>
                    </div>
                  ))
                ) : pendingReviews.length > 0 ? (
                  pendingReviews.map((review) => (
                    <div key={review.reviewId} className="p-4 hover:bg-admin-surface-3/30 transition-colors">
                      <div className="flex justify-between items-start mb-1">
                        <span className="font-medium text-white text-sm">{review.username || "Người dùng"}</span>
                        <span className="text-xs text-admin-3">{format(new Date(review.createdAt), "dd/MM/yyyy HH:mm", { locale: vi })}</span>
                      </div>
                      <p className="text-sm text-admin-2 line-clamp-2">{review.comment}</p>
                    </div>
                  ))
                ) : (
                  <div className="p-8 text-center text-admin-3">
                    <MessageSquare className="w-8 h-8 mx-auto mb-2 opacity-20" />
                    Không có bình luận nào chờ duyệt
                  </div>
                )}
              </div>
              {!loading && pendingReviews.length > 0 && (
                <div className="p-4 border-t border-admin-border bg-admin-surface-3/30 text-center">
                  <Link href="/admin/reviews" className="text-sm font-medium text-indigo-400 hover:text-indigo-300 inline-flex items-center gap-1 transition-colors">
                    Xem tất cả đánh giá
                    <ChevronRight className="w-4 h-4" />
                  </Link>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        <div className="space-y-6">
          <div className="flex items-center gap-2">
            <Film className="w-5 h-5 text-indigo-400" />
            <h2 className="text-xl font-semibold text-admin">Hệ Thống</h2>
          </div>

          {loading ? (
            <div className="grid grid-cols-1 gap-4 animate-pulse">
              <div className="h-28 rounded-xl bg-admin-surface-3 border border-admin-border"></div>
              <div className="h-28 rounded-xl bg-admin-surface-3 border border-admin-border"></div>
              <div className="h-28 rounded-xl bg-admin-surface-3 border border-admin-border"></div>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-4">
              <StatCard
                title="Phim Đang Chiếu"
                value={showingMovies.toString()}
                icon={<Film size={24} className="text-indigo-400" />}
                color="bg-indigo-500/20 ring-1 ring-indigo-500/30"
              />
              <StatCard
                title="Phim Sắp Chiếu"
                value={comingMovies.toString()}
                icon={<Film size={24} className="text-violet-400" />}
                color="bg-violet-500/20 ring-1 ring-violet-500/30"
              />
              <StatCard
                title="Tổng người dùng"
                value={totalUsers.toLocaleString("vi-VN")}
                icon={<Users size={24} className="text-sky-400" />}
                color="bg-sky-500/20 ring-1 ring-sky-500/30"
              />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
