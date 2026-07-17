"use client";

import { createContext, useContext, useMemo } from "react";

export interface Organization {
  id: string;
  name: string;
  slug: string;
  logoUrl?: string | null;
  role: string;
}

interface OrgContextState {
  activeOrg: Organization | null;
  allOrgs: Organization[];
}

const OrgContext = createContext<OrgContextState | null>(null);

export function OrgProvider({
  children,
  activeOrg,
  allOrgs,
}: {
  children: React.ReactNode;
  activeOrg: Organization | null;
  allOrgs: Organization[];
}) {
  const value = useMemo(
    () => ({ activeOrg, allOrgs }),
    [activeOrg, allOrgs]
  );

  return <OrgContext.Provider value={value}>{children}</OrgContext.Provider>;
}

export function useOrg() {
  const context = useContext(OrgContext);
  if (!context) {
    throw new Error("useOrg must be used within an OrgProvider");
  }
  return context;
}
