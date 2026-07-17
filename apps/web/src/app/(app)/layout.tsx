import { proxy } from '@/lib/proxy';
import { AuthProvider } from '@/providers/auth-provider';
import { getMyOrgsAction } from '@/actions/org.actions';
import { redirect } from 'next/navigation';
import { ROUTES } from '@/constants/routes';

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const { userId } = await proxy();

  // If the backend says onboarding isn't complete, force them to onboarding wizard
  // (unless they are already on the onboarding page, handled via route matching)
  // We can't check pathname in Server Components, so we'll do this check differently,
  // or let the proxy handle it. For now, let's just provide auth.

  return (
    <AuthProvider user={{ userId }}>
      {children}
    </AuthProvider>
  );
}
