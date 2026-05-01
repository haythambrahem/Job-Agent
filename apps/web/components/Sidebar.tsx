"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut } from "next-auth/react";

const DASHBOARD_PATH = "/dashboard";

const NAV_ITEMS = [
  { icon: "🏠", label: "Dashboard", href: DASHBOARD_PATH },
  { icon: "💼", label: "My Jobs", href: "/jobs" },
  { icon: "📋", label: "Applications", href: "/applications" },
  { icon: "⚙️", label: "Settings", href: "/profile" },
  { icon: "💳", label: "Billing", href: "/billing" },
  { icon: "📚", label: "Documentation", href: "/docs" }
];

const isNavItemActive = (pathname: string, itemHref: string) =>
  pathname === itemHref || pathname.startsWith(`${itemHref}/`);

export default function Sidebar({
  email,
  plan
}: {
  email?: string;
  plan?: "free" | "pro" | "premium" | string;
}) {
  const pathname = usePathname();

  return (
    <aside
      className="w-full border-b border-gray-200 bg-white lg:sticky lg:top-0 lg:h-screen lg:w-64 lg:border-b-0 lg:border-r"
      aria-label="Main navigation"
    >
      <div className="flex h-full flex-col">
        <div className="px-6 py-6 border-b border-gray-200">
          <div className="flex items-center gap-4">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-blue-600 to-indigo-600 text-lg font-bold text-white">
              J
            </div>
            <div>
              <h2 className="text-base font-semibold text-gray-900">Job Agent</h2>
              <p className="text-xs text-gray-500">Dashboard</p>
            </div>
          </div>

          <div className="mt-6 rounded-xl border border-gray-200 bg-gray-50 p-4">
            <p className="text-sm font-semibold text-gray-900 truncate">{email}</p>
            {plan && (
              <span className="mt-2 inline-flex items-center rounded-full bg-blue-100 px-3 py-1 text-xs font-semibold text-blue-700 capitalize">
                {plan} Plan
              </span>
            )}
          </div>
        </div>

        <nav className="flex-1 px-4 py-4 space-y-2">
          {NAV_ITEMS.map((item) => {
            const active = isNavItemActive(pathname, item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center gap-3 rounded-lg border px-4 py-3 text-sm font-medium transition-all duration-200 ${
                  active
                    ? "border-blue-100 bg-blue-50 text-blue-700"
                    : "border-transparent text-gray-700 hover:border-gray-200 hover:bg-gray-50 hover:text-gray-900"
                }`}
              >
                <span className="text-base">{item.icon}</span>
                <span>{item.label}</span>
              </Link>
            );
          })}
        </nav>

        <div className="border-t border-gray-200 p-4">
          <button
            onClick={() => signOut({ callbackUrl: "/signin" })}
            className="w-full rounded-lg border border-gray-200 px-4 py-3 text-sm font-medium text-gray-700 transition-colors duration-200 hover:bg-gray-50"
          >
            Sign Out
          </button>
        </div>
      </div>
    </aside>
  );
}
