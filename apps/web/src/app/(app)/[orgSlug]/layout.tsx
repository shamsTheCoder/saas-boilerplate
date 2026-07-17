import { getMyOrgsAction } from "@/actions/org.actions";
import { AppShell } from "@/components/layout/AppShell";
import { notFound, redirect } from "next/navigation";
import { ROUTES } from "@/constants/routes";

export default async function OrgLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ orgSlug: string }>;
}) {
  const { orgSlug } = await params;
  
  // Fetch all orgs the user is a member of
  const allOrgs = await getMyOrgsAction();
  
  if (!allOrgs || allOrgs.length === 0) {
    redirect(ROUTES.ONBOARDING);
  }

  // Find the active organization based on the URL slug
  const activeOrg = allOrgs.find((o) => o.slug === orgSlug);

  if (!activeOrg) {
    // If the user tries to access an org they don't belong to, redirect to their first org
    redirect(`/${allOrgs[0].slug}/dashboard`);
  }

  return (
    <AppShell activeOrg={activeOrg} allOrgs={allOrgs}>
      {children}
    </AppShell>
  );
}
