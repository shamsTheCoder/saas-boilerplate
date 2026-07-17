"use client";

import { ReactNode } from "react";
import { Sidebar } from "./Sidebar";
import { OrgProvider, Organization } from "@/providers/org-provider";

export function AppShell({
  children,
  activeOrg,
  allOrgs,
}: {
  children: ReactNode;
  activeOrg: Organization | null;
  allOrgs: Organization[];
}) {
  return (
    <OrgProvider activeOrg={activeOrg} allOrgs={allOrgs}>
      <div style={{ display: "flex", minHeight: "100vh" }}>
        {activeOrg && <Sidebar />}
        <div style={{ flex: 1, display: "flex", flexDirection: "column" }}>
          <header style={{ height: 64, borderBottom: "1px solid #eee", display: "flex", alignItems: "center", padding: "0 2rem" }}>
            <div style={{ marginLeft: "auto", display: "flex", gap: "1rem", alignItems: "center" }}>
              {/* User profile dropdown goes here */}
              <div style={{ width: 32, height: 32, borderRadius: "50%", background: "#ccc" }} />
            </div>
          </header>
          <main style={{ flex: 1, padding: "2rem", overflow: "auto" }}>
            {children}
          </main>
        </div>
      </div>
    </OrgProvider>
  );
}
