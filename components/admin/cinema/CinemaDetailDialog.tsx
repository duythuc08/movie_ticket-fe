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
import { ExternalLink, Building2, MapPin, Phone, Mail, Activity, X, Info } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import type { AdminCinemaDetail } from "@/types/admin.type";
import { fetchAdminCinemaById } from "@/services/admin/adminCinemaService";
import { ROOM_TYPE_LABELS, ROOM_STATUS_LABELS } from "./CinemaColumns";
import { ROOM_TYPE_BADGE_CLASSES } from "./RoomColumns";
import { toast } from "sonner";
import { CinemaFoodTab } from "./CinemaFoodTab";

interface CinemaDetailDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  cinemaId: number | null;
  onEdit?: (cinema: AdminCinemaDetail) => void;
}

export function CinemaDetailDialog({
  open,
  onOpenChange,
  cinemaId,
  onEdit,
}: CinemaDetailDialogProps) {
  const { token } = useAuth();
  const router = useRouter();
  const [cinema, setCinema] = useState<AdminCinemaDetail | null>(null);
  const [activeTab, setActiveTab] = useState<"info" | "food">("info");

  const loadCinema = useCallback(async () => {
    if (!open || !cinemaId || !token) {
      setCinema(null);
      setActiveTab("info");
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

  function handleGoToRoomsCreate() {
    if (!cinemaId) return;
    onOpenChange(false);
    router.push(`/admin/rooms?cinemaId=${cinemaId}&action=create`);
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent data-admin="" className="max-w-5xl max-h-[85vh] overflow-hidden flex flex-col gap-0 p-0 rounded-xl border border-border shadow-2xl [&>button]:hidden">
        
        <div className="flex flex-col flex-1 overflow-hidden">
          <DialogHeader className="bg-muted/40 border-b border-border px-6 py-4 shrink-0 flex flex-row items-center justify-between space-y-0">
            <div className="space-y-1 min-w-0 flex-1">
              <DialogTitle className="text-base font-bold tracking-tight text-foreground flex items-center gap-2">
                <Building2 className="w-5 h-5 text-primary" />
                Chi tiết cụm rạp
              </DialogTitle>
              {cinema && (
                <p className="text-smchi text-muted-foreground truncate max-w-xl">{cinema.name}</p>
              )}
            </div>
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="shrink-0 h-8 w-8 rounded-lg text-muted-foreground hover:bg-muted hover:text-foreground border border-transparent hover:border-border transition-all"
              onClick={() => onOpenChange(false)}
            >
              <X size={16} />
            </Button>
          </DialogHeader>

          {cinema && (
            <div className="flex items-center gap-6 px-6 border-b border-border bg-muted/10 shrink-0">
              <button
                onClick={() => setActiveTab("info")}
                className={`py-3 text-sm font-semibold border-b-2 transition-colors ${activeTab === "info" ? "border-primary text-primary" : "border-transparent text-muted-foreground hover:text-foreground"}`}
              >
                Thông tin rạp
              </button>
              <button
                onClick={() => setActiveTab("food")}
                className={`py-3 text-sm font-semibold border-b-2 transition-colors ${activeTab === "food" ? "border-primary text-primary" : "border-transparent text-muted-foreground hover:text-foreground"}`}
              >
                Food & Drink
              </button>
            </div>
          )}

          <div className="flex-1 overflow-y-auto p-6 bg-background">
            {!cinema ? (
              <div className="flex items-center justify-center py-20 text-muted-foreground text-sm">
                <div className="flex flex-col items-center gap-3">
                  <div className="w-8 h-8 rounded-full border-4 border-primary/20 border-t-primary animate-spin" />
                  <p>Đang tải dữ liệu rạp...</p>
                </div>
              </div>
            ) : (
              <>
                {activeTab === "info" && (
                  <div className="space-y-8">
                    {/* Header section with Name and Status */}
                    <div className="flex items-start justify-between">
                      <div>
                        <h2 className="text-2xl font-bold tracking-tight text-foreground mb-1">{cinema.name}</h2>
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                          <MapPin className="w-4 h-4 text-primary/70" />
                          {cinema.address}
                        </div>
                      </div>
                      <Badge variant={cinema.cinemaStatus === "OPERATIONAL" ? "success" : "warning"} className="px-3 py-1 text-xs uppercase tracking-wider font-bold">
                        {cinema.cinemaStatus === "OPERATIONAL" ? "Hoạt động" : "Tạm đóng"}
                      </Badge>
                    </div>

                    {/* Info Cards */}
                    <div className="grid grid-cols-2 gap-4">
                      <div className="flex items-center gap-4 p-4 rounded-xl border bg-card shadow-sm hover:shadow-md transition-shadow">
                        <div className="p-3 bg-primary/10 text-primary rounded-lg">
                          <Phone className="w-5 h-5" />
                        </div>
                        <div>
                          <p className="text-xs font-medium text-muted-foreground mb-0.5">Điện thoại liên hệ</p>
                          <p className="font-semibold">{cinema.phoneNumber}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-4 p-4 rounded-xl border bg-card shadow-sm hover:shadow-md transition-shadow">
                        <div className="p-3 bg-primary/10 text-primary rounded-lg">
                          <Mail className="w-5 h-5" />
                        </div>
                        <div>
                          <p className="text-xs font-medium text-muted-foreground mb-0.5">Email hỗ trợ</p>
                          <p className="font-semibold">{cinema.email}</p>
                        </div>
                      </div>
                    </div>

                    <Separator className="opacity-50" />

                    {/* Rooms Section */}
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <h4 className="text-lg font-bold flex items-center gap-2">
                            Danh sách phòng chiếu
                            <Badge variant="secondary" className="rounded-full px-2 py-0.5 text-xs">{cinema.rooms.length}</Badge>
                          </h4>
                          <p className="text-sm text-muted-foreground mt-1">Quản lý và thiết lập sơ đồ ghế cho các phòng</p>
                        </div>
                        <Button onClick={handleGoToRooms} className="gap-2 shadow-sm">
                          Quản lý chi tiết <ExternalLink className="h-4 w-4" />
                        </Button>
                      </div>

                      {cinema.rooms.length === 0 ? (
                        <div className="flex flex-col items-center justify-center py-12 border-2 border-dashed rounded-xl bg-muted/10">
                          <Activity className="w-10 h-10 text-muted-foreground/30 mb-3" />
                          <p className="text-sm font-medium text-muted-foreground">Rạp này chưa có phòng chiếu nào</p>
                          <Button variant="outline" onClick={handleGoToRoomsCreate} className="mt-1 text-primary">
                            Thêm phòng chiếu ngay
                          </Button>
                        </div>
                      ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                          {cinema.rooms.map((room) => (
                            <div
                              key={room.roomId}
                              className="group flex flex-col justify-between p-4 rounded-xl border bg-card hover:border-primary/30 hover:shadow-sm transition-all"
                            >
                              <div className="flex items-start justify-between mb-4">
                                <div>
                                  <span className="font-bold text-base block mb-1 group-hover:text-primary transition-colors">{room.name}</span>
                                  <Badge variant="outline" className={`text-[10px] uppercase tracking-wider font-bold ${ROOM_TYPE_BADGE_CLASSES[room.roomType]}`}>
                                    {ROOM_TYPE_LABELS[room.roomType]}
                                  </Badge>
                                </div>
                                <Badge
                                  variant={
                                    room.roomStatus === "OPERATIONAL"
                                      ? "success"
                                      : room.roomStatus === "MAINTENANCE"
                                      ? "warning"
                                      : "secondary"
                                  }
                                  className="text-[10px] uppercase tracking-wider"
                                >
                                  {ROOM_STATUS_LABELS[room.roomStatus]}
                                </Badge>
                              </div>
                              <div className="flex items-center justify-between text-sm pt-3 border-t">
                                <span className="text-muted-foreground font-medium flex items-center gap-1.5">
                                  Sức chứa:
                                </span>
                                <span className="font-bold">{room.capacity} ghế</span>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                )}
                {activeTab === "food" && cinemaId && (
                  <CinemaFoodTab cinemaId={cinemaId} />
                )}
              </>
            )}
          </div>

          <div className="sticky bottom-0 z-10 border-t border-border bg-card px-6 py-3.5 flex items-center justify-between gap-4 shrink-0">
            <div className="text-xs text-muted-foreground">
              <span className="flex items-center gap-1.5 font-medium text-muted-foreground/80">
                <Info size={13} className="text-muted-foreground/60" />
                Mã rạp: {cinemaId}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)} className="h-9 text-xs font-semibold">
                Đóng
              </Button>
              {activeTab === "info" && onEdit && cinema && (
                <Button type="button" onClick={() => onEdit(cinema)} className="min-w-[120px] h-9 text-xs font-semibold">
                  Chỉnh sửa rạp
                </Button>
              )}
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
