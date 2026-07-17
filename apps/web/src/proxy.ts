import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { decodeToken, isTokenExpired } from "@/lib/auth";
import { ROUTES } from "@/constants/routes";


const API_URL =
  process.env.API_INTERNAL_URL ??
  process.env.API_URL ??
  "http://localhost:3001";

// Auth routes (redirect to home if already logged in)
const authRoutes = [ROUTES.LOGIN, ROUTES.REGISTER, ROUTES.FORGOT_PASSWORD];

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // 1. Skip middleware for static assets, api routes, and Next.js internals
  if (
    pathname.startsWith("/_next") ||
    pathname.startsWith("/api") ||
    pathname.startsWith("/static") ||
    pathname.includes(".") // e.g. favicon.ico
  ) {
    return NextResponse.next();
  }

  // 2. Read cookies
  const accessToken = request.cookies.get("access_token")?.value;
  const refreshToken = request.cookies.get("refresh_token")?.value;

  const decoded = accessToken ? decodeToken(accessToken) : null;
  const isExpired = decoded ? isTokenExpired(decoded) : true;
  const tokenNeedsRefresh = isExpired && refreshToken;

  let finalAccessToken = accessToken;
  let finalDecoded = decoded;

  // 1. Clone headers so we can pass data to Server Components
  const requestHeaders = new Headers(request.headers);
  // CRITICAL SECURITY FIX: Strip incoming internal headers to prevent Header Spoofing (Smuggling)
  requestHeaders.delete("x-middleware-access-token");

  let newCookiesToSet: string[] = [];

  // 3. Perform silent refresh if needed
  if (tokenNeedsRefresh) {
    try {
      // Forward all cookies for the refresh request
      const allCookies = request.cookies
        .getAll()
        .map((c) => `${c.name}=${c.value}`)
        .join("; ");

      const refreshRes = await fetch(`${API_URL}/api/v1/auth/refresh`, {
        method: "POST",
        headers: { Cookie: allCookies },
        cache: "no-store",
      });

      if (refreshRes.ok) {
        const data = await refreshRes.json();
        finalAccessToken = data.accessToken as string;
        finalDecoded = decodeToken(finalAccessToken);

        // Pass the fresh token down to the Next.js Server Components
        requestHeaders.set("x-middleware-access-token", finalAccessToken);
        newCookiesToSet = refreshRes.headers.getSetCookie();
      } else {
        finalAccessToken = undefined;
        finalDecoded = null;
      }
    } catch (e) {
      finalAccessToken = undefined;
      finalDecoded = null;
    }
  }

  // 2. Initialize response with the mutated request headers
  let response = NextResponse.next({
    request: {
      headers: requestHeaders,
    },
  });

  if (tokenNeedsRefresh && finalAccessToken) {
    // Forward NestJS Set-Cookie headers to the browser (for refresh_token rotation)
    newCookiesToSet.forEach((c) => response.headers.append("Set-Cookie", c));

    // Set the new access_token on the response
    const isProduction = process.env.NODE_ENV === "production";
    response.cookies.set("access_token", finalAccessToken, {
      httpOnly: true,
      secure: isProduction,
      sameSite: "strict",
      maxAge: 7 * 24 * 60 * 60, // Match lib/auth.ts TTL
      path: "/",
    });
  } else if (tokenNeedsRefresh && !finalAccessToken) {
    // Refresh failed (e.g. token stolen or expired on backend)
    const isProduction = process.env.NODE_ENV === "production";
    response.cookies.set("access_token", "", {
      httpOnly: true,
      secure: isProduction,
      sameSite: "strict",
      maxAge: 0,
      path: "/",
    });
    response.cookies.set("refresh_token", "", {
      httpOnly: true,
      secure: isProduction,
      sameSite: "strict",
      maxAge: 0,
      path: "/",
    });
  }

  const isValidSession =
    finalAccessToken && finalDecoded && !isTokenExpired(finalDecoded);
  const isAuthRoute = authRoutes.some((route) => pathname.startsWith(route));

  // 4. If they are on an auth page but already logged in, redirect them out
  if (isAuthRoute && isValidSession) {
    const redirectRes = NextResponse.redirect(
      new URL(ROUTES.HOME, request.url),
    );
    // Must copy over any fresh cookies we just set
    if (tokenNeedsRefresh && finalAccessToken) {
      const nestCookies = response.headers.getSetCookie();
      nestCookies.forEach((c) => redirectRes.headers.append("Set-Cookie", c));
    }
    return redirectRes;
  }

  // Note: We do not do hard protection (redirecting to /login) for `(app)` routes in middleware here.
  // We leave that to `lib/proxy.ts` (the layout guard) so it can utilize Next.js Server Component boundaries
  // perfectly. `lib/proxy.ts` will just see that the token is valid (thanks to middleware) or missing.

  return response;
}

/**
 * BUG 10 FIX: Explicit matcher prevents this middleware from running on every /_next/ chunk,
 * favicon, image, or API route — eliminating unnecessary overhead on static asset requests.
 *
 * Matches: all routes EXCEPT /_next/, /static/, files with extensions (images/fonts/etc.),
 * and /api/ (Next.js API routes if ever added).
 */
export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico|woff|woff2|ttf|otf|eot|css|js|map)$).*)",
  ],
};
