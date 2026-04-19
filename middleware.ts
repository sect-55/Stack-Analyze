import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

/**
 * Global security headers applied to every response.
 * Runs at the Edge — zero latency overhead.
 */
export function middleware(request: NextRequest) {
  const res = NextResponse.next();
  const url  = request.nextUrl.pathname;

  res.headers.set("X-Content-Type-Options",   "nosniff");
  res.headers.set("X-XSS-Protection",         "1; mode=block");
  res.headers.set("Referrer-Policy",           "strict-origin-when-cross-origin");
  res.headers.set("Permissions-Policy",        "camera=(), microphone=(), geolocation=()");

  // Don't add X-Frame-Options on badge endpoint (it must be embeddable)
  if (!url.startsWith("/api/badge")) {
    res.headers.set("X-Frame-Options", "DENY");
  }

  // CSP — tight for pages, relaxed for API
  if (!url.startsWith("/api/")) {
    const isDev = process.env.NODE_ENV === "development";
    res.headers.set(
      "Content-Security-Policy",
      [
        "default-src 'self'",
        // 'unsafe-eval' required in dev: Next.js webpack uses eval() to load modules.
        // Without it React never hydrates and event handlers are never registered.
        isDev
          ? "script-src 'self' 'unsafe-inline' 'unsafe-eval'"
          : "script-src 'self' 'unsafe-inline'",
        "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
        "font-src 'self' https://fonts.gstatic.com",
        "img-src 'self' data: https:",          // badges fetched cross-origin
        "connect-src 'self'",
        "frame-ancestors 'none'",
      ].join("; ")
    );
  }

  return res;
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
