"use client";

import {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  type ReactNode,
} from "react";
import type { UserInfo } from "@/types";
import { AUTH_TOKEN_KEY } from "@/components/auth/constants/auth.constants";
import {
  isTokenExpired,
  removeStoredToken,
  setStoredToken,
  setTokenCookie,
  removeTokenCookie,
  getStoredRefreshToken,
  setStoredRefreshToken,
  removeStoredRefreshToken,
} from "@/components/auth/utils/auth.utils";
import { logoutUser } from "@/components/auth/service/auth.service";

interface AuthContextType {
  user: UserInfo | null;
  token: string | null;
  isAuthenticated: boolean;
  login: (token: string, refreshToken?: string) => void;
  logout: () => void;
  setUser: (user: UserInfo | null) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

async function fetchMyInfo(token: string): Promise<UserInfo | null> {
  try {
    const res = await fetch("/api-proxy/users/myInfo", {
      headers: { Authorization: `Bearer ${token}` },
    });
    if (!res.ok) return null;
    const data = await res.json();
    return (data.result as UserInfo) ?? null;
  } catch {
    return null;
  }
}

function readStoredToken(): string | null {
  if (typeof window === "undefined") return null;
  const stored = sessionStorage.getItem(AUTH_TOKEN_KEY);
  if (!stored || isTokenExpired(stored)) {
    if (stored) removeStoredToken();
    removeTokenCookie();
    return null;
  }
  setTokenCookie(stored);
  return stored;
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [token, setToken] = useState<string | null>(readStoredToken);
  const [user, setUser] = useState<UserInfo | null>(null);

  useEffect(() => {
    if (!token) return;
    let cancelled = false;
    fetchMyInfo(token).then((info) => {
      if (!cancelled) setUser(info);
    });
    return () => { cancelled = true; };
  }, [token]);

  const login = useCallback((newToken: string, newRefreshToken?: string) => {
    setStoredToken(newToken);
    setTokenCookie(newToken);
    if (newRefreshToken) setStoredRefreshToken(newRefreshToken);
    setToken(newToken);
  }, []);

  const logout = useCallback(() => {
    const currentToken = sessionStorage.getItem(AUTH_TOKEN_KEY);
    const currentRefreshToken = getStoredRefreshToken();
    removeStoredToken();
    removeStoredRefreshToken();
    removeTokenCookie();
    setToken(null);
    setUser(null);
    if (currentToken) {
      logoutUser(currentToken, currentRefreshToken);
    }
  }, []);

  useEffect(() => {
    const handleTokenRefreshed = (e: Event) => {
      const { token: newToken, refreshToken: newRefreshToken } = (e as CustomEvent).detail;
      setStoredToken(newToken);
      setTokenCookie(newToken);
      if (newRefreshToken) setStoredRefreshToken(newRefreshToken);
      setToken(newToken);
    };

    const handleForceLogout = () => {
      removeStoredToken();
      removeStoredRefreshToken();
      removeTokenCookie();
      setToken(null);
      setUser(null);
    };

    window.addEventListener("auth:token-refreshed", handleTokenRefreshed);
    window.addEventListener("auth:logout", handleForceLogout);
    return () => {
      window.removeEventListener("auth:token-refreshed", handleTokenRefreshed);
      window.removeEventListener("auth:logout", handleForceLogout);
    };
  }, []);

  return (
    <AuthContext.Provider
      value={{ user, token, isAuthenticated: !!token, login, logout, setUser }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextType {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
