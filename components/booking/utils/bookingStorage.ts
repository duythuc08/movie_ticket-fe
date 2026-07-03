import type { BookingState } from "@/types";

const KEY = "infinityCinema_bookingState";

export function saveBookingState(state: BookingState): void {
  if (typeof window === "undefined") return;
  sessionStorage.setItem(KEY, JSON.stringify(state));
}

export function getBookingState(): BookingState | null {
  if (typeof window === "undefined") return null;
  const raw = sessionStorage.getItem(KEY);
  if (!raw) return null;
  try {
    return JSON.parse(raw) as BookingState;
  } catch {
    return null;
  }
}

export function clearBookingState(): void {
  if (typeof window === "undefined") return;
  sessionStorage.removeItem(KEY);
}

export function clearOrderData(): void {
  const existing = getBookingState();
  if (!existing) return;
  saveBookingState({
    movieId: existing.movieId,
    movie: existing.movie,
    movieDuration: existing.movieDuration,
    moviePoster: existing.moviePoster,
    cinemaId: existing.cinemaId,
    cinema: existing.cinema,
    location: existing.location,
    time: existing.time,
    showTimeId: existing.showTimeId,
    date: existing.date,
    roomName: existing.roomName,
  });
}

export function mergeBookingState(partial: Partial<BookingState>): BookingState {
  const existing = getBookingState() ?? {};
  const merged = { ...existing, ...partial };
  saveBookingState(merged);
  return merged;
}
