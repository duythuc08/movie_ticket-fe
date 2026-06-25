"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

const TIMER_END_KEY = "infinityCinema_seatHoldEndTime";
const TIMER_START_KEY = "infinityCinema_seatHoldStartTime";

export function setBookingTimer(expiredTime: string) {
  const endTime = new Date(expiredTime).getTime();
  sessionStorage.setItem(TIMER_END_KEY, String(endTime));
  sessionStorage.setItem(TIMER_START_KEY, String(Date.now()));
}

export function clearBookingTimer() {
  if (typeof window !== "undefined") {
    sessionStorage.removeItem(TIMER_END_KEY);
    sessionStorage.removeItem(TIMER_START_KEY);
  }
}

export function useBookingTimer() {
  const router = useRouter();
  const endTimeRef = useRef<number>(0);
  const totalDurationRef = useRef<number>(5 * 60); // fallback 5 phút
  const hasWarnedRef = useRef(false);

  const [timeLeft, setTimeLeft] = useState<number>(() => {
    if (typeof window === "undefined") return 5 * 60;
    const stored = sessionStorage.getItem(TIMER_END_KEY);
    if (!stored) return 5 * 60;
    const endTime = parseInt(stored, 10);
    return Math.max(0, Math.floor((endTime - Date.now()) / 1000));
  });

  useEffect(() => {
    const stored = sessionStorage.getItem(TIMER_END_KEY);
    const startStored = sessionStorage.getItem(TIMER_START_KEY);

    if (!stored) {
      // Không có timer — không có seat hold hợp lệ, redirect về trang chủ
      toast.error("Phiên đặt vé không hợp lệ. Vui lòng bắt đầu lại.");
      router.push("/");
      return;
    }

    endTimeRef.current = parseInt(stored, 10);
    if (startStored) {
      totalDurationRef.current = Math.floor(
        (endTimeRef.current - parseInt(startStored, 10)) / 1000
      );
    }

    const intervalRef = { current: 0 as unknown as ReturnType<typeof setInterval> };

    const tick = () => {
      const remaining = Math.max(0, Math.floor((endTimeRef.current - Date.now()) / 1000));
      setTimeLeft(remaining);

      if (remaining === 60 && !hasWarnedRef.current) {
        hasWarnedRef.current = true;
        toast.warning("Còn 1 phút để hoàn tất đặt vé!", { duration: 3000 });
      }

      if (remaining <= 0) {
        clearInterval(intervalRef.current);
        clearBookingTimer();
        toast.error("Hết thời gian giữ ghế! Vui lòng đặt vé lại.", { duration: 5000 });
        router.push("/");
      }
    };

    intervalRef.current = setInterval(tick, 1000);
    return () => clearInterval(intervalRef.current);
  }, [router]);

  const minutes = String(Math.floor(timeLeft / 60)).padStart(2, "0");
  const seconds = String(timeLeft % 60).padStart(2, "0");
  const progress = totalDurationRef.current > 0
    ? (timeLeft / totalDurationRef.current) * 100
    : 0;
  const isUrgent = timeLeft <= 60;

  return { timeLeft, minutes, seconds, progress, isUrgent, clearTimer: clearBookingTimer };
}
