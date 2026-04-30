'use client';

import { motion } from 'framer-motion';
import Link from 'next/link';

export default function FinalCTA() {
  return (
    <section className="py-24 px-4">
      <div className="max-w-4xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8 }}
          className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-2xl p-12 md:p-16 text-center border border-blue-200"
        >
          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.2 }}
            className="text-4xl md:text-5xl font-bold text-gray-900 mb-6"
          >
            Ready to Transform Your Job Search?
          </motion.h2>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.3 }}
            className="text-xl text-gray-600 mb-8 max-w-2xl mx-auto"
          >
            Join thousands of job seekers who found their dream roles faster. Start your free trial today – no credit card required.
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.4 }}
            className="flex flex-col sm:flex-row gap-4 justify-center mb-8"
          >
            <Link
              href="/signup"
              className="px-8 py-4 bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-bold rounded-lg hover:shadow-lg transition"
            >
              Start Free Trial →
            </Link>

            <Link
              href="#pricing"
              className="px-8 py-4 border-2 border-blue-600 text-blue-600 hover:bg-blue-50 font-bold rounded-lg transition"
            >
              View Pricing
            </Link>
          </motion.div>

          {/* Trust badges */}
          <motion.div
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            transition={{ delay: 0.5 }}
            className="flex flex-col sm:flex-row items-center justify-center gap-6 pt-8 border-t border-blue-200"
          >
            <div className="flex items-center gap-2 text-sm text-gray-600">
              <span className="text-lg">🔒</span>
              <span>Bank-level security</span>
            </div>
            <div className="flex items-center gap-2 text-sm text-gray-600">
              <span className="text-lg">✓</span>
              <span>No credit card needed</span>
            </div>
            <div className="flex items-center gap-2 text-sm text-gray-600">
              <span className="text-lg">⚡</span>
              <span>14-day free trial</span>
            </div>
          </motion.div>
        </motion.div>
      </div>
    </section>
  );
}
