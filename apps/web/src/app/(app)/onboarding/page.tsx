// Onboarding will be fully built on Day 6.
// For now this page exists so loginAction can redirect here after a successful login.
import { getMyOrgsAction } from "@/actions/org.actions";
import { redirect } from "next/navigation";
import { CreateOrgForm } from "./CreateOrgForm";

export default async function OnboardingPage() {
  const orgs = await getMyOrgsAction();
  
  if (orgs && orgs.length > 0) {
    // If they already have an org, onboarding is complete, send them to dashboard
    redirect(`/${orgs[0].slug}/dashboard`);
  }

  return (
    <div style={{ display: "flex", height: "100vh", alignItems: "center", justifyContent: "center", background: "#f9fafb" }}>
      <div style={{ width: 400, padding: "2rem", background: "#fff", borderRadius: "8px", boxShadow: "0 4px 6px -1px rgb(0 0 0 / 0.1)" }}>
        <h1 style={{ fontSize: "1.5rem", fontWeight: 700, marginBottom: "0.5rem" }}>
          Welcome to SaaS Boilerplate
        </h1>
        <p style={{ color: "#6b7280", marginBottom: "2rem" }}>
          Let's create your first organization to get started.
        </p>
        <CreateOrgForm />
      </div>
    </div>
  );
}
