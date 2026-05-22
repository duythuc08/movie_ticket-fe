"use client";

import { useAuth } from "@/context/AuthContext";
import { LogOut, User } from "lucide-react";
import { useRouter } from "next/navigation";

export function AdminHeader() {
  const { user, logout } = useAuth();
  const router = useRouter();

  function handleLogout() {
    logout();
    router.push("/login");
  }

  return (
    <header className="flex h-16 shrink-0 items-center justify-between border-b border-gray-800 bg-gray-900 px-6">
      <div className="text-sm text-gray-400">
        Hệ thống quản trị Infinity Cinema
      </div>

      <div className="flex items-center gap-4">
        {user && (
          <div className="flex items-center gap-2 text-sm text-gray-300">
            <User size={16} className="text-indigo-400" />
            <span>
              {user.firstname} {user.lastname}
            </span>
          </div>
        )}

        <button
          onClick={handleLogout}
          className="flex items-center gap-1.5 rounded-md px-3 py-1.5 text-sm text-gray-400 hover:bg-red-900/30 hover:text-red-400 transition-colors"
        >
          <LogOut size={15} />
          <span>Đăng xuất</span>
        </button>
      </div>
    </header>
  );
}
