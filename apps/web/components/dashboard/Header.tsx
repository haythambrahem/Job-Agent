'use client';

import { motion } from 'framer-motion';
import Link from 'next/link';

export default function DashboardHeader() {
  return (
    <header className="h-16 bg-white border-b border-gray-200 shadow-sm flex items-center justify-between px-8">
      {/* Left Side - Title placeholder */}
      <div className="flex-1">
        {/* Page title will be updated by individual pages */}
      </div>

      {/* Right Side - User Actions */}
      <div className="flex items-center gap-4">
        {/* Notifications */}
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          className="p-2 hover:bg-gray-100 rounded-lg transition-colors duration-200 relative"
        >
          <span className="text-xl">🔔</span>
          <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full"></span>
        </motion.button>

        {/* User Menu */}
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          className="flex items-center gap-3 px-4 py-2 hover:bg-gray-100 rounded-lg transition-colors duration-200"
        >
          <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-indigo-500 rounded-full flex items-center justify-center text-white text-sm font-bold">
            JD
          </div>
          <div className="text-left hidden sm:block">
            <p className="text-sm font-medium text-gray-900">John Doe</p>
            <p className="text-xs text-gray-500">john@example.com</p>
          </div>
        </motion.button>
      </div>
    </header>
  );
}
