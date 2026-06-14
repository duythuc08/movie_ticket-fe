"use client";
import {
  getStoredRefreshToken,
  setStoredToken,
  setStoredRefreshToken,
  removeStoredToken,
  removeStoredRefreshToken,
} from "@/components/auth/utils/auth.utils";

let isRefreshing = false;

type QueueItem = { resolve: (token: string) => void; reject: (err: unknown) => void };
let pendingQueue: QueueItem[] = [];

function flushQueue(token: string) {
  pendingQueue.forEach(({ resolve }) => resolve(token));
  pendingQueue = [];
}

function rejectQueue(err: unknown) {
  pendingQueue.forEach(({ reject }) => reject(err));
  pendingQueue = [];
}

/**
 * JWT Refresh Token Rotation with Request Queueing.
 *
 * Singleton: dù bao nhiêu request cùng cần refresh, chỉ 1 call thật lên backend.
 * Các request còn lại xếp hàng đợi — khi refresh xong, nhận token mới; khi thất bại, tất cả bị reject.
 */
export async function refreshAccessToken(): Promise<string> {
  if (isRefreshing) {
    return new Promise<string>((resolve, reject) => {
      pendingQueue.push({ resolve, reject });
    });
  }

  isRefreshing = true;

  try {
    const refreshToken = getStoredRefreshToken();
    if (!refreshToken) throw new Error("no_refresh_token");

    const res = await fetch("/api-proxy/auth/refresh", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ refreshToken }),
    });

    if (!res.ok) throw new Error("refresh_failed");

    const data = await res.json();
    const { token: newToken, refreshToken: newRefreshToken } = data.result;

    setStoredToken(newToken);
    if (newRefreshToken) setStoredRefreshToken(newRefreshToken);

    if (typeof window !== "undefined") {
      window.dispatchEvent(
        new CustomEvent("auth:token-refreshed", {
          detail: { token: newToken, refreshToken: newRefreshToken },
        })
      );
    }

    flushQueue(newToken);
    return newToken;
  } catch (error) {
    rejectQueue(error);
    removeStoredToken();
    removeStoredRefreshToken();
    if (typeof window !== "undefined") {
      window.dispatchEvent(new Event("auth:logout"));
    }
    throw error;
  } finally {
    isRefreshing = false;
  }
}
