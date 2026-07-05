"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import { useSearchParams, useRouter, usePathname } from "next/navigation";
import { toast } from "sonner";
import { Plus } from "lucide-react";
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
  { label: "Phòng Thường", value: "STANDARD" },
  { label: "Phòng VIP",    value: "VIP"      },
  { label: "Phòng IMAX",   value: "IMAX"     },
  { label: "Phòng 3D",     value: "THREE_D"  },
];

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

  const defaultCinemaId = cinemaIdParam ? Number(cinemaIdParam) : null;

  const loadRooms = useCallback(async () => {
    if (!token) return;
    setIsLoading(true);
    try {
      const result = await fetchAdminRooms(token, { 
        page: 0, 
        size: 999, 
        cinemaId: defaultCinemaId ?? undefined 
      });
      setRooms(result.content);
      
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
  }, [token, defaultCinemaId]);

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
    loadRooms();
    loadCinemas();
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
        loadRooms();
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
        loadRooms();

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
      loadRooms();
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

      <DataTable
        columns={columns}
        data={rooms}
        searchKey="name"
        searchPlaceholder="Tìm theo tên phòng..."
        filters={[{
          key:     "roomType",
          label:   "Loại phòng",
          options: ROOM_TYPE_FILTER,
        }]}
        isLoading={isLoading}
        emptyText="Chưa có phòng chiếu nào."
      >
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
      </DataTable>

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
