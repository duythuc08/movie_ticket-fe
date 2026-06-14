"use client";
import { getStoredToken } from "@/components/auth/utils/auth.utils";
import { refreshAccessToken } from "@/lib/tokenRefresh";

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

  let response = await fetch(fullUrl, { ...options, headers });

  if (response.status === 401) {
    try {
      const newToken = await refreshAccessToken();
      headers.set("Authorization", `Bearer ${newToken}`);
      response = await fetch(fullUrl, { ...options, headers });
    } catch {
      // refreshAccessToken đã dispatch auth:logout và clear storage
    }
  }

  return response;
}
