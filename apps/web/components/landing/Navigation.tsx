"use client";

import Link from "next/link";

export default function Navigation() {
  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-slate-950/80 backdrop-blur-md border-b border-slate-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex items-center justify-between">
        <Link href="/" className="font-bold text-xl text-white">
          Job Agent
        </Link>
        
        <div className="hidden md:flex items-center gap-8">
          <Link href="/blog" className="text-slate-300 hover:text-white transition">
            Blog
          </Link>
          <Link href="/faq" className="text-slate-300 hover:text-white transition">
            FAQ
          </Link>
          <Link href="/pricing" className="text-slate-300 hover:text-white transition">
            Pricing
          </Link>
          <Link href="#" className="text-slate-300 hover:text-white transition">
            Docs
          </Link>
        </div>

        <div className="flex items-center gap-4">
          <Link
            href="/signin"
            className="text-slate-300 hover:text-white transition"
          >
            Sign In
          </Link>
          <Link
            href="/signup"
            className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-full font-medium transition"
          >
            Get Started
          </Link>
        </div>
      </div>
    </nav>
  );
}
