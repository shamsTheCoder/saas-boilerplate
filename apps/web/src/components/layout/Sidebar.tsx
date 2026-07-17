"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useOrg } from "@/providers/org-provider";
import { ROUTES } from "@/constants/routes";
import {
  LuLayoutDashboard,
  LuUsers,
  LuSettings,
  LuChevronDown,
} from "react-icons/lu";

export function Sidebar() {
  const { activeOrg, allOrgs } = useOrg();
  const pathname = usePathname();

  if (!activeOrg) return null;

  const orgPath = `/${activeOrg.slug}`;

  const navItems = [
    { label: "Dashboard", href: `${orgPath}/dashboard`, icon: LuLayoutDashboard, roles: ["OWNER", "ADMIN", "MEMBER"] },
    { label: "Members", href: `${orgPath}/members`, icon: LuUsers, roles: ["OWNER", "ADMIN", "MEMBER"] },
    { label: "Settings", href: `${orgPath}/settings`, icon: LuSettings, roles: ["OWNER", "ADMIN"] },
  ];

  return (
    <aside style={{ width: 250, borderRight: "1px solid #eee", padding: "1rem", display: "flex", flexDirection: "column", height: "100vh" }}>
      <div style={{ marginBottom: "2rem", display: "flex", alignItems: "center", justifyContent: "space-between", cursor: "pointer", padding: "0.5rem", borderRadius: "8px", background: "#f9fafb" }}>
        <div style={{ fontWeight: 600 }}>{activeOrg.name}</div>
        <LuChevronDown size={16} />
      </div>

      <nav style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
        {navItems.map((item) => {
          if (!item.roles.includes(activeOrg.role)) return null;

          const isActive = pathname.startsWith(item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              style={{
                display: "flex",
                alignItems: "center",
                gap: "0.75rem",
                padding: "0.5rem 0.75rem",
                borderRadius: "6px",
                textDecoration: "none",
                color: isActive ? "#000" : "#6b7280",
                background: isActive ? "#f3f4f6" : "transparent",
                fontWeight: isActive ? 500 : 400,
              }}
            >
              <item.icon size={18} />
              {item.label}
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}
