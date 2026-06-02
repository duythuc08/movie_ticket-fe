"use client";

import { getErrorMessage } from "@/lib/errors";
import { useState, useEffect, useCallback } from "react";
import { useAuth } from "@/context/AuthContext";
import { fetchActiveCinemasForSelect } from "@/services/admin/adminCinemaService";
import { fetchAdminRooms } from "@/services/admin/adminRoomService";
import { adminShowtimeService } from "@/services/admin/adminShowtimeService";
import { PageHeader } from "@/components/shared";
import { GanttChart } from "@/components/admin/showtime/gantt/GanttChart";
import { Button } from "@/components/ui/button";
import { ShowtimeDetailDialog } from "@/components/admin/showtime/ShowtimeDetailDialog";
import { ShowtimeEditDialog } from "@/components/admin/showtime/ShowtimeEditDialog";
import type { AdminCinema, AdminRoom } from "@/types/admin.type";
import type { Showtime } from "@/types/admin/showtime";

export default function GanttChartPage() {
  const { token } = useAuth();
  const [cinemas, setCinemas] = useState<AdminCinema[]>([]);
  const [selectedCinemaId, setSelectedCinemaId] = useState<number | "">("");
  const [selectedDate, setSelectedDate] = useState<string>(
    new Date().toISOString().split("T")[0]
  );
  const [rooms, setRooms] = useState<AdminRoom[]>([]);
  const [showtimes, setShowtimes] = useState<Showtime[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const [detailShowTimeId, setDetailShowTimeId] = useState<number | null>(null);
  const [editShowtime, setEditShowtime] = useState<Showtime | null>(null);

  useEffect(() => {
    if (!token) return;
    fetchActiveCinemasForSelect(token)
      .then(setCinemas)
      .catch(() => toast.error("Lỗi khi tải danh sách rạp"));
  }, [token]);

  const loadData = useCallback(async () => {
    if (!token || !selectedCinemaId || !selectedDate) return;
    setIsLoading(true);
    try {
      const roomsRes = await fetchAdminRooms(token, {
        cinemaId: Number(selectedCinemaId),
        size: 100,
      });
      setRooms(roomsRes.content || []);

      const showtimesData = await adminShowtimeService.getShowtimesForGantt(
        token,
        Number(selectedCinemaId),
        selectedDate
      );
      setShowtimes(showtimesData || []);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Lỗi khi tải dữ liệu suất chiếu");
    } finally {
      setIsLoading(false);
    }
  }, [token, selectedCinemaId, selectedDate]);

  useEffect(() => {
    if (selectedCinemaId) {
      loadData();
    }
  }, [selectedCinemaId, selectedDate, loadData]);

  const handleAddClick = (roomId: number, startTimeStr: string) => {
    toast.info(`Đã thêm vào phòng: ${roomId}, time: ${startTimeStr}`);
  };

  const handleViewDetail = (st: Showtime) => setDetailShowTimeId(st.showTimeId);
  const handleEdit = (st: Showtime) => setEditShowtime(st);
  
  const handleUpdateShowtimeTime = async (showTimeId: number, roomId: number, newStartTime: string) => {
    if (!token) return;
    try {
      const st = showtimes.find((s) => s.showTimeId === showTimeId);
      if (!st) return;
      await adminShowtimeService.updateShowtime(token, showTimeId, {
        movieId: st.movieId,
        roomId: roomId,
        startTime: newStartTime,
      });
      toast.success("Cập nhật giờ chiếu thành công");
      loadData();
    } catch (error: any) {
      const msg = getErrorMessage(error.code, error.message);
      toast.error(msg || "Lỗi khi cập nhật giờ chiếu");
    }
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Lịch chiếu (Gantt Chart)"
        description="Quản lý và điều phối suất chiếu trực quan"
      >
        <Button onClick={loadData} variant="outline" disabled={isLoading}>
          {isLoading ? "Đang tải..." : "Tải lại"}
        </Button>
      </PageHeader>

      <div className="flex flex-wrap gap-4 items-end bg-card p-4 rounded-lg border shadow-sm">
        <div className="space-y-1">
          <label className="text-sm font-medium">Chọn Rạp</label>
          <select
            value={selectedCinemaId}
            onChange={(e) => setSelectedCinemaId(e.target.value ? Number(e.target.value) : "")}
            className="flex h-10 w-[250px] items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
          >
            <option value="">-- Chọn rạp --</option>
            {cinemas.map((c) => (
              <option key={c.cinemaId} value={c.cinemaId}>
                {c.name}
              </option>
            ))}
          </select>
        </div>

        <div className="space-y-1">
          <label className="text-sm font-medium">Ngày chiếu</label>
          <input
            type="date"
            value={selectedDate}
            onChange={(e) => setSelectedDate(e.target.value)}
            className="flex h-10 w-[200px] rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
          />
        </div>
      </div>

      {selectedCinemaId ? (
        <GanttChart
          rooms={rooms.map((r) => ({ roomId: r.roomId, name: r.name }))}
          showtimes={showtimes}
          onAddClick={handleAddClick}
          onUpdateShowtimeTime={handleUpdateShowtimeTime}
          selectedDate={new Date(selectedDate)}
          onViewDetail={handleViewDetail}
          onEdit={handleEdit}
        />
      ) : (
        <div className="p-12 text-center border rounded-lg bg-muted/20 text-muted-foreground">
          Vui lòng chọn rạp chiếu để xem biểu đồ
        </div>
      )}

      <ShowtimeDetailDialog
        open={!!detailShowTimeId}
        onOpenChange={(open) => !open && setDetailShowTimeId(null)}
        showTimeId={detailShowTimeId}
        onRefreshList={loadData}
      />

      <ShowtimeEditDialog
        open={!!editShowtime}
        onOpenChange={(open) => !open && setEditShowtime(null)}
        showtime={editShowtime}
        onSuccess={loadData}
      />
    </div>
  );
}

