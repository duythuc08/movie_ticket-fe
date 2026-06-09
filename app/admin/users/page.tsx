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
import type { AdminUser } from "@/types/admin/user";

export default function AdminUsersPage() {
  const { token } = useAuth();
  const [items, setItems] = useState<AdminUser[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [keyword, setKeyword] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");

  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editUser, setEditUser] = useState<AdminUser | null>(null);
  const [detailUserId, setDetailUserId] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!token) return;
    setIsLoading(true);
    try {
      const parts: string[] = [];
      if (keyword)                parts.push(`username~'${keyword}'`);
      if (statusFilter !== "all") parts.push(`userStatus:'${statusFilter}'`);
      const result = await adminUserService.getUsers(token, 0, 20, parts.join(" and ") || undefined);
      setItems(result.content);
    } catch {
      toast.error("Không thể tải danh sách người dùng");
    } finally {
      setIsLoading(false);
    }
  }, [token, keyword, statusFilter]);

  useEffect(() => {
    const t = setTimeout(() => load(), 500);
    return () => clearTimeout(t);
  }, [load]);

  const handleToggleStatus = async (u: AdminUser) => {
    if (!token) return;
    const isActive = u.entityStatus === "ACTIVE";
    if (!confirm(`Bạn có chắc chắn muốn ${isActive ? "vô hiệu hóa" : "kích hoạt"} tài khoản ${u.username}?`)) return;
    try {
      if (isActive) await adminUserService.inactivateUser(token, u.userId);
      else          await adminUserService.activateUser(token, u.userId);
      toast.success(`${isActive ? "Vô hiệu hóa" : "Kích hoạt"} thành công`);
      load();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Lỗi thao tác");
    }
  };

  const handleBan = async (u: AdminUser) => {
    if (!token) return;
    if (!confirm(`Bạn có chắc chắn muốn KHÓA tài khoản ${u.username}?`)) return;
    try {
      await adminUserService.banUser(token, u.userId);
      toast.success("Khóa tài khoản thành công");
      load();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Lỗi khi khóa tài khoản");
    }
  };

  const columns = useMemo(() => createUserColumns({
    onViewDetail:   (u) => setDetailUserId(u.userId),
    onEdit:         (u) => { setEditUser(u); setIsFormOpen(true); },
    onToggleStatus: handleToggleStatus,
    onBan:          handleBan,
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
            onChange={(e) => setKeyword(e.target.value)}
          />
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-[180px] bg-background">
            <SelectValue placeholder="Trạng thái" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">-- Tất cả --</SelectItem>
            <SelectItem value="UNVERIFIED">Chưa xác minh</SelectItem>
            <SelectItem value="VERIFIED">Đã xác minh</SelectItem>
            <SelectItem value="BANNED">Bị cấm</SelectItem>
          </SelectContent>
        </Select>
        <Button
          variant="ghost"
          onClick={() => { setKeyword(""); setStatusFilter("all"); }}
          className="text-muted-foreground hover:text-foreground"
        >
          <X className="w-4 h-4 mr-2" /> Xoá lọc
        </Button>
      </div>

      <DataTable
        columns={columns}
        data={items}
        isLoading={isLoading}
        emptyText="Không tìm thấy người dùng nào."
      />

      <UserFormDialog
        open={isFormOpen}
        onOpenChange={(o) => { setIsFormOpen(o); if (!o) setEditUser(null); }}
        onSuccess={load}
        user={editUser}
      />

      <UserDetailDialog
        open={!!detailUserId}
        onOpenChange={(o) => { if (!o) setDetailUserId(null); }}
        userId={detailUserId}
      />
    </div>
  );
}
