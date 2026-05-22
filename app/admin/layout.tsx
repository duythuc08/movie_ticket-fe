import type { Metadata } from "next";
import { AdminSidebar } from "@/components/admin/layout/AdminSidebar";
import { AdminHeader } from "@/components/admin/layout/AdminHeader";

export const metadata: Metadata = {
  title: "Admin — Infinity Cinema",
  description: "Trang quản trị hệ thống Infinity Cinema",
};

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex h-screen overflow-hidden bg-gray-950 text-gray-100">
      <AdminSidebar />

      <div className="flex flex-col flex-1 overflow-hidden">
        <AdminHeader />

        <main className="flex-1 overflow-y-auto p-6">
          {children}
        </main>
      </div>
    </div>
  );
}
