"use client";

import Link from "next/link";

export default function Hero() {
  return (
    <section className="pt-32 pb-24 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
      <div className="grid md:grid-cols-2 gap-12 items-center">
        <div className="space-y-8">
          <h1 className="text-5xl md:text-6xl font-bold text-white leading-tight text-balance">
            Automate Your Job Applications
          </h1>
          <p className="text-xl text-slate-300 leading-relaxed text-balance">
            Stop wasting hours on job applications. Job Agent uses AI to automate your applications, match you with opportunities, and help you land your dream job faster.
          </p>
          
          <div className="flex flex-col sm:flex-row gap-4">
            <Link
              href="/signup"
              className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-4 rounded-full font-semibold text-lg transition inline-flex items-center justify-center"
            >
              Get Started Free
            </Link>
            <Link
              href="#how-it-works"
              className="border border-slate-600 hover:border-slate-400 text-white px-8 py-4 rounded-full font-semibold text-lg transition inline-flex items-center justify-center"
            >
              See How It Works
            </Link>
          </div>

          <p className="text-sm text-slate-400">
            ✓ No credit card required · ✓ Free for 14 days · ✓ Cancel anytime
          </p>
        </div>

        <div className="relative hidden md:block">
          <div className="absolute inset-0 bg-gradient-to-r from-blue-600 to-purple-600 rounded-3xl blur-3xl opacity-20" />
          <div className="relative bg-gradient-to-br from-slate-800 to-slate-900 border border-slate-700 rounded-3xl p-8 h-96">
            <div className="space-y-4">
              <div className="h-4 bg-slate-700 rounded w-3/4" />
              <div className="h-4 bg-slate-700 rounded w-full" />
              <div className="h-4 bg-slate-700 rounded w-5/6" />
            </div>
            <div className="mt-8 space-y-2">
              <div className="h-3 bg-blue-600/30 rounded w-1/2" />
              <div className="h-3 bg-blue-600/30 rounded w-2/3" />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
