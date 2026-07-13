// This layout wraps every page inside the authenticated app shell.
// proxy.ts will live here once we build auth on Day 4 —
// it checks the JWT cookie and redirects to /login if it's missing or expired.
export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <div>
      {/* Sidebar and top nav go here — Day 2 scaffold, real UI on Day 4 */}
      <main>{children}</main>
    </div>
  );
}
