"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import { useSearchParams, useRouter, usePathname } from "next/navigation";
import { toast } from "sonner";
import { Plus, Search } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import type { AdminRoom, AdminCinema } from "@/types/admin.type";
import type { RoomFormSchema } from "@/lib/validations/admin.schemas";
import {
  fetchAdminRooms,
  createAdminRoom,
  updateAdminRoom,
  toggleRoomEntityStatus,
} from "@/services/admin/adminRoomService";
import { setupSeatsForRoom } from "@/services/admin/adminSeatService";
import { fetchActiveCinemasForSelect } from "@/services/admin/adminCinemaService";
import { DataTable, PageHeader } from "@/components/shared";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { RoomFormDialog } from "@/components/admin/cinema/RoomFormDialog";
import { RoomDetailDialog } from "@/components/admin/cinema/RoomDetailDialog";
import { createRoomColumns } from "@/components/admin/cinema/RoomColumns";

const ROOM_TYPE_FILTER = [
  { label: "Phòng 2D", value: "TWO_D" },
  { label: "Phòng 3D", value: "THREE_D" },
  { label: "Phòng IMAX", value: "IMAX" },
  { label: "Phòng Premium", value: "PREMIUM" },
];

const PAGE_SIZE = 10;

export default function AdminRoomsPage() {
  const { token } = useAuth();
  const searchParams = useSearchParams();
  const cinemaIdParam = searchParams.get("cinemaId");

  const router = useRouter();
  const pathname = usePathname();

  const [rooms,         setRooms]         = useState<AdminRoom[]>([]);
  const [cinemas,       setCinemas]       = useState<AdminCinema[]>([]);
  const [isLoading,     setIsLoading]     = useState(false);
  const [isFormOpen,    setIsFormOpen]    = useState(() => searchParams.get("action") === "create");
  const [isDetailOpen,  setIsDetailOpen]  = useState(false);
  const [defaultEditMode, setDefaultEditMode] = useState(false);
  const [initialSetupDims, setInitialSetupDims] = useState<{ rows: number, cols: number } | undefined>();
  const [selectedRoom,  setSelectedRoom]  = useState<AdminRoom | null>(null);
  const [isSubmitting,  setIsSubmitting]  = useState(false);

  const [page, setPage] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [totalElements, setTotalElements] = useState(0);
  const [roomType, setRoomType] = useState<string | undefined>(undefined);
  const [keywordInput, setKeywordInput] = useState("");
  const [keyword, setKeyword] = useState("");

  const defaultCinemaId = cinemaIdParam ? Number(cinemaIdParam) : null;

  useEffect(() => {
    const t = setTimeout(() => setKeyword(keywordInput), 500);
    return () => clearTimeout(t);
  }, [keywordInput]);

  const loadRooms = useCallback(async (targetPage = 0) => {
    if (!token) return;
    setIsLoading(true);
    try {
      const result = await fetchAdminRooms(token, {
        page: targetPage,
        size: PAGE_SIZE,
        cinemaId: defaultCinemaId ?? undefined,
        roomType: roomType as AdminRoom["roomType"] | undefined,
        name: keyword || undefined,
      });
      setRooms(result.content);
      setTotalPages(result.totalPages);
      setTotalElements(result.totalElements);

      setSelectedRoom((prev) => {
        if (!prev) return null;
        const updated = result.content.find((r) => r.roomId === prev.roomId);
        return updated || prev;
      });
    } catch {
      toast.error("Không thể tải danh sách phòng chiếu");
    } finally {
      setIsLoading(false);
    }
  }, [token, defaultCinemaId, roomType, keyword]);

  const loadCinemas = useCallback(async () => {
    if (!token) return;
    try {
      const result = await fetchActiveCinemasForSelect(token);
      setCinemas(result);
    } catch {
      toast.error("Không thể tải danh sách rạp");
    }
  }, [token]);

  useEffect(() => {
    queueMicrotask(() => {
      setPage(0);
      void loadRooms(0);
      void loadCinemas();
    });
  }, [loadRooms, loadCinemas]);

  useEffect(() => {
    if (searchParams.get("action") === "create") {
      const cleaned = new URLSearchParams(searchParams.toString());
      cleaned.delete("action");
      router.replace(`${pathname}?${cleaned.toString()}`);
    }
  }, [searchParams, pathname, router]);

  function handleOpenCreate() {
    setSelectedRoom(null);
    setIsFormOpen(true);
  }

  function handleViewDetail(room: AdminRoom) {
    setSelectedRoom(room);
    setDefaultEditMode(false);
    setIsDetailOpen(true);
  }

  function handleEdit(room: AdminRoom) {
    setSelectedRoom(room);
    setIsFormOpen(true);
  }

  async function handleFormSubmit(data: RoomFormSchema) {
    if (!token) return;
    setIsSubmitting(true);
    try {
      if (selectedRoom) {
        await updateAdminRoom(token, selectedRoom.roomId, {
          name:       data.name,
          capacity:   data.capacity,
          roomType:   data.roomType,
          roomStatus: data.roomStatus,
        });
        toast.success(`Đã cập nhật phòng "${data.name}"`);
        setIsFormOpen(false);
        setSelectedRoom(null);
        loadRooms(page);
      } else {
        const created = await createAdminRoom(token, {
          name:       data.name,
          capacity:   0,
          cinemas:    { cinemaId: data.cinemaId },
          roomType:   data.roomType,
          roomStatus: data.roomStatus,
        });
        toast.success(`Đã thêm phòng "${data.name}"`);
        setIsFormOpen(false);
        setSelectedRoom(null);
        loadRooms(page);

        if (data.rowCount && data.columnCount) {
          setInitialSetupDims({ rows: data.rowCount, cols: data.columnCount });
          setSelectedRoom(created);
          setDefaultEditMode(true);
          setIsDetailOpen(true);
        }
      }
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Lưu phòng chiếu thất bại");
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handleToggleStatus(room: AdminRoom) {
    if (!token) return;
    const action = room.entityStatus === "ACTIVE" ? "vô hiệu hóa" : "kích hoạt";
    try {
      await toggleRoomEntityStatus(token, room.roomId, room.entityStatus);
      toast.success(`Đã ${action} phòng "${room.name}"`);
      loadRooms(page);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : `Không thể ${action} phòng`);
    }
  }

  const columns = useMemo(
    () => createRoomColumns({
      onViewDetail:   handleViewDetail,
      onEdit:         handleEdit,
      onToggleStatus: handleToggleStatus,
    }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [token]
  );

  const selectedCinema = cinemas.find((c) => c.cinemaId === defaultCinemaId);
  const pageTitle = selectedCinema
    ? `Phòng chiếu — ${selectedCinema.name}`
    : "Quản lý Phòng chiếu";

  return (
    <div className="space-y-6">
      <PageHeader
        title={pageTitle}
        description="Thêm, chỉnh sửa và quản lý phòng chiếu trong hệ thống"
      >
        <Button onClick={handleOpenCreate} className="gap-2">
          <Plus className="h-4 w-4" /> Thêm phòng mới
        </Button>
      </PageHeader>

      <div className="flex flex-wrap items-center gap-4 bg-card p-4 rounded-lg border shadow-sm">
        <div className="relative flex-1 min-w-50 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Tìm theo tên phòng..."
            value={keywordInput}
            onChange={(e) => setKeywordInput(e.target.value)}
            className="pl-9"
          />
        </div>

        <Select
          value={roomType ?? "__all__"}
          onValueChange={(value) => setRoomType(value === "__all__" ? undefined : value)}
        >
          <SelectTrigger className="w-45">
            <SelectValue placeholder="Loại phòng" />
          </SelectTrigger>
          <SelectContent data-admin="">
            {ROOM_TYPE_FILTER.map((opt) => (
              <SelectItem key={opt.value} value={opt.value}>
                {opt.label}
              </SelectItem>
            ))}
            <SelectItem value="__all__">Tất cả</SelectItem>
          </SelectContent>
        </Select>

        <Select
          value={cinemaIdParam ?? "__all__"}
          onValueChange={(value) => {
            const params = new URLSearchParams(searchParams.toString());
            if (value === "__all__") {
              params.delete("cinemaId");
            } else {
              params.set("cinemaId", value);
            }
            router.replace(`${pathname}?${params.toString()}`);
          }}
        >
          <SelectTrigger className="w-50">
            <SelectValue placeholder="Tất cả rạp" />
          </SelectTrigger>
          <SelectContent data-admin="">
            <SelectItem value="__all__">Tất cả rạp</SelectItem>
            {cinemas.map((c) => (
              <SelectItem key={c.cinemaId} value={String(c.cinemaId)}>
                {c.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <DataTable
        columns={columns}
        data={rooms}
        isLoading={isLoading}
        emptyText="Chưa có phòng chiếu nào."
        serverPagination={{
          page,
          pageCount: totalPages,
          total: totalElements,
          onChange: (newPage) => {
            setPage(newPage);
            loadRooms(newPage);
          },
        }}
      />

      <RoomFormDialog
        open={isFormOpen}
        onOpenChange={(isOpen) => {
          setIsFormOpen(isOpen);
          if (!isOpen) setSelectedRoom(null);
        }}
        room={selectedRoom}
        defaultCinemaId={defaultCinemaId}
        cinemas={cinemas}
        onSubmit={handleFormSubmit}
        isSubmitting={isSubmitting}
      />

      <RoomDetailDialog
        open={isDetailOpen}
        onOpenChange={(isOpen) => {
          setIsDetailOpen(isOpen);
          if (!isOpen) {
            setSelectedRoom(null);
            setDefaultEditMode(false);
          }
        }}
        room={selectedRoom}
        defaultEditMode={defaultEditMode}
        initialSetupDims={initialSetupDims}
        onEdit={(room) => {
          setIsDetailOpen(false);
          setSelectedRoom(room);
          setIsFormOpen(true);
        }}
        onRefresh={loadRooms}
      />
    </div>
  );
}
