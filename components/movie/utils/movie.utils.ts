import type { ShowtimeData } from "@/types";
import { AGE_RATING_COLORS, STATUS_COLORS } from "../constants/movie.constants";

export function formatDuration(minutes: number): string {
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return h > 0 ? `${h}h ${m}min` : `${m} phút`;
}

export function formatRuntime(minutes: number): string {
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  if (h === 0) return `${m} phút`;
  if (m === 0) return `${h} giờ`;
  return `${h} giờ ${m} phút`;
}

export function getRatingColor(ageRating: string): string {
  return AGE_RATING_COLORS[ageRating] ?? "bg-gray-500 text-white";
}

export function getStatusColor(status: string): string {
  return STATUS_COLORS[status] ?? "bg-gray-500/10 text-gray-500 border-gray-500/30";
}

export function groupShowtimesByDate(
  showtimes: ShowtimeData[]
): Record<string, ShowtimeData> {
  return showtimes.reduce<Record<string, ShowtimeData>>((acc, item) => {
    acc[item.date] = item;
    return acc;
  }, {});
}

export function formatReleaseDate(dateStr: string): string {
  if (!dateStr) return "";
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return dateStr;
  return d.toLocaleDateString("vi-VN", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
}
