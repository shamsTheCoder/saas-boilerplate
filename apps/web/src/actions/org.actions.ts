"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { cache } from "react";
import { api } from "@/lib/api";
import { ROUTES } from "@/constants/routes";
import { FormState } from "@/actions/auth.actions";

/**
 * BUG 9 FIX: Wrapped with React cache() so multiple Server Components in the same render
 * tree (e.g. layout + page) share a single network request per render instead of firing
 * independently. cache() is automatically reset between requests — no stale data risk.
 */
export const getMyOrgsAction = cache(async () => {
  try {
    const res = await api.get("/orgs/my");
    if (!res.ok) return [];
    return (await res.json()) as any[];
  } catch {
    // Backend is unreachable — return empty array to avoid crashing the SSR layout
    return [];
  }
});

export async function createOrgAction(
  prevState: FormState,
  formData: FormData
): Promise<FormState> {
  const name = formData.get("name")?.toString();
  if (!name) return { success: false, error: "Organization name is required." };

  let newOrgSlug: string | null = null;
  try {
    const res = await api.post("/orgs", { name });
    const data = await res.json();
    if (!res.ok) {
      return { success: false, error: data.message || "Failed to create organization." };
    }
    revalidatePath("/", "layout");
    newOrgSlug = data.slug as string;
  } catch {
    return { success: false, error: "Unable to connect to the server." };
  }

  // BUG 14 FIX: Redirect to the new org dashboard — must be outside try/catch
  if (newOrgSlug) {
    redirect(ROUTES.DASHBOARD(newOrgSlug));
  }
  return { success: true, error: "", message: "Organization created" };
}

export async function updateOrgAction(
  orgId: string,
  prevState: FormState,
  formData: FormData
): Promise<FormState> {
  const name = formData.get("name")?.toString();
  
  try {
    const res = await api.patch(`/orgs/${orgId}`, { name });
    const data = await res.json();
    if (!res.ok) {
      return { success: false, error: data.message || "Failed to update organization." };
    }
    revalidatePath("/", "layout");
    return { success: true, error: "", message: "Organization updated" };
  } catch {
    return { success: false, error: "Unable to connect to the server." };
  }
}

export async function getOrgMembersAction(orgId: string) {
  try {
    const res = await api.get(`/orgs/${orgId}/members`);
    if (!res.ok) return [];
    return (await res.json()) as any[];
  } catch {
    // Backend is unreachable — return empty array instead of crashing the page
    return [];
  }
}

export async function inviteMemberAction(
  orgId: string,
  prevState: FormState,
  formData: FormData
): Promise<FormState> {
  const email = formData.get("email")?.toString();
  const role = formData.get("role")?.toString() || "MEMBER";

  if (!email) return { success: false, error: "Email is required." };

  try {
    const res = await api.post(`/orgs/${orgId}/invitations`, { email, role });
    const data = await res.json();
    if (!res.ok) {
      return { success: false, error: data.message || "Failed to invite member." };
    }
    return { success: true, error: "", message: "Invitation sent successfully." };
  } catch {
    return { success: false, error: "Unable to connect to the server." };
  }
}

export async function removeMemberAction(orgId: string, memberId: string) {
  try {
    const res = await api.delete(`/orgs/${orgId}/members/${memberId}`);
    if (!res.ok) throw new Error("Failed to remove member");
    revalidatePath("/", "layout");
    return { success: true };
  } catch {
    return { success: false };
  }
}

export async function acceptInvitationAction(token: string) {
  try {
    const res = await api.post("/orgs/invitations/accept", { token });
    if (!res.ok) return { success: false, error: "Invalid or expired invitation." };
    const data = await res.json();
    revalidatePath("/", "layout");
    return { success: true, ...data };
  } catch {
    return { success: false, error: "Unable to connect to the server." };
  }
}
