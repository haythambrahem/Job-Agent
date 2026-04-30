'use client';

import { motion } from 'framer-motion';
import { useState } from 'react';

export default function ApplicationsPage() {
  const [statusFilter, setStatusFilter] = useState('all');

  const applications = [
    {
      id: 1,
      company: 'Tech Startup Co',
      position: 'Senior Software Engineer',
      status: 'Interview Scheduled',
      appliedAt: 'Mar 15, 2024',
      interviewDate: 'Apr 5, 2024',
      salary: '$150k - $200k',
    },
    {
      id: 2,
      company: 'Digital Agency Inc',
      position: 'Full Stack Developer',
      status: 'Reviewing',
      appliedAt: 'Mar 18, 2024',
      interviewDate: null,
      salary: '$120k - $160k',
    },
    {
      id: 3,
      company: 'Cloud Solutions LLC',
      position: 'DevOps Engineer',
      status: 'Applied',
      appliedAt: 'Mar 20, 2024',
      interviewDate: null,
      salary: '$140k - $180k',
    },
    {
      id: 4,
      company: 'Design Studios',
      position: 'Product Designer',
      status: 'Rejected',
      appliedAt: 'Mar 10, 2024',
      interviewDate: null,
      salary: '$100k - $140k',
    },
  ];

  const getStatusBadge = (status: string) => {
    const statusMap: Record<string, { bg: string; text: string; icon: string }> = {
      'Interview Scheduled': { bg: 'bg-green-100', text: 'text-green-700', icon: '✓' },
      'Reviewing': { bg: 'bg-blue-100', text: 'text-blue-700', icon: '⏳' },
      'Applied': { bg: 'bg-yellow-100', text: 'text-yellow-700', icon: '📤' },
      'Rejected': { bg: 'bg-red-100', text: 'text-red-700', icon: '✕' },
    };

    const config = statusMap[status] || statusMap['Applied'];
    return config;
  };

  const filteredApplications = statusFilter === 'all'
    ? applications
    : applications.filter((app) => app.status.toLowerCase() === statusFilter.toLowerCase());

  return (
    <div className="flex-1 overflow-auto bg-gray-50">
      <div className="p-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Applications</h1>
          <p className="text-gray-600">Track and manage all your job applications</p>
        </div>

        {/* Status Filter */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8 flex flex-wrap gap-3"
        >
          {['all', 'Interview Scheduled', 'Reviewing', 'Applied', 'Rejected'].map((status) => (
            <button
              key={status}
              onClick={() => setStatusFilter(status)}
              className={`px-4 py-2 rounded-lg font-medium transition-colors duration-200 ${
                statusFilter === status
                  ? 'bg-blue-600 text-white'
                  : 'bg-white border border-gray-200 text-gray-700 hover:border-blue-600'
              }`}
            >
              {status === 'all' ? 'All' : status}
            </button>
          ))}
        </motion.div>

        {/* Applications List */}
        <div className="space-y-4">
          {filteredApplications.length === 0 ? (
            <div className="card text-center py-12">
              <p className="text-gray-500 text-lg">No applications found</p>
            </div>
          ) : (
            filteredApplications.map((app, idx) => {
              const statusConfig = getStatusBadge(app.status);
              return (
                <motion.div
                  key={app.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: idx * 0.1 }}
                  whileHover={{ backgroundColor: '#f9fafb' }}
                  className="card transition-colors duration-200"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <h3 className="text-lg font-semibold text-gray-900 mb-1">
                        {app.position}
                      </h3>
                      <p className="text-gray-600 mb-3">{app.company}</p>

                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm text-gray-600">
                        <span>📅 Applied: {app.appliedAt}</span>
                        <span>💰 {app.salary}</span>
                        {app.interviewDate && (
                          <span>🗓️ Interview: {app.interviewDate}</span>
                        )}
                      </div>
                    </div>

                    <div className="flex flex-col items-end gap-4">
                      <span className={`px-4 py-2 rounded-lg font-medium text-sm ${statusConfig.bg} ${statusConfig.text}`}>
                        {app.status}
                      </span>
                      <div className="flex gap-2">
                        <button className="px-4 py-2 text-gray-700 border border-gray-200 rounded-lg hover:bg-gray-100 transition-colors text-sm">
                          Details
                        </button>
                        <button className="px-4 py-2 text-red-600 border border-red-200 rounded-lg hover:bg-red-50 transition-colors text-sm">
                          Withdraw
                        </button>
                      </div>
                    </div>
                  </div>
                </motion.div>
              );
            })
          )}
        </div>

        {/* Summary Stats */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="mt-8 grid grid-cols-2 md:grid-cols-4 gap-4"
        >
          {[
            { label: 'Total Applications', value: applications.length },
            { label: 'Interviews', value: applications.filter((a) => a.status === 'Interview Scheduled').length },
            { label: 'Under Review', value: applications.filter((a) => a.status === 'Reviewing').length },
            { label: 'Pending', value: applications.filter((a) => a.status === 'Applied').length },
          ].map((stat, idx) => (
            <div key={idx} className="card text-center">
              <p className="text-gray-600 text-sm mb-2">{stat.label}</p>
              <p className="text-3xl font-bold text-gray-900">{stat.value}</p>
            </div>
          ))}
        </motion.div>
      </div>
    </div>
  );
}
