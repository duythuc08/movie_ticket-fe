"use client";

import Image from "next/image";
import { Suspense, useEffect, useState } from "react";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import { CheckCircle2, Download, Home, Ticket } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { getOrderDetail } from "@/components/booking/service/order.service";
import type { OrderData, OrderExtraInfo } from "@/components/profile/types";

function PaymentSuccessContent() {
  const { id: pathId } = useParams<{ id: string }>();
  const searchParams = useSearchParams();
  const router = useRouter();

  const [orderData, setOrderData] = useState<OrderData | null>(null);
  const [extraInfo, setExtraInfo] = useState<OrderExtraInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const orderIdFromUrl = searchParams.get("orderId") || (pathId !== "momo" ? pathId : null);

  useEffect(() => {
    const loadData = async () => {
      const savedOrder = sessionStorage.getItem("pendingOrder");

      if (savedOrder) {
        try {
          const parsed = JSON.parse(savedOrder);
          setExtraInfo({
            movie: parsed.movie,
            moviePoster: parsed.moviePoster,
            format: parsed.format,
            cinema: parsed.cinema,
            roomName: parsed.roomName,
            date: parsed.date,
            time: parsed.time,
            paymentMethod: parsed.paymentMethod,
          });

          if (!orderIdFromUrl && parsed.orderId) {
            await loadOrderFromAPI(parsed.orderId);
            return;
          }
        } catch (e) {
          console.error("Error parsing localStorage:", e);
        }
      }

      if (!orderIdFromUrl) {
        setError("Không tìm thấy mã đơn hàng");
        setLoading(false);
        return;
      }

      await loadOrderFromAPI(orderIdFromUrl);
    };

    const loadOrderFromAPI = async (orderId: string) => {
      try {
        const token = sessionStorage.getItem("token") ?? "";
        const data = await getOrderDetail(orderId, token);
        setOrderData(data);
      } catch (err) {
        setError((err as Error).message);
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [orderIdFromUrl]);

  const formatCurrency = (amount?: number) =>
    new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND" }).format(amount || 0);

  const formatDate = (dateString?: string) => {
    if (!dateString) return "---";
    return new Date(dateString).toLocaleDateString("vi-VN", {
      weekday: "long",
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const getSeatList = () => {
    if (!orderData?.tickets || orderData.tickets.length === 0) return "---";
    return orderData.tickets.map((t) => t.seatName).join(", ");
  };

  const getTicketSummary = () => {
    if (!orderData?.tickets || orderData.tickets.length === 0) {
      return [{ seatType: "Ghế", count: 1, totalPrice: orderData?.totalTicketPrice || 0 }];
    }
    const grouped = orderData.tickets.reduce<Record<string, { seatType: string; count: number; totalPrice: number }>>((acc, ticket) => {
      const type = ticket.seatType || "STANDARD";
      if (!acc[type]) acc[type] = { seatType: type, count: 0, totalPrice: 0 };
      acc[type].count += 1;
      acc[type].totalPrice += ticket.price || 0;
      return acc;
    }, {});
    return Object.values(grouped);
  };

  if (loading) {
    return (
      <main className="w-full max-w-6xl mx-auto px-4 py-16">
        <div className="flex flex-col items-center gap-4 mb-12">
          <Skeleton className="w-20 h-20 rounded-full" />
          <Skeleton className="h-8 w-80 rounded-xl" />
          <Skeleton className="h-5 w-64 rounded-xl" />
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <Skeleton className="h-80 rounded-2xl" />
          <div className="lg:col-span-2 space-y-4">
            <Skeleton className="h-48 rounded-2xl" />
            <Skeleton className="h-56 rounded-2xl" />
          </div>
        </div>
      </main>
    );
  }

  if (error || !orderData) {
    return (
      <main className="w-full max-w-6xl mx-auto px-4 py-16 text-center">
        <p className="text-destructive text-xl mb-2 font-bold">Lỗi!</p>
        <p className="text-muted-foreground text-base mb-6">{error || "Không tìm thấy thông tin đơn hàng"}</p>
        <Button onClick={() => router.push("/")} className="gap-2">
          <Home className="w-4 h-4" /> Về trang chủ
        </Button>
      </main>
    );
  }

  const ticketSummary = getTicketSummary();

  return (
    <main className="w-full max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-10 md:py-16">
      <div className="flex flex-col gap-8">
        <div className="flex flex-col gap-3 text-center">
          <div className="flex justify-center mb-2">
            <div className="w-20 h-20 rounded-full bg-emerald-500/15 border-2 border-emerald-500/30 flex items-center justify-center">
              <CheckCircle2 className="w-12 h-12 text-emerald-500" />
            </div>
          </div>
          <h1 className="text-foreground text-3xl md:text-4xl font-black leading-tight">
            Đặt vé thành công!
          </h1>
          <p className="text-muted-foreground text-sm">
            Mã đơn hàng:{" "}
            <span className="font-bold text-yellow-500">#{orderData.orderId}</span>
            {" "}– Thông tin đã được gửi đến email của bạn.
          </p>
        </div>


        {/* Boarding Pass Ticket UI */}
        <div className="relative mx-auto w-full max-w-4xl flex flex-col md:flex-row bg-card rounded-3xl overflow-hidden shadow-2xl border border-border mt-4">
          
          {/* Left part: Movie Details */}
          <div className="flex-1 p-8 md:border-r-[3px] md:border-dashed border-border relative">
            {/* Notches for the ticket visual */}
            <div className="hidden md:block absolute -right-5 top-[-24px] w-10 h-10 rounded-full bg-background shadow-[inset_0_-2px_4px_rgba(0,0,0,0.1)] z-10" />
            <div className="hidden md:block absolute -right-5 bottom-[-24px] w-10 h-10 rounded-full bg-background shadow-[inset_0_2px_4px_rgba(0,0,0,0.1)] z-10" />

            <div className="flex items-center justify-between mb-8">
              <div className="flex items-center gap-4">
                <div className="bg-primary/15 text-primary p-3 rounded-2xl shadow-inner">
                  <Ticket className="w-8 h-8" />
                </div>
                <div>
                  <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest">Boarding Pass</p>
                  <h2 className="text-2xl font-black text-foreground tracking-tight">INFINITY CINEMA</h2>
                </div>
              </div>
              <div className="text-right hidden sm:block">
                 <p className="text-xs text-muted-foreground uppercase mb-1">Thanh toán qua</p>
                 <p className="font-bold text-sm text-foreground">{extraInfo?.paymentMethod || "VNPAY"}</p>
              </div>
            </div>

            <div className="flex gap-6 items-start mb-8 pb-8 border-b border-border">
              {extraInfo?.moviePoster ? (
                <Image src={extraInfo.moviePoster} alt="poster" width={96} height={144} className="rounded-xl shadow-lg border border-border" />
              ) : (
                <div className="w-24 h-36 bg-muted rounded-xl flex items-center justify-center border border-border">
                   <Ticket className="w-8 h-8 text-muted-foreground/50" />
                </div>
              )}
              <div className="flex flex-col justify-center py-2">
                <h3 className="text-2xl font-black uppercase tracking-tight text-foreground line-clamp-2">{extraInfo?.movie || "---"}</h3>
                <span className="inline-block mt-2 px-3 py-1 bg-muted text-muted-foreground text-xs font-bold rounded-full w-fit">
                  {extraInfo?.format || "2D"}
                </span>
                <p className="text-sm mt-4 text-foreground/80"><span className="text-muted-foreground">Khách hàng:</span> <span className="font-bold text-foreground">{orderData.fullName}</span></p>
                <p className="text-sm mt-1 text-foreground/80"><span className="text-muted-foreground">Ngày mua:</span> <span className="font-medium text-foreground">{formatDate(orderData.bookingTime)}</span></p>
              </div>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
              <div>
                <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1">Ngày chiếu</p>
                <p className="font-bold text-base text-foreground">{extraInfo?.date || "---"}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1">Giờ chiếu</p>
                <p className="font-black text-lg text-primary">{extraInfo?.time || "---"}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1">Rạp</p>
                <p className="font-bold text-base text-foreground">{extraInfo?.cinema || "---"}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1">Phòng chiếu</p>
                <p className="font-bold text-base text-foreground">{extraInfo?.roomName || "---"}</p>
              </div>
            </div>

            <div className="mt-8 pt-8 border-t border-border flex justify-between items-center">
              <div>
                <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1">Ghế ngồi</p>
                <p className="text-2xl font-black tracking-widest text-primary break-all">{getSeatList()}</p>
              </div>
              <Button className="hidden sm:flex gap-2 hover:-translate-y-0.5 transition-all shadow-lg rounded-xl h-12 px-6">
                <Download className="w-4 h-4" /> Lưu vé
              </Button>
            </div>
          </div>

          {/* Right part: QR and Price */}
          <div className="w-full md:w-80 bg-muted/20 p-8 flex flex-col justify-center items-center relative">
            <div className="text-center mb-8 w-full border-b border-border/50 pb-6">
              <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1">Mã đơn hàng</p>
              <p className="font-mono font-black text-xl text-foreground tracking-widest">#{orderData.orderId}</p>
            </div>
            
            <div className="bg-white p-4 rounded-2xl shadow-md border border-border mb-8 inline-block transform hover:scale-105 transition-transform duration-300">
              <img
                alt={`QR Code`}
                className="w-40 h-40 object-contain"
                src={
                  orderData.qrCode?.startsWith("data:image")
                    ? orderData.qrCode
                    : `https://api.qrserver.com/v1/create-qr-code/?size=250x250&data=${encodeURIComponent(orderData.qrCode || orderData.orderId)}`
                }
              />
            </div>

            <div className="w-full text-center mb-6">
               <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1">Tổng thanh toán</p>
               <p className="font-black text-3xl text-yellow-500">{formatCurrency(orderData.finalPrice)}</p>
            </div>
            
            <p className="text-[10px] text-muted-foreground text-center uppercase tracking-widest leading-relaxed">
              Vui lòng đưa mã QR này<br/>cho nhân viên soát vé
            </p>
          </div>
        </div>

        {/* Action Buttons Container */}
        <div className="w-full max-w-4xl mx-auto flex flex-col sm:flex-row gap-4 mt-2">
          <Button
            onClick={() => { sessionStorage.removeItem("pendingOrder"); router.push("/"); }}
            variant="outline"
            className="flex-1 gap-2 hover:-translate-y-0.5 transition-all h-12 rounded-xl text-base"
          >
            <Home className="w-5 h-5" /> Về trang chủ
          </Button>
          <Button
            onClick={() => { sessionStorage.removeItem("pendingOrder"); router.push("/profile"); }}
            className="flex-1 gap-2 hover:-translate-y-0.5 shadow-lg shadow-primary/30 transition-all h-12 rounded-xl text-base"
          >
            <Ticket className="w-5 h-5" /> Xem tất cả vé của tôi
          </Button>
        </div>
      </div>
    </main>
  );
}

export default function PaymentSuccessPage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <PaymentSuccessContent />
    </Suspense>
  );
}
