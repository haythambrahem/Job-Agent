"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut } from "next-auth/react";

const NAV_ITEMS = [
  { icon: "🏠", label: "Dashboard", href: "/dashboard" },
  { icon: "💼", label: "My Jobs", href: "/jobs" },
  { icon: "📋", label: "Applications", href: "/applications" },
  { icon: "⚙️", label: "Settings", href: "/profile" },
  { icon: "💳", label: "Billing", href: "/billing" },
  { icon: "📚", label: "Documentation", href: "/docs" }
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
    <aside className="w-64 bg-white border-r border-gray-200 flex flex-col min-h-screen">
      {/* Logo & Branding */}
      <div className="px-6 py-8 border-b border-gray-200">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 bg-gradient-to-br from-blue-600 to-indigo-600 rounded-lg flex items-center justify-center text-white font-bold text-lg">
            J
          </div>
          <div>
            <h2 className="text-lg font-bold text-gray-900">Job Agent</h2>
          </div>
        </div>

        {/* User Info */}
        <div className="bg-gray-50 rounded-lg p-4">
          <p className="text-sm font-medium text-gray-900 truncate">{email}</p>
          {plan && (
            <span className="inline-block mt-2 px-3 py-1 bg-blue-100 text-blue-700 text-xs font-semibold rounded-full capitalize">
              {plan} Plan
            </span>
          )}
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-4 py-6 space-y-2">
        {NAV_ITEMS.map((item) => {
          const active = pathname === item.href || (pathname.startsWith(item.href) && item.href !== "/dashboard");
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center gap-3 px-4 py-3 rounded-lg font-medium transition-all duration-200 ${
                active
                  ? "bg-blue-50 text-blue-600 border-l-4 border-blue-600"
                  : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
              }`}
            >
              <span className="text-lg">{item.icon}</span>
              <span>{item.label}</span>
            </Link>
          );
        })}
      </nav>

      {/* Sign Out Button */}
      <div className="p-4 border-t border-gray-200">
        <button
          onClick={() => signOut({ callbackUrl: "/signin" })}
          className="w-full px-4 py-3 text-gray-700 font-medium hover:bg-gray-100 rounded-lg transition-all duration-200 border border-gray-200"
        >
          Sign Out
        </button>
      </div>
    </aside>
  );
}
