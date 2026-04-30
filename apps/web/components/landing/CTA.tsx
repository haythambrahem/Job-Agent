"use client";

import Link from "next/link";

export default function CTA() {
  return (
    <section className="py-24 px-4 sm:px-6 lg:px-8 bg-gradient-to-r from-blue-600/20 to-purple-600/20 border-t border-slate-700">
      <div className="max-w-4xl mx-auto text-center">
        <h2 className="text-4xl md:text-5xl font-bold text-white mb-6 text-balance">
          Ready to Automate Your Job Search?
        </h2>
        <p className="text-xl text-slate-300 mb-8 text-balance">
          Stop wasting time on manual job applications. Start with Job Agent today and focus on what matters—landing your dream job.
        </p>
        
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Link
            href="/signup"
            className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-4 rounded-full font-semibold text-lg transition"
          >
            Get Started Free
          </Link>
          <Link
            href="#"
            className="border border-blue-600 text-blue-400 hover:bg-blue-600/10 px-8 py-4 rounded-full font-semibold text-lg transition"
          >
            Schedule Demo
          </Link>
        </div>

        <p className="text-slate-400 mt-8 text-sm">
          No credit card required · Free 14-day trial · Cancel anytime
        </p>
      </div>
    </section>
  );
}
