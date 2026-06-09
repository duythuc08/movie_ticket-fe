"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useState, useRef, useEffect } from "react";
import {
  LayoutDashboard,
  Film,
  Users,
  Tag,
  Star,
  Image,
  Building2,
  DoorOpen,
  Clock,
  Ticket,
  Gift,
  UserCog,
  ChevronDown,
  ChevronRight,
  Clapperboard,
  LogOut,
  Home,
  Percent,
  CalendarDays,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useAuth } from "@/context/AuthContext";

interface SidebarLeafItem {
  label: string;
  href: string;
  icon: React.ReactNode;
  developing?: boolean;
}

interface SidebarGroupItem {
  label: string;
  icon: React.ReactNode;
  children: SidebarLeafItem[];
}

type SidebarItem = SidebarLeafItem | SidebarGroupItem;

function isGroupItem(item: SidebarItem): item is SidebarGroupItem {
  return "children" in item;
}

const SIDEBAR_ITEMS: SidebarItem[] = [
  {
    label: "Dashboard",
    href: "/admin",
    icon: <LayoutDashboard size={18} />,
  },
  {
    label: "Quản lý Phim",
    icon: <Film size={18} />,
    children: [
      { label: "Danh sách Phim",       href: "/admin/movies",  icon: <Clapperboard size={16} /> },
      { label: "Thể loại (Genre)",      href: "/admin/genres",  icon: <Tag size={16} /> },
      { label: "Diễn viên & Đạo diễn", href: "/admin/persons", icon: <Users size={16} /> },
      { label: "Đánh giá (Review)",     href: "/admin/reviews", icon: <Star size={16} />, developing: true },
    ],
  },
  { label: "Quản lý Banner", href: "/admin/banners", icon: <Image size={18} /> },
  {
    label: "Quản lý Rạp chiếu",
    icon: <Building2 size={18} />,
    children: [
      { label: "Cụm rạp (Cinema)",   href: "/admin/cinemas", icon: <Building2 size={16} /> },
      { label: "Phòng chiếu (Room)", href: "/admin/rooms",   icon: <DoorOpen size={16} /> },
    ],
  },
  { label: "Suất chiếu",         href: "/admin/showtimes",  icon: <Clock size={18} /> },
  { label: "Đặt vé & Đơn hàng", href: "/admin/bookings",   icon: <Ticket size={18} /> },
  {
    label: "Khuyến mãi & Sự kiện",
    icon: <Gift size={18} />,
    children: [
      { label: "Khuyến mãi", href: "/admin/promotions", icon: <Percent size={16} /> },
      { label: "Sự kiện",    href: "/admin/events",     icon: <CalendarDays size={16} /> },
    ],
  },
  { label: "Quản lý Người dùng", href: "/admin/users", icon: <UserCog size={18} /> },
];

function SidebarLeaf({ item, isActive }: { item: SidebarLeafItem; isActive: boolean }) {
  return (
    <Link
      href={item.href}
      className={cn(
        "flex items-center gap-2.5 rounded-md px-3 py-2 text-sm transition-all duration-150",
        isActive
          ? "bg-(--admin-nav-active-bg) text-(--admin-nav-active-text) font-medium border-l-2 border-admin-accent"
          : "border-l-2 border-transparent text-admin-3 hover:bg-(--admin-nav-hover-bg) hover:text-admin-2"
      )}
    >
      <span className="shrink-0">{item.icon}</span>
      <span className="truncate">{item.label}</span>
      {item.developing && (
        <span className="ml-auto text-[10px] bg-admin-warning-sub text-admin-warning px-1.5 py-0.5 rounded-full shrink-0 font-medium">
          Soon
        </span>
      )}
    </Link>
  );
}

