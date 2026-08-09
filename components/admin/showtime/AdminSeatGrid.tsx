"use client";

import { useMemo } from "react";
import { cn } from "@/lib/utils";
import type { SeatShowTime } from "@/types";

interface AdminSeatGridProps {
  items: SeatShowTime[];
}

const getTypeColor = (seatType: string): string => {
  switch (seatType) {
    case "VIP":    return "bg-amber-200 border-amber-300 text-amber-900";
    case "COUPLE": return "bg-rose-200 border-rose-300 text-rose-900";
    default:       return "bg-slate-200 border-slate-300 text-slate-700";
  }
};

const SEAT_TYPE_VI: Record<string, string> = {
  STANDARD: "Thường",
  VIP: "VIP",
  COUPLE: "Đôi",
};

const SEAT_STATUS_VI: Record<string, string> = {
  AVAILABLE: "Còn trống",
  RESERVED: "Đặt trước",
  SOLD: "Đã bán",
  BLOCKED: "Khóa",
};

const getStatusColor = (status: string): string | null => {
  switch (status) {
    case "SOLD":     return "bg-red-400 border-red-500 text-white";
    case "RESERVED": return "bg-orange-400 border-orange-500 text-white";
    case "BLOCKED":  return "bg-slate-400 border-slate-500 text-white";
    default:         return null;
  }
};

export const AdminSeatGrid = ({ items }: AdminSeatGridProps) => {
  const { sortedRows, maxCol } = useMemo(() => {
    const rowMap = new Map<string, SeatShowTime[]>();
    let max = 0;
    items.forEach((seat) => {
      if (!rowMap.has(seat.seatRow)) rowMap.set(seat.seatRow, []);
      rowMap.get(seat.seatRow)!.push(seat);
      if (seat.seatNumber > max) max = seat.seatNumber;
    });
    const rows = Array.from(rowMap.entries())
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([row, seats]) => ({
        row,
        seats: seats.sort((a, b) => a.seatNumber - b.seatNumber),
      }));
    return { sortedRows: rows, maxCol: max };
  }, [items]);

  const coupleLeftIds = useMemo(() => {
    const ids = new Set<number>();
    sortedRows.forEach(({ seats }) => {
      const available = seats.filter(s => s.seatType === "COUPLE" && s.seatShowTimeStatus === "AVAILABLE");
      for (let i = 0; i < available.length - 1; i++) {
        if (available[i + 1].seatNumber === available[i].seatNumber + 1) {
          ids.add(available[i].seatId);
          i++;
        }
      }
    });
    return ids;
  }, [sortedRows]);

  const coupleRightIds = useMemo(() => {
    const ids = new Set<number>();
    sortedRows.forEach(({ seats }) => {
      const available = seats.filter(s => s.seatType === "COUPLE" && s.seatShowTimeStatus === "AVAILABLE");
      for (let i = 0; i < available.length - 1; i++) {
        if (available[i + 1].seatNumber === available[i].seatNumber + 1) {
          ids.add(available[i + 1].seatId);
          i++;
        }
      }
    });
    return ids;
  }, [sortedRows]);

  return (
    <div className="w-full">
      <div className="overflow-x-auto pb-2">
        <div className="w-fit mx-auto flex flex-col gap-1.5">
          {sortedRows.map(({ row, seats }) => (
            <div key={row} className="flex items-center gap-1.5">
              <span className="w-6 sm:w-7 text-center text-xs font-bold text-muted-foreground shrink-0">{row}</span>

              <div
                className="grid gap-1 sm:gap-1.5"
                style={{ gridTemplateColumns: `repeat(${maxCol}, 2.5rem)` }}
              >
                {seats.map((seat) => {
                  const isAvailable = seat.seatShowTimeStatus === "AVAILABLE";
                  const statusColor = getStatusColor(seat.seatShowTimeStatus);
                  const typeColor = getTypeColor(seat.seatType);
                  const isCouple = seat.seatType === "COUPLE";
                  const isLeft = isCouple && isAvailable && coupleLeftIds.has(seat.seatId);
                  const isRight = isCouple && isAvailable && coupleRightIds.has(seat.seatId);
                  const label = `${seat.seatRow}${seat.seatNumber}`;

                  return (
                    <div
                      key={seat.seatId}
                      title={`${label} – Ghế ${SEAT_TYPE_VI[seat.seatType] ?? seat.seatType} – ${SEAT_STATUS_VI[seat.seatShowTimeStatus] ?? seat.seatShowTimeStatus}`}
                      style={{ gridColumn: seat.seatNumber }}
                      className={cn(
                        "w-10 h-10 flex items-center justify-center border rounded-t-lg text-[9px] font-bold select-none",
                        statusColor ?? typeColor,
                        isLeft && "rounded-tr-none border-r-0 mr-[-4px] z-10 w-[calc(100%+4px)]",
                        isRight && "rounded-tl-none border-l-0 ml-[-4px] z-10 w-[calc(100%+4px)]"
                      )}
                    >
                      <span className="truncate leading-none">{label}</span>
                    </div>
                  );
                })}
              </div>

              <span className="w-6 sm:w-7 text-center text-xs font-bold text-muted-foreground shrink-0">{row}</span>
            </div>
          ))}
        </div>
      </div>

      <div className="mt-6 flex flex-wrap gap-x-5 gap-y-2 justify-center text-xs text-muted-foreground">
        <div className="flex items-center gap-1.5">
          <span className="w-4 h-4 rounded border bg-slate-200 border-slate-300 inline-block" />
          Ghế thường
        </div>
        <div className="flex items-center gap-1.5">
          <span className="w-4 h-4 rounded border bg-amber-200 border-amber-300 inline-block" />
          Ghế VIP
        </div>
        <div className="flex items-center gap-1.5">
          <span className="w-4 h-4 rounded border bg-rose-200 border-rose-300 inline-block" />
          Ghế đôi
        </div>
        <div className="flex items-center gap-1.5">
          <span className="w-4 h-4 rounded border bg-red-400 border-red-500 inline-block" />
          Đã bán
        </div>
        <div className="flex items-center gap-1.5">
          <span className="w-4 h-4 rounded border bg-orange-400 border-orange-500 inline-block" />
          Đặt trước
        </div>
        <div className="flex items-center gap-1.5">
          <span className="w-4 h-4 rounded border bg-slate-400 border-slate-500 inline-block" />
          Khóa
        </div>
      </div>
    </div>
  );
};
