"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { ExternalLink } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import type { AdminCinemaDetail } from "@/types/admin.type";
import { fetchAdminCinemaById } from "@/services/admin/adminCinemaService";
import { ROOM_TYPE_LABELS, ROOM_STATUS_LABELS } from "./CinemaColumns";
import { ROOM_TYPE_BADGE_CLASSES } from "./RoomColumns";
import { toast } from "sonner";

interface CinemaDetailDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  cinemaId: number | null;
}

export function CinemaDetailDialog({
  open,
  onOpenChange,
  cinemaId,
}: CinemaDetailDialogProps) {
  const { token } = useAuth();
  const router = useRouter();
  const [cinema, setCinema] = useState<AdminCinemaDetail | null>(null);

  const loadCinema = useCallback(async () => {
    if (!open || !cinemaId || !token) {
      setCinema(null);
      return;
    }
    try {
      const data = await fetchAdminCinemaById(token, cinemaId);
      setCinema(data);
    } catch {
      toast.error("Không thể tải thông tin rạp");
    }
  }, [open, cinemaId, token]);

  useEffect(() => {
    loadCinema();
  }, [loadCinema]);

  function handleGoToRooms() {
    if (!cinemaId) return;
    onOpenChange(false);
    router.push(`/admin/rooms?cinemaId=${cinemaId}`);
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Chi tiết rạp chiếu</DialogTitle>
        </DialogHeader>

        {!cinema ? (
          <div className="flex items-center justify-center py-10 text-muted-foreground text-sm">
            Đang tải...
          </div>
        ) : (
          <div className="space-y-6">
            <div className="grid grid-cols-2 gap-x-6 gap-y-3 text-sm">
              <div>
                <p className="text-xs text-muted-foreground mb-0.5">Tên rạp</p>
                <p className="font-medium">{cinema.name}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground mb-0.5">Vận hành</p>
                <Badge variant={cinema.cinemaStatus === "OPERATIONAL" ? "success" : "warning"}>
                  {cinema.cinemaStatus === "OPERATIONAL" ? "Hoạt động" : "Tạm đóng"}
                </Badge>
              </div>
              <div className="col-span-2">
                <p className="text-xs text-muted-foreground mb-0.5">Địa chỉ</p>
                <p className="font-medium">{cinema.address}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground mb-0.5">Điện thoại</p>
                <p className="font-medium">{cinema.phoneNumber}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground mb-0.5">Email</p>
                <p className="font-medium">{cinema.email}</p>
              </div>
            </div>

            <Separator />

            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <h4 className="text-sm font-medium">
                  Phòng chiếu ({cinema.rooms.length})
                </h4>
                <Button
                  size="sm"
                  variant="outline"
                  className="gap-1.5 text-xs"
                  onClick={handleGoToRooms}
                >
                  <ExternalLink className="h-3.5 w-3.5" />
                  Quản lý phòng
                </Button>
              </div>

              {cinema.rooms.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-4 border rounded-lg">
                  Rạp chưa có phòng chiếu nào.
                </p>
              ) : (
                <div className="space-y-2">
                  {cinema.rooms.map((room) => (
                    <div
                      key={room.roomId}
                      className="flex items-center justify-between rounded-lg border px-4 py-3"
                    >
                      <div className="flex items-center gap-3">
                        <span className="font-medium text-sm">{room.name}</span>
                        <Badge
                          variant="outline"
                          className={`text-xs ${ROOM_TYPE_BADGE_CLASSES[room.roomType]}`}
                        >
                          {ROOM_TYPE_LABELS[room.roomType]}
                        </Badge>
                      </div>
                      <div className="flex items-center gap-3 text-xs text-muted-foreground">
                        <span>{room.capacity} ghế</span>
                        <Badge
                          variant={
                            room.roomStatus === "OPERATIONAL"
                              ? "success"
                              : room.roomStatus === "MAINTENANCE"
                              ? "warning"
                              : "secondary"
                          }
                          className="text-xs"
                        >
                          {ROOM_STATUS_LABELS[room.roomStatus]}
                        </Badge>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
