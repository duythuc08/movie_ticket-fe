import { useState } from "react";
import { cn } from "@/lib/utils";
import { SEAT_STYLES } from "@/components/booking/constants/booking.constants";
import { formatCurrency, seatLabel } from "@/components/booking/utils/booking.utils";
import type { SeatShowTime, SuggestedSeat } from "@/types";

interface SeatMapProps {
  seatData: Record<string, SeatShowTime[]>;
  seatPrices: Record<string, number>;
  selectedSeats: number[];
  suggestedSeats?: SuggestedSeat[];
  showSuggestions?: boolean;
  onToggleSeat: (seat: SeatShowTime) => void;
  isSeatOccupied: (seat: SeatShowTime) => boolean;
}

export function SeatMap({
  seatData,
  seatPrices,
  selectedSeats,
  suggestedSeats = [],
  showSuggestions = false,
  onToggleSeat,
  isSeatOccupied,
}: SeatMapProps) {
  const [hoveredCoupleId, setHoveredCoupleId] = useState<number | null>(null);

  const isSeatSelected = (seatId: number) => selectedSeats.includes(seatId);
  
  const isSuggested = (seat: SeatShowTime) =>
    showSuggestions &&
    suggestedSeats.some(
      (s) =>
        s.seatShowTimeId === seat.seatShowTimeId ||
        (s.seatRow === seat.seatRow && s.seatNumber === seat.seatNumber)
    );

  const presentRows = Object.keys(seatData).sort((a, b) => a.localeCompare(b));
  const rows: string[] = [];
  if (presentRows.length > 0) {
    const first = presentRows[0].charCodeAt(0);
    const last = presentRows[presentRows.length - 1].charCodeAt(0);
    for (let i = first; i <= last; i++) rows.push(String.fromCharCode(i));
  }

  let maxCol = 0;
  for (const row of rows) {
    for (const seat of seatData[row]) {
      if (seat.seatNumber > maxCol) maxCol = seat.seatNumber;
    }
  }

  const coupleLeftIds = new Set<number>();
  const coupleRightIds = new Set<number>();
  
  rows.forEach((rowLabel) => {
    const rowSeats = seatData[rowLabel];
    const couples = rowSeats.filter((s) => s.seatType === "COUPLE");
    for (let i = 0; i < couples.length - 1; i++) {
      if (couples[i + 1].seatNumber === couples[i].seatNumber + 1) {
        coupleLeftIds.add(couples[i].seatId);
        coupleRightIds.add(couples[i + 1].seatId);
        i++;
      }
    }
  });

  return (
    <div className="mb-8 overflow-x-auto pb-6 pt-2 px-2">
      <div className="w-fit mx-auto relative flex flex-col gap-1.5">
        {rows.map((rowLabel) => {
          const rowSeats = seatData[rowLabel];
          if (!rowSeats || rowSeats.length === 0) {
            return (
              <div key={rowLabel} className="flex items-center gap-1.5" style={{ height: "2rem" }}>
                <span className="w-6 sm:w-7 text-center text-xs font-bold text-muted-foreground/30 shrink-0 select-none">{rowLabel}</span>
                <div className="flex-1 border-t border-dashed border-muted-foreground/20 mx-1" />
                <span className="w-6 sm:w-7 shrink-0 select-none" />
              </div>
            );
          }
          return (
            <div key={rowLabel} className="flex items-center gap-1.5">
              <span className="w-6 sm:w-7 text-center text-xs font-bold text-muted-foreground flex-shrink-0 select-none">
                {rowLabel}
              </span>

              <div
                className="grid gap-1"
                style={{ gridTemplateColumns: `repeat(${maxCol}, 2.5rem)` }}
              >
                {rowSeats.map((seat, index) => {
                  const occupied = isSeatOccupied(seat);
                  const selected = isSeatSelected(seat.seatId);
                  const suggested = isSuggested(seat);
                  const style = SEAT_STYLES[seat.seatType] ?? SEAT_STYLES.DEFAULT;
                  const price = seatPrices[seat.seatType] || 0;
                  const isCouple = seat.seatType === "COUPLE";
                  const label = seatLabel(seat.seatRow, seat.seatNumber);

                  let coupleClass = "";
                  if (isCouple) {
                    const isLeftCouple = coupleLeftIds.has(seat.seatId);
                    const isRightCouple = coupleRightIds.has(seat.seatId);

                    if (isLeftCouple) {
                      coupleClass = "rounded-tl-lg rounded-tr-none border-r-0 mr-[-4px] z-10 w-[calc(100%+4px)]";
                    } else if (isRightCouple) {
                      coupleClass = "rounded-tr-lg rounded-tl-none border-l-0 ml-[-4px] z-10 w-[calc(100%+4px)]";
                    } else {
                      coupleClass = "rounded-t-lg";
                    }
                  } else {
                    coupleClass = "rounded-t-lg";
                  }

                  const isHoveredCouple = isCouple && hoveredCoupleId && (hoveredCoupleId === seat.seatId || hoveredCoupleId === seat.partnerId);

                  let seatClass = "";
                  if (occupied) {
                    seatClass =
                      "bg-slate-300/60 border border-dashed border-slate-400/60 cursor-not-allowed opacity-60";
                  } else if (selected) {
                    seatClass =
                      "bg-primary border border-primary/80 -translate-y-1 z-20 shadow-lg shadow-primary/40 cursor-pointer";
                  } else if (suggested) {
                    seatClass = `${style.idle} ${style.suggested} cursor-pointer z-10 ${isHoveredCouple ? '-translate-y-1 shadow-md z-20' : 'hover:-translate-y-1 hover:shadow-md hover:z-20'}`;
                  } else {
                    seatClass = `${style.idle} cursor-pointer ${isHoveredCouple ? '-translate-y-1 shadow-md z-20' : 'hover:-translate-y-1 hover:shadow-md hover:z-20'}`;
                  }

                  return (
                    <button
                      key={seat.seatId}
                      type="button"
                      style={{ gridColumn: seat.seatNumber }}
                      onClick={() => onToggleSeat(seat)}
                      onMouseEnter={() => {
                        if (isCouple) setHoveredCoupleId(seat.seatId);
                      }}
                      onMouseLeave={() => {
                        if (isCouple) setHoveredCoupleId(null);
                      }}
                      disabled={occupied}
                      title={`${label} – ${style.label}${price > 0 ? ` (${formatCurrency(price)})` : ""}`}
                      className={cn(
                        "relative flex flex-col items-center justify-center transition-all duration-150 select-none",
                        "w-10 h-10",
                        seatClass,
                        coupleClass
                      )}
                    >
                      <span
                        className={
                          occupied
                            ? "text-[9px] font-bold leading-none tracking-tight text-muted-foreground/60"
                            : selected
                            ? "text-[9px] font-bold leading-none tracking-tight text-primary-foreground"
                            : "text-[9px] font-bold leading-none tracking-tight text-[#663399]"
                        }
                      >
                        {label}
                      </span>

                      {isCouple && !occupied && (
                        <span
                          className={
                            selected
                              ? "text-[7px] leading-none mt-0.5 opacity-70 text-primary-foreground"
                              : "text-[7px] leading-none mt-0.5 opacity-60 text-[#663399]"
                          }
                        >
                          ♥
                        </span>
                      )}

                      {occupied && (
                        <span className="text-[8px] leading-none mt-0.5 text-muted-foreground/50">
                          ✕
                        </span>
                      )}

                      {suggested && !occupied && !selected && (
                        <span className="absolute -top-2 -left-2 text-xs text-yellow-400 animate-bounce drop-shadow-md">
                          ✨
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>

              <span className="w-6 sm:w-7 text-center text-xs font-bold text-muted-foreground flex-shrink-0 select-none">
                {rowLabel}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
