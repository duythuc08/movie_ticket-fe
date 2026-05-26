"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import { useSearchParams } from "next/navigation";
import { toast } from "sonner";
import { Plus } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import type { AdminRoom, AdminCinema } from "@/types/admin.type";
import type { RoomFormSchema } from "@/lib/validations/admin.schemas";
import {
  fetchAllRooms,
  fetchRoomsByCinema,
  createAdminRoom,
  updateAdminRoom,
  toggleRoomEntityStatus,
} from "@/services/admin/adminRoomService";
import { fetchActiveCinemasForSelect } from "@/services/admin/adminCinemaService";
import { DataTable, PageHeader } from "@/components/shared";
import { Button } from "@/components/ui/button";
import { RoomFormDialog } from "@/components/admin/cinema/RoomFormDialog";
import { RoomDetailDialog } from "@/components/admin/cinema/RoomDetailDialog";
import { createRoomColumns } from "@/components/admin/cinema/RoomColumns";

const ROOM_TYPE_FILTER = [
  { label: "Phòng thường", value: "STANDARD" },
  { label: "Phòng VIP",    value: "VIP"      },
  { label: "Phòng IMAX",   value: "IMAX"     },
  { label: "Phòng 3D",     value: "THREE_D"  },
];

export default function AdminRoomsPage() {
  const { token } = useAuth();
  const searchParams = useSearchParams();
  const cinemaIdParam = searchParams.get("cinemaId");

  const [rooms,         setRooms]         = useState<AdminRoom[]>([]);
  const [cinemas,       setCinemas]       = useState<AdminCinema[]>([]);
  const [isLoading,     setIsLoading]     = useState(false);
  const [isFormOpen,    setIsFormOpen]    = useState(false);
  const [isDetailOpen,  setIsDetailOpen]  = useState(false);
  const [selectedRoom,  setSelectedRoom]  = useState<AdminRoom | null>(null);
  const [isSubmitting,  setIsSubmitting]  = useState(false);

  const defaultCinemaId = cinemaIdParam ? Number(cinemaIdParam) : null;

  const loadRooms = useCallback(async () => {
    if (!token) return;
    setIsLoading(true);
    try {
      const result = defaultCinemaId
        ? await fetchRoomsByCinema(token, defaultCinemaId)
        : await fetchAllRooms(token);
      setRooms(result);
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

  function handleOpenCreate() {
    setSelectedRoom(null);
    setIsFormOpen(true);
  }

  function handleViewDetail(room: AdminRoom) {
    setSelectedRoom(room);
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
      } else {
        await createAdminRoom(token, {
          name:       data.name,
          capacity:   data.capacity,
          cinemas:    { cinemaId: data.cinemaId },
          roomType:   data.roomType,
          roomStatus: data.roomStatus,
        });
        toast.success(`Đã thêm phòng "${data.name}"`);
      }
      setIsFormOpen(false);
      setSelectedRoom(null);
      loadRooms();
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

  const pageTitle = defaultCinemaId
    ? `Phòng chiếu — Rạp #${defaultCinemaId}`
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
          if (!isOpen) setSelectedRoom(null);
        }}
        room={selectedRoom}
        onEdit={(room) => {
          setIsDetailOpen(false);
          setSelectedRoom(room);
          setIsFormOpen(true);
        }}
      />
    </div>
  );
}
