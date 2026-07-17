import { Metadata } from "next";
import { getOrgMembersAction, getMyOrgsAction } from "@/actions/org.actions";
import { InviteMemberForm } from "./InviteMemberForm";
import { notFound } from "next/navigation";

export const metadata: Metadata = { title: "Members" };

export default async function MembersPage({
  params,
}: {
  params: Promise<{ orgSlug: string }>;
}) {
  const { orgSlug } = await params;
  
  const allOrgs = await getMyOrgsAction();
  const activeOrg = allOrgs.find((o) => o.slug === orgSlug);
  
  if (!activeOrg) return notFound();

  const members = await getOrgMembersAction(activeOrg.id);
  const canInvite = activeOrg.role === "ADMIN" || activeOrg.role === "OWNER";

  return (
    <div style={{ maxWidth: 800, margin: "0 auto" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "2rem" }}>
        <h1 style={{ fontSize: "2rem", fontWeight: 700 }}>Members</h1>
        {canInvite && <InviteMemberForm orgId={activeOrg.id} />}
      </div>

      <div style={{ background: "#fff", borderRadius: "8px", border: "1px solid #eee", overflow: "hidden" }}>
        <table style={{ width: "100%", borderCollapse: "collapse" }}>
          <thead style={{ background: "#f9fafb", borderBottom: "1px solid #eee", textAlign: "left" }}>
            <tr>
              <th style={{ padding: "1rem", fontWeight: 500, color: "#6b7280", fontSize: "0.875rem" }}>Name</th>
              <th style={{ padding: "1rem", fontWeight: 500, color: "#6b7280", fontSize: "0.875rem" }}>Email</th>
              <th style={{ padding: "1rem", fontWeight: 500, color: "#6b7280", fontSize: "0.875rem" }}>Role</th>
              <th style={{ padding: "1rem", fontWeight: 500, color: "#6b7280", fontSize: "0.875rem" }}>Joined</th>
            </tr>
          </thead>
          <tbody>
            {members.map((member: any) => (
              <tr key={member.id} style={{ borderBottom: "1px solid #eee" }}>
                <td style={{ padding: "1rem", fontSize: "0.875rem" }}>{member.user.name || "—"}</td>
                <td style={{ padding: "1rem", fontSize: "0.875rem" }}>{member.user.email}</td>
                <td style={{ padding: "1rem", fontSize: "0.875rem" }}>
                  <span style={{ 
                    padding: "0.25rem 0.5rem", 
                    background: member.role === "OWNER" ? "#fef3c7" : member.role === "ADMIN" ? "#dbeafe" : "#f3f4f6",
                    color: member.role === "OWNER" ? "#92400e" : member.role === "ADMIN" ? "#1e40af" : "#374151",
                    borderRadius: "9999px",
                    fontSize: "0.75rem",
                    fontWeight: 500
                  }}>
                    {member.role}
                  </span>
                </td>
                <td style={{ padding: "1rem", fontSize: "0.875rem", color: "#6b7280" }}>
                  {new Date(member.createdAt).toLocaleDateString()}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
