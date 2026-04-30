'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { motion } from 'framer-motion';

export default function DashboardSidebar() {
  const pathname = usePathname();

  const navItems = [
    {
      href: '/dashboard',
      label: 'Overview',
      icon: '📊',
    },
    {
      href: '/dashboard/jobs',
      label: 'Job Listings',
      icon: '💼',
    },
    {
      href: '/dashboard/applications',
      label: 'Applications',
      icon: '📝',
    },
    {
      href: '/dashboard/profile',
      label: 'Profile',
      icon: '👤',
    },
    {
      href: '/dashboard/settings',
      label: 'Settings',
      icon: '⚙️',
    },
  ];

  return (
    <aside className="w-64 bg-white border-r border-gray-200 shadow-sm flex flex-col">
      {/* Logo */}
      <div className="h-16 flex items-center justify-center border-b border-gray-200">
        <Link href="/" className="flex items-center gap-2 font-bold">
          <div className="w-8 h-8 bg-gradient-to-br from-blue-600 to-indigo-600 rounded-lg flex items-center justify-center text-white text-sm font-bold">
            J
          </div>
          <span className="text-gray-900">Job Agent</span>
        </Link>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-4 py-6 space-y-2">
        {navItems.map((item) => {
          const isActive = pathname === item.href || (item.href !== '/dashboard' && pathname.startsWith(item.href));

          return (
            <motion.div
              key={item.href}
              whileHover={{ x: 4 }}
              whileTap={{ scale: 0.98 }}
            >
              <Link
                href={item.href}
                className={`flex items-center gap-3 px-4 py-3 rounded-lg font-medium transition-all duration-200 ${
                  isActive
                    ? 'bg-blue-50 text-blue-600 border-l-4 border-blue-600'
                    : 'text-gray-700 hover:bg-gray-50'
                }`}
              >
                <span className="text-xl">{item.icon}</span>
                <span>{item.label}</span>
              </Link>
            </motion.div>
          );
        })}
      </nav>

      {/* Footer */}
      <div className="p-4 border-t border-gray-200">
        <button className="w-full px-4 py-3 text-gray-700 hover:bg-gray-50 rounded-lg font-medium transition-colors duration-200">
          Sign Out
        </button>
      </div>
    </aside>
  );
}
