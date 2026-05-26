"use client";

import { useEffect, useState, useCallback } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Pencil, LayoutGrid } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { toast } from "sonner";
import type { AdminRoom, AdminSeat, SeatType } from "@/types/admin.type";
import {
  fetchSeatsByRoom,
  setupSeatsForRoom,
  toggleSeatEntityStatus,
} from "@/services/admin/adminSeatService";
import { SeatGrid } from "./SeatGrid";
import { SeatSetupDialog } from "./SeatSetupDialog";
import { ROOM_TYPE_LABELS } from "./RoomColumns";

interface RoomDetailDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  room: AdminRoom | null;
  onEdit?: (room: AdminRoom) => void;
}

export function RoomDetailDialog({
  open,
  onOpenChange,
  room,
  onEdit,
}: RoomDetailDialogProps) {
  const { token } = useAuth();
  const [seats, setSeats] = useState<AdminSeat[]>([]);
  const [isLoadingSeats, setIsLoadingSeats] = useState(false);
  const [isSetupOpen, setIsSetupOpen] = useState(false);
  const [isSettingUp, setIsSettingUp] = useState(false);

  const loadSeats = useCallback(async () => {
    if (!token || !room) return;
    setIsLoadingSeats(true);
    try {
      const result = await fetchSeatsByRoom(token, room.roomId);
      setSeats(result);
    } catch {
      toast.error("Không thể tải sơ đồ ghế");
    } finally {
      setIsLoadingSeats(false);
    }
  }, [token, room]);

  useEffect(() => {
    if (open) loadSeats();
    else setSeats([]);
  }, [open, loadSeats]);

  async function handleSeatClick(seat: AdminSeat) {
    if (!token) return;
    const action = seat.entityStatus === "ACTIVE" ? "vô hiệu hóa" : "kích hoạt";
    try {
      await toggleSeatEntityStatus(token, seat.seatId, seat.entityStatus);
      toast.success(`Đã ${action} ghế ${seat.seatRow}${seat.seatNumber}`);
      loadSeats();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : `Không thể ${action} ghế`);
    }
  }

  async function handleSetupComplete(
    rows: number,
    cols: number,
    seatTypes: (SeatType | null)[][]
  ) {
    if (!token || !room) return;
    setIsSettingUp(true);
    try {
      await setupSeatsForRoom(token, room.roomId, { rows, cols, seatTypes });
      toast.success("Thiết lập sơ đồ ghế thành công");
      setIsSetupOpen(false);
      loadSeats();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Thiết lập thất bại");
    } finally {
      setIsSettingUp(false);
    }
  }

  if (!room) return null;

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-3xl max-h-[88vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Chi tiết phòng chiếu</DialogTitle>
          </DialogHeader>

          <div className="space-y-5">
            <div className="grid grid-cols-2 gap-x-6 gap-y-3 text-sm">
              <div>
                <p className="text-xs text-muted-foreground mb-0.5">Tên phòng</p>
                <p className="font-medium">{room.name}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground mb-0.5">Rạp chiếu</p>
                <p className="font-medium">{room.cinemas.name}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground mb-0.5">Loại phòng</p>
                <Badge variant="outline" className="text-xs">
                  {ROOM_TYPE_LABELS[room.roomType]}
                </Badge>
              </div>
              <div>
                <p className="text-xs text-muted-foreground mb-0.5">Sức chứa</p>
                <p className="font-medium">{room.capacity} ghế</p>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2">
              {onEdit && (
                <Button
                  size="sm"
                  variant="outline"
                  className="gap-1.5 text-xs"
                  onClick={() => {
                    onOpenChange(false);
                    onEdit(room);
                  }}
                >
                  <Pencil className="h-3.5 w-3.5" />
                  Chỉnh sửa phòng
                </Button>
              )}
              <Button
                size="sm"
                variant="outline"
                className="gap-1.5 text-xs"
                onClick={() => setIsSetupOpen(true)}
              >
                <LayoutGrid className="h-3.5 w-3.5" />
                Thiết lập ghế
              </Button>
            </div>

            <Separator />

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <h4 className="text-sm font-medium">
                  Sơ đồ ghế {seats.length > 0 && `(${seats.length} ghế)`}
                </h4>
                <p className="text-xs text-muted-foreground">
                  Click vào ghế để kích hoạt / vô hiệu hóa
                </p>
              </div>
              <SeatGrid
                seats={seats}
                onSeatClick={handleSeatClick}
                isLoading={isLoadingSeats}
              />
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <SeatSetupDialog
        open={isSetupOpen}
        onOpenChange={setIsSetupOpen}
        roomId={room.roomId}
        roomName={room.name}
        onSetupComplete={handleSetupComplete}
        isSubmitting={isSettingUp}
      />
    </>
  );
}
