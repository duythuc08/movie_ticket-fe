import { SEAT_STYLES } from "@/components/booking/constants/booking.constants";
import { formatCurrency, seatLabel } from "@/components/booking/utils/booking.utils";
import type { SeatShowTime } from "@/types";

interface SeatMapProps {
  seatData: Record<string, SeatShowTime[]>;
  seatPrices: Record<string, number>;
  selectedSeats: number[];
  onToggleSeat: (seat: SeatShowTime) => void;
  isSeatOccupied: (seat: SeatShowTime) => boolean;
}

export function SeatMap({
  seatData,
  seatPrices,
  selectedSeats,
  onToggleSeat,
  isSeatOccupied,
}: SeatMapProps) {
  const isSeatSelected = (seatId: number) => selectedSeats.includes(seatId);
  const rows = Object.keys(seatData).sort();

  return (
    <div className="mb-8 overflow-x-auto pb-2">
      <div className="w-fit mx-auto">
        <div className="flex flex-col gap-1.5">
          {rows.map((row) => (
            <div key={row} className="flex items-center gap-1.5 sm:gap-2">
              <span className="w-7 text-center text-xs font-bold text-muted-foreground flex-shrink-0 select-none">
                {row}
              </span>

              <div className="flex gap-1 sm:gap-1.5">
                {seatData[row].map((seat) => {
                  const occupied = isSeatOccupied(seat);
                  const selected = isSeatSelected(seat.seatId);
                  const style = SEAT_STYLES[seat.seatType] ?? SEAT_STYLES.DEFAULT;
                  const price = seatPrices[seat.seatType] || 0;
                  const isCouple = seat.seatType === "COUPLE";
                  const label = seatLabel(seat.seatRow, seat.seatNumber);

                  let seatClass = "";
                  if (occupied) {
                    seatClass =
                      "bg-slate-300/60 dark:bg-slate-700/50 border border-dashed border-slate-400/60 dark:border-slate-600/60 cursor-not-allowed opacity-60";
                  } else if (selected) {
                    seatClass =
                      "bg-primary border-2 border-primary/80 -translate-y-1 z-10 shadow-lg shadow-primary/40 cursor-pointer";
                  } else {
                    seatClass = `${style.idle} cursor-pointer hover:-translate-y-1 hover:shadow-md hover:z-10`;
                  }

                  return (
                    <button
                      key={seat.seatId}
                      type="button"
                      onClick={() => onToggleSeat(seat)}
                      disabled={occupied}
                      title={`${label} – ${style.label}${price > 0 ? ` (${formatCurrency(price)})` : ""}`}
                      className={[
                        "relative flex flex-col items-center justify-center rounded-t-lg transition-all duration-150 select-none",
                        isCouple ? "w-11 sm:w-12 h-11 sm:h-12" : "w-10 sm:w-11 h-10 sm:h-11",
                        seatClass,
                        isCouple ? "rounded-none first:rounded-tl-lg last:rounded-tr-lg" : "",
                      ]
                        .filter(Boolean)
                        .join(" ")}
                    >
                      <span
                        className={
                          occupied
                            ? "text-[9px] sm:text-[10px] font-bold leading-none tracking-tight text-muted-foreground/60"
                            : selected
                            ? "text-[9px] sm:text-[10px] font-bold leading-none tracking-tight text-primary-foreground"
                            : "text-[9px] sm:text-[10px] font-bold leading-none tracking-tight text-[#663399] dark:text-violet-200"
                        }
                      >
                        {label}
                      </span>

                      {isCouple && !occupied && (
                        <span
                          className={
                            selected
                              ? "text-[7px] leading-none mt-0.5 opacity-70 text-primary-foreground"
                              : "text-[7px] leading-none mt-0.5 opacity-60 text-[#663399] dark:text-violet-500"
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
                    </button>
                  );
                })}
              </div>

              <span className="w-7 text-center text-xs font-bold text-muted-foreground flex-shrink-0 select-none">
                {row}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
