'use client';

import Link from 'next/link';
import { motion } from 'framer-motion';
import { useState } from 'react';

export default function Hero() {
  const [isHovering, setIsHovering] = useState(false);

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: { staggerChildren: 0.15, delayChildren: 0.2 }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { duration: 0.7 }
    }
  };

  return (
    <section className="relative pt-32 pb-24 px-4">
      <motion.div 
        className="max-w-5xl mx-auto space-y-8 text-center w-full"
        variants={containerVariants}
        initial="hidden"
        animate="visible"
      >
        {/* Badge */}
        <motion.div variants={itemVariants}>
          <div className="inline-block px-4 py-2 bg-blue-50 border border-blue-200 rounded-full">
            <span className="text-sm font-semibold text-blue-600">
              ✨ AI-Powered Automation
            </span>
          </div>
        </motion.div>

        {/* Main Headline */}
        <motion.h1 
          variants={itemVariants}
          className="text-5xl md:text-6xl lg:text-7xl font-bold text-gray-900 leading-tight"
        >
          Automate Your Job Hunt, Land More Interviews
        </motion.h1>

        {/* Subheading */}
        <motion.p 
          variants={itemVariants}
          className="text-xl md:text-2xl text-gray-600 max-w-3xl mx-auto leading-relaxed"
        >
          Stop wasting hours on repetitive applications. Job Agent uses AI to find matching opportunities, apply automatically, and track every step.
        </motion.p>

        {/* CTA Buttons */}
        <motion.div 
          variants={itemVariants}
          className="flex flex-col sm:flex-row gap-4 justify-center pt-4"
        >
          <Link
            href="/signup"
            className="group relative px-8 py-4 bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-bold rounded-lg overflow-hidden transition-all duration-300 hover:shadow-lg"
            onMouseEnter={() => setIsHovering(true)}
            onMouseLeave={() => setIsHovering(false)}
          >
            <span className="relative z-10 flex items-center justify-center gap-2">
              Start Free Trial
              <motion.span
                animate={{ x: isHovering ? 5 : 0 }}
                transition={{ duration: 0.3 }}
              >
                →
              </motion.span>
            </span>
          </Link>

          <Link
            href="#how-it-works"
            className="px-8 py-4 border-2 border-gray-300 text-gray-900 font-bold rounded-lg hover:border-blue-600 hover:text-blue-600 transition-all duration-300"
          >
            Watch Demo
          </Link>
        </motion.div>

        {/* Trust info */}
        <motion.p 
          variants={itemVariants}
          className="text-sm text-gray-600"
        >
          No credit card required · Free for 14 days · Cancel anytime
        </motion.p>

        {/* Trust Badges */}
        <motion.div 
          variants={itemVariants}
          className="pt-8 border-t border-gray-200"
        >
          <p className="text-gray-600 text-sm mb-8">Trusted by 10,000+ job seekers worldwide</p>
          <div className="grid grid-cols-3 gap-8 md:gap-12">
            {[
              { value: '10K+', label: 'Active Users' },
              { value: '98%', label: 'Success Rate' },
              { value: '4.9★', label: 'Rating' }
            ].map((stat, idx) => (
              <motion.div
                key={idx}
                whileHover={{ scale: 1.05 }}
                className="space-y-2"
              >
                <p className="text-3xl md:text-4xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
                  {stat.value}
                </p>
                <p className="text-gray-600 text-sm">{stat.label}</p>
              </motion.div>
            ))}
          </div>
        </motion.div>
      </motion.div>

      {/* Floating elements */}
      <motion.div 
        className="absolute top-20 right-10 w-64 h-64 bg-blue-100 rounded-full blur-3xl opacity-20"
        animate={{ y: [0, 30, 0] }}
        transition={{ duration: 4, repeat: Infinity }}
      />
      <motion.div 
        className="absolute bottom-20 left-10 w-64 h-64 bg-indigo-100 rounded-full blur-3xl opacity-20"
        animate={{ y: [0, -30, 0] }}
        transition={{ duration: 4, repeat: Infinity, delay: 2 }}
      />
    </section>
  );
}
