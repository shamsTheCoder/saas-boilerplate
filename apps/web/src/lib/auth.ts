import 'server-only';
import { cookies } from 'next/headers';

const ACCESS_TOKEN_COOKIE = 'access_token';
const COOKIE_MAX_AGE = 15 * 60; // 15 minutes — matches the JWT TTL on NestJS

export interface TokenUser {
  userId: string;
  exp: number;
  iat: number;
}

/**
 * Read the access token from the httpOnly server-side cookie.
 * Returns undefined if no cookie is set.
 * Marked `server-only` — cannot be imported by Client Components.
 */
export async function getAccessToken(): Promise<string | undefined> {
  const cookieStore = await cookies();
  return cookieStore.get(ACCESS_TOKEN_COOKIE)?.value;
}

/**
 * Store the access token as a secure httpOnly cookie.
 * Called from Server Actions after a successful login or token refresh.
 */
export async function setAccessToken(token: string): Promise<void> {
  const cookieStore = await cookies();
  const isProduction = process.env.NODE_ENV === 'production';

  cookieStore.set(ACCESS_TOKEN_COOKIE, token, {
    httpOnly: true,
    secure: isProduction,
    sameSite: 'strict',
    // BUG FIX: Must live longer than the 15min JWT TTL!
    // If the browser deletes the cookie at 15 minutes, proxy.ts gets undefined
    // and instantly redirects to login, meaning silent refresh NEVER runs.
    // We set this to 7 days to match the refresh token lifetime.
    maxAge: 7 * 24 * 60 * 60,
    path: '/',
  });
}

/**
 * Clear the access token cookie on logout.
 */
export async function clearAccessToken(): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.delete(ACCESS_TOKEN_COOKIE);
}

/**
 * Decode the JWT payload without verifying the signature.
 * We NEVER trust this for authorization — NestJS guards do that.
 * We only use this on the Next.js server to read non-sensitive user metadata
 * (like userId) for display purposes without an extra API round-trip.
 */
export function decodeToken(token: string): TokenUser | null {
  try {
    const payload = token.split('.')[1];
    if (!payload) return null;
    const decoded = JSON.parse(Buffer.from(payload, 'base64url').toString('utf-8')) as {
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
