import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

const LOCALES = ["tc", "sc", "en", "pt", "ja"];
const DEFAULT_LOCALE = "tc";

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Skip static files and API routes
  if (
    pathname.startsWith("/_next") ||
    pathname.startsWith("/api") ||
    pathname.includes(".") // static files
  ) {
    return NextResponse.next();
  }

  // Check if pathname has a locale prefix
  const pathnameLocale = LOCALES.find(
    (locale) => pathname.startsWith(`/${locale}/`) || pathname === `/${locale}`
  );

  // Redirect to default locale if no locale prefix
  if (!pathnameLocale) {
    const url = request.nextUrl.clone();
    url.pathname = `/${DEFAULT_LOCALE}${pathname}`;
    return NextResponse.redirect(url);
  }

  // Dev: propagate ?tenant= param as header for tenant resolver
  const tenantParam = request.nextUrl.searchParams.get("tenant");
  const requestHeaders = new Headers(request.headers);
  if (tenantParam) {
    requestHeaders.set("x-tenant-slug", tenantParam);
  }
  const response = NextResponse.next({ request: { headers: requestHeaders } });

  // Ensure guest cart session token exists
  if (!request.cookies.has("sf_cart_session")) {
    response.cookies.set("sf_cart_session", crypto.randomUUID(), {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 7 * 24 * 60 * 60, // 7 days
      path: "/",
    });
  }

  // Auth guard for /account/* pages
  if (pathname.includes("/account")) {
    const customerSession = request.cookies.get("sf_customer_session");
    if (!customerSession?.value) {
      const url = request.nextUrl.clone();
      url.pathname = `/${pathnameLocale}/login`;
      return NextResponse.redirect(url);
    }
  }

  return response;
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
