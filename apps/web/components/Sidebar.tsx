"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut } from "next-auth/react";

const NAV_ITEMS = [
  { label: "Dashboard", href: "/dashboard" },
  { label: "My Jobs", href: "/jobs" },
  { label: "Applications", href: "/applications" },
  { label: "Profile", href: "/profile" },
  { label: "Billing", href: "/billing" }
];

export default function Sidebar({
  email,
  plan
}: {
  email?: string;
  plan?: "free" | "pro" | "premium" | string;
}) {
  const pathname = usePathname();

  return (
    <aside style={{ width: "var(--sidebar-width)", background: "#0f172a", color: "white", padding: 20 }}>
      <h2>Job Agent SaaS</h2>
      {email ? <p style={{ fontSize: 13, opacity: 0.8 }}>{email}</p> : null}
      {plan ? <p style={{ fontSize: 13, opacity: 0.8 }}>Plan: {plan}</p> : null}
      <nav style={{ display: "grid", gap: 8, marginTop: 16 }}>
        {NAV_ITEMS.map((item) => {
          const active = pathname === item.href;
          return (
            <Link
              key={item.href}
              href={item.href}
              style={{
                padding: "8px 10px",
                borderRadius: "var(--radius-md)",
                background: active ? "#1e293b" : "transparent",
                textDecoration: "none"
              }}
            >
              {item.label}
            </Link>
          );
        })}
      </nav>
      <button onClick={() => signOut({ callbackUrl: "/signin" })} style={{ marginTop: 16 }}>
        Sign out
      </button>
    </aside>
  );
}
