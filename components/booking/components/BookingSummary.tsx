import { formatCurrency } from "@/components/booking/utils/booking.utils";
import type { BookingState, FoodProduct } from "@/types";

interface BookingSummaryProps {
  bookingInfo: BookingState | null;
  groupedSeats: Record<string, { seatType: string; count: number; totalPrice: number }>;
  cart?: Record<number, number>;
  products?: FoodProduct[];
  grandTotal: number;
  onBack?: () => void;
  onProceed?: () => void;
  backText?: string;
  proceedText?: string;
  disableProceed?: boolean;
}

export function BookingSummary({
  bookingInfo,
  groupedSeats,
  cart = {},
  products = [],
  grandTotal,
  onBack,
  onProceed,
  backText = "Quay lại",
  proceedText = "Thanh toán",
  disableProceed = false,
}: BookingSummaryProps) {
  return (
    <div className="bg-card rounded-2xl p-5 border border-border shadow-xl shadow-black/10">
      <div className="flex mb-5 gap-3">
        {bookingInfo?.moviePoster && (
          <img
            src={bookingInfo.moviePoster}
            alt="Poster phim"
            className="w-20 h-28 rounded-xl object-cover flex-shrink-0 border border-border shadow-md"
          />
        )}
        <div className="min-w-0">
          <h3 className="text-base font-bold mb-1 text-card-foreground line-clamp-2">{bookingInfo?.movie}</h3>
          <p className="text-xs text-muted-foreground mb-1">{bookingInfo?.cinema}</p>
          <p className="text-xs text-muted-foreground">{bookingInfo?.roomName}</p>
          <p className="text-xs font-semibold text-foreground mt-1">{bookingInfo?.time}</p>
        </div>
      </div>

      <div className="border-t border-dashed border-border pt-4 mb-4">
        <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-2">Vé đã đặt</p>
        <p className="text-xs text-muted-foreground mb-2">
          Ghế: <span className="text-foreground font-medium">{(bookingInfo?.seats || []).map((s) => `${s.seatRow}${s.seatNumber}`).join(", ")}</span>
        </p>
        <div className="space-y-1.5">
          {Object.values(groupedSeats).map((g) => (
            <div key={g.seatType} className="flex justify-between text-sm">
              <span className="text-muted-foreground">{g.seatType} ×{g.count}</span>
              <span className="font-medium text-foreground">{formatCurrency(g.totalPrice)}</span>
            </div>
          ))}
        </div>
      </div>

      {Object.keys(cart).length > 0 && (
        <div className="mb-4">
          <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-2">Combo đã chọn</p>
          {Object.entries(cart).map(([pid, qty]) => {
            const product = products.find((p) => p.id === Number(pid));
            if (!product) return null;
            return (
              <div key={pid} className="flex justify-between items-center text-sm mb-1.5">
                <span className="flex-1 pr-2 text-muted-foreground">{qty}× {product.name}</span>
                <span className="whitespace-nowrap font-medium text-foreground">{formatCurrency(product.price * qty)}</span>
              </div>
            );
          })}
        </div>
      )}

      <div className="border-t border-dashed border-border pt-4 mb-5">
        <div className="flex justify-between items-center">
          <span className="font-bold text-base">Tổng cộng</span>
          <span className="text-primary font-black text-xl">{formatCurrency(grandTotal)}</span>
        </div>
      </div>

      <div className="flex gap-3">
        {onBack && (
          <button
            className="flex-1 py-3 rounded-xl font-semibold text-primary bg-transparent border-2 border-primary cursor-pointer transition-all hover:bg-primary/10 text-sm"
            onClick={onBack}
          >
            {backText}
          </button>
        )}
        {onProceed && (
          <button
            className="flex-1 py-3 rounded-xl font-semibold text-white bg-primary border-none cursor-pointer transition-all hover:bg-primary/90 hover:-translate-y-0.5 shadow-lg shadow-primary/30 text-sm disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:translate-y-0"
            onClick={onProceed}
            disabled={disableProceed}
          >
            {proceedText}
          </button>
        )}
      </div>
    </div>
  );
}
