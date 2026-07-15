import "server-only";
import { cookies, headers } from "next/headers";

const ACCESS_TOKEN_COOKIE = "access_token";
const COOKIE_MAX_AGE = 15 * 60; // 15 minutes — matches the JWT TTL on NestJS

export interface TokenUser {
  userId: string;
  exp: number;
  iat: number;
}

/**
 * Read the access token from the httpOnly server-side cookie or middleware headers.
 * Returns undefined if no token is found.
 * Marked `server-only` — cannot be imported by Client Components.
 */
export async function getAccessToken(): Promise<string | undefined> {
  // 1. Check if the Edge proxy (middleware) just refreshed the token and passed it down via headers
  const headersList = await headers();
  const middlewareToken = headersList.get("x-middleware-access-token");
  if (middlewareToken) {
    return middlewareToken;
  }

  // 2. Otherwise, fall back to the browser's current cookie
  const cookieStore = await cookies();
  return cookieStore.get(ACCESS_TOKEN_COOKIE)?.value;
}

/**
 * Store the access token as a secure httpOnly cookie.
 * Called from Server Actions after a successful login or token refresh.
 */
export async function setAccessToken(token: string): Promise<void> {
  const cookieStore = await cookies();
  const isProduction = process.env.NODE_ENV === "production";

  cookieStore.set(ACCESS_TOKEN_COOKIE, token, {
    httpOnly: true,
    secure: isProduction,
    sameSite: "strict",
    // BUG FIX: Must live longer than the 15min JWT TTL!
    // If the browser deletes the cookie at 15 minutes, proxy.ts gets undefined
    // and instantly redirects to login, meaning silent refresh NEVER runs.
    // We set this to 7 days to match the refresh token lifetime.
    maxAge: 7 * 24 * 60 * 60,
    path: "/",
  });
}

/**
 * Clear the access token cookie on logout.
 */
export async function clearAccessToken(): Promise<void> {
  const cookieStore = await cookies();
  const isProduction = process.env.NODE_ENV === "production";

  // To reliably delete a secure cookie in modern browsers,
  // you must mirror the exact security attributes used when setting it.
  cookieStore.set(ACCESS_TOKEN_COOKIE, "", {
    httpOnly: true,
    secure: isProduction,
    sameSite: "strict",
    maxAge: 0,
    path: "/",
  });
}

/**
 * Decode the JWT payload without verifying the signature.
 * We NEVER trust this for authorization — NestJS guards do that.
 * We only use this on the Next.js server to read non-sensitive user metadata
 * (like userId) for display purposes without an extra API round-trip.
 */
export function decodeToken(token: string): TokenUser | null {
  try {
    const payload = token.split(".")[1];
    if (!payload) return null;

    // Safely decode base64url using standard Web APIs (Edge-compatible)
    const base64 = payload.replace(/-/g, "+").replace(/_/g, "/");
    const jsonPayload = decodeURIComponent(
      atob(base64)
        .split("")
        .map((c) => "%" + ("00" + c.charCodeAt(0).toString(16)).slice(-2))
        .join(""),
    );

    const decoded = JSON.parse(jsonPayload) as {
      sub?: string;
      exp?: number;
      iat?: number;
    };

    // JWT standard uses `sub` for the subject (userId) — map it explicitly
    if (!decoded.sub || !decoded.exp) return null;
    return {
      userId: decoded.sub,
      exp: decoded.exp,
      iat: decoded.iat ?? 0,
    };
  } catch {
    return null;
  }
}

/**
 * Check if a decoded JWT is expired.
 */
export function isTokenExpired(decoded: TokenUser): boolean {
  return decoded.exp * 1000 < Date.now();
}
