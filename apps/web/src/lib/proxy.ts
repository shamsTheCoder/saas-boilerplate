import "server-only";
import { redirect } from "next/navigation";
import { getAccessToken, decodeToken, isTokenExpired } from "@/lib/auth";
import { ROUTES } from "@/constants/routes";
import { headers } from "next/headers";

/**
 * Route guard — must be called at the top of every authenticated layout.
 *
 * Flow:
 * 1. Read access_token from the middleware or cookies.
 * 2. If missing or expired (meaning middleware failed to refresh it) → redirect to /login
 * 3. If valid → pass through (returns decoded user)
 *
 * Note: Token refresh is handled entirely by src/middleware.ts. This Server Component
 * is strictly read-only and never mutates cookies.
 */
export async function proxy(): Promise<{ userId: string }> {
  // getAccessToken handles both cookies and middleware injected headers automatically
  const accessToken = await getAccessToken();

  if (!accessToken) {
    redirect(ROUTES.LOGIN);
  }

  const decoded = decodeToken(accessToken);

  // If token is missing, malformed, or expired (and middleware didn't refresh it), redirect
  if (!decoded || isTokenExpired(decoded)) {
    redirect(ROUTES.LOGIN);
  }

  return { userId: decoded.userId };
}
