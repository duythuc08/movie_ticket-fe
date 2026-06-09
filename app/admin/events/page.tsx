"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import { toast } from "sonner";
import { Plus } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { DataTable, PageHeader, ConfirmDialog } from "@/components/shared";
import { Button } from "@/components/ui/button";
import { adminEventService } from "@/services/admin/adminEventService";
import { createEventColumns } from "@/components/admin/event/EventColumns";
import { EventFilters } from "@/components/admin/event/EventFilters";
import { EventFormDialog } from "@/components/admin/event/EventFormDialog";
import type { AdminEvent } from "@/types/admin/promotion";

export default function AdminEventsPage() {
  const { token } = useAuth();
  const [items, setItems] = useState<AdminEvent[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [filters, setFilters] = useState<{ keyword?: string; eventType?: string }>({});
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editEvent, setEditEvent] = useState<AdminEvent | null>(null);
  const [pendingDelete, setPendingDelete] = useState<AdminEvent | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const load = useCallback(async () => {
    if (!token) return;
    setIsLoading(true);
    try {
      const parts: string[] = [];
      if (filters.keyword)   parts.push(`title~'${filters.keyword}'`);
      if (filters.eventType) parts.push(`eventType:'${filters.eventType}'`);
      const result = await adminEventService.getEvents(token, 0, 50, parts.join(" and ") || undefined);
      setItems(result.content);
    } catch {
      toast.error("Không thể tải danh sách sự kiện");
    } finally {
      setIsLoading(false);
    }
  }, [token, filters]);

  useEffect(() => { load(); }, [load]);

  const columns = useMemo(
    () => createEventColumns({
      onEdit:   (e) => { setEditEvent(e); setIsFormOpen(true); },
      onDelete: (e) => setPendingDelete(e),
    }),
    []
  );

  return (
    <div className="space-y-6">
      <PageHeader title="Quản lý Sự kiện" description="Quản lý các sự kiện chiếu phim đặc biệt">
        <Button onClick={() => { setEditEvent(null); setIsFormOpen(true); }}>
          <Plus className="h-4 w-4" /> Thêm sự kiện
        </Button>
      </PageHeader>

      <EventFilters onFilterChange={setFilters} />

      <DataTable columns={columns} data={items} isLoading={isLoading} emptyText="Chưa có sự kiện nào." />

      <EventFormDialog
        open={isFormOpen}
        onOpenChange={(o) => { setIsFormOpen(o); if (!o) setEditEvent(null); }}
        onSuccess={load}
        event={editEvent}
      />

      <ConfirmDialog
        open={!!pendingDelete}
        onOpenChange={(o) => { if (!o) setPendingDelete(null); }}
        title="Xóa sự kiện"
        description={`Bạn có chắc chắn muốn xóa sự kiện "${pendingDelete?.title}"? Hành động này không thể hoàn tác.`}
        confirmLabel="Xóa"
        confirmVariant="destructive"
        isLoading={isDeleting}
        onConfirm={async () => {
          if (!pendingDelete || !token) return;
          setIsDeleting(true);
          try {
            await adminEventService.deleteEvent(token, pendingDelete.eventId);
            toast.success("Xóa sự kiện thành công");
            load();
            setPendingDelete(null);
          } catch (error) {
            toast.error(error instanceof Error ? error.message : "Lỗi khi xóa sự kiện");
          } finally {
            setIsDeleting(false);
          }
        }}
      />
    </div>
  );
}
