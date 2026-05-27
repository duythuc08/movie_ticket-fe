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
import { Pencil, LayoutGrid, MonitorPlay, Building2, Tag, Users, X } from "lucide-react";
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
import { ROOM_TYPE_LABELS, ROOM_TYPE_BADGE_CLASSES } from "./RoomColumns";

interface RoomDetailDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  room: AdminRoom | null;
  onEdit?: (room: AdminRoom) => void;
  onRefresh?: () => void;
}

export function RoomDetailDialog({
  open,
  onOpenChange,
  room,
  onEdit,
  onRefresh,
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
      if (onRefresh) onRefresh();
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
        <DialogContent data-admin="" className="max-w-4xl max-h-[88vh] overflow-y-auto p-0 gap-0">
        <DialogHeader className="px-6 py-5 border-b bg-muted/20 flex flex-row items-center justify-between">
          <DialogTitle className="text-lg font-bold flex items-center gap-2">
            <MonitorPlay className="w-5 h-5 text-primary" />
            Chi tiết phòng chiếu
          </DialogTitle>
          <Button type="button" variant="ghost" size="icon" className="h-8 w-8 -mr-2 rounded-full text-muted-foreground hover:text-foreground hover:bg-accent" onClick={() => onOpenChange(false)}>
            <X className="w-4 h-4" />
          </Button>
        </DialogHeader>

        <div className="p-6 space-y-8 bg-background">
          {/* Header Section */}
          <div className="flex items-start justify-between">
            <div>
              <h2 className="text-2xl font-bold tracking-tight text-foreground mb-1">{room.name}</h2>
              <div className="flex items-center gap-2 text-sm text-muted-foreground font-medium">
                <Building2 className="w-4 h-4 text-primary/70" />
                Thuộc rạp: <span className="text-foreground">{room.cinemas.name}</span>
              </div>
            </div>
            <div className="flex flex-col items-end gap-2">
              <Badge variant="outline" className={`text-xs uppercase tracking-wider font-bold ${ROOM_TYPE_BADGE_CLASSES[room.roomType]}`}>
                {ROOM_TYPE_LABELS[room.roomType]}
              </Badge>
              <Badge
                variant={room.roomStatus === "OPERATIONAL" ? "success" : room.roomStatus === "MAINTENANCE" ? "warning" : "secondary"}
                className="text-[10px] uppercase tracking-wider"
              >
                {room.roomStatus === "OPERATIONAL" ? "Hoạt động" : room.roomStatus === "MAINTENANCE" ? "Bảo trì" : "Vệ sinh"}
              </Badge>
            </div>
          </div>

          <div className="flex items-center justify-between p-4 bg-primary/5 rounded-xl border border-primary/10">
            <div className="flex items-center gap-3">
              <div className="p-2.5 bg-background rounded-lg shadow-sm border text-primary">
                <Users className="w-5 h-5" />
              </div>
              <div>
                <p className="text-xs font-medium text-muted-foreground">Sức chứa hợp lệ</p>
                <p className="text-lg font-bold text-foreground">{room.capacity} <span className="text-sm font-medium text-muted-foreground">ghế</span></p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              {onEdit && (
                <Button size="sm" variant="outline" className="gap-1.5 shadow-sm bg-background" onClick={() => { onOpenChange(false); onEdit(room); }}>
                  <Pencil className="h-3.5 w-3.5" /> Chỉnh sửa
                </Button>
              )}
              <Button size="sm" className="gap-1.5 shadow-sm" onClick={() => setIsSetupOpen(true)}>
                <LayoutGrid className="h-3.5 w-3.5" /> Cập nhật Sơ đồ
              </Button>
            </div>
          </div>

          <Separator className="opacity-50" />

          {/* Seat Grid Section */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h4 className="text-lg font-bold flex items-center gap-2">
                  Sơ đồ ghế hiện tại
                  {seats.length > 0 && <Badge variant="secondary" className="rounded-full px-2 py-0.5 text-xs">{seats.length}</Badge>}
                </h4>
                <p className="text-sm text-muted-foreground mt-1">
                  Click vào ghế để kích hoạt hoặc vô hiệu hóa ghế hỏng
                </p>
              </div>
            </div>

            <div className="bg-muted/10 border rounded-xl p-4 md:p-6 overflow-hidden">
              <SeatGrid seats={seats} onSeatClick={handleSeatClick} isLoading={isLoadingSeats} />
            </div>
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
