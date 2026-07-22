"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter, useParams } from "next/navigation";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { getBookingState, mergeBookingState } from "@/components/booking/utils/bookingStorage";
import { fetchSeatSelection, initiateBooking } from "@/components/booking/service/booking.service";
import { setBookingTimer, clearBookingTimer } from "@/components/booking/hooks/use-booking-timer";
import { logActivity } from "@/components/activity/service/activity.service";
import type { SeatShowTime, SeatDetail, SuggestedSeat } from "@/types";

import { SeatMap } from "@/components/booking/components/SeatMap";
import { SeatLegend } from "@/components/booking/components/SeatLegend";
import { formatCurrency, seatLabel } from "@/components/booking/utils/booking.utils";


export default function SeatSelectionPage() {
  const router = useRouter();
  const { id: showTimeIdParam } = useParams<{ id: string }>();
  const showTimeId = Number(showTimeIdParam) || 1;

  const bookingInfo = getBookingState() ?? {};

  const [selectedSeats, setSelectedSeats] = useState<number[]>([]);
  const selectedSeatsRef = useRef<number[]>([]);
  const proceededRef = useRef(false);
  const [seatData, setSeatData] = useState<Record<string, SeatShowTime[]>>({});
  const [seatPrices, setSeatPrices] = useState<Record<string, number>>({});
  const [suggestedSeats, setSuggestedSeats] = useState<SuggestedSeat[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(true);
  const [loading, setLoading] = useState(true);
  const [initiating, setInitiating] = useState(false);

  const processSeatData = (data: SeatShowTime[]) => {
    const grouped = data.reduce<Record<string, SeatShowTime[]>>((acc, seat) => {
      const row = seat.seatRow;
      if (!acc[row]) acc[row] = [];
      acc[row].push(seat);
      return acc;
    }, {});

    Object.keys(grouped).forEach((row) => {
      const sorted = grouped[row].sort((a, b) => a.seatNumber - b.seatNumber);
      for (let i = 0; i < sorted.length - 1; i++) {
        if (sorted[i].seatType === "COUPLE" && sorted[i + 1].seatType === "COUPLE") {
          sorted[i].partnerId = sorted[i + 1].seatId;
          sorted[i + 1].partnerId = sorted[i].seatId;
          i++;
        }
      }
      grouped[row] = sorted;
    });

    setSeatData(grouped);
  };

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      setSelectedSeats([]);
      const token = sessionStorage.getItem("token");
      if (!token) {
        toast.error("Vui lòng đăng nhập để tiếp tục đặt vé.");
        router.push(`/login?from=/seat-selection/${showTimeId}`);
        return;
      }
      try {
        const res = await fetchSeatSelection(showTimeId, token);
        processSeatData(res.seats || []);
        setSeatPrices(res.pricingMap || {});
        setSuggestedSeats(res.suggested || []);
      } catch {
        toast.error("Không thể tải thông tin ghế. Vui lòng thử lại.");
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [showTimeId, router]);

  const isSeatOccupied = (seat: SeatShowTime) => seat.seatShowTimeStatus !== "AVAILABLE";
  const isSeatSelected = (seatId: number) => selectedSeats.includes(seatId);

  // sync ref với state để cleanup effect đọc được giá trị mới nhất
  useEffect(() => { selectedSeatsRef.current = selectedSeats; }, [selectedSeats]);

  // log ABANDON_SEAT_SELECTION khi user rời trang mà chưa chọn ghế nào
  useEffect(() => {
    const movieId = bookingInfo.movieId;
    return () => {
      if (!proceededRef.current && selectedSeatsRef.current.length > 0 && movieId) {
        logActivity({ actionType: "ABANDON_SEAT_SELECTION", movieId });
      }
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // SSE — nhận cập nhật ghế real-time thay vì polling mỗi 5s
  useEffect(() => {
    if (loading) return;

    const es = new EventSource(`/api-proxy/seatShowTimes/selection/${showTimeId}/stream`);

    es.addEventListener("seat-update", (e: MessageEvent) => {
      try {
        const seats: SeatShowTime[] = JSON.parse(e.data);
        processSeatData(seats);
        const nowOccupied = seats
          .filter((s) => s.seatShowTimeStatus !== "AVAILABLE")
          .map((s) => s.seatId);
        setSelectedSeats((prev) => {
          const conflicts = prev.filter((id) => nowOccupied.includes(id));
          if (conflicts.length > 0) {
            toast.warning("Một số ghế bạn chọn vừa được người khác đặt. Vui lòng chọn lại.");
            return prev.filter((id) => !nowOccupied.includes(id));
          }
          return prev;
        });
      } catch {
        // silent — không làm gián đoạn UX khi parse thất bại
      }
    });

    es.onerror = () => es.close();

    return () => es.close();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [loading, showTimeId]);

  const toggleSeat = (seat: SeatShowTime) => {
    if (isSeatOccupied(seat)) return;
    const seatsToToggle = [seat.seatId];
    if (seat.partnerId) {
      const partner = Object.values(seatData).flat().find((s) => s.seatId === seat.partnerId);
      if (partner && isSeatOccupied(partner)) {
        toast.error("Ghế đôi này không còn khả dụng. Vui lòng chọn ghế khác.");
        return;
      }
      seatsToToggle.push(seat.partnerId);
    }
    const isSelected = isSeatSelected(seat.seatId);
    const isSuggested = suggestedSeats.some(
      (s) => s.seatShowTimeId === seat.seatShowTimeId || (s.seatRow === seat.seatRow && s.seatNumber === seat.seatNumber)
    );
    if (!isSelected && !isSuggested) {
      setShowSuggestions(false);
    }
    setSelectedSeats((prev) =>
      isSelected
        ? prev.filter((id) => !seatsToToggle.includes(id))
        : [...prev, ...seatsToToggle]
    );
  };

  const calculateTotal = () =>
    Object.values(seatData)
      .flat()
      .filter((s) => selectedSeats.includes(s.seatId))
      .reduce((sum, s) => sum + (seatPrices[s.seatType] || 0), 0);

  const getUserId = () => {
    const token = sessionStorage.getItem("token");
    if (!token) return null;
    try {
      const payload = JSON.parse(atob(token.split(".")[1]));
      return payload.userId || payload.sub || payload.id;
    } catch {
      return null;
    }
  };

  const handleGoToFoods = async () => {
    if (selectedSeats.length === 0 || initiating) return;

    const token = sessionStorage.getItem("token");
    if (!token) {
      toast.error("Vui lòng đăng nhập để tiếp tục đặt vé.");
      router.push(`/login?from=/seat-selection/${showTimeId}`);
      return;
    }

    const userId = getUserId();
    if (!userId) {
      toast.error("Phiên đăng nhập hết hạn. Vui lòng đăng nhập lại.");
      router.push("/login");
      return;
    }

    const allSeats = Object.values(seatData).flat();
    const selectedSeatDetails: SeatDetail[] = allSeats
      .filter((s) => selectedSeats.includes(s.seatId))
      .map((seat) => ({
        seatId: seat.seatId,
        seatRow: seat.seatRow,
        seatNumber: seat.seatNumber,
        seatType: seat.seatType,
        price: seatPrices[seat.seatType] || 0,
        seatShowTimeId: seat.seatShowTimeId,
        partnerId: seat.partnerId,
        seatShowTimeStatus: seat.seatShowTimeStatus,
      }));

    const seatShowTimeIds = selectedSeatDetails
      .map((s) => s.seatShowTimeId)
      .filter((id): id is number => id !== undefined);

    setInitiating(true);
    try {
      const result = await initiateBooking(token, { userId, seatShowTimeIds });
      proceededRef.current = true;
      setBookingTimer(result.expiredTime);
      mergeBookingState({
        seats: selectedSeatDetails,
        seatTotal: calculateTotal(),
        orderId: result.orderId,
        expiredTime: result.expiredTime,
      });
      router.push(`/food-selection/${showTimeId}`);
    } catch (err) {
      const error = err as Error;
      toast.error(error.message || "Không thể khóa ghế. Vui lòng thử lại.");
      // Refresh để lấy trạng thái ghế mới nhất và bỏ chọn ghế bị conflict
      try {
        const fresh = await fetchSeatSelection(showTimeId, token);
        processSeatData(fresh.seats || []);
        const nowOccupied = (fresh.seats || [])
          .filter((s) => s.seatShowTimeStatus !== "AVAILABLE")
          .map((s) => s.seatId);
        setSelectedSeats((prev) => prev.filter((id) => !nowOccupied.includes(id)));
      } catch {
        // silent
      }
    } finally {
      setInitiating(false);
    }
  };

  // ─── Loading skeleton ───────────────────────────────────────────────────────
  if (loading) {
    return (
      <div className="min-h-screen pt-6 sm:pt-8 px-4 sm:px-6 lg:px-8 pb-32 bg-background">
        <div className="max-w-6xl mx-auto space-y-8">
          <div className="space-y-2">
            <Skeleton className="h-7 w-56 rounded-xl" />
            <Skeleton className="h-4 w-40 rounded-xl" />
          </div>
          <Skeleton className="h-3 max-w-2xl mx-auto rounded-full" />
          <div className="space-y-2.5 w-fit mx-auto">
            {[...Array(8)].map((_, i) => (
              <div key={i} className="flex items-center gap-2">
                <Skeleton className="w-7 h-7 rounded" />
                <div className="flex gap-1.5">
                  {[...Array(10)].map((_, j) => (
                    <Skeleton key={j} className="w-11 h-11 rounded-t-lg" />
                  ))}
                </div>
                <Skeleton className="w-7 h-7 rounded" />
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  const rows = Object.keys(seatData).sort();

  return (
    <div className="min-h-screen pt-6 sm:pt-8 px-4 sm:px-6 lg:px-8 pb-36 bg-background">
      <div className="max-w-6xl mx-auto">

        {/* Title & Actions */}
        <div className="mb-8 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="mb-1 text-2xl font-bold text-foreground">Chọn ghế của bạn</h1>
            <p className="text-sm text-muted-foreground">
              {bookingInfo.movie || "Tên phim"} • {bookingInfo.roomName || "Phòng chiếu"}
            </p>
          </div>
          {suggestedSeats.length > 0 && !showSuggestions && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowSuggestions(true)}
              className="w-fit text-amber-600 border-amber-600 hover:bg-amber-50 dark:text-amber-400 dark:border-amber-400 dark:hover:bg-amber-950/30 gap-2"
            >
              ✨ Ghế tốt nhất hiện tại
            </Button>
          )}
        </div>

        {/* Screen */}
        <div className="mb-10">
          <div className="max-w-2xl mx-auto">
            <div className="relative h-3 rounded-t-[50%] overflow-hidden bg-gradient-to-b from-foreground/20 dark:from-white/40 to-transparent shadow-[0_-6px_18px_rgba(0,0,0,0.1)] dark:shadow-[0_-6px_18px_rgba(255,255,255,0.12)]" />
            <p className="text-center text-[10px] text-muted-foreground tracking-[0.3em] uppercase mt-1.5 font-medium">
              Màn hình
            </p>
          </div>
        </div>

        {/* Seat map
            overflow-x-auto chỉ bao ngoài cùng.
            Không dùng hover:scale → tránh lỗi scroll cursor khi hover ghế.
            Thay bằng hover:-translate-y-1 (chỉ dịch trục Y, không gây overflow ngang).
        */}
        <SeatMap
          seatData={seatData}
          seatPrices={seatPrices}
          selectedSeats={selectedSeats}
          suggestedSeats={suggestedSeats}
          showSuggestions={showSuggestions}
          onToggleSeat={toggleSeat}
          isSeatOccupied={isSeatOccupied}
        />

        {/* Legend */}
        <SeatLegend seatPrices={seatPrices} />
      </div>

      {/* Bottom sticky bar */}
      {selectedSeats.length > 0 && (
        <div className="fixed bottom-0 left-0 right-0 z-40 bg-card/95 backdrop-blur-xl border-t border-border shadow-2xl">
          <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-3 flex items-center justify-between gap-4">
            <div className="min-w-0">
              <p className="text-xs text-muted-foreground mb-0.5">
                Đã chọn <span className="font-semibold text-foreground">{selectedSeats.length}</span> ghế
              </p>
              <p className="text-sm font-medium text-foreground truncate">
                {Object.values(seatData)
                  .flat()
                  .filter((s) => selectedSeats.includes(s.seatId))
                  .map((s) => seatLabel(s.seatRow, s.seatNumber))
                  .join(", ")}
              </p>
            </div>
            <div className="flex items-center gap-4 flex-shrink-0">
              <div className="text-right">
                <p className="text-xs text-muted-foreground">Tạm tính</p>
                <p className="text-xl sm:text-2xl text-primary font-black tabular-nums">
                  {formatCurrency(calculateTotal())}
                </p>
              </div>
              <Button
                size="lg"
                className="cursor-pointer shadow-lg shadow-primary/30 hover:-translate-y-0.5 transition-all font-bold"
                onClick={handleGoToFoods}
                disabled={initiating}
              >
                {initiating ? "Đang xử lý..." : "Tiếp tục →"}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
