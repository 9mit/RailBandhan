import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
const publicPages = new Set([
  "/",
  "/home",
  "/login",
  "/signup",
  "/games",
  "/explore",
  "/help",
  "/journeys/restricted",
  "/robots.txt",
  "/sitemap.xml",
]);
const publicApis = new Set([
  "/api/health",
  "/api/v1/health",
  "/api/v1/auth/login",
  "/api/v1/auth/signup",
  "/api/v1/auth/logout",
  "/api/v1/auth/session",
  "/api/v1/auth/refresh",
  "/api/v1/jobs/retention",
  "/api/v1/metrics",
  "/api/v1/catalog/trains",
]);
function allowedOrigin(request: NextRequest) {
  const origin = request.headers.get("origin");
  if (request.headers.get("sec-fetch-site") === "cross-site") return false;
  if (!origin) return true;
  const allowed = new Set([request.nextUrl.origin]);
  try {
    if (process.env.NEXT_PUBLIC_APP_URL)
      allowed.add(new URL(process.env.NEXT_PUBLIC_APP_URL).origin);
  } catch {}
  return allowed.has(origin);
}
export function middleware(request: NextRequest) {
  const path = request.nextUrl.pathname;
  const requestId = crypto.randomUUID();
  const nonce = btoa(crypto.randomUUID());
  const csp = [
    "default-src 'self'",
    `script-src 'self' 'nonce-${nonce}'${process.env.NODE_ENV === "development" ? " 'unsafe-eval'" : ""}`,
    "style-src 'self' 'unsafe-inline'",
    "img-src 'self' data: blob:",
    "font-src 'self'",
    "media-src 'self'",
    "connect-src 'self'" +
      (process.env.NODE_ENV === "development" ? " ws: wss:" : ""),
    "object-src 'none'",
    "frame-ancestors 'none'",
    "base-uri 'self'",
    "form-action 'self'",
  ].join("; ");
  const requestHeaders = new Headers(request.headers);
  requestHeaders.set("x-request-id", requestId);
  requestHeaders.set("x-nonce", nonce);
  requestHeaders.set("x-route-path", path);
  requestHeaders.set("Content-Security-Policy", csp);
  const finish = (response: NextResponse) => {
    response.headers.set("x-request-id", requestId);
    response.headers.set("Content-Security-Policy", csp);
    if (path.startsWith("/api/"))
      response.headers.set("Cache-Control", "no-store");
    return response;
  };
  const mutation = ["POST", "PUT", "PATCH", "DELETE"].includes(request.method);
  if (mutation && path.startsWith("/api/") && !allowedOrigin(request))
    return finish(
      NextResponse.json(
        { error: { code: "forbidden", message: "Invalid request origin" } },
        { status: 403 },
      ),
    );
  const max = path === "/api/v1/tickets/upload" ? 9 * 1024 * 1024 : 32 * 1024;
  if (mutation && Number(request.headers.get("content-length")) > max)
    return finish(
      NextResponse.json(
        {
          error: {
            code: "payload_too_large",
            message: "Request body is too large",
          },
        },
        { status: 413 },
      ),
    );
  const hasSession = !!(
    request.cookies.get("rb_session")?.value ||
    request.cookies.get("rb_refresh")?.value
  );
  if (path.startsWith("/api/") && !publicApis.has(path) && !hasSession)
    return finish(
      NextResponse.json(
        { error: { code: "unauthorized", message: "Authentication required" } },
        { status: 401 },
      ),
    );
  const page =
    !path.startsWith("/api/") &&
    !path.startsWith("/_next/") &&
    !path.includes(".");
  if (page && !publicPages.has(path) && !hasSession) {
    const login = new URL("/login", request.url);
    login.searchParams.set("next", path + request.nextUrl.search);
    return finish(NextResponse.redirect(login));
  }
  return finish(NextResponse.next({ request: { headers: requestHeaders } }));
}
export const config = {
  matcher: ["/((?!_next/static|_next/image|images/|videos/|favicon.ico).*)"],
};
