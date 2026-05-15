import { SEAT_STYLES } from "@/components/booking/constants/booking.constants";
import { formatCurrency } from "@/components/booking/utils/booking.utils";

interface SeatLegendProps {
  seatPrices: Record<string, number>;
}

export function SeatLegend({ seatPrices }: SeatLegendProps) {
  return (
    <div className="flex flex-wrap justify-center gap-3 sm:gap-5 py-4 px-5 bg-muted/40 rounded-2xl border border-border mb-6">
      {Object.entries(SEAT_STYLES)
        .filter(([type]) => type !== "DEFAULT")
        .map(([type, cfg]) => {
          const price = seatPrices[type] || 0;
          return (
            <div key={type} className="flex items-center gap-2">
              <div className={`w-7 h-7 rounded-t-lg flex-shrink-0 ${cfg.legend}`} />
              <span className="text-xs text-muted-foreground whitespace-nowrap">
                {cfg.label}
                {price > 0 && (
                  <span className="ml-1 font-medium text-foreground">
                    {formatCurrency(price)}
                  </span>
                )}
              </span>
            </div>
          );
        })}

      <div className="flex items-center gap-2">
        <div className="w-7 h-7 rounded-t-lg bg-primary shadow-[0_0_8px_2px] shadow-primary/40 flex-shrink-0" />
        <span className="text-xs text-muted-foreground">Đang chọn</span>
      </div>
      
      <div className="flex items-center gap-2">
        <div className="w-7 h-7 rounded-t-lg bg-slate-300/60 dark:bg-slate-700/50 border border-dashed border-slate-400/60 dark:border-slate-600/60 flex items-center justify-center flex-shrink-0">
          <span className="text-[8px] text-muted-foreground/60">✕</span>
        </div>
        <span className="text-xs text-muted-foreground">Đã đặt</span>
      </div>
    </div>
  );
}
