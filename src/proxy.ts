import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

const STAFF_SESSION_COOKIE = "staff_session";

export function proxy(request: NextRequest) {
  const { pathname, search } = request.nextUrl;

  if (!pathname.startsWith("/staff") || pathname === "/staff/login") {
    return NextResponse.next();
  }

  const hasSessionCookie = request.cookies.has(STAFF_SESSION_COOKIE);

  if (hasSessionCookie) {
    return NextResponse.next();
  }

  const loginUrl = new URL("/staff/login", request.url);
  loginUrl.searchParams.set("next", `${pathname}${search}`);

  return NextResponse.redirect(loginUrl);
}

export const config = {
  matcher: ["/staff/:path*"],
};
