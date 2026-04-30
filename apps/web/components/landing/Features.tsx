'use client';

import { motion } from 'framer-motion';

export default function Features() {
  const features = [
    {
      title: 'AI-Powered Matching',
      description: 'Our AI algorithm matches you with the most relevant job opportunities based on your skills, experience, and preferences.',
      icon: '🤖'
    },
    {
      title: 'Instant Applications',
      description: 'Automatically fill out and submit job applications with your information. Save hours every week on repetitive tasks.',
      icon: '⚡'
    },
    {
      title: 'Smart Profile',
      description: 'Create once, apply everywhere. Manage your professional profile and watch it populate forms automatically.',
      icon: '📋'
    },
    {
      title: 'Real-time Alerts',
      description: 'Get notified instantly when jobs matching your criteria are posted. Never miss an opportunity.',
      icon: '🔔'
    },
    {
      title: 'Application Tracking',
      description: 'Track all your applications in one place. Monitor responses and follow-ups with built-in reminders.',
      icon: '📊'
    },
    {
      title: 'Resume Optimization',
      description: 'Get AI-powered suggestions to optimize your resume for better ATS scores and higher interview rates.',
      icon: '✨'
    }
  ];

  return (
    <section className="py-24 px-4">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7 }}
          viewport={{ once: true }}
          className="text-center mb-16"
        >
          <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">
            Powerful Features Built for Job Seekers
          </h2>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            Everything you need to automate your job search and land your dream role
          </p>
        </motion.div>

        {/* Feature Grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
          {features.map((feature, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: index * 0.08 }}
              viewport={{ once: true }}
              className="card hover:border-blue-500 group"
            >
              <div className="text-4xl mb-4">{feature.icon}</div>
              <h3 className="text-lg font-bold text-gray-900 mb-3">{feature.title}</h3>
              <p className="text-gray-600 leading-relaxed">{feature.description}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
