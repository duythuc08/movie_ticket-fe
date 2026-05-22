import type { ApiResponse, ApiPagedResult } from "@/types/admin.type";

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

  const response = await fetch(url.toString(), {
    method: "GET",
    headers: buildAuthHeaders(token),
  });

  const data: ApiResponse<T> = await response.json();

  if (!response.ok) {
    throw new Error(data.message || `Lỗi ${response.status}: ${path}`);
  }

  return data.result;
}

export async function adminPost<T>(
  token: string,
  path: string,
  body: unknown,
): Promise<T> {
  const response = await fetch(`${ADMIN_BASE}${path}`, {
    method: "POST",
    headers: buildAuthHeaders(token),
    body: JSON.stringify(body),
  });

  const data: ApiResponse<T> = await response.json();

  if (!response.ok) {
    throw new Error(data.message || `Lỗi ${response.status}: ${path}`);
  }

  return data.result;
}

export async function adminPut<T>(
  token: string,
  path: string,
  body: unknown,
): Promise<T> {
  const response = await fetch(`${ADMIN_BASE}${path}`, {
    method: "PUT",
    headers: buildAuthHeaders(token),
    body: JSON.stringify(body),
  });

  const data: ApiResponse<T> = await response.json();

  if (!response.ok) {
    throw new Error(data.message || `Lỗi ${response.status}: ${path}`);
  }

  return data.result;
}

export async function adminPutEmpty(
  token: string,
  path: string
): Promise<void> {
  const response = await fetch(`${ADMIN_BASE}${path}`, {
    method: "PUT",
    headers: buildAuthHeaders(token),
  });

  if (!response.ok) {
    const data: ApiResponse<null> = await response.json();
    throw new Error(data.message || `Lỗi ${response.status}: ${path}`);
  }
}

export async function adminPostFormData<T>(
  token: string,
  path: string,
  formData: FormData
): Promise<T> {
  const response = await fetch(`${ADMIN_BASE}${path}`, {
    method: "POST",
    headers: buildAuthHeadersMultipart(token),
    body: formData,
  });

  const data: ApiResponse<T> = await response.json();

  if (!response.ok) {
    throw new Error(data.message || `Lỗi ${response.status}: ${path}`);
  }

  return data.result;
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