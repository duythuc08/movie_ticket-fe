import { AUTH_TOKEN_KEY, REFRESH_TOKEN_KEY } from "../constants/auth.constants";

export function decodeToken(token: string): Record<string, unknown> | null {
  try {
    const base64url = token.split(".")[1];
    const base64 = base64url.replace(/-/g, "+").replace(/_/g, "/");
    return JSON.parse(atob(base64));
  } catch {
    return null;
  }
}

export function isTokenExpired(token: string): boolean {
  const decoded = decodeToken(token);
  if (!decoded?.exp) return true;
  return Date.now() >= (decoded.exp as number) * 1000;
}

export function getStoredToken(): string | null {
  if (typeof window === "undefined") return null;
  return sessionStorage.getItem(AUTH_TOKEN_KEY);
}

export function setStoredToken(token: string): void {
  sessionStorage.setItem(AUTH_TOKEN_KEY, token);
}

export function removeStoredToken(): void {
  sessionStorage.removeItem(AUTH_TOKEN_KEY);
}

export function setTokenCookie(token: string): void {
  document.cookie = `${AUTH_TOKEN_KEY}=${token}; path=/; SameSite=Strict`;
}

export function removeTokenCookie(): void {
  document.cookie = `${AUTH_TOKEN_KEY}=; path=/; max-age=0`;
}

export function getStoredRefreshToken(): string | null {
  if (typeof window === "undefined") return null;
  return sessionStorage.getItem(REFRESH_TOKEN_KEY);
}

export function setStoredRefreshToken(token: string): void {
  sessionStorage.setItem(REFRESH_TOKEN_KEY, token);
}

export function removeStoredRefreshToken(): void {
  sessionStorage.removeItem(REFRESH_TOKEN_KEY);
}
