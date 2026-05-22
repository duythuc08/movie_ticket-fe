import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

function hasAdminRole(token: string): boolean {
  try {
    const base64url = token.split(".")[1];
    const base64 = base64url.replace(/-/g, "+").replace(/_/g, "/");
    const payload = JSON.parse(atob(base64));
    const scope: string = payload.scope ?? payload.role ?? "";
    return scope.includes("ADMIN");
  } catch {
    return false;
  }
}

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const token = request.cookies.get("token")?.value;

  if (!token) {
    const loginUrl = new URL("/login", request.url);
    loginUrl.searchParams.set("from", pathname);
    return NextResponse.redirect(loginUrl);
  }

  if (pathname.startsWith("/admin") && !hasAdminRole(token)) {
    return NextResponse.redirect(new URL("/?forbidden=admin", request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/seat-selection/:path*",
    "/food-selection/:path*",
    "/payment/:path*",
    "/payment-success/:path*",
    "/payment-fail/:path*",
    "/profile/:path*",
    "/admin/:path*",
  ],
};
