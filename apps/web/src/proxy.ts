// This is the BFF auth guard — called at the top of (app)/layout.tsx.
// It runs on the Next.js server so it has full access to cookies and can redirect.
// Full implementation comes on Day 4 once the auth endpoints are ready.

import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';

export async function requireAuth(): Promise<{ userId: string; orgSlug?: string }> {
  const cookieStore = cookies();
  const accessToken = cookieStore.get('access_token')?.value;

  // Nothing in the cookie jar — send them to login
  if (!accessToken) {
    redirect('/login');
  }

  // TODO Day 4: Validate the JWT, attempt a refresh if expired, and extract the user payload.
  // For now we just confirm the cookie exists so the scaffold builds without errors.
  return { userId: 'stub' };
}
