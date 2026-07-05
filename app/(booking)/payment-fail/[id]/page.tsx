"use client";

import { Suspense, useState } from "react";
import { useRouter, useSearchParams, useParams } from "next/navigation";
import { XCircle, Home, RefreshCcw, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/context/AuthContext";
import type { AttemptedOrderInfo } from "@/components/profile/types";

function PaymentFailContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { id } = useParams<{ id: string }>();
  const { token } = useAuth();
  const [isRetrying, setIsRetrying] = useState(false);
  const [attemptedInfo] = useState<AttemptedOrderInfo | null>(() => {
    if (typeof window === "undefined") return null;
    const saved = sessionStorage.getItem("pendingOrder");
    if (!saved) return null;
    try {
      return JSON.parse(saved) as AttemptedOrderInfo;
    } catch {
      return null;
    }
  });

  const responseCode = searchParams.get("vnp_ResponseCode");
  const errorMessageParam = searchParams.get("error_message");

  const formatCurrency = (amount?: number) =>
    new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND" }).format(amount || 0);

  const getErrorMessage = () => {
    if (errorMessageParam) return decodeURIComponent(errorMessageParam);
    if (responseCode === "24") return "Giao dịch bị hủy bởi khách hàng.";
    if (responseCode === "51") return "Tài khoản của quý khách không đủ số dư.";
    if (responseCode) return `Mã lỗi từ cổng thanh toán: ${responseCode}`;
    return "Đã có lỗi xảy ra trong quá trình xử lý thanh toán.";
  };

  const handleGoHome = () => {
    sessionStorage.removeItem("pendingOrder");
    router.push("/");
  };

  const handleRetry = async () => {
    if (attemptedInfo?.paymentMethod === "MOMO" && id) {
      setIsRetrying(true);
      try {
        const res = await fetch(`/api-proxy/payment/momo/retry?orderId=${id}`, {
          method: "POST",
          headers: token ? { Authorization: `Bearer ${token}` } : {},
        });
        if (!res.ok) throw new Error();
        const data = await res.json();
        const payUrl = data.result as string;
        window.location.href = payUrl;
      } catch {
        setIsRetrying(false);
      }
      return;
    }
    router.back();
  };

  return (
    <main className="w-full max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-10 md:py-20">
      <div className="flex flex-col gap-10 items-center">
        <div className="flex flex-col gap-4 text-center items-center max-w-2xl">
          <div className="w-24 h-24 rounded-full bg-red-500/10 border-2 border-red-500/30 flex items-center justify-center mb-2">
            <XCircle className="w-14 h-14 text-red-500" />
          </div>

          <h1 className="text-foreground text-3xl md:text-4xl font-black leading-tight">
            Thanh toán thất bại!
          </h1>
          <p className="text-muted-foreground text-base leading-relaxed">
            Rất tiếc, giao dịch của bạn chưa được hoàn tất. Vui lòng kiểm tra lại thông tin hoặc thử phương thức thanh toán khác.
          </p>

          <div className="mt-2 bg-destructive/10 border border-destructive/30 p-4 rounded-2xl flex items-start gap-3 text-left w-full">
            <AlertCircle className="w-5 h-5 text-destructive shrink-0 mt-0.5" />
            <div>
              <p className="text-destructive font-semibold text-sm">Chi tiết lỗi:</p>
              <p className="text-muted-foreground text-sm mt-0.5">{getErrorMessage()}</p>
            </div>
          </div>
        </div>

        {attemptedInfo && (
          <div className="w-full bg-card border border-border rounded-2xl p-6 shadow-lg shadow-black/10">
            <h3 className="text-foreground text-base font-bold mb-5">Thông tin giao dịch chưa hoàn tất</h3>

            <div className="flex flex-col md:flex-row gap-5 border-b border-border pb-5 mb-5">
              {attemptedInfo.moviePoster && (
                <img
                  src={attemptedInfo.moviePoster}
                  alt={attemptedInfo.movie}
                  className="w-16 h-24 object-cover rounded-xl border border-border shadow-md hidden sm:block flex-shrink-0"
                />
              )}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 flex-1">
                <div>
                  <p className="text-muted-foreground text-xs mb-1">Phim</p>
                  <p className="text-foreground font-semibold text-sm">{attemptedInfo.movie || "---"}</p>
                </div>
                <div>
                  <p className="text-muted-foreground text-xs mb-1">Rạp chiếu</p>
                  <p className="text-foreground font-semibold text-sm">{attemptedInfo.cinema} – {attemptedInfo.roomName}</p>
                </div>
                <div>
                  <p className="text-muted-foreground text-xs mb-1">Suất chiếu</p>
                  <p className="text-foreground font-semibold text-sm">{attemptedInfo.time} – {attemptedInfo.date}</p>
                </div>
              </div>
            </div>

            <div className="flex justify-between items-center">
              <div>
                <p className="text-muted-foreground text-xs mb-1">Phương thức</p>
                <p className="text-foreground font-semibold text-sm">{attemptedInfo.paymentMethod || "---"}</p>
              </div>
              <div className="text-right">
                <p className="text-muted-foreground text-xs mb-1">Tổng tiền cần thanh toán</p>
                <p className="text-yellow-500 font-black text-2xl">
                  {formatCurrency(attemptedInfo.finalPrice || attemptedInfo.totalAmount)}
                </p>
              </div>
            </div>
          </div>
        )}

        <div className="flex flex-col sm:flex-row gap-4 w-full max-w-md">
          <Button
            onClick={handleGoHome}
            variant="outline"
            size="lg"
            className="flex-1 gap-2 hover:-translate-y-0.5 transition-all"
          >
            <Home className="w-5 h-5" />
            Về trang chủ
          </Button>
          <Button
            onClick={handleRetry}
            disabled={isRetrying}
            size="lg"
            className="flex-1 gap-2 bg-primary hover:bg-primary/90 shadow-lg shadow-primary/30 hover:-translate-y-0.5 transition-all"
          >
            <RefreshCcw className={`w-5 h-5 ${isRetrying ? "animate-spin" : ""}`} />
            {isRetrying ? "Đang xử lý..." : "Thử thanh toán lại"}
          </Button>
        </div>

        <p className="text-muted-foreground text-sm text-center">
          Nếu bạn cho rằng đây là lỗi hệ thống và đã bị trừ tiền, vui lòng liên hệ bộ phận CSKH.
        </p>
      </div>
    </main>
  );
}

export default function PaymentFailPage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <PaymentFailContent />
    </Suspense>
  );
}
