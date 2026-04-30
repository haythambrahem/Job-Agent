'use client';

import { motion } from 'framer-motion';
import { useState } from 'react';

export default function ProfilePage() {
  const [formData, setFormData] = useState({
    fullName: 'John Doe',
    email: 'john@example.com',
    phone: '+1 (555) 123-4567',
    location: 'San Francisco, CA',
    bio: 'Experienced software engineer with 5+ years of experience in full-stack development.',
    skills: ['JavaScript', 'React', 'Node.js', 'Python', 'AWS'],
    resume: 'john-doe-resume.pdf',
  });

  const [isEditing, setIsEditing] = useState(false);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };

  const handleSave = () => {
    setIsEditing(false);
    // Handle save logic
  };

  return (
    <div className="flex-1 overflow-auto bg-gray-50">
      <div className="p-8">
        {/* Header */}
        <div className="mb-8 flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Profile</h1>
            <p className="text-gray-600">Manage your professional information</p>
          </div>
          <button
            onClick={() => setIsEditing(!isEditing)}
            className={`px-6 py-2 rounded-lg font-medium transition-colors ${
              isEditing
                ? 'bg-gray-200 text-gray-900 hover:bg-gray-300'
                : 'bg-blue-600 text-white hover:bg-blue-700'
            }`}
          >
            {isEditing ? 'Cancel' : 'Edit Profile'}
          </button>
        </div>

        {/* Profile Content */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="card mb-8"
        >
          {/* Avatar Section */}
          <div className="mb-8 pb-8 border-b border-gray-200 flex items-center gap-6">
            <div className="w-24 h-24 bg-gradient-to-br from-blue-500 to-indigo-500 rounded-full flex items-center justify-center text-white text-2xl font-bold">
              JD
            </div>
            <div>
              <h2 className="text-2xl font-bold text-gray-900">{formData.fullName}</h2>
              <p className="text-gray-600">{formData.email}</p>
              {isEditing && (
                <button className="mt-3 text-sm text-blue-600 hover:text-blue-700 font-medium">
                  Change Avatar
                </button>
              )}
            </div>
          </div>

          {/* Personal Information */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
            <div>
              <label className="block text-sm font-semibold text-gray-900 mb-2">
                Full Name
              </label>
              <input
                type="text"
                name="fullName"
                value={formData.fullName}
                onChange={handleInputChange}
                disabled={!isEditing}
                className="w-full px-4 py-3 border border-gray-200 rounded-lg bg-gray-50 disabled:bg-gray-100 disabled:cursor-not-allowed focus:border-blue-500 focus:ring-0 transition-colors"
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-900 mb-2">
                Email
              </label>
              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleInputChange}
                disabled={!isEditing}
                className="w-full px-4 py-3 border border-gray-200 rounded-lg bg-gray-50 disabled:bg-gray-100 disabled:cursor-not-allowed focus:border-blue-500 focus:ring-0 transition-colors"
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-900 mb-2">
                Phone
              </label>
              <input
                type="tel"
                name="phone"
                value={formData.phone}
                onChange={handleInputChange}
                disabled={!isEditing}
                className="w-full px-4 py-3 border border-gray-200 rounded-lg bg-gray-50 disabled:bg-gray-100 disabled:cursor-not-allowed focus:border-blue-500 focus:ring-0 transition-colors"
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-900 mb-2">
                Location
              </label>
              <input
                type="text"
                name="location"
                value={formData.location}
                onChange={handleInputChange}
                disabled={!isEditing}
                className="w-full px-4 py-3 border border-gray-200 rounded-lg bg-gray-50 disabled:bg-gray-100 disabled:cursor-not-allowed focus:border-blue-500 focus:ring-0 transition-colors"
              />
            </div>
          </div>

          {/* Bio */}
          <div className="mb-8">
            <label className="block text-sm font-semibold text-gray-900 mb-2">
              Professional Bio
            </label>
            <textarea
              name="bio"
              value={formData.bio}
              onChange={handleInputChange}
              disabled={!isEditing}
              rows={4}
              className="w-full px-4 py-3 border border-gray-200 rounded-lg bg-gray-50 disabled:bg-gray-100 disabled:cursor-not-allowed focus:border-blue-500 focus:ring-0 transition-colors resize-none"
            />
          </div>

          {/* Skills */}
          <div className="mb-8">
            <label className="block text-sm font-semibold text-gray-900 mb-3">
              Skills
            </label>
            <div className="flex flex-wrap gap-2 mb-4">
              {formData.skills.map((skill, idx) => (
                <span
                  key={idx}
                  className="px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-sm font-medium flex items-center gap-2"
                >
                  {skill}
                  {isEditing && (
                    <button className="text-blue-700 hover:text-blue-900">×</button>
                  )}
                </span>
              ))}
            </div>
            {isEditing && (
              <input
                type="text"
                placeholder="Add a skill..."
                className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:border-blue-500 focus:ring-0 transition-colors"
              />
            )}
          </div>

          {/* Resume */}
          <div className="mb-8 pb-8 border-b border-gray-200">
            <label className="block text-sm font-semibold text-gray-900 mb-3">
              Resume
            </label>
            <div className="flex items-center gap-4">
              <div className="flex-1 px-4 py-3 bg-gray-100 rounded-lg border border-gray-200">
                <p className="text-sm text-gray-700">{formData.resume}</p>
              </div>
              {isEditing && (
                <button className="px-4 py-2 border border-gray-200 text-gray-700 rounded-lg hover:bg-gray-100 transition-colors">
                  Upload
                </button>
              )}
            </div>
          </div>

          {/* Save Button */}
          {isEditing && (
            <div className="flex gap-4 justify-end">
              <button
                onClick={() => setIsEditing(false)}
                className="px-6 py-2 border border-gray-200 text-gray-700 rounded-lg hover:bg-gray-100 transition-colors font-medium"
              >
                Cancel
              </button>
              <button
                onClick={handleSave}
                className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
              >
                Save Changes
              </button>
            </div>
          )}
        </motion.div>

        {/* Account Settings Link */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="card p-6"
        >
          <h3 className="font-semibold text-gray-900 mb-2">Account Settings</h3>
          <p className="text-gray-600 text-sm mb-4">
            Manage your account security, notifications, and preferences
          </p>
          <a
            href="/dashboard/settings"
            className="text-blue-600 hover:text-blue-700 font-medium text-sm"
          >
            Go to Settings →
          </a>
        </motion.div>
      </div>
    </div>
  );
}
