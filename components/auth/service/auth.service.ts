import type { LoginResult, RegisterPayload } from "../types";
import { getErrorMessage } from "@/lib/errors";

const BASE_URL = "/api-proxy";

export async function loginUser(username: string, password: string): Promise<LoginResult> {
  const res = await fetch(`${BASE_URL}/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ username, password }),
  });

  const data = await res.json();

  if (!res.ok) {
    throw new Error(getErrorMessage(data?.code, data?.message || "Sai tên đăng nhập hoặc mật khẩu!"));
  }

  return data.result as LoginResult;
}

export async function registerUser(payload: RegisterPayload): Promise<void> {
  const res = await fetch(`${BASE_URL}/auth/register`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });

  const data = await res.json();
  if (!res.ok) {
    throw new Error(getErrorMessage(data?.code, data?.message || "Đăng ký thất bại"));
  }
}

export async function resendOTP(email: string): Promise<void> {
  await fetch(`${BASE_URL}/auth/resendOTP?email=${email}`, { method: "POST" });
}

export async function verifyOTP(email: string, otp: string): Promise<void> {
  const res = await fetch(`${BASE_URL}/auth/verify?otp=${otp}&email=${email}`, { method: "POST" });
  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new Error(getErrorMessage(data?.code, data?.message || "Xác thực OTP thất bại"));
  }
}

export async function sendForgotPassword(username: string): Promise<void> {
  const res = await fetch(`${BASE_URL}/auth/forgot-password`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ username }),
  });
  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new Error(getErrorMessage(data?.code, data?.message || "Gửi yêu cầu quên mật khẩu thất bại"));
  }
}

export async function resetPassword(email: string, newPassword: string): Promise<void> {
  const res = await fetch(`${BASE_URL}/auth/reset-password?email=${email}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ newPassword }),
  });
  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new Error(getErrorMessage(data?.code, data?.message || "Đặt lại mật khẩu thất bại"));
  }
}

export async function refreshTokenApi(refreshToken: string): Promise<{ token: string; refreshToken: string }> {
  const res = await fetch(`${BASE_URL}/auth/refresh`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ refreshToken }),
  });
  if (!res.ok) throw new Error("Refresh token hết hạn");
  const data = await res.json();
  return data.result as { token: string; refreshToken: string };
}

export async function logoutUser(token: string, refreshToken?: string | null): Promise<void> {
  await fetch(`${BASE_URL}/auth/logout`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ token, refreshToken }),
  }).catch(() => {});
}
