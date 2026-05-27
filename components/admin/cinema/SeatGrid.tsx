"use client";

import { cn } from "@/lib/utils";
import type { AdminSeat, SeatType, SeatStatus } from "@/types/admin.type";

const SEAT_TYPE_CLASSES: Record<SeatType, string> = {
  STANDARD: "bg-blue-100 border-blue-300 text-blue-800 hover:bg-blue-200",
  VIP:      "bg-purple-100 border-purple-300 text-purple-800 hover:bg-purple-200",
  COUPLE:   "bg-pink-100 border-pink-300 text-pink-800 hover:bg-pink-200",
};

const SEAT_STATUS_CLASSES: Record<SeatStatus, string> = {
  NORMAL:      "",
  BROKEN:      "bg-red-100 border-red-300 text-red-700 hover:bg-red-200",
  MAINTENANCE: "bg-amber-100 border-amber-300 text-amber-700 hover:bg-amber-200",
};

interface SeatGridProps {
  seats: AdminSeat[];
  onSeatClick?: (seat: AdminSeat) => void;
  isLoading?: boolean;
}

export function SeatGrid({ seats, onSeatClick, isLoading }: SeatGridProps) {
  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-10 text-sm text-muted-foreground">
        Đang tải sơ đồ ghế...
      </div>
    );
  }

  if (seats.length === 0) {
    return (
      <div className="flex items-center justify-center py-8 text-sm text-muted-foreground border rounded-lg">
        Phòng chưa có sơ đồ ghế.
      </div>
    );
  }

  const rowMap = new Map<string, AdminSeat[]>();
  let maxCol = 0;
  for (const seat of seats) {
    if (!rowMap.has(seat.seatRow)) rowMap.set(seat.seatRow, []);
    rowMap.get(seat.seatRow)!.push(seat);
    if (seat.seatNumber > maxCol) maxCol = seat.seatNumber;
  }
  const sortedRows = [...rowMap.entries()].sort(([a], [b]) => a.localeCompare(b));
  for (const [, row] of sortedRows) {
    row.sort((a, b) => a.seatNumber - b.seatNumber);
  }

  return (
    <div className="overflow-x-auto w-full">
      <div className="w-max mx-auto flex flex-col gap-1.5 pb-8 relative">
        <div className="mb-8 w-full max-w-xl mx-auto border-t-[6px] border-primary/40 rounded-t-[50%] text-center pt-2">
          <span className="text-xs font-semibold text-muted-foreground uppercase tracking-widest">
            Màn hình
          </span>
        </div>
        {sortedRows.map(([rowLabel, rowSeats]) => (
          <div key={rowLabel} className="flex items-center gap-1">
            <span className="w-6 shrink-0 text-center text-xs font-semibold text-muted-foreground">
              {rowLabel}
            </span>
            <div 
              className="grid gap-1"
              style={{ gridTemplateColumns: `repeat(${maxCol}, minmax(0, 1fr))` }}
            >
              {rowSeats.map((seat, index) => {
                const isInactive = seat.entityStatus === "INACTIVE";
                const statusClass = SEAT_STATUS_CLASSES[seat.seatStatus];
                const typeClass = SEAT_TYPE_CLASSES[seat.seatType];

                // Check for couple pairs
                let coupleClass = "";
                if (seat.seatType === "COUPLE") {
                  let countBefore = 0;
                  for (let k = index - 1; k >= 0; k--) {
                    if (rowSeats[k].seatType === "COUPLE" && rowSeats[k].seatNumber === rowSeats[k + 1].seatNumber - 1) {
                      countBefore++;
                    } else {
                      break;
                    }
                  }
                  
                  const isLeftCouple = countBefore % 2 === 0;
                  const nextSeat = rowSeats[index + 1];
                  const prevSeat = rowSeats[index - 1];

                  if (isLeftCouple && nextSeat?.seatType === "COUPLE" && nextSeat.seatNumber === seat.seatNumber + 1) {
                    coupleClass = "!w-[36px] border-r-0 mr-[-4px] z-10";
                  } else if (!isLeftCouple && prevSeat?.seatType === "COUPLE" && prevSeat.seatNumber === seat.seatNumber - 1) {
                    coupleClass = "!w-[36px] ml-[-4px] border-l-0 z-10";
                  }
                }

                return (
                  <button
                    key={seat.seatId}
                    type="button"
                    title={`${seat.seatRow}${seat.seatNumber} — ${seat.seatType}${isInactive ? " (Vô hiệu)" : ""}${seat.seatStatus !== "NORMAL" ? ` — ${seat.seatStatus}` : ""}`}
                    onClick={() => onSeatClick?.(seat)}
                    style={{ gridColumn: seat.seatNumber }}
                    className={cn(
                      "h-8 w-8 border text-[10px] font-semibold transition-all flex items-center justify-center",
                      isInactive
                        ? "bg-muted border-border text-muted-foreground opacity-50 hover:opacity-70"
                        : statusClass || typeClass,
                      coupleClass,
                      onSeatClick ? "cursor-pointer" : "cursor-default"
                    )}
                  >
                    {seat.seatRow}{seat.seatNumber}
                  </button>
                );
              })}
            </div>
            <span className="w-6 shrink-0 ml-1 opacity-0 pointer-events-none" />
          </div>
        ))}

        <div className="mt-3 flex flex-wrap gap-3 border-t pt-3">
          {(["STANDARD", "VIP", "COUPLE"] as SeatType[]).map((type) => (
            <span key={type} className="flex items-center gap-1.5 text-xs text-muted-foreground">
              <span className={cn("h-4 w-4 border", SEAT_TYPE_CLASSES[type].split(" ").slice(0, 2).join(" "))} />
              {type === "STANDARD" ? "Thường" : type === "VIP" ? "VIP" : "Đôi"}
            </span>
          ))}
          <span className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <span className="h-4 w-4 border bg-muted opacity-50" />
            Vô hiệu
          </span>
          <span className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <span className="h-4 w-4 border bg-red-100 border-red-300" />
            Hỏng
          </span>
        </div>
      </div>
    </div>
  );
}
