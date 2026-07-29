"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams, usePathname } from "next/navigation";
import { toast } from "sonner";
import { ArrowLeft, Eye, Plus, DoorOpen, X, Check } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { PageHeader, ConfirmDialog } from "@/components/shared";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { SingleSelectWithSearch } from "@/components/shared";
import { TimePicker24h } from "@/components/shared/TimePicker24h";
import { cn } from "@/lib/utils";
import { fetchActiveCinemasForSelect, fetchAdminCinemaById } from "@/services/admin/adminCinemaService";
import { fetchAdminMovies } from "@/services/admin/adminMovieService";
import { adminShowtimeService } from "@/services/admin/adminShowtimeService";
import { GanttChart } from "@/components/admin/showtime/gantt/GanttChart";
import {
  RoomPlanCard,
  computeUsedMinutes,
  type RoomOption,
  type MovieOption,
  type RoomPlanState,
} from "@/components/admin/showtime/propose/RoomPlanCard";
import type { AdminCinema } from "@/types/admin.type";
import type { Showtime, ShowTimeProposalRequest } from "@/types/admin/showtime";

const BUFFER_MINUTES = 15; // khớp AdminShowTimeService.BUFFER_MINUTES ở backend

let planSeq = 0;
const newPlanId = () => `plan_${planSeq++}`;

const toMinute = (hm: string) => {
  if (!hm) return 0;
  const [h, m] = hm.split(":").map(Number);
  return h * 60 + m;
};

