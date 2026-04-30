"use client";

import Link from "next/link";

export default function CTA() {
  return (
    <section className="py-24 px-4 bg-blue-50 border-t border-blue-200">
      <div className="max-w-4xl mx-auto text-center">
        <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-6">
          Ready to Automate Your Job Search?
        </h2>
        <p className="text-xl text-gray-600 mb-8">
          Stop wasting time on manual applications. Start with Job Agent and focus on landing your dream job.
        </p>
        
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Link
            href="/signup"
            className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-4 rounded-lg font-semibold transition"
          >
            Get Started Free
          </Link>
          <Link
            href="#pricing"
            className="border-2 border-blue-600 text-blue-600 hover:bg-blue-50 px-8 py-4 rounded-lg font-semibold transition"
          >
            View Pricing
          </Link>
        </div>

        <p className="text-gray-600 mt-8 text-sm">
          No credit card required · Free trial · Cancel anytime
        </p>
      </div>
    </section>
  );
}
