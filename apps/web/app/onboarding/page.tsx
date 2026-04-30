'use client';

import { motion } from 'framer-motion';
import { useState } from 'react';
import Link from 'next/link';

export default function OnboardingPage() {
  const [currentStep, setCurrentStep] = useState(0);
  const [formData, setFormData] = useState({
    jobTitle: '',
    experience: '',
    targetSalary: '',
    location: '',
    skills: [],
    preferredJobTypes: [],
    companies: '',
    industries: '',
  });

  const steps = [
    {
      title: 'Let\'s Get Started!',
      description: 'Welcome to Job Agent. Let\'s set up your profile to find the perfect job matches.',
      content: (
        <div className="space-y-6">
          <div>
            <label className="block text-sm font-semibold text-gray-900 mb-2">
              What&apos;s your current job title?
            </label>
            <input
              type="text"
              placeholder="e.g., Software Engineer, Product Manager"
              value={formData.jobTitle}
              onChange={(e) => setFormData({ ...formData, jobTitle: e.target.value })}
              className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:border-blue-500 focus:ring-0 transition-colors"
            />
          </div>
          <div>
            <label className="block text-sm font-semibold text-gray-900 mb-2">
              Years of experience
            </label>
            <select
              value={formData.experience}
              onChange={(e) => setFormData({ ...formData, experience: e.target.value })}
              className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:border-blue-500 focus:ring-0 transition-colors"
            >
              <option value="">Select experience level</option>
              <option value="0-2">0-2 years</option>
              <option value="2-5">2-5 years</option>
              <option value="5-10">5-10 years</option>
              <option value="10+">10+ years</option>
            </select>
          </div>
        </div>
      ),
    },
    {
      title: 'Job Preferences',
      description: 'Tell us what you\'re looking for',
      content: (
        <div className="space-y-6">
          <div>
            <label className="block text-sm font-semibold text-gray-900 mb-2">
              Target Salary Range
            </label>
            <select
              value={formData.targetSalary}
              onChange={(e) => setFormData({ ...formData, targetSalary: e.target.value })}
              className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:border-blue-500 focus:ring-0 transition-colors"
            >
              <option value="">Select salary range</option>
              <option value="0-75">$0 - $75k</option>
              <option value="75-150">$75k - $150k</option>
              <option value="150-200">$150k - $200k</option>
              <option value="200+">$200k+</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-semibold text-gray-900 mb-2">
              Preferred Location
            </label>
            <input
              type="text"
              placeholder="e.g., San Francisco, Remote"
              value={formData.location}
              onChange={(e) => setFormData({ ...formData, location: e.target.value })}
              className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:border-blue-500 focus:ring-0 transition-colors"
            />
          </div>
          <div>
            <label className="block text-sm font-semibold text-gray-900 mb-3">
              Preferred Job Types
            </label>
            <div className="space-y-2">
              {['Full-time', 'Contract', 'Part-time', 'Remote'].map((type) => (
                <label key={type} className="flex items-center gap-3">
                  <input
                    type="checkbox"
                    checked={formData.preferredJobTypes.includes(type)}
                    onChange={(e) => {
                      if (e.target.checked) {
                        setFormData({
                          ...formData,
                          preferredJobTypes: [...formData.preferredJobTypes, type],
                        });
                      } else {
                        setFormData({
                          ...formData,
                          preferredJobTypes: formData.preferredJobTypes.filter((t) => t !== type),
                        });
                      }
                    }}
                    className="w-4 h-4 rounded border-gray-300 text-blue-600"
                  />
                  <span className="text-gray-700">{type}</span>
                </label>
              ))}
            </div>
          </div>
        </div>
      ),
    },
    {
      title: 'Skills & Interests',
      description: 'What are your key skills?',
      content: (
        <div className="space-y-6">
          <div>
            <label className="block text-sm font-semibold text-gray-900 mb-2">
              Key Skills (comma-separated)
            </label>
            <textarea
              placeholder="e.g., JavaScript, React, Node.js, Python"
              value={formData.skills.join(', ')}
              onChange={(e) => setFormData({ ...formData, skills: e.target.value.split(',').map((s) => s.trim()) })}
              rows={3}
              className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:border-blue-500 focus:ring-0 transition-colors resize-none"
            />
          </div>
          <div>
            <label className="block text-sm font-semibold text-gray-900 mb-2">
              Industries of Interest (optional)
            </label>
            <input
              type="text"
              placeholder="e.g., Tech, Finance, Healthcare"
              value={formData.industries}
              onChange={(e) => setFormData({ ...formData, industries: e.target.value })}
              className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:border-blue-500 focus:ring-0 transition-colors"
            />
          </div>
          <div>
            <label className="block text-sm font-semibold text-gray-900 mb-2">
              Companies You&apos;re Interested In (optional)
            </label>
            <input
              type="text"
              placeholder="e.g., Google, Meta, Microsoft"
              value={formData.companies}
              onChange={(e) => setFormData({ ...formData, companies: e.target.value })}
              className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:border-blue-500 focus:ring-0 transition-colors"
            />
          </div>
        </div>
      ),
    },
    {
      title: 'You&apos;re All Set!',
      description: 'Your profile is ready. Let\'s start finding your dream job.',
      content: (
        <div className="text-center space-y-6">
          <div className="text-6xl mb-4">🎉</div>
          <p className="text-gray-600 text-lg">
            Your Job Agent profile is configured and ready to find amazing opportunities.
          </p>
          <ul className="text-left space-y-3 bg-blue-50 rounded-lg p-6 border border-blue-200">
            <li className="flex items-center gap-3">
              <span className="text-green-600">✓</span>
              <span className="text-gray-700">Profile configured with your preferences</span>
            </li>
            <li className="flex items-center gap-3">
              <span className="text-green-600">✓</span>
              <span className="text-gray-700">AI matching engine is finding jobs for you</span>
            </li>
            <li className="flex items-center gap-3">
              <span className="text-green-600">✓</span>
              <span className="text-gray-700">You&apos;ll receive personalized job matches</span>
            </li>
          </ul>
        </div>
      ),
    },
  ];

  const containerVariants = {
    hidden: { opacity: 0, x: 20 },
    visible: {
      opacity: 1,
      x: 0,
      transition: { duration: 0.5 },
    },
    exit: {
      opacity: 0,
      x: -20,
      transition: { duration: 0.3 },
    },
  };

  return (
    <main className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50 flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-2xl">
        {/* Progress Bar */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-semibold text-gray-900">
              Step {currentStep + 1} of {steps.length}
            </h2>
            <span className="text-sm text-gray-600">
              {Math.round(((currentStep + 1) / steps.length) * 100)}%
            </span>
          </div>
          <div className="w-full h-2 bg-gray-200 rounded-full overflow-hidden">
            <motion.div
              animate={{ width: `${((currentStep + 1) / steps.length) * 100}%` }}
              transition={{ duration: 0.5 }}
              className="h-full bg-gradient-to-r from-blue-600 to-indigo-600"
            />
          </div>
        </div>

        {/* Card */}
        <motion.div
          key={currentStep}
          variants={containerVariants}
          initial="hidden"
          animate="visible"
          exit="exit"
          className="bg-white rounded-2xl shadow-lg border border-gray-100 p-8 md:p-12"
        >
          {/* Header */}
          <h1 className="text-3xl font-bold text-gray-900 mb-3">{steps[currentStep].title}</h1>
          <p className="text-gray-600 mb-8">{steps[currentStep].description}</p>

          {/* Content */}
          {steps[currentStep].content}

          {/* Buttons */}
          <div className="mt-10 flex gap-4 justify-between">
            <button
              onClick={() => setCurrentStep(Math.max(0, currentStep - 1))}
              disabled={currentStep === 0}
              className="px-6 py-3 border border-gray-200 text-gray-700 rounded-lg font-medium hover:bg-gray-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Back
            </button>

            {currentStep === steps.length - 1 ? (
              <Link
                href="/dashboard"
                className="px-6 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-lg font-medium hover:shadow-lg transition-all"
              >
                Go to Dashboard →
              </Link>
            ) : (
              <button
                onClick={() => setCurrentStep(currentStep + 1)}
                className="px-6 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-lg font-medium hover:shadow-lg transition-all"
              >
                Continue →
              </button>
            )}
          </div>
        </motion.div>

        {/* Skip Link */}
        {currentStep < steps.length - 1 && (
          <div className="text-center mt-6">
            <Link
              href="/dashboard"
              className="text-gray-600 hover:text-gray-900 font-medium text-sm"
            >
              Skip for now
            </Link>
          </div>
        )}
      </div>
    </main>
  );
}
