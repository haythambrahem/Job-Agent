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
    <section id="pricing" className="py-24 px-4">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-16"
        >
          <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">
            Simple, Transparent Pricing
          </h2>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto mb-8">
            Choose the plan that fits your job search goals
          </p>
        </motion.div>

        {/* Pricing Cards */}
        <div className="grid md:grid-cols-3 gap-8 mb-16">
          {pricingPlans.map((plan, idx) => (
            <motion.div
              key={idx}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: idx * 0.1 }}
              viewport={{ once: true }}
              className={`relative rounded-2xl p-8 transition-all duration-300 ${
                plan.highlighted
                  ? 'card ring-2 ring-blue-600 bg-blue-50'
                  : 'card'
              }`}
            >
              {plan.highlighted && (
                <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
                  <span className="bg-blue-600 text-white px-4 py-1 rounded-full text-sm font-semibold">
                    Most Popular
                  </span>
                </div>
              )}

              <div className="space-y-6">
                {/* Plan Header */}
                <div>
                  <h3 className="text-2xl font-bold text-gray-900 mb-2">{plan.name}</h3>
                  <p className="text-gray-600 text-sm">{plan.description}</p>
                </div>

                {/* Price */}
                <div>
                  <div className="flex items-baseline gap-1">
                    <span className="text-5xl font-bold text-gray-900">{plan.price}</span>
                    {plan.price !== 'Custom' && (
                      <span className="text-gray-600">
                        {plan.period === 'forever' ? '/forever' : '/month'}
                      </span>
                    )}
                  </div>
                </div>

                {/* CTA Button */}
                <Link
                  href="/signup"
                  className={`block w-full py-3 rounded-lg font-semibold text-center transition-all duration-200 ${
                    plan.highlighted
                      ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white hover:shadow-lg'
                      : 'bg-gray-100 text-gray-900 hover:bg-gray-200'
                  }`}
                >
                  {plan.cta}
                </Link>

                {/* Features */}
                <div className="space-y-3 pt-6 border-t border-gray-200">
                  {plan.features.map((feature, fidx) => (
                    <div key={fidx} className="flex items-center gap-3">
                      <span className="text-green-600 font-bold">✓</span>
                      <span className="text-gray-700 text-sm">{feature}</span>
                    </div>
                  ))}
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
