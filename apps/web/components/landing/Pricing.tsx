'use client';

import { motion } from 'framer-motion';
import { useState } from 'react';
import Link from 'next/link';

const pricingPlans = [
  {
    name: 'Starter',
    price: '0',
    period: 'forever',
    description: 'Perfect for exploring Job Agent',
    features: [
      'Up to 5 job applications/day',
      'Basic job matching',
      'Email notifications',
      'Job history',
      'Community support'
    ],
    cta: 'Get Started',
    highlighted: false
  },
  {
    name: 'Professional',
    price: '29',
    period: 'month',
    description: 'Best for serious job seekers',
    features: [
      'Unlimited applications',
      'Advanced AI matching',
      'Priority support',
      'Resume optimization',
      'Interview prep guides',
      'Analytics dashboard',
      'Custom job filters'
    ],
    cta: 'Start Free Trial',
    highlighted: true
  },
  {
    name: 'Enterprise',
    price: 'Custom',
    period: 'month',
    description: 'For teams and organizations',
    features: [
      'Everything in Professional',
      'Team management',
      'Custom integrations',
      'Dedicated account manager',
      'White-label option',
      'API access',
      'Custom training'
    ],
    cta: 'Contact Sales',
    highlighted: false
  }
];

export default function PricingSection() {
  const [isAnnual, setIsAnnual] = useState(false);

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: { staggerChildren: 0.1, delayChildren: 0.2 }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { duration: 0.6 }
    }
  };

  return (
    <section className="relative py-24 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <motion.div
          variants={containerVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
          className="text-center mb-16"
        >
          <motion.h2 
            variants={itemVariants}
            className="text-4xl md:text-5xl font-bold text-white mb-4"
          >
            Simple, Transparent <span className="gradient-text">Pricing</span>
          </motion.h2>
          <motion.p 
            variants={itemVariants}
            className="text-xl text-slate-300 mb-8 max-w-2xl mx-auto"
          >
            Choose the plan that fits your job search goals
          </motion.p>

          {/* Toggle */}
          <motion.div variants={itemVariants} className="flex items-center justify-center gap-4">
            <span className={`text-sm font-medium ${!isAnnual ? 'text-white' : 'text-slate-400'}`}>
              Monthly
            </span>
            <button
              onClick={() => setIsAnnual(!isAnnual)}
              className="relative inline-flex h-8 w-14 items-center rounded-full bg-white/10 border border-white/20 transition"
            >
              <motion.div
                animate={{ x: isAnnual ? 28 : 2 }}
                transition={{ type: 'spring', stiffness: 500, damping: 30 }}
                className="inline-block h-6 w-6 transform rounded-full bg-gradient-to-r from-blue-500 to-purple-500"
              />
            </button>
            <span className={`text-sm font-medium ${isAnnual ? 'text-white' : 'text-slate-400'}`}>
              Annual <span className="ml-1 text-xs bg-gradient-to-r from-blue-500 to-green-500 -webkit-background-clip-text -webkit-text-fill-color-transparent">Save 20%</span>
            </span>
          </motion.div>
        </motion.div>

        {/* Pricing Cards */}
        <motion.div
          variants={containerVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
          className="grid md:grid-cols-3 gap-8"
        >
          {pricingPlans.map((plan, idx) => (
            <motion.div
              key={idx}
              variants={itemVariants}
              whileHover={plan.highlighted ? { scale: 1.05, y: -10 } : { scale: 1.02, y: -5 }}
              className={`relative rounded-2xl transition-all duration-300 ${
                plan.highlighted
                  ? 'glass border-blue-500/50 shadow-2xl shadow-blue-500/20'
                  : 'glass hover:border-white/20'
              }`}
            >
              {plan.highlighted && (
                <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2">
                  <div className="bg-gradient-to-r from-blue-600 to-purple-600 text-white px-4 py-1 rounded-full text-sm font-semibold">
                    Most Popular
                  </div>
                </div>
              )}

              <div className="p-8 space-y-8">
                {/* Plan Header */}
                <div>
                  <h3 className="text-2xl font-bold text-white mb-2">{plan.name}</h3>
                  <p className="text-slate-400 text-sm">{plan.description}</p>
                </div>

                {/* Price */}
                <div className="space-y-2">
                  <div className="flex items-baseline gap-2">
                    <span className="text-5xl font-bold text-white">{plan.price}</span>
                    {plan.price !== 'Custom' && (
                      <>
                        <span className="text-slate-400">$</span>
                        <span className="text-slate-400">{plan.period === 'forever' ? 'forever' : '/month'}</span>
                      </>
                    )}
                  </div>
                  {isAnnual && plan.period !== 'forever' && plan.price !== 'Custom' && (
                    <p className="text-sm text-green-400">Save ${Math.round(parseInt(plan.price) * 12 * 0.2)}/year</p>
                  )}
                </div>

                {/* CTA Button */}
                <Link
                  href="/signup"
                  className={`block w-full py-3 rounded-xl font-semibold text-center transition-all duration-300 ${
                    plan.highlighted
                      ? 'bg-gradient-to-r from-blue-600 to-purple-600 text-white hover:shadow-lg hover:shadow-blue-500/50'
                      : 'glass hover:bg-white/10 text-white'
                  }`}
                >
                  {plan.cta}
                </Link>

                {/* Features */}
                <div className="space-y-4 pt-4 border-t border-white/10">
                  {plan.features.map((feature, fidx) => (
                    <motion.div
                      key={fidx}
                      whileHover={{ x: 5 }}
                      className="flex items-center gap-3"
                    >
                      <span className="text-green-400 text-lg">✓</span>
                      <span className="text-slate-300 text-sm">{feature}</span>
                    </motion.div>
                  ))}
                </div>
              </div>
            </motion.div>
          ))}
        </motion.div>

        {/* Comparison Table */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ delay: 0.3 }}
          className="mt-16 glass rounded-2xl p-8 overflow-x-auto"
        >
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-white/10">
                <th className="text-left py-4 px-4 font-semibold text-white">Feature</th>
                <th className="text-center py-4 px-4 font-semibold text-slate-300">Starter</th>
                <th className="text-center py-4 px-4 font-semibold text-slate-300">Professional</th>
                <th className="text-center py-4 px-4 font-semibold text-slate-300">Enterprise</th>
              </tr>
            </thead>
            <tbody>
              {[
                { feature: 'Applications/day', starter: '5', professional: 'Unlimited', enterprise: 'Unlimited' },
                { feature: 'AI Job Matching', starter: 'Basic', professional: 'Advanced', enterprise: 'Advanced' },
                { feature: 'Priority Support', starter: 'No', professional: 'Yes', enterprise: 'Yes' },
                { feature: 'Resume Optimization', starter: 'No', professional: 'Yes', enterprise: 'Yes' },
                { feature: 'Analytics Dashboard', starter: 'No', professional: 'Yes', enterprise: 'Yes' }
              ].map((row, idx) => (
                <tr key={idx} className="border-b border-white/5 hover:bg-white/5 transition">
                  <td className="py-4 px-4 text-slate-300">{row.feature}</td>
                  <td className="text-center py-4 px-4 text-slate-400">{row.starter}</td>
                  <td className="text-center py-4 px-4 text-green-400 font-medium">{row.professional}</td>
                  <td className="text-center py-4 px-4 text-green-400 font-medium">{row.enterprise}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </motion.div>
      </div>
    </section>
  );
}
