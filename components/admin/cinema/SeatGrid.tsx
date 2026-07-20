"use client";

import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuItem,
  DropdownMenuSub,
  DropdownMenuSubTrigger,
  DropdownMenuSubContent,
  DropdownMenuPortal,
} from "@/components/ui/dropdown-menu";

import { cn } from "@/lib/utils";
import type { AdminSeat, SeatType, SeatStatus } from "@/types/admin.type";

const SEAT_TYPE_CLASSES: Record<SeatType, string> = {
  STANDARD: "bg-slate-200 hover:bg-slate-300 border border-slate-300 text-slate-700",
  VIP: "bg-amber-200 hover:bg-amber-300 border border-amber-300 text-amber-800",
  COUPLE: "bg-rose-200 hover:bg-rose-300 border border-rose-300 text-rose-800",
  AISLE: "",
};

const SEAT_STATUS_CLASSES: Record<SeatStatus, string> = {
  NORMAL: "",
  BROKEN: "bg-slate-300/60 border-dashed border-slate-400/60 opacity-60 text-muted-foreground/60",
  MAINTENANCE: "bg-slate-300/60 border-dashed border-slate-400/60 opacity-60 text-muted-foreground/60",
};

interface SeatGridProps {
  seats: AdminSeat[];
  onSeatAction?: (seat: AdminSeat, actionType: "CHANGE_STATUS" | "TOGGLE_ENTITY", newStatus?: SeatStatus) => void;
  isLoading?: boolean;
}

export function SeatGrid({ seats, onSeatAction, isLoading }: SeatGridProps) {
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

  const allRowLabels: string[] = [];
  if (sortedRows.length > 0) {
    const first = sortedRows[0][0];
    const last = sortedRows[sortedRows.length - 1][0];
    for (let i = first.charCodeAt(0); i <= last.charCodeAt(0); i++) {
      allRowLabels.push(String.fromCharCode(i));
    }
  }

  return (
    <div className="overflow-x-auto w-full">
      <div className="w-max mx-auto flex flex-col gap-1.5 pb-8 relative">
        <div className="mb-8 w-full max-w-xl mx-auto border-t-[6px] border-primary/40 rounded-t-[50%] text-center pt-2">
          <span className="text-xs font-semibold text-muted-foreground uppercase tracking-widest">
            Màn hình
          </span>
        </div>
        {allRowLabels.map((rowLabel) => {
          const rowSeats = rowMap.get(rowLabel) ?? [];
          const isAisleRow = rowSeats.length === 0 || rowSeats.every(s => s.seatType === "AISLE");
          if (isAisleRow) {
            return (
              <div key={rowLabel} className="flex items-center gap-1" style={{ height: "2rem" }}>
                <span className="w-6 shrink-0 text-center text-xs font-semibold text-muted-foreground/40">{rowLabel}</span>
                <div className="flex-1 border-t border-dashed border-muted-foreground/20 mx-1" />
              </div>
            );
          }
          return (
          <div key={rowLabel} className="flex items-center gap-1">
            <span className="w-6 shrink-0 text-center text-xs font-semibold text-muted-foreground">
              {rowLabel}
            </span>
            <div
              className="grid gap-1"
              style={{ gridTemplateColumns: `repeat(${maxCol}, minmax(0, 1fr))` }}
            >
              {rowSeats.map((seat, index) => {
                if (seat.seatType === "AISLE") {
                  return (
                    <div
                      key={seat.seatId}
                      style={{ gridColumn: seat.seatNumber }}
                      className="h-8 w-8"
                    />
                  );
                }
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

                const seatElement = (
                  <button
                    key={seat.seatId}
                    type="button"
                    title={`${seat.seatRow}${seat.seatNumber} — ${seat.seatType}${isInactive ? " (Vô hiệu)" : ""}${seat.seatStatus !== "NORMAL" ? ` — ${seat.seatStatus}` : ""}\nSCORE: ${seat.viewQuanlityScore}`}
                    style={{ gridColumn: seat.seatNumber }}
                    className={cn(
                      "h-8 w-8 border text-[10px] font-semibold transition-all flex items-center justify-center",
                      isInactive
                        ? "bg-slate-300/60 border-dashed border-slate-400/60 opacity-60 text-muted-foreground/60"
                        : statusClass || typeClass,
                      coupleClass,
                      onSeatAction ? "cursor-pointer" : "cursor-default"
                    )}
                  >
                    {seat.seatRow}{seat.seatNumber}
                  </button>
                );

                if (!onSeatAction) return seatElement;

                return (
                  <DropdownMenu key={seat.seatId}>
                    <DropdownMenuTrigger asChild>
                      {seatElement}
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="center" data-admin="">
                      <DropdownMenuLabel>Ghế {seat.seatRow}{seat.seatNumber}</DropdownMenuLabel>
                      <DropdownMenuSeparator />
                      <DropdownMenuSub>
                        <DropdownMenuSubTrigger>({seat.seatStatus})</DropdownMenuSubTrigger>
                        <DropdownMenuPortal>
                          <DropdownMenuSubContent data-admin="">
                            <DropdownMenuItem onClick={() => onSeatAction(seat, "CHANGE_STATUS", "NORMAL")} disabled={seat.seatStatus === "NORMAL"}>
                              Bình thường
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => onSeatAction(seat, "CHANGE_STATUS", "BROKEN")} disabled={seat.seatStatus === "BROKEN"}>
                              Hỏng
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => onSeatAction(seat, "CHANGE_STATUS", "MAINTENANCE")} disabled={seat.seatStatus === "MAINTENANCE"}>
                              Bảo trì
                            </DropdownMenuItem>
                          </DropdownMenuSubContent>
                        </DropdownMenuPortal>
                      </DropdownMenuSub>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem onClick={() => onSeatAction(seat, "TOGGLE_ENTITY")}>
                        {isInactive ? "Kích hoạt" : "Vô hiệu hóa"}
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                );
              })}
            </div>
            <span className="w-6 shrink-0 ml-1 opacity-0 pointer-events-none" />
          </div>
          );
        })}

        <div className="mt-3 flex flex-wrap justify-center gap-4 border-t pt-4">
          {(["STANDARD", "VIP", "COUPLE"] as SeatType[]).map((type) => {
            const classes = SEAT_TYPE_CLASSES[type];
            return (
              <span key={type} className="flex items-center gap-1.5 text-xs text-muted-foreground">
                <span className={cn("h-4 w-4", classes.split(" ").filter(c => c.startsWith("bg-") || c.startsWith("border-")).slice(0, 2).join(" "))} />
                {type === "STANDARD" ? "Thường" : type === "VIP" ? "VIP" : "Đôi"}
              </span>
            );
          })}
          <span className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <span className="h-4 w-4 bg-slate-300/60 border border-dashed border-slate-400/60 opacity-60 flex items-center justify-center text-[8px] text-muted-foreground/60">✕</span>
            Vô hiệu/Hỏng
          </span>
        </div>
      </div>
    </div>
  );
}
