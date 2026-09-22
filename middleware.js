import { NextResponse } from "next/server";
import { SESSION_COOKIE, verifySessionToken } from "./lib/auth";

export const config = {
  // Run on everything except Next internals/static assets. Login page and
  // its API are handled inside the middleware body (allow-listed), not
  // excluded here, so they still go through this same file.
  matcher: ["/((?!_next/static|_next/image|favicon.ico|icons|manifest.json).*)"],
};

export async function middleware(req) {
  const { pathname } = req.nextUrl;

  if (pathname === "/login" || pathname === "/api/login") {
    return NextResponse.next();
  }

  const token = req.cookies.get(SESSION_COOKIE)?.value;
  const ok = await verifySessionToken(token);
  if (ok) return NextResponse.next();

  if (pathname.startsWith("/api/")) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const loginUrl = new URL("/login", req.url);
  loginUrl.searchParams.set("next", pathname);
  return NextResponse.redirect(loginUrl);
}
