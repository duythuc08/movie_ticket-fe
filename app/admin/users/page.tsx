"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import { toast } from "sonner";
import { Plus, Search, X } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { DataTable, PageHeader } from "@/components/shared";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { adminUserService } from "@/services/admin/adminUserService";
import { createUserColumns } from "@/components/admin/user/UserColumns";
import { UserFormDialog } from "@/components/admin/user/UserFormDialog";
import { UserDetailDialog } from "@/components/admin/user/UserDetailDialog";
import { ConfirmDialog } from "@/components/shared";
import type { AdminUser } from "@/types/admin/user";

type PendingConfirm = {
  title: string;
  description: string;
  confirmLabel: string;
  confirmVariant: "default" | "destructive";
  action: () => Promise<void>;
};

export default function AdminUsersPage() {
  const { token } = useAuth();
  const [items, setItems] = useState<AdminUser[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [keyword, setKeyword] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [page, setPage] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [totalElements, setTotalElements] = useState(0);

  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editUser, setEditUser] = useState<AdminUser | null>(null);
  const [detailUserId, setDetailUserId] = useState<string | null>(null);
  const [pending, setPending] = useState<PendingConfirm | null>(null);
  const [isActioning, setIsActioning] = useState(false);

  const buildFilter = useCallback(() => {
    const parts: string[] = [];
    if (keyword) parts.push(`username~'${keyword}'`);
    if (statusFilter !== "all") parts.push(`userStatus:'${statusFilter}'`);
    return parts.join(" and ") || undefined;
  }, [keyword, statusFilter]);

  const load = useCallback(async (targetPage: number) => {
    if (!token) return;
    setIsLoading(true);
    try {
      const result = await adminUserService.getUsers(token, targetPage, 10, buildFilter());
      setItems(result.content);
      setTotalPages(result.totalPages);
      setTotalElements(result.totalElements);
    } catch {
      toast.error("Không thể tải danh sách người dùng");
    } finally {
      setIsLoading(false);
    }
  }, [token, buildFilter]);

  useEffect(() => {
    const t = setTimeout(() => load(0), 500);
    return () => clearTimeout(t);
  }, [load]);

  const handleToggleStatus = (u: AdminUser) => {
    const isActive = u.entityStatus === "ACTIVE";
    setPending({
      title: isActive ? "Vô hiệu hóa tài khoản" : "Kích hoạt tài khoản",
      description: `Bạn có chắc chắn muốn ${isActive ? "vô hiệu hóa" : "kích hoạt"} tài khoản "${u.username}"?`,
      confirmLabel: isActive ? "Vô hiệu hóa" : "Kích hoạt",
      confirmVariant: isActive ? "destructive" : "default",
      action: async () => {
        if (!token) return;
        if (isActive) await adminUserService.inactivateUser(token, u.userId);
        else await adminUserService.activateUser(token, u.userId);
        toast.success(`${isActive ? "Vô hiệu hóa" : "Kích hoạt"} thành công`);
        load(page);
      },
    });
  };

  const handleBan = (u: AdminUser) => {
    setPending({
      title: "Khóa tài khoản",
      description: `Bạn có chắc chắn muốn khóa tài khoản "${u.username}"? Tài khoản sẽ không thể đăng nhập.`,
      confirmLabel: "Khóa tài khoản",
      confirmVariant: "destructive",
      action: async () => {
        if (!token) return;
        await adminUserService.banUser(token, u.userId);
        toast.success("Khóa tài khoản thành công");
        load(page);
      },
    });
  };

  const handleUnban = (u: AdminUser) => {
    setPending({
      title: "Mở khóa tài khoản",
      description: `Bạn có chắc chắn muốn mở khóa cho tài khoản "${u.username}"?`,
      confirmLabel: "Mở khóa",
      confirmVariant: "default",
      action: async () => {
        if (!token) return;
        await adminUserService.unbanUser(token, u.userId);
        toast.success("Mở khóa tài khoản thành công");
        load(page);
      },
    });
  };

  const columns = useMemo(() => createUserColumns({
    onViewDetail: (u) => setDetailUserId(u.userId),
    onEdit: (u) => { setEditUser(u); setIsFormOpen(true); },
    onToggleStatus: handleToggleStatus,
    onBan: handleBan,
    onUnban: handleUnban,
  }), []); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <div className="space-y-6">
      <PageHeader title="Quản lý Người dùng" description="Quản lý tài khoản, vai trò và điểm tích lũy">
        <Button onClick={() => { setEditUser(null); setIsFormOpen(true); }}>
          <Plus className="h-4 w-4" /> Thêm người dùng
        </Button>
      </PageHeader>

      <div className="flex flex-wrap items-center gap-4 bg-card p-4 rounded-lg border shadow-sm">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Tìm email hoặc tên..."
            className="pl-9 bg-background"
            value={keyword}
            onChange={(e) => { setKeyword(e.target.value); setPage(0); }}
          />
        </div>
        <Select value={statusFilter} onValueChange={(v) => { setStatusFilter(v); setPage(0); }}>
          <SelectTrigger className="w-[180px] bg-background">
            <SelectValue placeholder="Trạng thái" />
          </SelectTrigger>
          <SelectContent data-admin="">
            <SelectItem value="all">-- Tất cả --</SelectItem>
            <SelectItem value="UNVERIFIED">Chưa xác minh</SelectItem>
            <SelectItem value="VERIFIED">Đã xác minh</SelectItem>
            <SelectItem value="BANNED">Bị cấm</SelectItem>
          </SelectContent>
        </Select>
        <Button
          variant="ghost"
          onClick={() => { setKeyword(""); setStatusFilter("all"); setPage(0); }}
          className="text-muted-foreground hover:text-foreground"
        >
          <X className="w-4 h-4 mr-2" /> Xóa lọc
        </Button>
      </div>

      <DataTable
        columns={columns}
        data={items}
        isLoading={isLoading}
        emptyText="Không tìm thấy người dùng nào."
        serverPagination={{
          page,
          pageCount: totalPages,
          total: totalElements,
          onChange: (newPage) => { setPage(newPage); load(newPage); },
        }}
      />

      <UserFormDialog
        open={isFormOpen}
        onOpenChange={(o) => { setIsFormOpen(o); if (!o) setEditUser(null); }}
        onSuccess={() => load(page)}
        user={editUser}
      />

      <UserDetailDialog
        key={detailUserId ?? "none"}
        open={!!detailUserId}
        onOpenChange={(o) => { if (!o) setDetailUserId(null); }}
        userId={detailUserId}
      />

      <ConfirmDialog
        open={!!pending}
        onOpenChange={(o) => { if (!o) setPending(null); }}
        title={pending?.title ?? ""}
        description={pending?.description ?? ""}
        confirmLabel={pending?.confirmLabel}
        confirmVariant={pending?.confirmVariant}
        isLoading={isActioning}
        onConfirm={async () => {
          if (!pending) return;
          setIsActioning(true);
          try {
            await pending.action();
          } catch (error) {
            toast.error(error instanceof Error ? error.message : "Lỗi thao tác");
          } finally {
            setIsActioning(false);
            setPending(null);
          }
        }}
      />
    </div>
  );
}
