"use client";

import { useActionState, useState, useEffect, useRef } from "react";
import { inviteMemberAction } from "@/actions/org.actions";
import { FormState } from "@/actions/auth.actions";

const initialState: FormState = { success: false, error: "" };

export function InviteMemberForm({ orgId }: { orgId: string }) {
  const [isOpen, setIsOpen] = useState(false);
  const formRef = useRef<HTMLFormElement>(null);

  // Bind orgId to the server action
  const inviteAction = inviteMemberAction.bind(null, orgId);
  const [state, formAction, isPending] = useActionState(inviteAction, initialState);

  // BUG 12 FIX: Auto-close modal and reset the form after a successful invite
  useEffect(() => {
    if (state.success) {
      const timer = setTimeout(() => {
        setIsOpen(false);
        formRef.current?.reset();
      }, 1500); // Brief pause so the user can see the green success message
      return () => clearTimeout(timer);
    }
  }, [state.success]);

  if (!isOpen) {
    return (
      <button
        onClick={() => setIsOpen(true)}
        style={{ padding: "0.5rem 1rem", background: "#000", color: "#fff", borderRadius: "6px", fontSize: "0.875rem", fontWeight: 500 }}
      >
        Invite Member
      </button>
    );
  }

  return (
    <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.5)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 50 }}>
      <div style={{ background: "#fff", padding: "2rem", borderRadius: "8px", width: 400 }}>
        <h2 style={{ fontSize: "1.25rem", fontWeight: 600, marginBottom: "1rem" }}>Invite Team Member</h2>

        <form ref={formRef} action={formAction} style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
          <div>
            <label style={{ display: "block", fontSize: "0.875rem", fontWeight: 500, marginBottom: "0.25rem" }}>Email Address</label>
            <input name="email" type="email" required style={{ width: "100%", padding: "0.5rem", border: "1px solid #d1d5db", borderRadius: "6px" }} />
          </div>

          <div>
            <label style={{ display: "block", fontSize: "0.875rem", fontWeight: 500, marginBottom: "0.25rem" }}>Role</label>
            <select name="role" style={{ width: "100%", padding: "0.5rem", border: "1px solid #d1d5db", borderRadius: "6px" }}>
              <option value="MEMBER">Member</option>
              <option value="ADMIN">Admin</option>
            </select>
          </div>

          {state.error && <div style={{ color: "red", fontSize: "0.875rem" }}>{state.error}</div>}
          {state.success && <div style={{ color: "green", fontSize: "0.875rem" }}>✓ {state.message} — closing...</div>}

          <div style={{ display: "flex", justifyContent: "flex-end", gap: "0.5rem", marginTop: "1rem" }}>
            <button type="button" onClick={() => setIsOpen(false)} style={{ padding: "0.5rem 1rem", borderRadius: "6px", fontWeight: 500 }}>Cancel</button>
            <button type="submit" disabled={isPending || state.success} style={{ padding: "0.5rem 1rem", background: "#000", color: "#fff", borderRadius: "6px", fontWeight: 500 }}>
              {isPending ? "Sending..." : "Send Invite"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

