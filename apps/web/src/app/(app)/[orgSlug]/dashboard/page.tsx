import { Metadata } from "next";

export const metadata: Metadata = { title: "Dashboard" };

export default async function DashboardPage({
  params,
}: {
  params: Promise<{ orgSlug: string }>;
}) {
  const { orgSlug } = await params;
  return (
    <div style={{ maxWidth: 800, margin: "0 auto" }}>
      <h1 style={{ fontSize: "2rem", fontWeight: 700, marginBottom: "1rem" }}>
        Overview
      </h1>
      <div style={{ padding: "2rem", background: "#fff", borderRadius: "8px", border: "1px solid #eee" }}>
        <p style={{ color: "#4b5563" }}>
          Welcome to the <strong>{orgSlug}</strong> dashboard. Multi-tenancy is now fully operational!
        </p>
      </div>
    </div>
  );
}
