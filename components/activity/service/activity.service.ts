"use client";
import { apiFetch } from "@/lib/fetchApi";
import { getStoredToken } from "@/components/auth/utils/auth.utils";

export type ActionType =
  | "WATCH_TRAILER"
  | "VIEW_DETAILS"
  | "VIEW_SHOWTIMES"
  | "SEARCH"
  | "SHARE_MOVIE"
  | "SKIP_RECOMMENDATION"
  | "ABANDON_SEAT_SELECTION";

export interface ActivityPayload {
  actionType: ActionType;
  movieId: number;
  metadata?: Record<string, unknown>;
}

/**
 * Fire-and-forget activity log.
 * No-ops for unauthenticated users and silences network errors.
 */
export async function logActivity(payload: ActivityPayload): Promise<void> {
  if (typeof window === "undefined" || !getStoredToken()) return;
  try {
    await apiFetch("/activity", {
      method: "PATCH",
      body: JSON.stringify(payload),
    });
  } catch {
    // silence — must not interrupt UX
  }
}
