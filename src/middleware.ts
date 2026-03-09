import { NextRequest, NextResponse } from "next/server";

const PUBLIC_PATHS = [
  "/waitlist",
  "/api/waitlist",
  "/api/health",
  "/_next",
  "/favicon.ico",
];

const OWNER_PATHS = [
  "/admin",
  "/api/admin",
  "/onboarding",
];

export function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  // Always allow public paths
  if (PUBLIC_PATHS.some((p) => pathname.startsWith(p))) {
    return NextResponse.next();
  }

  // Root redirects to waitlist for everyone
  if (pathname === "/") {
    const userId = req.cookies.get("protocol-user-id")?.value;
    if (userId) return NextResponse.next();
    return NextResponse.redirect(new URL("/waitlist", req.url));
  }

  // Owner-only paths: require ?key= or protocol-owner cookie
  const ownerKey = process.env.NEXT_PUBLIC_OWNER_KEY || "protocol-owner-2026";

  if (OWNER_PATHS.some((p) => pathname.startsWith(p))) {
    const keyParam = req.nextUrl.searchParams.get("key");
    const ownerCookie = req.cookies.get("protocol-owner")?.value;

    if (keyParam === ownerKey) {
      const res = NextResponse.next();
      res.cookies.set("protocol-owner", "true", {
        httpOnly: true,
        path: "/",
        maxAge: 60 * 60 * 24 * 90,
      });
      return res;
    }

    if (ownerCookie === "true") {
      return NextResponse.next();
    }

    return NextResponse.redirect(new URL("/waitlist", req.url));
  }

  // All other app pages: require either protocol-user-id OR protocol-owner cookie
  const userId = req.cookies.get("protocol-user-id")?.value;
  const ownerCookie = req.cookies.get("protocol-owner")?.value;

  if (userId || ownerCookie === "true") {
    return NextResponse.next();
  }

  // API routes: let them handle their own auth (they return 401)
  if (pathname.startsWith("/api/")) {
    return NextResponse.next();
  }

  // Everything else: redirect to waitlist
  return NextResponse.redirect(new URL("/waitlist", req.url));
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
