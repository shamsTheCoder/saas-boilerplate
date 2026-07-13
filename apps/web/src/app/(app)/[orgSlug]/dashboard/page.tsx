import type { Metadata } from 'next';

export const metadata: Metadata = { title: 'Dashboard' };

// The orgSlug in the URL tells us which org's data to load — no session magic needed
export default function DashboardPage({ params }: { params: { orgSlug: string } }) {
  return (
    <main>
      <h1>Dashboard — {params.orgSlug}</h1>
      <p>Dashboard content goes here — Day 5+.</p>
    </main>
  );
}
