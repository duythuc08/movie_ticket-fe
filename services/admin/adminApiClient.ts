import type { ApiResponse, ApiPagedResult } from "@/types/admin.type";
import { getErrorMessage } from "@/lib/errors";

const ADMIN_BASE = "/api-proxy";

export const buildAuthHeaders = (token: string): HeadersInit => ({
  "Content-Type": "application/json",
  Authorization: `Bearer ${token}`,
});

export function buildAuthHeadersMultipart(token: string): HeadersInit {
  return {
    Authorization: `Bearer ${token}`,
  };
}

import { apiFetch } from "@/lib/fetchApi";

export async function adminGet<T>(
  token: string,
  path: string,
  queryParams?: Record<string, string | number | undefined>,
): Promise<T> {
  const url = new URL(`${ADMIN_BASE}${path}`, window.location.origin);

  if (queryParams) {
    Object.entries(queryParams).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== "") {
        url.searchParams.set(key, String(value));
      }
    });
  }

  const response = await apiFetch(url.toString(), {
    method: "GET",
    headers: buildAuthHeaders(token),
    cache: "no-store",
  });

  const data: ApiResponse<T> = await response.json();

  if (!response.ok) {
    const errorMsg = getErrorMessage(data?.code, data?.message || `Lỗi ${response.status}: ${path}`);
    const error: any = new Error(errorMsg);
    error.code = data?.code;
    throw error;
  }

  return data.result;
}

export async function adminPost<T>(
  token: string,
  path: string,
  body: unknown,
): Promise<T> {
  const response = await apiFetch(`${ADMIN_BASE}${path}`, {
    method: "POST",
    headers: buildAuthHeaders(token),
    body: JSON.stringify(body),
  });

  const data: ApiResponse<T> = await response.json();

  if (!response.ok) {
    const errorMsg = getErrorMessage(data?.code, data?.message || `Lỗi ${response.status}: ${path}`);
    const error: any = new Error(errorMsg);
    error.code = data?.code;
    throw error;
  }

  return data.result;
}

export async function adminPut<T>(
  token: string,
  path: string,
  body: unknown,
): Promise<T> {
  const response = await apiFetch(`${ADMIN_BASE}${path}`, {
    method: "PUT",
    headers: buildAuthHeaders(token),
    body: JSON.stringify(body),
  });

  const data: ApiResponse<T> = await response.json();

  if (!response.ok) {
    const errorMsg = getErrorMessage(data?.code, data?.message || `Lỗi ${response.status}: ${path}`);
    const error: any = new Error(errorMsg);
    error.code = data?.code;
    throw error;
  }

  return data.result;
}

export async function adminPutEmpty(
  token: string,
  path: string
): Promise<void> {
  const response = await apiFetch(`${ADMIN_BASE}${path}`, {
    method: "PUT",
    headers: buildAuthHeaders(token),
  });

  if (!response.ok) {
    const data: ApiResponse<null> = await response.json();
    const errorMsg = getErrorMessage(data?.code, data?.message || `Lỗi ${response.status}: ${path}`);
    const error: any = new Error(errorMsg);
    error.code = data?.code;
    throw error;
  }
}

export async function adminPostFormData<T>(
  token: string,
  path: string,
  formData: FormData
): Promise<T> {
  const response = await apiFetch(`${ADMIN_BASE}${path}`, {
    method: "POST",
    headers: buildAuthHeadersMultipart(token),
    body: formData,
  });

  const data: ApiResponse<T> = await response.json();

  if (!response.ok) {
    const errorMsg = getErrorMessage(data?.code, data?.message || `Lỗi ${response.status}: ${path}`);
    const error: any = new Error(errorMsg);
    error.code = data?.code;
    throw error;
  }

  return data.result;
}

export async function adminDelete(
  token: string,
  path: string
): Promise<void> {
  const response = await apiFetch(`${ADMIN_BASE}${path}`, {
    method: "DELETE",
    headers: buildAuthHeaders(token),
  });

  if (!response.ok) {
    const data: ApiResponse<null> = await response.json().catch(() => ({ message: `Lỗi ${response.status}` }) as any);
    const errorMsg = getErrorMessage(data?.code, data?.message || `Lỗi ${response.status}: ${path}`);
    const error: any = new Error(errorMsg);
    error.code = data?.code;
    throw error;
  }
}

export function buildFilterString(
  filters: Record<string, string | undefined | null>
): string {
  const parts: string[] = [];

  Object.entries(filters).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== "") {
      parts.push(`${key}:'${value}'`);
    }
  });

  return parts.join(" and ");
}