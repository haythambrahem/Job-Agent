'use client';

import { motion } from 'framer-motion';
import Link from 'next/link';

export default function DashboardPage() {
  const stats = [
    {
      label: 'Active Applications',
      value: '24',
      icon: '📤',
      color: 'blue',
    },
    {
      label: 'Interview Invites',
      value: '5',
      icon: '📅',
      color: 'green',
    },
    {
      label: 'Profile Views',
      value: '127',
      icon: '👀',
      color: 'purple',
    },
    {
      label: 'Jobs Matched',
      value: '89',
      icon: '💼',
      color: 'orange',
    },
  ];

  const recentApplications = [
    {
      company: 'Tech Startup Co',
      position: 'Senior Software Engineer',
      appliedAt: '2 hours ago',
      status: 'Applied',
    },
    {
      company: 'Design Studios Inc',
      position: 'Product Designer',
      appliedAt: '1 day ago',
      status: 'Reviewing',
    },
    {
      company: 'Cloud Solutions LLC',
      position: 'DevOps Engineer',
      appliedAt: '2 days ago',
      status: 'Applied',
    },
  ];

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: { staggerChildren: 0.1 },
    },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { duration: 0.5 },
    },
  };

  return (
    <div className="flex-1 overflow-auto bg-gray-50">
      <div className="p-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Welcome back!</h1>
          <p className="text-gray-600">Here&apos;s your job search overview</p>
        </div>

        {/* Stats Grid */}
        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate="visible"
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8"
        >
          {stats.map((stat, idx) => {
            const colorMap = {
              blue: 'bg-blue-50 border-blue-200',
              green: 'bg-green-50 border-green-200',
              purple: 'bg-purple-50 border-purple-200',
              orange: 'bg-orange-50 border-orange-200',
            };

            return (
              <motion.div
                key={idx}
                variants={itemVariants}
                whileHover={{ y: -4 }}
                className={`rounded-lg border card ${colorMap[stat.color as keyof typeof colorMap]}`}
              >
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-sm text-gray-600 mb-2">{stat.label}</p>
                    <p className="text-3xl font-bold text-gray-900">{stat.value}</p>
                  </div>
                  <span className="text-2xl">{stat.icon}</span>
                </div>
              </motion.div>
            );
          })}
        </motion.div>

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Recent Applications */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="lg:col-span-2 card"
          >
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold text-gray-900">Recent Applications</h2>
              <Link
                href="/dashboard/applications"
                className="text-blue-600 hover:text-blue-700 font-medium text-sm"
              >
                View All →
              </Link>
            </div>

            <div className="space-y-4">
              {recentApplications.map((app, idx) => (
                <motion.div
                  key={idx}
                  whileHover={{ backgroundColor: '#f9fafb' }}
                  className="p-4 border border-gray-200 rounded-lg transition-colors duration-200"
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="font-semibold text-gray-900">{app.position}</p>
                      <p className="text-sm text-gray-600">{app.company}</p>
                      <p className="text-xs text-gray-500 mt-1">{app.appliedAt}</p>
                    </div>
                    <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                      app.status === 'Applied'
                        ? 'bg-blue-100 text-blue-700'
                        : 'bg-yellow-100 text-yellow-700'
                    }`}>
                      {app.status}
                    </span>
                  </div>
                </motion.div>
              ))}
            </div>
          </motion.div>

          {/* Quick Actions */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="card"
          >
            <h2 className="text-xl font-bold text-gray-900 mb-6">Quick Actions</h2>

            <div className="space-y-3">
              <Link
                href="/dashboard/jobs"
                className="block w-full py-3 px-4 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors duration-200 text-center"
              >
                Browse Jobs
              </Link>
              <Link
                href="/dashboard/profile"
                className="block w-full py-3 px-4 border-2 border-blue-600 text-blue-600 rounded-lg font-medium hover:bg-blue-50 transition-colors duration-200 text-center"
              >
                Update Profile
              </Link>
              <button className="w-full py-3 px-4 border-2 border-gray-200 text-gray-900 rounded-lg font-medium hover:bg-gray-50 transition-colors duration-200">
                View Analytics
              </button>
            </div>

            {/* Tips */}
            <div className="mt-6 p-4 bg-blue-50 rounded-lg border border-blue-200">
              <p className="text-sm font-semibold text-blue-900 mb-2">💡 Pro Tip</p>
              <p className="text-xs text-blue-700">
                Update your profile regularly to improve job matching accuracy
              </p>
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  );
}
