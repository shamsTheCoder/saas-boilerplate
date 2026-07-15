import { proxy } from '@/lib/proxy';
import { AuthProvider } from '@/providers/auth-provider';

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  // 🔒 Route guard — redirects unauthenticated or expired sessions to /login.
  // Silent token refresh happens here automatically.
  const { userId } = await proxy();

  return (
    <AuthProvider user={{ userId }}>
      <div>
        {/* Sidebar and top nav go here on Day 6 */}
        <main>{children}</main>
      </div>
    </AuthProvider>
  );
}
