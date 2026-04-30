'use client';

import { motion } from 'framer-motion';
import { useState } from 'react';

export default function JobsPage() {
  const [filters, setFilters] = useState({
    searchTerm: '',
    location: '',
    salary: 'all',
  });

  const jobs = [
    {
      id: 1,
      title: 'Senior Software Engineer',
      company: 'Tech Startup Co',
      location: 'San Francisco, CA',
      salary: '$150k - $200k',
      match: 95,
      postedAt: '2 hours ago',
    },
    {
      id: 2,
      title: 'Full Stack Developer',
      company: 'Digital Agency Inc',
      location: 'Remote',
      salary: '$120k - $160k',
      match: 88,
      postedAt: '5 hours ago',
    },
    {
      id: 3,
      title: 'DevOps Engineer',
      company: 'Cloud Solutions LLC',
      location: 'New York, NY',
      salary: '$140k - $180k',
      match: 82,
      postedAt: '1 day ago',
    },
    {
      id: 4,
      title: 'Product Designer',
      company: 'Design Studios',
      location: 'Austin, TX',
      salary: '$100k - $140k',
      match: 76,
      postedAt: '2 days ago',
    },
  ];

  const getMatchColor = (match: number) => {
    if (match >= 90) return 'text-green-600 bg-green-50';
    if (match >= 80) return 'text-blue-600 bg-blue-50';
    return 'text-yellow-600 bg-yellow-50';
  };

  return (
    <div className="flex-1 overflow-auto bg-gray-50">
      <div className="p-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Job Listings</h1>
          <p className="text-gray-600">Browse and apply to matched job opportunities</p>
        </div>

        {/* Filters */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="card mb-8"
        >
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Search
              </label>
              <input
                type="text"
                placeholder="Job title..."
                value={filters.searchTerm}
                onChange={(e) => setFilters({ ...filters, searchTerm: e.target.value })}
                className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:border-blue-500 focus:ring-0 transition-colors"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Location
              </label>
              <input
                type="text"
                placeholder="City, state..."
                value={filters.location}
                onChange={(e) => setFilters({ ...filters, location: e.target.value })}
                className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:border-blue-500 focus:ring-0 transition-colors"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Salary Range
              </label>
              <select
                value={filters.salary}
                onChange={(e) => setFilters({ ...filters, salary: e.target.value })}
                className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:border-blue-500 focus:ring-0 transition-colors"
              >
                <option value="all">All Salaries</option>
                <option value="100-150">$100k - $150k</option>
                <option value="150-200">$150k - $200k</option>
                <option value="200+">$200k+</option>
              </select>
            </div>
            <div className="flex items-end">
              <button className="w-full py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors">
                Apply Filters
              </button>
            </div>
          </div>
        </motion.div>

        {/* Jobs List */}
        <div className="space-y-4">
          {jobs.map((job, idx) => (
            <motion.div
              key={job.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: idx * 0.1 }}
              whileHover={{ backgroundColor: '#f9fafb' }}
              className="card transition-colors duration-200"
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <h3 className="text-lg font-semibold text-gray-900 mb-1">
                    {job.title}
                  </h3>
                  <p className="text-gray-600 mb-3">{job.company}</p>

                  <div className="flex flex-wrap items-center gap-4 text-sm text-gray-600">
                    <span>📍 {job.location}</span>
                    <span>💰 {job.salary}</span>
                    <span>⏰ {job.postedAt}</span>
                  </div>
                </div>

                <div className="flex flex-col items-end gap-4">
                  <div className={`px-4 py-2 rounded-lg font-bold text-center ${getMatchColor(job.match)}`}>
                    {job.match}% Match
                  </div>
                  <button className="px-6 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors">
                    View & Apply
                  </button>
                </div>
              </div>
            </motion.div>
          ))}
        </div>

        {/* Pagination */}
        <div className="mt-8 flex items-center justify-center gap-2">
          <button className="px-4 py-2 border border-gray-200 rounded-lg hover:bg-gray-100 transition-colors">
            Previous
          </button>
          {[1, 2, 3].map((page) => (
            <button
              key={page}
              className={`px-4 py-2 rounded-lg transition-colors ${
                page === 1
                  ? 'bg-blue-600 text-white'
                  : 'border border-gray-200 hover:bg-gray-100'
              }`}
            >
              {page}
            </button>
          ))}
          <button className="px-4 py-2 border border-gray-200 rounded-lg hover:bg-gray-100 transition-colors">
            Next
          </button>
        </div>
      </div>
    </div>
  );
}
