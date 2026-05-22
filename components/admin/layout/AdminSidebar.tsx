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
      {
        label: "Danh sách Phim",
        href: "/admin/movies",
        icon: <Clapperboard size={16} />,
      },
      {
        label: "Thể loại (Genre)",
        href: "/admin/genres",
        icon: <Tag size={16} />,
      },
      {
        label: "Diễn viên & Đạo diễn",
        href: "/admin/persons",
        icon: <Users size={16} />,
      },
      {
        label: "Đánh giá (Review)",
        href: "/admin/reviews",
        icon: <Star size={16} />,
        developing: true,
      },
      {
        label: "Banner quảng cáo",
        href: "/admin/banners",
        icon: <Image size={16} />,
        developing: true,
      },
    ],
  },
  {
    label: "Quản lý Rạp chiếu",
    icon: <Building2 size={18} />,
    children: [
      {
        label: "Cụm rạp (Cinema)",
        href: "/admin/cinemas",
        icon: <Building2 size={16} />,
        developing: true,
      },
      {
        label: "Phòng chiếu (Room)",
        href: "/admin/rooms",
        icon: <DoorOpen size={16} />,
        developing: true,
      },
    ],
  },
  {
    label: "Suất chiếu",
    href: "/admin/showtimes",
    icon: <Clock size={18} />,
    developing: true,
  },
  {
    label: "Đặt vé & Đơn hàng",
    href: "/admin/bookings",
    icon: <Ticket size={18} />,
    developing: true,
  },
  {
    label: "Khuyến mãi & Sự kiện",
    href: "/admin/promotions",
    icon: <Gift size={18} />,
    developing: true,
  },
  {
    label: "Quản lý Người dùng",
    href: "/admin/users",
    icon: <UserCog size={18} />,
    developing: true,
  },
];

function SidebarLeaf({
  item,
  isActive,
}: {
  item: SidebarLeafItem;
  isActive: boolean;
}) {
  return (
    <Link
      href={item.href}
      className={cn(
        "flex items-center gap-2 rounded-md px-3 py-2 text-sm transition-colors",
        isActive
          ? "bg-indigo-600 text-white font-medium"
          : "text-gray-400 hover:bg-gray-800 hover:text-gray-100"
      )}
    >
      <span className="shrink-0">{item.icon}</span>
      <span className="truncate">{item.label}</span>
      {item.developing && (
        <span className="ml-auto text-[10px] bg-amber-600/30 text-amber-400 px-1.5 py-0.5 rounded-full shrink-0">
          Soon
        </span>
      )}
    </Link>
  );
}

function SidebarGroup({
  item,
  currentPath,
}: {
  item: SidebarGroupItem;
  currentPath: string;
}) {
  const isAnyChildActive = item.children.some((child) =>
    currentPath.startsWith(child.href)
  );

  const [isOpen, setIsOpen] = useState(isAnyChildActive);

  return (
    <div>
      <button
        onClick={() => setIsOpen((prev) => !prev)}
        className={cn(
          "flex w-full items-center gap-2 rounded-md px-3 py-2 text-sm transition-colors",
          isAnyChildActive
            ? "text-indigo-400 font-medium"
            : "text-gray-400 hover:bg-gray-800 hover:text-gray-100"
        )}
      >
        <span className="shrink-0">{item.icon}</span>
        <span className="flex-1 truncate text-left">{item.label}</span>
        <span className="shrink-0 transition-transform duration-200">
          {isOpen ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
        </span>
      </button>

      {isOpen && (
        <div className="mt-1 ml-4 space-y-1 border-l border-gray-700 pl-3">
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
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
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
        className="flex w-full items-center gap-3 rounded-lg px-2 py-2 hover:bg-gray-800 transition-colors"
      >
        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-indigo-600 text-sm font-semibold text-white">
          {initials}
        </div>
        <div className="flex-1 min-w-0 text-left">
          <p className="truncate text-sm font-medium text-gray-200">{fullName}</p>
          <p className="truncate text-xs text-gray-500">{user?.username ?? ""}</p>
        </div>
        <ChevronDown
          size={14}
          className={cn("shrink-0 text-gray-500 transition-transform", open && "rotate-180")}
        />
      </button>

      {open && (
        <div className="absolute bottom-full left-0 right-0 mb-1 rounded-lg border border-gray-700 bg-gray-800 py-1 shadow-xl">
          <Link
            href="/"
            onClick={() => setOpen(false)}
            className="flex items-center gap-2 px-3 py-2 text-sm text-gray-300 hover:bg-gray-700 transition-colors"
          >
            <Home size={14} />
            Về trang chủ
          </Link>
          <div className="my-1 border-t border-gray-700" />
          <button
            onClick={handleLogout}
            className="flex w-full items-center gap-2 px-3 py-2 text-sm text-red-400 hover:bg-red-900/30 transition-colors"
          >
            <LogOut size={14} />
            Đăng xuất
          </button>
        </div>
      )}
    </div>
  );
}

export function AdminSidebar() {
  const pathname = usePathname();

  return (
    <aside className="flex h-full w-64 shrink-0 flex-col border-r border-gray-800 bg-gray-900">
      <div className="flex h-16 items-center gap-2 border-b border-gray-800 px-4">
        <Film className="text-red-500" size={22} />
        <span className="text-lg font-bold tracking-tight text-white">
          Admin Control
        </span>
      </div>

      <nav className="flex-1 space-y-1 overflow-y-auto p-3">
        {SIDEBAR_ITEMS.map((item) => {
          if (isGroupItem(item)) {
            return (
              <SidebarGroup
                key={item.label}
                item={item}
                currentPath={pathname}
              />
            );
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

      <div className="border-t border-gray-800 p-3">
        <UserMenu />
      </div>
    </aside>
  );
}
