import { Metadata } from "next";
import { getMyOrgsAction } from "@/actions/org.actions";
import { notFound, redirect } from "next/navigation";
import { SettingsForm } from "./SettingsForm";

export const metadata: Metadata = { title: "Settings" };

export default async function SettingsPage({
  params,
}: {
  params: Promise<{ orgSlug: string }>;
}) {
  const { orgSlug } = await params;

  const allOrgs = await getMyOrgsAction();
  const activeOrg = allOrgs.find((o) => o.slug === orgSlug);

  if (!activeOrg) return notFound();

  // BUG 13 FIX: Use redirect() instead of rendering an "Access Denied" div.
  // MEMBERs have no business reaching this SSR pipeline at all — redirect cleanly.
  if (activeOrg.role === "MEMBER") {
    redirect(`/${orgSlug}/dashboard`);
  }


  return (
    <div style={{ maxWidth: 600, margin: "0 auto" }}>
      <h1 style={{ fontSize: "2rem", fontWeight: 700, marginBottom: "2rem" }}>
        Organization Settings
      </h1>

      <div style={{ background: "#fff", padding: "2rem", borderRadius: "8px", border: "1px solid #eee" }}>
        <h2 style={{ fontSize: "1.25rem", fontWeight: 600, marginBottom: "1rem" }}>General Profile</h2>
        <SettingsForm orgId={activeOrg.id} initialName={activeOrg.name} />
      </div>
    </div>
  );
}
