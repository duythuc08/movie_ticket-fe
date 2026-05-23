"use client";

import { usePathname } from "next/navigation";

const PATH_LABELS: Record<string, string> = {
  "/admin": "Dashboard",
  "/admin/genres": "Thể loại phim",
  "/admin/persons": "Diễn viên & Đạo diễn",
  "/admin/movies": "Quản lý phim",
  "/admin/cinemas": "Cụm rạp",
  "/admin/rooms": "Phòng chiếu",
  "/admin/showtimes": "Suất chiếu",
  "/admin/bookings": "Đặt vé & Đơn hàng",
  "/admin/promotions": "Khuyến mãi & Sự kiện",
  "/admin/users": "Quản lý người dùng",
  "/admin/banners": "Banner quảng cáo",
  "/admin/reviews": "Đánh giá phim",
};

export function AdminHeader() {
  const pathname = usePathname();
  const pageTitle = PATH_LABELS[pathname] ?? "Quản trị hệ thống";

  return (
    <header className="flex h-16 shrink-0 items-center justify-between border-b border-gray-800 bg-gray-900/80 px-6 backdrop-blur-sm">
      <div className="flex items-center gap-2 text-sm">
        <span className="text-xs uppercase tracking-widest text-gray-500 font-medium select-none">Admin</span>
        <span className="text-gray-700">/</span>
        <span className="font-semibold text-gray-100">{pageTitle}</span>
      </div>
    </header>
  );
}
