'use client';

import { motion } from 'framer-motion';

export default function Features() {
  const features = [
    {
      title: 'AI-Powered Matching',
      description: 'Our AI algorithm matches you with the most relevant job opportunities based on your skills, experience, and preferences.',
      icon: '🤖',
      color: 'from-blue-600 to-cyan-600'
    },
    {
      title: 'Automated Applications',
      description: 'Automatically fill out and submit job applications with your information. Save hours every week on repetitive tasks.',
      icon: '⚡',
      color: 'from-yellow-600 to-orange-600'
    },
    {
      title: 'Smart Profile Management',
      description: 'Create once, apply everywhere. Manage your professional profile and watch it populate forms automatically.',
      icon: '📋',
      color: 'from-purple-600 to-pink-600'
    },
    {
      title: 'Real-time Alerts',
      description: 'Get notified instantly when jobs matching your criteria are posted. Never miss an opportunity.',
      icon: '🔔',
      color: 'from-red-600 to-rose-600'
    },
    {
      title: 'Application Tracking',
      description: 'Track all your applications in one place. Monitor responses and follow-ups with built-in reminders.',
      icon: '📊',
      color: 'from-green-600 to-emerald-600'
    },
    {
      title: 'Resume Optimization',
      description: 'Get AI-powered suggestions to optimize your resume for better ATS scores and higher interview rates.',
      icon: '✨',
      color: 'from-indigo-600 to-purple-600'
    },
  ];

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
    <section className="py-24 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-16"
        >
          <h2 className="text-4xl md:text-5xl font-bold text-white mb-4 text-balance">
            Powerful Features Built for <span className="gradient-text">Job Seekers</span>
          </h2>
          <p className="text-xl text-slate-300 text-balance max-w-2xl mx-auto">
            Everything you need to automate your job search and land your dream role
          </p>
        </motion.div>

        {/* Feature Grid */}
        <motion.div
          variants={containerVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
          className="grid md:grid-cols-2 lg:grid-cols-3 gap-8"
        >
          {features.map((feature, index) => (
            <motion.div
              key={index}
              variants={itemVariants}
              whileHover={{ y: -8, scale: 1.02 }}
              className="group glass rounded-2xl p-8 transition-all duration-300 hover:border-white/30"
            >
              {/* Icon Background */}
              <div className={`inline-flex p-4 rounded-xl bg-gradient-to-br ${feature.color} mb-6 group-hover:scale-110 transition-transform duration-300`}>
                <span className="text-3xl filter drop-shadow-lg">{feature.icon}</span>
              </div>

              {/* Content */}
              <h3 className="text-xl font-bold text-white mb-3 group-hover:text-transparent group-hover:bg-clip-text group-hover:bg-gradient-to-r group-hover:from-blue-400 group-hover:to-purple-400 transition">
                {feature.title}
              </h3>
              <p className="text-slate-300 leading-relaxed">{feature.description}</p>

              {/* Hover indicator */}
              <motion.div
                initial={{ x: -20, opacity: 0 }}
                whileHover={{ x: 0, opacity: 1 }}
                transition={{ duration: 0.3 }}
                className="mt-6 text-blue-400 font-semibold flex items-center gap-2"
              >
                Learn more →
              </motion.div>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  );
}
