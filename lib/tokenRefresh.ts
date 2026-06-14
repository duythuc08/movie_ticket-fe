"use client";
import {
  getStoredRefreshToken,
  setStoredToken,
  setStoredRefreshToken,
  removeStoredToken,
  removeStoredRefreshToken,
} from "@/components/auth/utils/auth.utils";

let isRefreshing = false;
let pendingQueue: Array<(token: string) => void> = [];

function flushQueue(token: string) {
  pendingQueue.forEach((cb) => cb(token));
  pendingQueue = [];
}

/**
 * Singleton refresh: chỉ gọi /auth/refresh một lần dù nhiều request đồng thời bị 401.
 * Các request sau sẽ chờ và nhận token mới khi refresh xong.
 */
export async function refreshAccessToken(): Promise<string> {
  if (isRefreshing) {
    return new Promise<string>((resolve) => {
      pendingQueue.push((token: string) => resolve(token));
    });
  }

  isRefreshing = true;

  try {
    const refreshToken = getStoredRefreshToken();
    if (!refreshToken) throw new Error("no refresh token");

    const res = await fetch("/api-proxy/auth/refresh", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ refreshToken }),
    });

    if (!res.ok) throw new Error("refresh failed");

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
    pendingQueue = [];
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
