"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

const TIMER_END_KEY = "infinityCinema_seatHoldEndTime";
const TIMER_START_KEY = "infinityCinema_seatHoldStartTime";
const TIMER_UPDATED_EVENT = "infinityCinema_bookingTimerUpdated";

export function setBookingTimer(expiredTime: string) {
  if (typeof window === "undefined") return;
  const endTime = new Date(expiredTime).getTime();
  sessionStorage.setItem(TIMER_END_KEY, String(endTime));
  sessionStorage.setItem(TIMER_START_KEY, String(Date.now()));
  window.dispatchEvent(new Event(TIMER_UPDATED_EVENT));
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
  const hasWarnedRef = useRef(false);
  const [totalDuration, setTotalDuration] = useState<number>(5 * 60);

  const [timeLeft, setTimeLeft] = useState<number>(() => {
    if (typeof window === "undefined") return 5 * 60;
    const stored = sessionStorage.getItem(TIMER_END_KEY);
    if (!stored) return 5 * 60;
    const endTime = parseInt(stored, 10);
    return Math.max(0, Math.floor((endTime - Date.now()) / 1000));
  });

  useEffect(() => {
    const syncTimerFromStorage = () => {
      const stored = sessionStorage.getItem(TIMER_END_KEY);
      const startStored = sessionStorage.getItem(TIMER_START_KEY);

      if (!stored) {
        toast.error("Phiên đặt vé không hợp lệ. Vui lòng bắt đầu lại.");
        router.push("/");
        return;
      }

      endTimeRef.current = parseInt(stored, 10);
      if (startStored) {
        setTotalDuration(Math.floor((endTimeRef.current - parseInt(startStored, 10)) / 1000));
      }
      setTimeLeft(Math.max(0, Math.floor((endTimeRef.current - Date.now()) / 1000)));
      hasWarnedRef.current = false;
    };

    syncTimerFromStorage();
    window.addEventListener(TIMER_UPDATED_EVENT, syncTimerFromStorage);

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
    return () => {
      clearInterval(intervalRef.current);
      window.removeEventListener(TIMER_UPDATED_EVENT, syncTimerFromStorage);
    };
  }, [router]);

  const minutes = String(Math.floor(timeLeft / 60)).padStart(2, "0");
  const seconds = String(timeLeft % 60).padStart(2, "0");
  const progress = totalDuration > 0 ? (timeLeft / totalDuration) * 100 : 0;
  const isUrgent = timeLeft <= 60;

  return { timeLeft, minutes, seconds, progress, isUrgent, clearTimer: clearBookingTimer };
}