function SidebarGroup({ item, currentPath }: { item: SidebarGroupItem; currentPath: string }) {
  const isAnyChildActive = item.children.some((child) => currentPath.startsWith(child.href));
  const [isOpen, setIsOpen] = useState(isAnyChildActive);

  return (
    <div>
      <button
        onClick={() => setIsOpen((prev) => !prev)}
        className={cn(
          "flex w-full items-center gap-2.5 rounded-md px-3 py-2 text-sm transition-all duration-150",
          isAnyChildActive
            ? "text-admin font-medium"
            : "text-admin-3 hover:bg-(--admin-nav-hover-bg) hover:text-admin-2"
        )}
      >
        <span className="shrink-0">{item.icon}</span>
        <span className="flex-1 truncate text-left">{item.label}</span>
        <span className={cn("shrink-0 transition-transform duration-200", isOpen && "rotate-180")}>
          {isOpen ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
        </span>
      </button>

      {isOpen && (
        <div className="mt-0.5 ml-4 space-y-0.5 border-l border-admin-border pl-3">
          {item.children.map((child) => (
            <SidebarLeaf
              key={child.href}
              item={child}
              isActive={currentPath === child.href || currentPath.startsWith(child.href + "/")}
            />
          ))}
        </div>
      )}
    </div>
  );
}

function UserMenu() {
  const { user, logout } = useAuth();
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  function handleLogout() {
    logout();
    router.push("/login");
  }

  const initials = user
    ? `${user.firstname?.[0] ?? ""}${user.lastname?.[0] ?? ""}`.toUpperCase()
    : "A";
  const fullName = user ? `${user.firstname} ${user.lastname}`.trim() : "Admin";

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen((p) => !p)}
        className="flex w-full items-center gap-3 rounded-lg px-2 py-2 hover:bg-(--admin-nav-hover-bg) transition-colors"
      >
        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-admin-accent text-admin-accent-fg text-sm font-semibold">
          {initials}
        </div>
        <div className="flex-1 min-w-0 text-left">
          <p className="truncate text-sm font-medium text-admin">{fullName}</p>
          <p className="truncate text-xs text-admin-3">{user?.username ?? ""}</p>
        </div>
        <ChevronDown
          size={14}
          className={cn("shrink-0 text-admin-3 transition-transform", open && "rotate-180")}
        />
      </button>

      {open && (
        <div className="absolute bottom-full left-0 right-0 mb-1 rounded-xl border border-admin-border-2 bg-admin-surface-2 py-1 shadow-2xl overflow-hidden">
          <Link
            href="/"
            onClick={() => setOpen(false)}
            className="flex items-center gap-2 px-3 py-2 text-sm text-admin-2 hover:bg-admin-surface-3 hover:text-admin transition-colors"
          >
            <Home size={14} /> Về trang chủ
          </Link>
          <div className="my-1 border-t border-admin-border" />
          <button
            onClick={handleLogout}
            className="flex w-full items-center gap-2 px-3 py-2 text-sm text-admin-danger hover:bg-admin-danger-sub transition-colors"
          >
            <LogOut size={14} /> Đăng xuất
          </button>
        </div>
      )}
    </div>
  );
}

export function AdminSidebar() {
  const pathname = usePathname();

  return (
    <aside className="flex h-full w-64 shrink-0 flex-col border-r border-admin-border bg-admin-surface">
      {/* Logo */}
      <div className="flex h-16 items-center gap-2.5 border-b border-admin-border px-5">
        <Film className="text-admin-accent shrink-0" size={20} />
        <span className="text-sm font-black tracking-widest uppercase text-admin whitespace-nowrap">
          Infinity Cinema
        </span>
      </div>

      {/* Nav */}
      <nav className="flex-1 space-y-0.5 overflow-y-auto p-3">
        {SIDEBAR_ITEMS.map((item) => {
          if (isGroupItem(item)) {
            return <SidebarGroup key={item.label} item={item} currentPath={pathname} />;
          }
          return (
            <SidebarLeaf
              key={item.href}
              item={item}
              isActive={pathname === item.href}
            />
          );
        })}
      </nav>

      {/* User */}
      <div className="border-t border-admin-border p-3">
        <UserMenu />
      </div>
    </aside>
  );
}
