"use client";
import {
  getStoredToken,
  getStoredRefreshToken,
  decodeToken,
} from "@/components/auth/utils/auth.utils";
import { refreshAccessToken } from "@/lib/tokenRefresh";

/** Refresh chủ động nếu token còn dưới ngưỡng này (giây) */
const PROACTIVE_THRESHOLD_S = 90;

/** Tầng 1 helper: kiểm tra token còn < 90s là hết hạn */
function willExpireSoon(token: string): boolean {
  const payload = decodeToken(token);
  if (!payload?.exp) return true;
  return Date.now() >= (payload.exp as number) * 1000 - PROACTIVE_THRESHOLD_S * 1000;
}

/** Tầng 2 helper: quyết định có cần passive refresh không */
async function shouldPassiveRefresh(response: Response): Promise<boolean> {
  if (response.status === 401) return true;
  if (response.ok || !getStoredRefreshToken()) return false;
  // Safety net: backend đôi khi trả non-401 nhưng body chứa code 1009 (UNAUTHENTICATED)
  try {
    const data = await response.clone().json();
    return data?.code === 1009;
  } catch {
    return false;
  }
}

/** Body chuẩn của ApiResponse từ backend */
export type ApiBody = { code?: number; message?: string; result?: unknown } & Record<string, unknown>;

/**
 * Đọc body JSON an toàn. Trả về null nếu body không phải JSON —
 * ví dụ BE lỗi 500 trả text thuần "Internal Server Error" làm res.json() throw.
 */
export async function parseJsonSafe(res: Response): Promise<ApiBody | null> {
  try {
    return await res.json();
  } catch {
    return null;
  }
}

/**
 * Fetch wrapper với 2 tầng bảo vệ token:
 *
 * Tầng 1 (Chủ động): Decode JWT client-side. Nếu còn < 90s hết hạn → refresh trước,
 *   gắn token mới vào request, rồi mới gửi đi. Tránh 401 ngay từ đầu.
 *
 * Tầng 2 (Bị động): Nếu request đã đi mà dính 401 (hoặc body code 1009) từ backend,
 *   giữ request lại, refresh ngầm, rồi retry tự động với token mới.
 *
 * Khi cả 2 token hết hạn: rejectQueue + xóa storage + dispatch auth:logout.
 */
export async function apiFetch(url: string, options: RequestInit = {}) {
  const baseURL = "/api-proxy";
  const fullUrl =
    url.startsWith("http") || url.startsWith(baseURL) ? url : `${baseURL}${url}`;

  const headers = new Headers(options.headers || {});
  if (!headers.has("Content-Type") && !(options.body instanceof FormData)) {
    headers.set("Content-Type", "application/json");
  }

  // ── Tầng 1: Chủ động ─────────────────────────────────────────────────────────
  if (typeof window !== "undefined") {
    const token = getStoredToken();
    if (token) {
      if (willExpireSoon(token)) {
        try {
          const freshToken = await refreshAccessToken();
          headers.set("Authorization", `Bearer ${freshToken}`);
        } catch {
          // Refresh thất bại (cả 2 token hết hạn) → auth:logout đã dispatch.
          // Vẫn tiếp tục với token cũ để Tầng 2 bắt 401 và kết thúc luồng sạch.
          headers.set("Authorization", `Bearer ${token}`);
        }
      } else {
        headers.set("Authorization", `Bearer ${token}`);
      }
    }
  }

  // ── Tầng 2: Bị động ──────────────────────────────────────────────────────────
  let response = await fetch(fullUrl, { ...options, headers });

  if (await shouldPassiveRefresh(response)) {
    try {
      const newToken = await refreshAccessToken();
      headers.set("Authorization", `Bearer ${newToken}`);
      response = await fetch(fullUrl, { ...options, headers });
    } catch {
      // refreshAccessToken đã dispatch auth:logout và clear storage
    }
  }

  if (response.status >= 500) {
    throw new Error("Máy chủ không phản hồi");
  }

  return response;
}
