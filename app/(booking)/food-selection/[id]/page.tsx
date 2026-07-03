"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter, useParams } from "next/navigation";
import { Minus, Plus } from "lucide-react";
import { toast } from "sonner";
import { Skeleton } from "@/components/ui/skeleton";
import { getBookingState, mergeBookingState, clearOrderData } from "@/components/booking/utils/bookingStorage";
import { getFoods, releaseBooking, addFoodsToBooking } from "@/components/booking/service/booking.service";
import { useBookingTimer, clearBookingTimer } from "@/components/booking/hooks/use-booking-timer";
import type { FoodProduct, FoodDetail } from "@/types";
import { FoodMenuItem } from "@/components/booking/components/FoodMenuItem";
import { BookingSummary } from "@/components/booking/components/BookingSummary";

export default function FoodSelectionPage() {
  const router = useRouter();
  const { id } = useParams<{ id: string }>();

  const [cart, setCart] = useState<Record<number, number>>({});
  const [products, setProducts] = useState<FoodProduct[]>([]);
  const [loadingProducts, setLoadingProducts] = useState(true);
  const [proceeding, setProceeding] = useState(false);

  const releasedRef = useRef(false);

  const { minutes, seconds, progress, isUrgent } = useBookingTimer();

  const bookingInfo = getBookingState();

  const unmountTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Khi component unmount (back, timer hết, đóng tab) mà chưa release → tự release.
  // keepalive: true đảm bảo request hoàn thành dù page đang unload.
  useEffect(() => {
    if (unmountTimeoutRef.current) {
      clearTimeout(unmountTimeoutRef.current);
      unmountTimeoutRef.current = null;
    }

    const release = () => {
      if (releasedRef.current) return;
      const token = sessionStorage.getItem("token") ?? "";
      const orderId = getBookingState()?.orderId;
      if (!orderId || !token) return;
      clearBookingTimer();
      clearOrderData();
      fetch(`/api-proxy/bookings/${orderId}/release`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
        keepalive: true,
      }).catch(() => {});
    };

    const handleBeforeUnload = () => {
      release();
    };

    window.addEventListener("beforeunload", handleBeforeUnload);

    return () => {
      window.removeEventListener("beforeunload", handleBeforeUnload);
      unmountTimeoutRef.current = setTimeout(() => {
        release();
      }, 300);
    };
  }, []);

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

  const handleBack = async () => {
    releasedRef.current = true;
    const token = sessionStorage.getItem("token") ?? "";
    const orderId = bookingInfo?.orderId;
    if (orderId && token) {
      await releaseBooking(token, Number(orderId)).catch(() => {});
    }
    clearBookingTimer();
    clearOrderData();
    router.back();
  };

  const handleProceedToCheckout = async () => {
    if (!bookingInfo?.seats || bookingInfo.seats.length === 0) return;
    if (proceeding) return;

    const token = sessionStorage.getItem("token") ?? "";
    const orderId = bookingInfo?.orderId;
    if (!orderId || !token) {
      toast.error("Phiên đặt vé không hợp lệ. Vui lòng bắt đầu lại.");
      router.push("/");
      return;
    }

    const foodsPayload = Object.entries(cart).map(([pid, qty]) => ({
      foodId: Number(pid),
      quantity: qty,
    }));

    releasedRef.current = true; // báo cleanup không release khi navigate sang payment
    setProceeding(true);
    try {
      await addFoodsToBooking(token, Number(orderId), foodsPayload);

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
      });

      router.push(`/payment/${id}`);
    } catch (err) {
      const error = err as Error;
      toast.error(error.message || "Không thể cập nhật đồ ăn. Vui lòng thử lại.");
    } finally {
      setProceeding(false);
    }
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
              onBack={handleBack}
              onProceed={handleProceedToCheckout}
              backText="Quay lại"
              proceedText={proceeding ? "Đang xử lý..." : "Thanh toán"}
              disableProceed={proceeding}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
