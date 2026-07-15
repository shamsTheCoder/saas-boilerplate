import 'server-only';
import { redirect } from 'next/navigation';
import { cookies } from 'next/headers';
import { clearAccessToken, decodeToken, getAccessToken, isTokenExpired, setAccessToken } from '@/lib/auth';
import { ROUTES } from '@/constants/routes';

const API_URL = process.env.API_URL ?? 'http://localhost:3001';

/**
 * Route guard — must be called at the top of every authenticated layout.
 *
 * Flow:
 * 1. Read access_token httpOnly cookie
 * 2. If missing → redirect to /login
 * 3. If present but valid → pass through (returns decoded user)
 * 4. If expired → silently refresh via NestJS /auth/refresh (uses refresh_token cookie forwarded to API)
 * 5. If refresh fails → clear cookies → redirect to /login
 *
 * Returns the decoded token payload for use in the layout/page.
 */
export async function proxy(): Promise<{ userId: string }> {
  const accessToken = await getAccessToken();

  // No token at all → go to login
  if (!accessToken) {
    redirect(ROUTES.LOGIN);
  }

  const decoded = decodeToken(accessToken);

  if (!decoded) {
    await clearAccessToken();
    redirect(ROUTES.LOGIN);
  }

  // Token still valid — nothing to do
  if (!isTokenExpired(decoded)) {
    return { userId: decoded.userId };
  }

  // Token expired — attempt a silent refresh
  // We forward ALL cookies from the Next.js request to NestJS so it can
  // read the httpOnly refresh_token cookie it set during login.
  const cookieStore = await cookies();
  const allCookies = cookieStore.getAll().map((c) => `${c.name}=${c.value}`).join('; ');

  try {
    const refreshRes = await fetch(`${API_URL}/api/v1/auth/refresh`, {
      method: 'POST',
      headers: { Cookie: allCookies },
      credentials: 'include',
      cache: 'no-store',
    });

    if (!refreshRes.ok) {
      await clearAccessToken();
      redirect(ROUTES.LOGIN);
    }

    const { accessToken: newAccessToken } = (await refreshRes.json()) as { accessToken: string };
    await setAccessToken(newAccessToken);

    const newDecoded = decodeToken(newAccessToken);
    if (!newDecoded) {
      await clearAccessToken();
      redirect(ROUTES.LOGIN);
    }

    return { userId: newDecoded.userId };
  } catch {
    await clearAccessToken();
    redirect(ROUTES.LOGIN);
  }
}
