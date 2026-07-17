"use client";

import { useActionState } from "react";
import { updateOrgAction } from "@/actions/org.actions";
import { FormState } from "@/actions/auth.actions";

const initialState: FormState = { success: false, error: "" };

export function SettingsForm({ orgId, initialName }: { orgId: string; initialName: string }) {
  const updateAction = updateOrgAction.bind(null, orgId);
  const [state, formAction, isPending] = useActionState(updateAction, initialState);

  return (
    <form action={formAction} style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
      <div>
        <label htmlFor="name" style={{ display: "block", fontSize: "0.875rem", fontWeight: 500, marginBottom: "0.5rem" }}>
          Organization Name
        </label>
        <input
          id="name"
          name="name"
          type="text"
          defaultValue={initialName}
          required
          style={{ width: "100%", padding: "0.5rem", border: "1px solid #d1d5db", borderRadius: "6px" }}
        />
      </div>

      {state.error && <div style={{ color: "red", fontSize: "0.875rem" }}>{state.error}</div>}
      {state.success && <div style={{ color: "green", fontSize: "0.875rem" }}>{state.message}</div>}

      <div style={{ display: "flex", justifyContent: "flex-end", marginTop: "1rem" }}>
        <button
          type="submit"
          disabled={isPending}
          style={{
            padding: "0.5rem 1.5rem",
            background: "#000",
            color: "#fff",
            borderRadius: "6px",
            fontWeight: 500,
            opacity: isPending ? 0.7 : 1,
            cursor: isPending ? "not-allowed" : "pointer"
          }}
        >
          {isPending ? "Saving..." : "Save Changes"}
        </button>
      </div>
    </form>
  );
}
