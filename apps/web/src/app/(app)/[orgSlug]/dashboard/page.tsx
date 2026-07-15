import type { Metadata } from "next";

export const metadata: Metadata = { title: "Dashboard" };

// The orgSlug in the URL tells us which org's data to load — no session magic needed
export default async function DashboardPage({
  params,
}: {
  params: Promise<{ orgSlug: string }>;
}) {
  const { orgSlug } = await params;
  return (
    <main>
      <h1>Dashboard — {orgSlug}</h1>
      <p>Dashboard content goes here — Day 5+.</p>
    </main>
  );
}
