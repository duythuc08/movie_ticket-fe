"use client";
import axios from "axios";

const api = axios.create({
  baseURL: "/api-proxy",
  headers: {
    "Content-Type": "application/json",
  },
});

api.interceptors.request.use((config) => {
  if (typeof window !== "undefined") {
    const token = localStorage.getItem("token");
    if (token) {
      config.headers["Authorization"] = `Bearer ${token}`;
    }
  }
  return config;
});

let isRefreshing = false;
let pendingQueue: Array<(token: string) => void> = [];

function flushQueue(token: string) {
  pendingQueue.forEach((cb) => cb(token));
  pendingQueue = [];
}

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const original = error.config;

    if (error.response?.status !== 401 || original._retry) {
      return Promise.reject(error);
    }

    original._retry = true;

    if (isRefreshing) {
      return new Promise((resolve, reject) => {
        pendingQueue.push((token: string) => {
          original.headers["Authorization"] = `Bearer ${token}`;
          resolve(api(original));
        });
      });
    }

    isRefreshing = true;

    try {
      const refreshToken = localStorage.getItem("refreshToken");
      if (!refreshToken) throw new Error("no refresh token");

      const res = await fetch("/api-proxy/auth/refresh", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ refreshToken }),
      });

      if (!res.ok) throw new Error("refresh failed");

      const data = await res.json();
      const { token: newToken, refreshToken: newRefreshToken } = data.result;

      localStorage.setItem("token", newToken);
      if (newRefreshToken) localStorage.setItem("refreshToken", newRefreshToken);

      window.dispatchEvent(
        new CustomEvent("auth:token-refreshed", {
          detail: { token: newToken, refreshToken: newRefreshToken },
        })
      );

      flushQueue(newToken);
      original.headers["Authorization"] = `Bearer ${newToken}`;
      return api(original);
    } catch {
      pendingQueue = [];
      localStorage.removeItem("token");
      localStorage.removeItem("refreshToken");
      window.dispatchEvent(new Event("auth:logout"));
      return Promise.reject(error);
    } finally {
      isRefreshing = false;
    }
  }
);

export default api;
