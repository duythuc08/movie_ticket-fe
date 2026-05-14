import type { QuickBookingSlot } from "@/types";
import { WEEKDAY_LABELS } from "../constants/home.constants";

export function filterExpiredShowtimes(
  slots: QuickBookingSlot[],
  dateValue: string
): QuickBookingSlot[] {
  const todayStr = getTodayStr();
  if (dateValue !== todayStr) return slots;

  const now = new Date();
  const nowMinutes = now.getHours() * 60 + now.getMinutes();

  return slots.filter((s) => {
    const [h, min] = s.startTime.split(":").map(Number);
    return h * 60 + min > nowMinutes;
  });
}

export function formatDateLabel(dateStr: string): string {
  const d = new Date(dateStr + "T00:00:00");
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const dd = String(d.getDate()).padStart(2, "0");
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  return d.getTime() === today.getTime()
    ? `Hôm nay (${dd}/${mm})`
    : `${WEEKDAY_LABELS[d.getDay()]} (${dd}/${mm})`;
}

export function getTodayStr(): string {
  const d = new Date();
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

export function get6DayWindow(): string[] {
  const today = new Date();
  return Array.from({ length: 6 }, (_, i) => {
    const d = new Date(today);
    d.setDate(today.getDate() + i);
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, "0");
    const day = String(d.getDate()).padStart(2, "0");
    return `${y}-${m}-${day}`;
  });
}
