"use client";

import { setBookingTimer, useBookingTimer } from "@/components/booking/hooks/use-booking-timer";
import { ApiError, checkoutBooking, getApplicableVouchers, resumePayment } from "@/components/booking/service/booking.service";
import { formatCurrency } from "@/components/booking/utils/booking.utils";
import {
  getBookingState,
  mergeBookingState,
} from "@/components/booking/utils/bookingStorage";
import {
  VoucherSelectDialog,
  estimateVoucherDiscount,
} from "@/components/booking/VoucherSelectDialog";
import { fetchMembershipTierByName } from "@/components/profile/service/user.service";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { getErrorMessage } from "@/lib/errors";
import { userProfileService } from "@/services/userProfileService";
import type { BookingState, MembershipTier, UserVoucher } from "@/types";
import { Ticket } from "lucide-react";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";

export default function PaymentPage() {
  const router = useRouter();
  useParams<{ id: string }>();

  const [bookingInfo] = useState<BookingState | null>(() =>
    typeof window === "undefined" ? null : getBookingState()
  );

  const [paymentMethod, setPaymentMethod] = useState("MOMO");
  const [loading, setLoading] = useState(false);
  const { minutes, seconds, progress, isUrgent } = useBookingTimer();
  const [membershipData, setMembershipData] = useState<MembershipTier | null>(
    null,
  );
  const [isTierLoading, setIsTierLoading] = useState(true);

  // Voucher state
  const [appliedVoucher, setAppliedVoucher] = useState<UserVoucher | null>(null);
  const [manualCode, setManualCode] = useState<string>(() =>
    typeof window === "undefined" ? "" : (getBookingState()?.promotionCode ?? "")
  );
  const [isVoucherOpen, setIsVoucherOpen] = useState(false);
  const [voucherOptions, setVoucherOptions] = useState<UserVoucher[]>([]);
  const [isVoucherLoading, setIsVoucherLoading] = useState(false);
  const [isApplyingCode, setIsApplyingCode] = useState(false);

  // Fix hydration
  const [isMounted, setIsMounted] = useState(false);
  useEffect(() => {
    const timer = setTimeout(() => setIsMounted(true), 0);
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    if (!bookingInfo) {
      toast.error("Không có thông tin đặt vé. Vui lòng bắt đầu lại.");
      router.push("/");
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    const fetchTierInfo = async () => {
      try {
        const userStr = localStorage.getItem("user");
        if (!userStr) return;
        const storedUser = JSON.parse(userStr);
        const tierName = storedUser.memberShipTierName;
        const token = sessionStorage.getItem("token") ?? "";
        const tier = await fetchMembershipTierByName(token, tierName);
        if (tier) setMembershipData(tier);
      } catch (error) {
        console.error("Lỗi lấy thông tin hạng thẻ:", error);
      } finally {
        setIsTierLoading(false);
      }
    };
    fetchTierInfo();
  }, []);

  const discountInfo = useMemo(() => {
    const total = bookingInfo?.total || 0;
    if (!membershipData) return { amount: 0, label: "MEMBER" };

    let rate = membershipData.discountPercent || 0;
    let label = membershipData.name || "MEMBER";

    const now = new Date();
    const storedUser =
      typeof window !== "undefined"
        ? JSON.parse(localStorage.getItem("user") || "{}")
        : {};
    if (storedUser.birthday) {
      const birthDate = new Date(storedUser.birthday);
      if (birthDate.getMonth() === now.getMonth()) {
        rate = membershipData.birthdayDiscount || 0;
        label = "Sinh Nhật";
      }
    }

    const amount = total * (rate / 100);
    return { amount, label };
  }, [membershipData, bookingInfo]);

  // Ước tính giảm giá từ voucher (chỉ có khi chọn từ dialog, không có khi nhập tay)
  const voucherDiscount = appliedVoucher
    ? estimateVoucherDiscount(appliedVoucher, bookingInfo?.total || 0)
    : 0;

  const finalPrice = (bookingInfo?.total || 0) - discountInfo.amount - voucherDiscount;
  const checkoutEligibleAmount = Math.max(0, (bookingInfo?.total || 0) - discountInfo.amount);

  // ─── Voucher handlers ────────────────────────────────────────────────────────

  const handleSelectVoucher = (voucher: UserVoucher | null) => {
    setAppliedVoucher(voucher);
    const code = voucher?.code ?? "";
    setManualCode(code);
    mergeBookingState({ promotionCode: code || undefined });
  };

  const handleOpenVoucherDialog = async () => {
    const token = sessionStorage.getItem("token");
    if (!token) return;

    setIsVoucherLoading(true);
    try {
      const data = await getApplicableVouchers(token, bookingInfo?.movieId, checkoutEligibleAmount);
      setVoucherOptions(data);
      setIsVoucherOpen(true);
    } catch {
      toast.error("Không thể tải danh sách voucher");
    } finally {
      setIsVoucherLoading(false);
    }
  };

  const handleApplyManual = async () => {
    const code = manualCode.trim().toUpperCase();
    if (!code || isApplyingCode) return;

    const token = sessionStorage.getItem("token");
    if (!token) return;

    setIsApplyingCode(true);
    try {
      // Vừa lưu vừa áp dụng
      await userProfileService.claimPromotionByCode(token, code);
      toast.success(`Lưu và áp dụng mã "${code}" thành công`);

      // Fetch lại để lấy thông tin voucher mới nhất và tính toán discount
      const data = await getApplicableVouchers(token, bookingInfo?.movieId, checkoutEligibleAmount);
      const newlyClaimed = data.find((v) => v.code === code);
      if (newlyClaimed) {
        setAppliedVoucher(newlyClaimed);
      } else {
        setAppliedVoucher(null);
      }

      mergeBookingState({ promotionCode: code });
      setManualCode(code);
    } catch (err: unknown) {
      const errorCode = (err as { code?: number } | null)?.code;
      toast.error(getErrorMessage(errorCode, "Mã giảm giá không hợp lệ hoặc đã hết hạn."));
    } finally {
      setIsApplyingCode(false);
    }
  };

  const getUserId = () => {
    const token = sessionStorage.getItem("token");
    if (!token) return null;
    try {
      const payload = JSON.parse(atob(token.split(".")[1]));
      return payload.userId || payload.sub || payload.id;
    } catch {
      return null;
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    const token = sessionStorage.getItem("token") ?? "";
    const userId = getUserId();

    if (!userId) {
      toast.error("Phiên đăng nhập hết hạn. Vui lòng đăng nhập lại.");
      router.push("/login");
      setLoading(false);
      return;
    }

    if (paymentMethod === "VNPAY") {
      const orderId = bookingInfo?.orderId;
      if (!orderId) {
        toast.error("Phiên đặt vé không hợp lệ. Vui lòng bắt đầu lại.");
        router.push("/");
        setLoading(false);
        return;
      }
      try {
        const result = await checkoutBooking(
          token,
          Number(orderId),
          manualCode.trim() || undefined,
        );

        const orderData = {
          ...bookingInfo,
          orderId,
          finalPrice: result.finalPrice,
          discountAmount: result.discountAmount,
          memberDiscountAmount: result.memberDiscountAmount,
          paymentMethod: "VNPAY",
          expiredTime: result.expiredTime,
        };

        setBookingTimer(result.expiredTime);
        mergeBookingState({ expiredTime: result.expiredTime });
        sessionStorage.setItem("pendingOrder", JSON.stringify(orderData));
        window.location.href = result.paymentUrl;
      } catch (err) {
        if (err instanceof ApiError && err.code === 1088) {
          // Đơn đã IN_PROGRESS — lấy lại URL thanh toán
          try {
            const resumed = await resumePayment(token, Number(orderId));
            setBookingTimer(resumed.expiredTime);
            mergeBookingState({ expiredTime: resumed.expiredTime });
            sessionStorage.setItem("pendingOrder", JSON.stringify({
              ...bookingInfo,
              orderId,
              paymentMethod: "VNPAY",
              expiredTime: resumed.expiredTime,
            }));
            window.location.href = resumed.paymentUrl;
            return;
          } catch {
            toast.error("Không thể lấy lại trang thanh toán. Vui lòng thử lại.");
          }
        } else {
          toast.error((err as Error).message || "Tạo thanh toán thất bại. Vui lòng thử lại.");
        }
        setLoading(false);
      }
    }

    if (paymentMethod === "MOMO") {
      const orderId = bookingInfo?.orderId;
      if (!orderId) {
        toast.error("Phiên đặt vé không hợp lệ. Vui lòng bắt đầu lại.");
        router.push("/");
        setLoading(false);
        return;
      }
      try {
        const result = await checkoutBooking(
          token,
          Number(orderId),
          manualCode.trim() || undefined,
          "MOMO",
        );

        const orderData = {
          ...bookingInfo,
          orderId,
          finalPrice: result.finalPrice,
          discountAmount: result.discountAmount,
          memberDiscountAmount: result.memberDiscountAmount,
          paymentMethod: "MOMO",
          expiredTime: result.expiredTime,
        };

        setBookingTimer(result.expiredTime);
        mergeBookingState({ expiredTime: result.expiredTime });
        sessionStorage.setItem("pendingOrder", JSON.stringify(orderData));
        window.location.href = result.paymentUrl;
      } catch (err) {
        if (err instanceof ApiError && err.code === 1088) {
          // Đơn đã IN_PROGRESS — lấy lại URL thanh toán
          try {
            const resumed = await resumePayment(token, Number(orderId));
            setBookingTimer(resumed.expiredTime);
            mergeBookingState({ expiredTime: resumed.expiredTime });
            sessionStorage.setItem("pendingOrder", JSON.stringify({
              ...bookingInfo,
              orderId,
              paymentMethod: "MOMO",
              expiredTime: resumed.expiredTime,
            }));
            window.location.href = resumed.paymentUrl;
            return;
          } catch {
            toast.error("Không thể lấy lại trang thanh toán. Vui lòng thử lại.");
          }
        } else {
          toast.error((err as Error).message || "Tạo thanh toán MoMo thất bại. Vui lòng thử lại.");
        }
        setLoading(false);
      }
    }
  };

  const groupedSeats = (bookingInfo?.seats || []).reduce<
    Record<string, { seatType: string; count: number; totalPrice: number }>
  >((acc, seat) => {
    const type = seat.seatType;
    if (!acc[type]) acc[type] = { seatType: type, count: 0, totalPrice: 0 };
    acc[type].count += 1;
    acc[type].totalPrice += seat.price;
    return acc;
  }, {});

  if (!isMounted) {
    return null; // Tránh lỗi Hydration bằng cách không render nội dung SSR không khớp với CSR
  }

  return (
    <div className="min-h-screen pt-6 sm:pt-8 px-4 sm:px-6 lg:px-8 pb-12 bg-background">
      <div className="max-w-6xl mx-auto">
        <form onSubmit={handleSubmit} className="grid lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-6">
            <div className="bg-card border border-border rounded-2xl p-6 shadow-lg shadow-black/5">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-1 h-6 bg-primary rounded-full" />
                <h1 className="text-xl font-bold text-transparent bg-clip-text bg-linear-to-r from-foreground to-foreground/60">
                  Chọn Phương Thức Thanh Toán
                </h1>
              </div>

              <RadioGroup
                value={paymentMethod}
                onValueChange={setPaymentMethod}
                className="space-y-3"
              >
                <label
                  className={`flex items-center gap-4 p-5 rounded-2xl border-2 cursor-pointer transition-all duration-200 ${paymentMethod === "MOMO"
                      ? "border-[#d82d8b] bg-[#d82d8b]/8 shadow-lg shadow-[#d82d8b]/10"
                      : "border-border hover:border-[#d82d8b]/40 bg-secondary/30"
                    }`}
                >
                  <RadioGroupItem value="MOMO" id="pm1" />
                  <div className="flex-1">
                    <p className="text-base font-bold text-[#d82d8b]">MOMO</p>
                    <p className="text-sm text-muted-foreground">
                      Thanh toán qua ví MoMo
                    </p>
                  </div>
                  <div className="w-10 h-10 rounded-xl bg-[#d82d8b]/10 flex items-center justify-center">
                    <span className="text-lg font-black text-[#d82d8b]">M</span>
                  </div>
                </label>

                <label
                  className={`flex items-center gap-4 p-5 rounded-2xl border-2 cursor-pointer transition-all duration-200 ${paymentMethod === "VNPAY"
                      ? "border-[#0066b3] bg-[#0066b3]/8 shadow-lg shadow-[#0066b3]/10"
                      : "border-border hover:border-[#0066b3]/40 bg-secondary/30"
                    }`}
                >
                  <RadioGroupItem value="VNPAY" id="pm2" />
                  <div className="flex-1">
                    <p className="text-base font-bold text-[#0066b3]">VNPAY</p>
                    <p className="text-sm text-muted-foreground">
                      Thanh toán qua cổng VNPAY (ATM/QR)
                    </p>
                  </div>
                  <div className="w-10 h-10 rounded-xl bg-[#0066b3]/10 flex items-center justify-center">
                    <span className="text-lg font-black text-[#0066b3]">V</span>
                  </div>
                </label>
              </RadioGroup>
            </div>

            {/* ── Mã giảm giá ── */}
            <div className="bg-card border border-border rounded-2xl p-6 shadow-lg shadow-black/5">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-1 h-6 bg-primary rounded-full" />
                <h2 className="text-base font-bold">Mã giảm giá</h2>
              </div>

              {manualCode ? (
                <button
                  type="button"
                  onClick={() => setIsVoucherOpen(true)}
                  className="w-full flex items-center justify-between rounded-xl border border-primary/50 bg-primary/5 px-4 py-3 text-left hover:bg-primary/10 transition-colors cursor-pointer"
                >
                  <div>
                    <p className="text-xs text-muted-foreground mb-0.5">Đã áp dụng</p>
                    <code className="font-bold text-primary text-sm">{manualCode}</code>
                    {voucherDiscount > 0 && (
                      <p className="text-xs text-emerald-500 mt-0.5">
                        Tiết kiệm ~{formatCurrency(voucherDiscount)}
                      </p>
                    )}
                  </div>
                  <div className="text-xs text-primary hover:underline">
                    Nhấn để đổi
                  </div>
                </button>
              ) : (
                <div className="space-y-3">
                  <div className="flex gap-2">
                    <Input
                      value={manualCode}
                      onChange={(e) => setManualCode(e.target.value.toUpperCase())}
                      onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), handleApplyManual())}
                      placeholder="Nhập mã giảm giá..."
                      className="bg-background"
                    />
                    <Button
                      type="button"
                      variant="outline"
                      onClick={handleApplyManual}
                      disabled={!manualCode.trim() || isApplyingCode}
                      className="shrink-0"
                    >
                      {isApplyingCode ? "Đang áp dụng..." : "Áp dụng"}
                    </Button>
                  </div>
                  <button
                    type="button"
                    onClick={handleOpenVoucherDialog}
                    className="flex items-center gap-1.5 text-sm text-primary hover:underline"
                  >
                    <Ticket className="w-3.5 h-3.5" />
                    Chọn từ voucher của tôi
                  </button>
                </div>
              )}
            </div>
          </div>

          <div className="lg:col-span-1">
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

              <div className="bg-card/80 backdrop-blur-sm border border-border rounded-2xl p-5 shadow-xl shadow-black/10">
                <div className="flex mb-5 gap-3">
                  {bookingInfo?.moviePoster && (
                    <>
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={bookingInfo.moviePoster}
                        alt="Poster phim"
                        className="w-16 h-24 rounded-xl object-cover shrink-0 border border-border shadow-md"
                      />
                    </>
                  )}
                  <div className="min-w-0">
                    <h3 className="text-sm font-bold leading-tight text-card-foreground line-clamp-2 mb-1">
                      {bookingInfo?.movie}
                    </h3>
                    <p className="text-xs text-muted-foreground">
                      {bookingInfo?.cinema}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {bookingInfo?.date}
                    </p>
                    <p className="text-xs font-semibold text-foreground">
                      {bookingInfo?.time}
                    </p>
                  </div>
                </div>

                <div className="border-t border-dashed border-border pt-4 mb-4">
                  <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-2">
                    Vé đã đặt
                  </p>
                  {Object.values(groupedSeats).map((group) => (
                    <div
                      key={group.seatType}
                      className="flex justify-between items-center text-sm mb-1.5"
                    >
                      <span className="text-muted-foreground">
                        {group.count}× {group.seatType}
                      </span>
                      <span className="font-medium">
                        {formatCurrency(group.totalPrice)}
                      </span>
                    </div>
                  ))}
                  <p className="text-xs mt-2 text-muted-foreground">
                    Ghế:{" "}
                    <span className="text-foreground font-medium">
                      {(bookingInfo?.seats || [])
                        .map((s) => `${s.seatRow}${s.seatNumber}`)
                        .join(", ")}
                    </span>
                  </p>
                </div>

                {bookingInfo?.foods && bookingInfo.foods.length > 0 && (
                  <div className="mb-4">
                    <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-2">
                      Đồ ăn &amp; Nước
                    </p>
                    {bookingInfo.foods.map((item) => (
                      <div
                        key={item.id}
                        className="flex justify-between items-center text-sm mb-1.5"
                      >
                        <span className="flex-1 pr-2 text-muted-foreground">
                          {item.qty}× {item.name}
                        </span>
                        <span className="whitespace-nowrap font-medium">
                          {formatCurrency(item.totalPrice)}
                        </span>
                      </div>
                    ))}
                  </div>
                )}

                <div className="border-t border-dashed border-border pt-4 space-y-2.5 mb-4">
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Tạm tính</span>
                    <span className="font-medium">
                      {formatCurrency(bookingInfo?.total || 0)}
                    </span>
                  </div>
                  {discountInfo.amount > 0 && (
                    <div className="flex justify-between text-sm text-emerald-500">
                      <span>
                        Giảm giá ({isTierLoading ? "..." : discountInfo.label})
                      </span>
                      <span>−{formatCurrency(discountInfo.amount)}</span>
                    </div>
                  )}
                  {manualCode && (
                    <div className="flex justify-between text-sm text-emerald-500">
                      <span className="truncate max-w-[60%]">
                        Mã KM ({manualCode})
                      </span>
                      <span>
                        {voucherDiscount > 0
                          ? `−${formatCurrency(voucherDiscount)}`
                          : "−..."}
                      </span>
                    </div>
                  )}
                  <div className="flex justify-between text-lg font-black pt-2 border-t border-border">
                    <span>Tổng cộng</span>
                    <span className="text-primary">
                      {formatCurrency(finalPrice)}
                    </span>
                  </div>
                </div>

                <Button
                  type="submit"
                  className="w-full py-6 text-base font-black bg-primary hover:bg-primary/90 hover:-translate-y-0.5 shadow-lg shadow-primary/30 transition-all cursor-pointer"
                  disabled={loading || isTierLoading}
                >
                  {loading ? "ĐANG XỬ LÝ..." : "THANH TOÁN NGAY"}
                </Button>
              </div>
            </div>
          </div>
        </form>

        <VoucherSelectDialog
          key={`${isVoucherOpen ? "open" : "closed"}-${manualCode || "empty"}-${bookingInfo?.movieId ?? "none"}`}
          open={isVoucherOpen}
          onOpenChange={setIsVoucherOpen}
          totalAmount={checkoutEligibleAmount}
          vouchers={voucherOptions}
          isLoading={isVoucherLoading}
          selectedCode={manualCode || null}
          movieId={bookingInfo?.movieId ?? null}
          onSelect={handleSelectVoucher}
        />
      </div>
    </div>
  );
}