export default function ProposeShowtimesPage() {
  const { token } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const [cinemas, setCinemas] = useState<AdminCinema[]>([]);
  const [cinemaId, setCinemaId] = useState<string>(searchParams.get("cinemaId") || "");
  const [fromDate, setFromDate] = useState(searchParams.get("from") || "");
  const [toDate, setToDate] = useState(searchParams.get("to") || "");
  const [openTime, setOpenTime] = useState("09:00");
  const [closeTime, setCloseTime] = useState("23:59");

  const [rooms, setRooms] = useState<RoomOption[]>([]);
  const [movies, setMovies] = useState<MovieOption[]>([]);
  const [plans, setPlans] = useState<RoomPlanState[]>([]);
  const [isLoadingCinemaData, setIsLoadingCinemaData] = useState(false);
  // Số phút đã bị suất chiếu THẬT (SCHEDULED/ONGOING/FULLY_BOOKED...) chiếm sẵn trong từng phòng —
  // lấy worst-case (ngày bận nhất) trong toàn bộ khoảng ngày đã chọn, dùng để trừ vào "còn dư".
  const [existingBusyMinutesByRoom, setExistingBusyMinutesByRoom] = useState<Record<number, number>>({});
  const [existingCountByRoom, setExistingCountByRoom] = useState<Record<number, number>>({});

  const [isPreviewOpen, setIsPreviewOpen] = useState(false);
  const [previewShowtimes, setPreviewShowtimes] = useState<Showtime[]>([]);
  // Suất chiếu THẬT (SCHEDULED/ONGOING/...) đã có sẵn, hiển thị cùng Gantt với DRAFT dự kiến để
  // admin đối chiếu bằng mắt — chỉ để xem, không kéo-thả/thao tác được trong Preview.
  const [existingShowtimes, setExistingShowtimes] = useState<Showtime[]>([]);
  const [previewDates, setPreviewDates] = useState<string[]>([]);
  const [previewDate, setPreviewDate] = useState<string>("");
  const [previewShortfallCount, setPreviewShortfallCount] = useState(0);
  const [isCalculating, setIsCalculating] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  // Click-to-select để hoán đổi 2 khối DRAFT: chọn khối 1 (lưu showTimeId), chọn khối 2 khác sẽ mở
  // dialog hỏi hoán đổi giờ/phòng của 2 khối cho nhau — chỉ áp dụng cho bản nháp chưa lưu.
  const [selectedForSwapId, setSelectedForSwapId] = useState<number | null>(null);
  const [pendingSwap, setPendingSwap] = useState<{ movedId: number; targetId: number } | null>(null);

  useEffect(() => {
    if (!token) return;
    fetchActiveCinemasForSelect(token).then(setCinemas).catch(() => toast.error("Không thể tải danh sách rạp"));
  }, [token]);

  // Đồng bộ ngược URL query string theo form — copy link chia sẻ đúng trạng thái đang cấu hình,
  // refresh trang không mất rạp/khoảng ngày đã chọn.
  useEffect(() => {
    const params = new URLSearchParams();
    if (cinemaId) params.set("cinemaId", cinemaId);
    if (fromDate) params.set("from", fromDate);
    if (toDate) params.set("to", toDate);
    const query = params.toString();
    router.replace(query ? `${pathname}?${query}` : pathname, { scroll: false });
  }, [cinemaId, fromDate, toDate, pathname, router]);

  useEffect(() => {
    if (!token || !cinemaId) {
      setRooms([]);
      setPlans([]);
      return;
    }
    setIsLoadingCinemaData(true);
    Promise.all([
      fetchAdminCinemaById(token, Number(cinemaId)),
      fetchAdminMovies(token, { size: 200, movieStatus: "NOW_SHOWING" as any }),
      fetchAdminMovies(token, { size: 200, movieStatus: "COMING_SOON" as any }),
    ])
      .then(([cinemaDetail, nowShowingRes, comingSoonRes]) => {
        setRooms(cinemaDetail.rooms.map((r) => ({ roomId: r.roomId, name: r.name, roomType: r.roomType })));
        const allMovies = [...nowShowingRes.content, ...comingSoonRes.content];
        setMovies(allMovies.map((m) => ({ movieId: m.movieId, title: m.title, duration: m.duration })));
        setPlans([{ id: newPlanId(), roomId: null, assignments: [] }]);
      })
      .catch(() => toast.error("Không thể tải dữ liệu phòng/phim của rạp"))
      .finally(() => setIsLoadingCinemaData(false));
  }, [token, cinemaId]);

  useEffect(() => {
    if (!token || !cinemaId || !fromDate || !toDate || fromDate > toDate) {
      setExistingBusyMinutesByRoom({});
      setExistingCountByRoom({});
      return;
    }
    let cancelled = false;

    const dates: string[] = [];
    for (let d = new Date(fromDate); d <= new Date(toDate); d.setDate(d.getDate() + 1)) {
      dates.push(d.toISOString().slice(0, 10));
    }

    Promise.all(dates.map((day) => adminShowtimeService.getShowtimesForGantt(token, Number(cinemaId), day)))
      .then((results) => {
        if (cancelled) return;
        // Worst-case: với mỗi phòng, lấy NGÀY bận nhất trong khoảng (nhiều phút bị chiếm nhất) làm
        // giới hạn chung cho cả khoảng — tránh cho phép cấu hình số suất vượt quá những ngày bận.
        const busyMinutesPerDayPerRoom: Record<number, number[]> = {};
        const countPerDayPerRoom: Record<number, number[]> = {};
        results.forEach((dayShowtimes) => {
          const minutesByRoom: Record<number, number> = {};
          const countByRoom: Record<number, number> = {};
          dayShowtimes
            .filter((s) => s.showTimeStatus !== "CANCELLED" && s.showTimeStatus !== "COMPLETED")
            .forEach((s) => {
              const minutes = (new Date(s.endTime).getTime() - new Date(s.startTime).getTime()) / 60000;
              minutesByRoom[s.roomId] = (minutesByRoom[s.roomId] || 0) + minutes;
              countByRoom[s.roomId] = (countByRoom[s.roomId] || 0) + 1;
            });
          Object.entries(minutesByRoom).forEach(([roomId, minutes]) => {
            const rid = Number(roomId);
            (busyMinutesPerDayPerRoom[rid] ||= []).push(minutes);
          });
          Object.entries(countByRoom).forEach(([roomId, count]) => {
            const rid = Number(roomId);
            (countPerDayPerRoom[rid] ||= []).push(count);
          });
        });

        const worstMinutes: Record<number, number> = {};
        Object.entries(busyMinutesPerDayPerRoom).forEach(([roomId, values]) => {
          worstMinutes[Number(roomId)] = Math.max(...values);
        });
        const worstCount: Record<number, number> = {};
        Object.entries(countPerDayPerRoom).forEach(([roomId, values]) => {
          worstCount[Number(roomId)] = Math.max(...values);
        });

        setExistingBusyMinutesByRoom(worstMinutes);
        setExistingCountByRoom(worstCount);
      })
      .catch(() => {
        if (!cancelled) toast.error("Không thể tải lịch chiếu hiện có của rạp để đối chiếu");
      });

    return () => {
      cancelled = true;
    };
  }, [token, cinemaId, fromDate, toDate]);

  const chosenRoomIds = useMemo(() => new Set(plans.map((p) => p.roomId).filter((r): r is number => r != null)), [plans]);

  const availableRoomsFor = useCallback(
    (planId: string) => {
      const currentPlan = plans.find((p) => p.id === planId);
      return rooms.filter((r) => r.roomId === currentPlan?.roomId || !chosenRoomIds.has(r.roomId));
    },
    [rooms, plans, chosenRoomIds],
  );

  const handleAddPlan = () => setPlans((prev) => [...prev, { id: newPlanId(), roomId: null, assignments: [] }]);
  const handleRemovePlan = (planId: string) => setPlans((prev) => prev.filter((p) => p.id !== planId));
  const handleChangeRoom = (planId: string, roomId: number | null) =>
    setPlans((prev) => prev.map((p) => (p.id === planId ? { ...p, roomId, assignments: [] } : p)));
  const handleAddMovie = (planId: string, movieId: number) =>
    setPlans((prev) =>
      prev.map((p) => (p.id === planId ? { ...p, assignments: [...p.assignments, { movieId, count: 1 }] } : p)),
    );
  const handleChangeCount = (planId: string, movieId: number, count: number) =>
    setPlans((prev) =>
      prev.map((p) =>
        p.id === planId
          ? { ...p, assignments: p.assignments.map((a) => (a.movieId === movieId ? { ...a, count } : a)) }
          : p,
      ),
    );
  const handleRemoveMovie = (planId: string, movieId: number) =>
    setPlans((prev) =>
      prev.map((p) => (p.id === planId ? { ...p, assignments: p.assignments.filter((a) => a.movieId !== movieId) } : p)),
    );

  const buildRequest = (dryRun: boolean): ShowTimeProposalRequest | null => {
    if (!cinemaId || !fromDate || !toDate) {
      toast.error("Vui lòng chọn đủ Rạp và khoảng ngày");
      return null;
    }
    if (fromDate > toDate) {
      toast.error("Ngày bắt đầu phải trước ngày kết thúc");
      return null;
    }
    if (!closeTime) {
      toast.error("Vui lòng chọn giờ đóng cửa");
      return null;
    }
    const roomPlans = plans
      .filter((p) => p.roomId != null && p.assignments.length > 0)
      .map((p) => ({ roomId: p.roomId as number, assignments: p.assignments }));

    if (roomPlans.length === 0) {
      toast.error("Chọn ít nhất 1 phòng và ít nhất 1 phim cho phòng đó");
      return null;
    }

    return {
      cinemaId: Number(cinemaId),
      fromDate,
      toDate,
      openTime,
      closeTime,
      roomPlans,
      dryRun,
    };
  };

  const handlePreview = async () => {
    if (!token) return;
    const request = buildRequest(true);
    if (!request) return;
    setIsCalculating(true);
    try {
      const result = await adminShowtimeService.proposeShowtimes(token, request);
      // dryRun trả về suất chưa lưu DB nên showTimeId luôn null — gán tmpId âm tuần tự để phân
      // biệt từng khối trong preview (dùng cho click-to-select hoán đổi nội bộ, không phải ID thật để gọi API).
      const withTmpIds = result.created.map((s, idx) => ({ ...s, showTimeId: -(idx + 1) }));
      setPreviewShowtimes(withTmpIds);
      setPreviewShortfallCount(result.shortfalls.length);
      const dates = Array.from(new Set(result.created.map((s) => s.startTime.slice(0, 10)))).sort();
      setPreviewDates(dates);
      setPreviewDate(dates[0] || fromDate);
      setIsPreviewOpen(true);

      // Hiển thị luôn suất chiếu THẬT đã có sẵn cùng Gantt để đối chiếu bằng mắt — fetch toàn bộ
      // khoảng ngày đã chọn (không chỉ ngày đầu), gộp lại thành 1 danh sách.
      const dayResults = await Promise.all(
        dates.map((day) => adminShowtimeService.getShowtimesForGantt(token, Number(cinemaId), day)),
      );
      setExistingShowtimes(dayResults.flat());
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Không thể tính toán lịch dự kiến");
    } finally {
      setIsCalculating(false);
    }
  };

  const handleConfirmCreate = async () => {
    if (!token) return;
    const request = buildRequest(false);
    if (!request) return;
    // Ghi đúng bản đã hoán đổi chỉnh tay trong Preview (mục 2.5c) — không tính lại thuật toán.
    request.overrideShowtimes = previewShowtimes.map((s) => ({
      movieId: s.movieId,
      roomId: s.roomId,
      startTime: s.startTime,
      endTime: s.endTime,
    }));
    setIsSubmitting(true);
    try {
      const result = await adminShowtimeService.proposeShowtimes(token, request);
      setIsPreviewOpen(false);
      if (result.shortfalls.length > 0) {
        toast.warning(
          `Đã tạo ${result.created.length} suất DRAFT — ${result.shortfalls.length} lượt suất không xếp được chỗ do phân mảnh thời gian.`,
        );
      } else {
        toast.success(`Đã tạo ${result.created.length} suất chiếu DRAFT`);
      }
      const cId = Number(cinemaId);
      router.push(`/admin/showtimes?cinemaId=${cId}&date=${request.fromDate}&expandCinema=${cId}`);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Không thể tạo đề xuất lịch chiếu");
    } finally {
      setIsSubmitting(false);
    }
  };

  const previewRooms = useMemo(() => {
    const roomIds = new Set([
      ...previewShowtimes.map((s) => s.roomId),
      ...existingShowtimes.map((s) => s.roomId),
    ]);
    return rooms.filter((r) => roomIds.has(r.roomId));
  }, [previewShowtimes, existingShowtimes, rooms]);

  const previewShowtimesForDate = useMemo(
    () => previewShowtimes.filter((s) => s.startTime.slice(0, 10) === previewDate),
    [previewShowtimes, previewDate],
  );

  const existingShowtimesForDate = useMemo(
    () =>
      existingShowtimes.filter(
        (s) =>
          s.startTime.slice(0, 10) === previewDate &&
          s.showTimeStatus !== "CANCELLED" &&
          s.showTimeStatus !== "COMPLETED",
      ),
    [existingShowtimes, previewDate],
  );

  // Gộp suất thật + DRAFT dự kiến để vẽ chung trên Gantt — dùng hiển thị, không dùng để gọi API.
  const combinedGanttShowtimes = useMemo(
    () => [...existingShowtimesForDate, ...previewShowtimesForDate],
    [existingShowtimesForDate, previewShowtimesForDate],
  );

  // Click-to-select: click khối 1 -> chọn (viền nổi bật). Click đúng khối đang chọn -> bỏ chọn.
  // Click khối 2 (khác khối 1) -> mở dialog hỏi hoán đổi giờ/phòng của 2 khối cho nhau.
  const handleSelectForSwap = (showtime: Showtime) => {
    if (selectedForSwapId === null) {
      setSelectedForSwapId(showtime.showTimeId);
      return;
    }
    if (selectedForSwapId === showtime.showTimeId) {
      setSelectedForSwapId(null);
      return;
    }
    setPendingSwap({ movedId: selectedForSwapId, targetId: showtime.showTimeId });
    setSelectedForSwapId(null);
  };

  const handleConfirmSwap = () => {
    if (!pendingSwap) return;
    const { movedId, targetId } = pendingSwap;
    const movedItem = previewShowtimes.find((s) => s.showTimeId === movedId);
    const targetItem = previewShowtimes.find((s) => s.showTimeId === targetId);
    if (!movedItem || !targetItem) {
      setPendingSwap(null);
      return;
    }
    setPreviewShowtimes((prev) =>
      prev.map((s) => {
        if (s.showTimeId === movedId) {
          return { ...s, roomId: targetItem.roomId, startTime: targetItem.startTime, endTime: targetItem.endTime };
        }
        if (s.showTimeId === targetId) {
          return { ...s, roomId: movedItem.roomId, startTime: movedItem.startTime, endTime: movedItem.endTime };
        }
        return s;
      }),
    );
    setPendingSwap(null);
  };

  return (
    <div className="space-y-6">
      <PageHeader title="Lập lịch chiếu mới" description="Cấu hình số suất theo từng phòng, hệ thống tự xếp giờ theo thuật toán 2 giai đoạn" />

      <Button variant="ghost" size="sm" className="text-muted-foreground -ml-2 -mt-4" onClick={() => router.push("/admin/showtimes")}>
        <ArrowLeft className="h-4 w-4" /> Quay lại danh sách suất chiếu
      </Button>

      <div className="bg-card border rounded-xl p-5">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="rounded-lg border bg-muted/20 p-4 space-y-2">
            <Label>Rạp chiếu <span className="text-destructive">*</span></Label>
            <SingleSelectWithSearch
              options={cinemas.map((c) => ({ value: String(c.cinemaId), label: c.name }))}
              value={cinemaId}
              onChange={setCinemaId}
              placeholder="Chọn rạp..."
            />
          </div>

          <div className="rounded-lg border bg-muted/20 p-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Từ ngày <span className="text-destructive">*</span></Label>
                <Input type="date" value={fromDate} onChange={(e) => setFromDate(e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label>Đến ngày <span className="text-destructive">*</span></Label>
                <Input type="date" value={toDate} onChange={(e) => setToDate(e.target.value)} />
              </div>
            </div>
          </div>

          <div className="rounded-lg border bg-muted/20 p-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Giờ mở cửa</Label>
                <TimePicker24h value={openTime} onChange={setOpenTime} />
              </div>
              <div className="space-y-2">
                <Label>Giờ đóng cửa <span className="text-destructive">*</span></Label>
                <TimePicker24h value={closeTime} onChange={setCloseTime} />
              </div>
            </div>
          </div>
        </div>
      </div>

      {isLoadingCinemaData ? (
        <div className="p-10 text-center text-muted-foreground">Đang tải dữ liệu phòng/phim...</div>
      ) : cinemaId ? (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-semibold text-foreground flex items-center gap-2">
              <DoorOpen className="h-4 w-4 text-muted-foreground" />
              Cấu hình theo phòng
            </h2>
            <Badge variant="secondary" className="font-normal">
              {chosenRoomIds.size}/{rooms.length} phòng đã cấu hình
            </Badge>
          </div>

          {plans.map((plan) => (
            <RoomPlanCard
              key={plan.id}
              plan={plan}
              availableRooms={availableRoomsFor(plan.id)}
              movieOptions={movies}
              bufferMinutes={BUFFER_MINUTES}
              openMinute={toMinute(openTime)}
              closeMinute={closeTime === "00:00" ? 24 * 60 : toMinute(closeTime)}
              existingBusyMinutes={existingBusyMinutesByRoom[plan.roomId ?? -1] || 0}
              existingShowtimeCount={existingCountByRoom[plan.roomId ?? -1] || 0}
              existingCountByRoom={existingCountByRoom}
              onChangeRoom={handleChangeRoom}
              onAddMovie={handleAddMovie}
              onChangeCount={handleChangeCount}
              onRemoveMovie={handleRemoveMovie}
              onRemovePlan={handleRemovePlan}
            />
          ))}

          <button
            type="button"
            disabled={chosenRoomIds.size >= rooms.length}
            onClick={handleAddPlan}
            className={cn(
              "w-full flex items-center justify-center gap-2 rounded-xl border-2 border-dashed py-4 text-sm font-medium transition-colors",
              chosenRoomIds.size >= rooms.length
                ? "border-border/60 text-muted-foreground/60 cursor-not-allowed"
                : "border-border text-muted-foreground hover:border-primary/50 hover:text-primary hover:bg-primary/5 cursor-pointer",
            )}
          >
            <Plus className="h-4 w-4" />
            {chosenRoomIds.size >= rooms.length ? "Đã cấu hình hết phòng của rạp" : "Thêm phòng"}
          </button>
        </div>
      ) : (
        <div className="p-10 text-center text-muted-foreground bg-card border rounded-lg">Chọn rạp để bắt đầu cấu hình</div>
      )}

      {cinemaId && (
        <div className="flex items-center justify-between rounded-xl border bg-muted/30 px-5 py-4">
          <p className="text-sm text-muted-foreground">
            Xem thử lịch được xếp tự động trước khi tạo đề xuất — vẫn có thể click chọn để hoán đổi vị trí ở bước sau.
          </p>
          <Button
            size="lg"
            disabled={isCalculating || chosenRoomIds.size === 0}
            onClick={handlePreview}
            className="gap-2 shrink-0"
          >
            <Eye className="h-4 w-4" />
            {isCalculating ? "Đang tính toán..." : "Xem trước trên sơ đồ Gantt"}
          </Button>
        </div>
      )}

      {isPreviewOpen && (
        <div className="rounded-xl border bg-card shadow-sm overflow-hidden">
          <div className="flex items-center justify-between px-5 py-4 border-b bg-muted/30">
            <div>
              <h3 className="font-semibold text-foreground">
                Xem trước — {cinemas.find((c) => String(c.cinemaId) === cinemaId)?.name}
              </h3>
              <p className="text-sm text-muted-foreground mt-0.5">{previewShowtimes.length} suất DRAFT dự kiến</p>
            </div>
            <Button variant="ghost" size="icon" onClick={() => setIsPreviewOpen(false)} className="shrink-0">
              <X className="h-4 w-4" />
            </Button>
          </div>

          <div className="p-5 space-y-4">
            {previewShortfallCount > 0 && (
              <div className="text-sm bg-amber-50 text-amber-700 border border-amber-200 rounded-md px-3 py-2">
                ⚠ {previewShortfallCount} lượt suất không xếp được chỗ do phân mảnh thời gian — xem chi tiết sau khi tạo đề xuất.
              </div>
            )}

            <div className="flex items-center gap-3">
              <Label className="shrink-0">Ngày xem</Label>
              <select
                className="flex h-9 rounded-md border border-input bg-background px-3 py-1 text-sm"
                value={previewDate}
                onChange={(e) => setPreviewDate(e.target.value)}
              >
                {previewDates.map((d) => (
                  <option key={d} value={d}>{d}</option>
                ))}
              </select>
            </div>

            <div className="flex items-center gap-4 text-xs text-muted-foreground">
              <span className="flex items-center gap-1.5">
                <span className="w-3 h-3 rounded-sm bg-violet-500/80 border border-violet-500 border-dashed inline-block" />
                Đề xuất DRAFT (click để chọn)
              </span>
              <span className="flex items-center gap-1.5">
                <span className="w-3 h-3 rounded-sm bg-blue-500 inline-block" />
                Suất chiếu đã có sẵn (chỉ xem)
              </span>
            </div>
            <p className="text-xs text-muted-foreground">Click 1 khối DRAFT để chọn (viền vàng nổi bật), click tiếp 1 khối DRAFT khác để hoán đổi vị trí cho nhau — chỉ áp dụng cho bản nháp, chưa lưu. Click lại khối đang chọn để hủy.</p>

            <div className="max-h-[60vh] overflow-auto">
              <GanttChart
                rooms={previewRooms}
                showtimes={combinedGanttShowtimes}
                selectedDate={previewDate ? new Date(previewDate) : new Date()}
                selectedForSwapId={selectedForSwapId}
                onSelectForSwap={handleSelectForSwap}
                dragOnly
              />
            </div>

            <div className="flex justify-end pt-2 border-t">
              <Button disabled={isSubmitting} onClick={handleConfirmCreate} className="gap-2">
                <Check className="h-4 w-4" /> Xác nhận tạo đề xuất (DRAFT)
              </Button>
            </div>
          </div>
        </div>
      )}

      <ConfirmDialog
        open={!!pendingSwap}
        onOpenChange={(open) => { if (!open) setPendingSwap(null); }}
        title="Hoán đổi vị trí 2 suất DRAFT"
        description="Vị trí bạn thả đã có 1 suất DRAFT khác trong bản nháp. Xác nhận sẽ hoán đổi giờ/phòng của 2 suất này cho nhau — chưa lưu, chỉ áp dụng cho bản nháp đang xem trước."
        confirmLabel="Hoán đổi"
        onConfirm={handleConfirmSwap}
      />
    </div>
  );
}
