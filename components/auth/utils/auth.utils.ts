import { AUTH_TOKEN_KEY } from "../constants/auth.constants";

export function decodeToken(token: string): Record<string, unknown> | null {
  try {
    const payload = token.split(".")[1];
    return JSON.parse(atob(payload));
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
  return localStorage.getItem(AUTH_TOKEN_KEY);
}

export function setStoredToken(token: string): void {
  localStorage.setItem(AUTH_TOKEN_KEY, token);
}

export function removeStoredToken(): void {
  localStorage.removeItem(AUTH_TOKEN_KEY);
}

export function setTokenCookie(token: string): void {
  const decoded = decodeToken(token);
  const exp = decoded?.exp as number | undefined;
  const maxAge = exp ? exp - Math.floor(Date.now() / 1000) : 60 * 60 * 24;
  document.cookie = `${AUTH_TOKEN_KEY}=${token}; path=/; max-age=${maxAge}; SameSite=Strict`;
}

export function removeTokenCookie(): void {
  document.cookie = `${AUTH_TOKEN_KEY}=; path=/; max-age=0`;
}
