"use client";

import { useEffect, useRef } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { toast } from "sonner";
import { useAuth } from "@/context/AuthContext";
import { decodeToken } from "@/components/auth/utils/auth.utils";

function hasAdminRole(token: string): boolean {
  const payload = decodeToken(token);
  if (!payload) return false;
  const scope = String(payload.scope ?? payload.role ?? "");
  return scope.includes("ADMIN");
}

export function AdminGuard({ children }: { children: React.ReactNode }) {
  const { token, isAuthenticated } = useAuth();
  const router = useRouter();
  const toastShown = useRef(false);

  useEffect(() => {
    if (!isAuthenticated || !token) return;

    if (!hasAdminRole(token) && !toastShown.current) {
      toastShown.current = true;
      toast.error("Bạn không có quyền truy cập trang quản trị");
      router.replace("/");
    }
  }, [isAuthenticated, token, router]);

  if (!isAuthenticated || !token || !hasAdminRole(token)) {
    return null;
  }

  return <>{children}</>;
}

export function ForbiddenToast() {
  const searchParams = useSearchParams();
  const toastShown = useRef(false);

  useEffect(() => {
    if (searchParams.get("forbidden") === "admin" && !toastShown.current) {
      toastShown.current = true;
      toast.error("Bạn không có quyền truy cập trang quản trị");
    }
  }, [searchParams]);

  return null;
}
