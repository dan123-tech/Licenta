import { NextResponse } from "next/server";

/**
 * Production-only security headers (HTTPS-oriented). HSTS can be disabled for local prod testing via DISABLE_HSTS=1.
 */
export function middleware(request) {
  const res = NextResponse.next();
  if (process.env.NODE_ENV !== "production") return res;

  res.headers.set("X-Content-Type-Options", "nosniff");
  res.headers.set("X-Frame-Options", "SAMEORIGIN");
  res.headers.set("Referrer-Policy", "strict-origin-when-cross-origin");
  res.headers.set("Permissions-Policy", "camera=(), microphone=(), geolocation=()");

  // HSTS only over HTTPS — never send on http:// (e.g. LAN IP) or browsers may behave oddly.
  if (process.env.DISABLE_HSTS !== "1" && request.nextUrl.protocol === "https:") {
    res.headers.set("Strict-Transport-Security", "max-age=31536000; includeSubDomains");
  }

  return res;
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon\\.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico)$).*)",
  ],
};
