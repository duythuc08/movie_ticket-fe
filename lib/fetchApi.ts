"use client";
import { getStoredToken, setStoredToken, removeStoredToken, getStoredRefreshToken, setStoredRefreshToken, removeStoredRefreshToken } from "@/components/auth/utils/auth.utils";

let isRefreshing = false;
let pendingQueue: Array<(token: string) => void> = [];

function flushQueue(token: string) {
  pendingQueue.forEach((cb) => cb(token));
  pendingQueue = [];
}

export async function apiFetch(url: string, options: RequestInit = {}) {
  const baseURL = "/api-proxy";
  const fullUrl = url.startsWith("http") || url.startsWith(baseURL) ? url : `${baseURL}${url}`;
  
  const headers = new Headers(options.headers || {});
  if (!headers.has("Content-Type") && !(options.body instanceof FormData)) {
    headers.set("Content-Type", "application/json");
  }

  if (typeof window !== "undefined") {
    const token = getStoredToken();
    if (token) {
      headers.set("Authorization", `Bearer ${token}`);
    }
  }

  const doFetch = () => fetch(fullUrl, { ...options, headers });

  let response = await doFetch();

  if (response.status === 401) {
    if (isRefreshing) {
      return new Promise<Response>((resolve) => {
        pendingQueue.push((token: string) => {
          headers.set("Authorization", `Bearer ${token}`);
          resolve(fetch(fullUrl, { ...options, headers }));
        });
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

      window.dispatchEvent(
        new CustomEvent("auth:token-refreshed", {
          detail: { token: newToken, refreshToken: newRefreshToken },
        })
      );

      flushQueue(newToken);
      
      headers.set("Authorization", `Bearer ${newToken}`);
      response = await fetch(fullUrl, { ...options, headers });
    } catch (error) {
      pendingQueue = [];
      removeStoredToken();
      removeStoredRefreshToken();
      window.dispatchEvent(new Event("auth:logout"));
      throw error;
    } finally {
      isRefreshing = false;
    }
  }

  return response;
}
