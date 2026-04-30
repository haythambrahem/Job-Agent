'use client';

import Link from 'next/link';
import { motion, useScroll, useTransform } from 'framer-motion';
import { useState, useEffect } from 'react';

export default function Navigation() {
  const [scrolled, setScrolled] = useState(false);
  const { scrollY } = useScroll();
  const navBg = useTransform(
    scrollY,
    [0, 100],
    ['rgba(10, 14, 39, 0)', 'rgba(10, 14, 39, 0.8)']
  );

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 50);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <motion.nav
      style={{ backgroundColor: navBg }}
      className={`fixed top-0 left-0 right-0 z-50 backdrop-blur-md border-b transition-all duration-300 ${
        scrolled ? 'border-white/10' : 'border-white/0'
      }`}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex items-center justify-between">
        {/* Logo */}
        <motion.div
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
        >
          <Link href="/" className="font-bold text-2xl bg-gradient-to-r from-blue-400 to-purple-400 -webkit-background-clip-text -webkit-text-fill-color-transparent bg-clip-text">
            Job Agent
          </Link>
        </motion.div>

        {/* Center Links */}
        <div className="hidden md:flex items-center gap-8">
          {[
            { href: '#how-it-works', label: 'How It Works' },
            { href: '#pricing', label: 'Pricing' },
            { href: '/blog', label: 'Blog' },
            { href: '/faq', label: 'FAQ' }
          ].map((link) => (
            <motion.div
              key={link.href}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              <Link
                href={link.href}
                className="text-slate-300 hover:text-white transition relative group"
              >
                {link.label}
                <span className="absolute bottom-0 left-0 w-0 h-0.5 bg-gradient-to-r from-blue-400 to-purple-400 group-hover:w-full transition-all duration-300" />
              </Link>
            </motion.div>
          ))}
        </div>

        {/* Right Actions */}
        <div className="flex items-center gap-4">
          <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
            <Link
              href="/signin"
              className="text-slate-300 hover:text-white transition font-medium"
            >
              Sign In
            </Link>
          </motion.div>

          <motion.div
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            <Link
              href="/signup"
              className="bg-gradient-to-r from-blue-600 to-purple-600 hover:shadow-lg hover:shadow-blue-500/50 text-white px-6 py-3 rounded-xl font-semibold transition-all duration-300"
            >
              Get Started
            </Link>
          </motion.div>
        </div>
      </div>
    </motion.nav>
  );
}
