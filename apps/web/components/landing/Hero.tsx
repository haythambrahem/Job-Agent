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
      transition: { staggerChildren: 0.2, delayChildren: 0.3 }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { duration: 0.8 }
    }
  };

  return (
    <section className="relative min-h-screen flex items-center justify-center px-4 py-24">
      <motion.div 
        className="max-w-5xl mx-auto space-y-10 text-center w-full"
        variants={containerVariants}
        initial="hidden"
        animate="visible"
      >
        {/* Badge */}
        <motion.div variants={itemVariants}>
          <div className="inline-block px-4 py-2 glass">
            <span className="text-sm font-semibold bg-gradient-to-r from-blue-400 via-purple-400 to-cyan-400 -webkit-background-clip-text -webkit-text-fill-color-transparent bg-clip-text">
              ✨ AI-Powered Job Automation
            </span>
          </div>
        </motion.div>

        {/* Main Headline */}
        <motion.h1 
          variants={itemVariants}
          className="text-6xl md:text-7xl lg:text-8xl font-bold text-white leading-[1.1] tracking-tight"
        >
          Automate Your <br />
          <span className="bg-gradient-to-r from-blue-400 via-purple-400 to-cyan-400 -webkit-background-clip-text -webkit-text-fill-color-transparent bg-clip-text">
            Job Hunt
          </span>
        </motion.h1>

        {/* Subheading */}
        <motion.p 
          variants={itemVariants}
          className="text-xl md:text-2xl text-slate-300 max-w-3xl mx-auto leading-relaxed"
        >
          Stop wasting hours on applications. Job Agent uses AI to find opportunities, apply instantly, and land more interviews.
        </motion.p>

        {/* CTA Buttons */}
        <motion.div 
          variants={itemVariants}
          className="flex flex-col sm:flex-row gap-4 justify-center pt-4"
        >
          <Link
            href="/signup"
            className="group relative px-8 py-4 bg-gradient-to-r from-blue-600 to-purple-600 text-white font-bold rounded-xl overflow-hidden transition-all duration-300 hover:shadow-2xl hover:shadow-blue-500/50"
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
            <div className="absolute inset-0 bg-gradient-to-r from-purple-600 to-blue-600 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
          </Link>

          <Link
            href="#how-it-works"
            className="px-8 py-4 glass hover:bg-white/10 text-white font-bold rounded-xl transition-all duration-300 hover:border-blue-400/50"
          >
            See How It Works
          </Link>
        </motion.div>

        {/* Trust info */}
        <motion.p 
          variants={itemVariants}
          className="text-sm text-slate-400"
        >
          ✓ No credit card required · ✓ Free for 14 days · ✓ Cancel anytime
        </motion.p>

        {/* Trust Badges */}
        <motion.div 
          variants={itemVariants}
          className="pt-8 border-t border-white/10"
        >
          <p className="text-slate-400 text-sm mb-8">Trusted by ambitious job seekers worldwide</p>
          <div className="grid grid-cols-3 gap-8 md:gap-12">
            {[
              { value: '50K+', label: 'Jobs Automated' },
              { value: '95%', label: 'Success Rate' },
              { value: '10hrs', label: 'Saved Weekly' }
            ].map((stat, idx) => (
              <motion.div
                key={idx}
                whileHover={{ scale: 1.05 }}
                className="space-y-2"
              >
                <p className="text-3xl md:text-4xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-purple-400">
                  {stat.value}
                </p>
                <p className="text-slate-400 text-sm">{stat.label}</p>
              </motion.div>
            ))}
          </div>
        </motion.div>
      </motion.div>

      {/* Floating elements */}
      <motion.div 
        className="absolute top-20 right-10 w-64 h-64 bg-gradient-to-br from-blue-600/10 to-purple-600/10 rounded-full blur-3xl"
        animate={{ y: [0, 30, 0] }}
        transition={{ duration: 4, repeat: Infinity }}
      />
      <motion.div 
        className="absolute bottom-20 left-10 w-64 h-64 bg-gradient-to-br from-cyan-600/10 to-blue-600/10 rounded-full blur-3xl"
        animate={{ y: [0, -30, 0] }}
        transition={{ duration: 4, repeat: Infinity, delay: 2 }}
      />
    </section>
  );
}
