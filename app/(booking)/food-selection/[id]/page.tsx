"use client";

import { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import { Minus, Plus } from "lucide-react";
import { toast } from "sonner";
import { Skeleton } from "@/components/ui/skeleton";
import { getBookingState, mergeBookingState } from "@/components/booking/utils/bookingStorage";
import { getFoods } from "@/components/booking/service/booking.service";
import { useBookingTimer } from "@/components/booking/hooks/use-booking-timer";
import type { FoodProduct, FoodDetail } from "@/types";
import { FoodMenuItem } from "@/components/booking/components/FoodMenuItem";
import { BookingSummary } from "@/components/booking/components/BookingSummary";

export default function FoodSelectionPage() {
  const router = useRouter();
  const { id } = useParams<{ id: string }>();

  const [cart, setCart] = useState<Record<number, number>>({});
  const [products, setProducts] = useState<FoodProduct[]>([]);
  const [loadingProducts, setLoadingProducts] = useState(true);

  const { minutes, seconds, progress, isUrgent } = useBookingTimer();

  const bookingInfo = getBookingState();

  // Fetch foods
  useEffect(() => {
    const token = sessionStorage.getItem("token") ?? "";
    const cinemaId = bookingInfo?.cinemaId;

    if (!cinemaId) {
      setLoadingProducts(false);
      return;
    }

    getFoods(token, cinemaId)
      .then((data) => {
        setProducts(data);
        setLoadingProducts(false);
      })
      .catch((error) => {
        console.error("Lỗi tải món ăn:", error);
        toast.error("Không thể tải danh sách đồ ăn. Vui lòng thử lại.");
        setLoadingProducts(false);
      });
  }, []);

  const updateQuantity = (productId: number, delta: number) => {
    setCart((prev) => {
      const newQty = (prev[productId] || 0) + delta;
      if (newQty <= 0) {
        const { [productId]: _, ...rest } = prev;
        return rest;
      }
      return { ...prev, [productId]: newQty };
    });
  };



  const foodTotal = Object.entries(cart).reduce((sum, [pid, qty]) => {
    const product = products.find((p) => p.id === Number(pid));
    return sum + (product ? product.price * qty : 0);
  }, 0);

  const grandTotal = foodTotal + (bookingInfo?.seatTotal || 0);

  const groupedSeats = (bookingInfo?.seats || []).reduce<
    Record<string, { seatType: string; price: number; count: number; totalPrice: number }>
  >((acc, seat) => {
    const type = seat.seatType;
    if (!acc[type]) acc[type] = { seatType: type, price: seat.price, count: 0, totalPrice: 0 };
    acc[type].count += 1;
    acc[type].totalPrice += seat.price;
    return acc;
  }, {});

  const handleProceedToCheckout = () => {
    if (!bookingInfo?.seats || bookingInfo.seats.length === 0) return;

    const selectedFoods: FoodDetail[] = Object.entries(cart).map(([pid, qty]) => {
      const product = products.find((p) => p.id === Number(pid))!;
      return {
        id: product.id,
        foodId: product.id,
        name: product.name,
        desc: product.desc,
        price: product.price,
        img: product.img,
        qty,
        totalPrice: product.price * qty,
        isCombo: product.isCombo,
      };
    });

    mergeBookingState({
      foods: selectedFoods,
      foodTotal,
      total: (bookingInfo.seatTotal || 0) + foodTotal,
      orderId: id,
    });

    router.push(`/payment/${id}`);
  };

  return (
    <div className="min-h-screen bg-background text-foreground pt-6 sm:pt-8 pb-8 px-4">
      <div className="max-w-5xl lg:max-w-[1200px] mx-auto grid grid-cols-1 gap-8 lg:grid-cols-[minmax(0,2fr)_minmax(0,1fr)]">

        {/* Left: Products */}
        <div>
          <div className="flex items-center gap-3 mb-6">
            <div className="w-1 h-6 bg-primary rounded-full" />
            <h1 className="text-2xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-foreground to-foreground/60">
              Chọn Combo / Sản phẩm
            </h1>
          </div>

          <div className="flex flex-col gap-3">
            {loadingProducts ? (
              [...Array(4)].map((_, i) => (
                <div key={i} className="flex items-center gap-4 p-4 bg-card rounded-2xl border border-border">
                  <Skeleton className="w-24 h-24 rounded-xl flex-shrink-0" />
                  <div className="flex-1 space-y-2">
                    <Skeleton className="h-5 w-3/4 rounded-lg" />
                    <Skeleton className="h-4 w-full rounded-lg" />
                    <Skeleton className="h-5 w-24 rounded-lg" />
                  </div>
                </div>
              ))
            ) : products.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground border border-dashed border-border rounded-2xl">
                <p>Không có sản phẩm nào.</p>
              </div>
            ) : (
              products.map((p) => (
                <FoodMenuItem
                  key={p.id}
                  product={p}
                  quantity={cart[p.id] || 0}
                  onUpdateQuantity={updateQuantity}
                />
              ))
            )}
          </div>
        </div>

        {/* Right: Order Summary */}
        <div>
          <div className="sticky top-20">
            {/* Countdown timer */}
            <div className="mb-4 bg-card/80 backdrop-blur-sm border border-border rounded-2xl p-4">
              <div className="text-center">
                <p className="text-xs text-muted-foreground mb-1">Thời gian đặt vé</p>
                <div className={`text-3xl font-black  ${isUrgent ? "text-destructive animate-pulse" : "text-primary"}`}>
                  {minutes}:{seconds}
                </div>
              </div>
              <div className="mt-3 w-full h-1.5 bg-muted rounded-full overflow-hidden">
                <div
                  className={`h-full transition-[width] duration-300 rounded-full ${isUrgent ? "bg-destructive" : "bg-primary"}`}
                  style={{ width: `${progress}%` }}
                />
              </div>
            </div>

            {/* Summary card */}
            <BookingSummary
              bookingInfo={bookingInfo}
              groupedSeats={groupedSeats}
              cart={cart}
              products={products}
              grandTotal={grandTotal}
              onBack={() => router.back()}
              onProceed={handleProceedToCheckout}
              backText="Quay lại"
              proceedText="Thanh toán"
            />
          </div>
        </div>
      </div>
    </div>
  );
}
