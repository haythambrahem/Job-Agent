"use client";

import { useState } from "react";

export default function Topbar({ email }: { email?: string }) {
  const [searchOpen, setSearchOpen] = useState(false);

  return (
    <div className="sticky top-0 z-40 bg-white border-b border-gray-200">
      <div className="flex items-center justify-between h-16 px-6 gap-6">
        {/* Search Bar */}
        <div className="flex-1 max-w-md">
          <div className="relative">
            <input
              type="text"
              placeholder="Search jobs by title or company..."
              className="w-full px-4 py-2 text-sm border border-gray-300 rounded-lg bg-gray-50 focus:bg-white focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
              onFocus={() => setSearchOpen(true)}
              onBlur={() => setSearchOpen(false)}
            />
            <span className="absolute right-3 top-2.5 text-gray-400 text-sm">⌘K</span>
          </div>
        </div>

        {/* Right Actions */}
        <div className="flex items-center gap-4">
          {/* Notifications */}
          <button
            className="relative p-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors duration-200"
            aria-label="Notifications"
          >
            <span className="text-xl">🔔</span>
            <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full"></span>
          </button>

          {/* Upgrade Button */}
          <button
            className="px-4 py-2 text-sm font-semibold text-blue-600 hover:bg-blue-50 rounded-lg transition-colors duration-200"
            aria-label="Upgrade to premium plan"
          >
            ⭐ Upgrade
          </button>

          {/* User Profile Dropdown */}
          <div className="relative group">
            <button className="flex items-center gap-2 px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100 rounded-lg transition-colors duration-200">
              <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-indigo-500 rounded-lg flex items-center justify-center text-white text-sm font-bold">
                {email?.charAt(0).toUpperCase() || "U"}
              </div>
              <span className="hidden sm:inline">{email?.split("@")[0]}</span>
            </button>

            {/* Dropdown Menu */}
            <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg border border-gray-200 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200">
              <div className="px-4 py-3 border-b border-gray-100">
                <p className="text-sm font-medium text-gray-900">{email}</p>
              </div>
              <a href="/profile" className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-50">
                Profile Settings
              </a>
              <a href="/billing" className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-50">
                Billing
              </a>
              <hr className="my-2" />
              <a href="#" className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-50">
                Documentation
              </a>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
