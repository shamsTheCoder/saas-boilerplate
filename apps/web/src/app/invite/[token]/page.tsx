import type { Metadata } from "next";
import { redirect } from "next/navigation";
import Link from "next/link";
import { acceptInvitationAction } from "@/actions/org.actions";
import { ROUTES } from "@/constants/routes";
import { getAccessToken, decodeToken, isTokenExpired } from "@/lib/auth";
import { cookies } from "next/headers";

export const metadata: Metadata = { title: "Accept Invitation" };

/**
 * Invite acceptance page — handles the full journey:
 *
 * 1. User is NOT logged in → show "Login to accept" UI with the token in a query param
 *    so they can be redirected back here after auth.
 * 2. User IS logged in → immediately call acceptInvitation on the server and redirect to
 *    the org dashboard on success, or show a clear error on failure.
 *
 * Security note: The backend enforces that the logged-in user's email matches the
 * invited email. If they're the wrong user, a 403 is returned and shown here.
 */
export default async function InvitePage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = await params;

  // ── Check auth state ──────────────────────────────────────────────────────
  const accessToken = await getAccessToken();
  const decoded = accessToken ? decodeToken(accessToken) : null;
  const isAuthenticated = decoded && !isTokenExpired(decoded);

  // ── Not logged in — prompt to sign in ─────────────────────────────────────
  if (!isAuthenticated) {
    return (
      <main
        style={{
          minHeight: "100vh",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: "#f9fafb",
          padding: "2rem",
        }}
      >
        <div
          style={{
            maxWidth: 420,
            width: "100%",
            background: "#fff",
            borderRadius: "12px",
            padding: "2.5rem",
            boxShadow: "0 4px 24px rgba(0,0,0,0.08)",
            textAlign: "center",
          }}
        >
          <div style={{ fontSize: "2.5rem", marginBottom: "1rem" }}>📨</div>
          <h1 style={{ fontSize: "1.5rem", fontWeight: 700, marginBottom: "0.5rem" }}>
            You've been invited!
          </h1>
          <p style={{ color: "#6b7280", lineHeight: 1.6, marginBottom: "2rem" }}>
            To accept this invitation, please sign in or create an account with
            the email address the invite was sent to.
          </p>
          <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
            <Link
              href={`${ROUTES.LOGIN}?redirect=/invite/${token}`}
              style={{
                display: "block",
                padding: "0.75rem 1.5rem",
                background: "#000",
                color: "#fff",
                borderRadius: "8px",
                textDecoration: "none",
                fontWeight: 600,
                fontSize: "0.95rem",
              }}
            >
              Sign in to accept
            </Link>
            <Link
              href={`${ROUTES.REGISTER}?redirect=/invite/${token}`}
              style={{
                display: "block",
                padding: "0.75rem 1.5rem",
                background: "#f3f4f6",
                color: "#374151",
                borderRadius: "8px",
                textDecoration: "none",
                fontWeight: 600,
                fontSize: "0.95rem",
              }}
            >
              Create a new account
            </Link>
          </div>
        </div>
      </main>
    );
  }

  // ── Logged in — accept the invitation server-side ─────────────────────────
  const result = await acceptInvitationAction(token);

  if (result.success && result.orgSlug) {
    // Navigate directly to the new org's dashboard
    redirect(ROUTES.DASHBOARD(result.orgSlug as string));
  }

  // ── Error state ───────────────────────────────────────────────────────────
  const errorMessage =
    result.error ??
    "Something went wrong. The invitation may have expired or already been used.";

  return (
    <main
      style={{
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background: "#f9fafb",
        padding: "2rem",
      }}
    >
      <div
        style={{
          maxWidth: 420,
          width: "100%",
          background: "#fff",
          borderRadius: "12px",
          padding: "2.5rem",
          boxShadow: "0 4px 24px rgba(0,0,0,0.08)",
          textAlign: "center",
        }}
      >
        <div style={{ fontSize: "2.5rem", marginBottom: "1rem" }}>⚠️</div>
        <h1 style={{ fontSize: "1.5rem", fontWeight: 700, marginBottom: "0.5rem", color: "#dc2626" }}>
          Invitation failed
        </h1>
        <p style={{ color: "#6b7280", lineHeight: 1.6, marginBottom: "2rem" }}>
          {errorMessage}
        </p>
        <Link
          href={ROUTES.HOME}
          style={{
            display: "inline-block",
            padding: "0.75rem 1.5rem",
            background: "#000",
            color: "#fff",
            borderRadius: "8px",
            textDecoration: "none",
            fontWeight: 600,
          }}
        >
          Go to dashboard
        </Link>
      </div>
    </main>
  );
}
