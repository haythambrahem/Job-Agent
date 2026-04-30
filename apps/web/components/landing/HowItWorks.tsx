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
    <section id="how-it-works" className="py-24 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-16"
        >
          <h2 className="text-4xl md:text-5xl font-bold text-white mb-4 text-balance">
            <span className="gradient-text">Get Started</span> in Minutes
          </h2>
          <p className="text-xl text-slate-300 text-balance max-w-2xl mx-auto">
            A simple 4-step process to automate your job search
          </p>
        </motion.div>

        {/* Steps Grid */}
        <motion.div
          variants={containerVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
          className="grid md:grid-cols-2 gap-12 lg:gap-16"
        >
          {steps.map((step, index) => (
            <motion.div
              key={index}
              variants={itemVariants}
              whileHover={{ y: -5 }}
              className="flex gap-8 group"
            >
              {/* Number & Line */}
              <div className="flex flex-col items-center flex-shrink-0">
                <motion.div
                  whileHover={{ scale: 1.1 }}
                  className="w-20 h-20 rounded-full bg-gradient-to-br from-blue-600 to-purple-600 flex items-center justify-center font-bold text-2xl text-white mb-6 shadow-lg shadow-blue-500/30 group-hover:shadow-purple-500/50 transition-all duration-300"
                >
                  <span className="text-3xl">{step.icon}</span>
                </motion.div>
                {index < steps.length - 1 && index % 2 === 0 && (
                  <motion.div
                    initial={{ scaleY: 0 }}
                    whileInView={{ scaleY: 1 }}
                    viewport={{ once: true }}
                    transition={{ delay: 0.5 + index * 0.1 }}
                    className="hidden md:block w-1 h-32 bg-gradient-to-b from-blue-600/50 to-transparent mt-4 origin-top"
                  />
                )}
              </div>

              {/* Content */}
              <div className="pt-2 flex-1">
                <div className="flex items-center gap-3 mb-3">
                  <span className="text-sm font-bold text-blue-400">Step {step.number}</span>
                </div>
                <h3 className="text-2xl font-bold text-white mb-3 group-hover:gradient-text transition">
                  {step.title}
                </h3>
                <p className="text-slate-300 leading-relaxed">
                  {step.description}
                </p>
              </div>
            </motion.div>
          ))}
        </motion.div>

        {/* Visual Demo or Additional Info */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ delay: 0.4 }}
          className="mt-20 glass rounded-2xl p-12 text-center"
        >
          <p className="text-lg text-slate-300 mb-6">
            The entire process is designed to save you time and effort
          </p>
          <div className="grid grid-cols-3 gap-8">
            {[
              { label: 'Setup Time', value: '< 5 min' },
              { label: 'Time Saved/Week', value: '10+ hours' },
              { label: 'Interview Boost', value: '3-5x' }
            ].map((stat, idx) => (
              <motion.div key={idx} whileHover={{ y: -5 }} className="space-y-2">
                <p className="text-2xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-purple-400">
                  {stat.value}
                </p>
                <p className="text-slate-400 text-sm">{stat.label}</p>
              </motion.div>
            ))}
          </div>
        </motion.div>
      </div>
    </section>
  );
}
