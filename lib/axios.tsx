"use client";
import axios from "axios";
import { getStoredToken } from "@/components/auth/utils/auth.utils";
import { refreshAccessToken } from "@/lib/tokenRefresh";

const api = axios.create({
  baseURL: "/api-proxy",
  headers: {
    "Content-Type": "application/json",
  },
});

api.interceptors.request.use((config) => {
  if (typeof window !== "undefined") {
    const token = getStoredToken();
    if (token) {
      config.headers["Authorization"] = `Bearer ${token}`;
    }
  }
  return config;
});

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const original = error.config;

    if (error.response?.status !== 401 || original._retry) {
      return Promise.reject(error);
    }

    original._retry = true;

    try {
      const newToken = await refreshAccessToken();
      original.headers["Authorization"] = `Bearer ${newToken}`;
      return api(original);
    } catch {
      return Promise.reject(error);
    }
  }
);

export default api;
