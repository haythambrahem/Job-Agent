'use client';

import { motion } from 'framer-motion';

export default function HowItWorks() {
  const steps = [
    {
      number: '01',
      title: 'Create Your Profile',
      description: 'Sign up and build your professional profile with your skills, experience, and job preferences.',
      icon: '👤'
    },
    {
      number: '02',
      title: 'Set Your Criteria',
      description: 'Define your ideal job by industry, location, salary, and company. Let our AI understand what you\'re looking for.',
      icon: '⚙️'
    },
    {
      number: '03',
      title: 'Watch It Work',
      description: 'Our automation engine finds matching jobs and applies on your behalf, 24/7.',
      icon: '🤖'
    },
    {
      number: '04',
      title: 'Track & Respond',
      description: 'Monitor all your applications and respond to opportunities as they come in. Land your dream job.',
      icon: '🎯'
    },
  ];

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: { staggerChildren: 0.15, delayChildren: 0.2 }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, x: -20 },
    visible: {
      opacity: 1,
      x: 0,
      transition: { duration: 0.6 }
    }
  };

  return (
    <section id="how-it-works" className="py-24 px-4">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-16"
        >
          <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">
            Get Started in Minutes
          </h2>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            A simple 4-step process to automate your job search
          </p>
        </motion.div>

        {/* Steps Grid */}
        <div className="grid md:grid-cols-2 gap-12 mb-16">
          {steps.map((step, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: index * 0.1 }}
              viewport={{ once: true }}
              className="flex gap-6"
            >
              <div className="flex flex-col items-center flex-shrink-0">
                <div className="w-16 h-16 rounded-full bg-gradient-to-br from-blue-100 to-indigo-100 flex items-center justify-center text-3xl border-2 border-blue-200">
                  {step.icon}
                </div>
              </div>

              <div className="flex-1 pt-1">
                <div className="text-sm font-bold text-blue-600 mb-2">Step {step.number}</div>
                <h3 className="text-xl font-bold text-gray-900 mb-2">{step.title}</h3>
                <p className="text-gray-600 leading-relaxed">{step.description}</p>
              </div>
            </motion.div>
          ))}
        </div>

        {/* Stats */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="bg-blue-50 rounded-2xl p-12 border border-blue-200 text-center"
        >
          <p className="text-lg text-gray-700 mb-8">Everything you need to succeed</p>
          <div className="grid grid-cols-3 gap-8">
            {[
              { label: 'Setup Time', value: '< 5 min' },
              { label: 'Time Saved/Week', value: '10+ hrs' },
              { label: 'More Interviews', value: '3-5x' }
            ].map((stat, idx) => (
              <div key={idx} className="space-y-2">
                <p className="text-3xl font-bold text-blue-600">{stat.value}</p>
                <p className="text-gray-600 text-sm">{stat.label}</p>
              </div>
            ))}
          </div>
        </motion.div>
      </div>
    </section>
  );
}
