"use client";

import { useActionState } from "react";
import { createOrgAction } from "@/actions/org.actions";
import { FormState } from "@/actions/auth.actions";

const initialState: FormState = { success: false, error: "" };

export function CreateOrgForm() {
  const [state, formAction, isPending] = useActionState(
    createOrgAction,
    initialState
  );

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
          required
          style={{ width: "100%", padding: "0.5rem", border: "1px solid #d1d5db", borderRadius: "6px" }}
          placeholder="e.g. Acme Corp"
        />
      </div>

      {state.error && <div style={{ color: "red", fontSize: "0.875rem" }}>{state.error}</div>}

      <button
        type="submit"
        disabled={isPending}
        style={{
          width: "100%",
          padding: "0.5rem",
          background: "#000",
          color: "#fff",
          borderRadius: "6px",
          fontWeight: 500,
          opacity: isPending ? 0.7 : 1,
          cursor: isPending ? "not-allowed" : "pointer"
        }}
      >
        {isPending ? "Creating..." : "Create Organization"}
      </button>
    </form>
  );
}
