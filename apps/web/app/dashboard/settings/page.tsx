'use client';

import { motion } from 'framer-motion';
import { useState } from 'react';

export default function SettingsPage() {
  const [settings, setSettings] = useState({
    emailNotifications: true,
    pushNotifications: false,
    weeklyDigest: true,
    jobAlerts: true,
    interviewReminders: true,
    autoApply: true,
    maxApplicationsPerDay: '10',
    privacy: 'private',
    twoFactor: false,
  });

  const handleToggle = (key: string) => {
    setSettings({
      ...settings,
      [key]: !settings[key as keyof typeof settings],
    });
  };

  const handleChange = (key: string, value: string) => {
    setSettings({
      ...settings,
      [key]: value,
    });
  };

  const handleSave = () => {
    // Handle save logic
    alert('Settings saved successfully!');
  };

  return (
    <div className="flex-1 overflow-auto bg-gray-50">
      <div className="p-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Settings</h1>
          <p className="text-gray-600">Manage your account and preferences</p>
        </div>

        {/* Notification Settings */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="card mb-8"
        >
          <h2 className="text-xl font-bold text-gray-900 mb-6">Notifications</h2>

          <div className="space-y-6 border-t border-gray-200 pt-6">
            {[
              { key: 'emailNotifications', label: 'Email Notifications', description: 'Receive updates via email' },
              { key: 'pushNotifications', label: 'Push Notifications', description: 'Get browser notifications' },
              { key: 'weeklyDigest', label: 'Weekly Digest', description: 'Receive a weekly summary' },
              { key: 'jobAlerts', label: 'Job Alerts', description: 'Get notified of new matching jobs' },
              { key: 'interviewReminders', label: 'Interview Reminders', description: 'Reminders before scheduled interviews' },
            ].map((notification) => (
              <div key={notification.key} className="flex items-center justify-between">
                <div>
                  <p className="font-medium text-gray-900">{notification.label}</p>
                  <p className="text-sm text-gray-600">{notification.description}</p>
                </div>
                <label className="relative inline-flex cursor-pointer">
                  <input
                    type="checkbox"
                    checked={settings[notification.key as keyof typeof settings] as boolean}
                    onChange={() => handleToggle(notification.key)}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                </label>
              </div>
            ))}
          </div>
        </motion.div>

        {/* Automation Settings */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="card mb-8"
        >
          <h2 className="text-xl font-bold text-gray-900 mb-6">Automation</h2>

          <div className="space-y-6 border-t border-gray-200 pt-6">
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="block text-sm font-semibold text-gray-900">
                  Auto-Apply to Jobs
                </label>
                <label className="relative inline-flex cursor-pointer">
                  <input
                    type="checkbox"
                    checked={settings.autoApply}
                    onChange={() => handleToggle('autoApply')}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                </label>
              </div>
              <p className="text-sm text-gray-600">Automatically apply to matching jobs</p>
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-900 mb-2">
                Max Applications Per Day
              </label>
              <input
                type="number"
                value={settings.maxApplicationsPerDay}
                onChange={(e) => handleChange('maxApplicationsPerDay', e.target.value)}
                min="1"
                max="50"
                className="w-full md:w-32 px-4 py-2 border border-gray-200 rounded-lg focus:border-blue-500 focus:ring-0 transition-colors"
              />
              <p className="text-sm text-gray-600 mt-2">Limit automatic applications per day</p>
            </div>
          </div>
        </motion.div>

        {/* Privacy Settings */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="card mb-8"
        >
          <h2 className="text-xl font-bold text-gray-900 mb-6">Privacy & Security</h2>

          <div className="space-y-6 border-t border-gray-200 pt-6">
            <div>
              <label className="block text-sm font-semibold text-gray-900 mb-3">
                Profile Visibility
              </label>
              <select
                value={settings.privacy}
                onChange={(e) => handleChange('privacy', e.target.value)}
                className="w-full md:w-64 px-4 py-2 border border-gray-200 rounded-lg focus:border-blue-500 focus:ring-0 transition-colors"
              >
                <option value="private">Private - Only you can see</option>
                <option value="recruiters">Recruiters - Visible to recruiters</option>
                <option value="public">Public - Visible to everyone</option>
              </select>
            </div>

            <div>
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium text-gray-900">Two-Factor Authentication</p>
                  <p className="text-sm text-gray-600">Add an extra layer of security</p>
                </div>
                <label className="relative inline-flex cursor-pointer">
                  <input
                    type="checkbox"
                    checked={settings.twoFactor}
                    onChange={() => handleToggle('twoFactor')}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                </label>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Danger Zone */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="card border-red-200 bg-red-50 mb-8"
        >
          <h2 className="text-xl font-bold text-red-900 mb-6">Danger Zone</h2>

          <div className="space-y-4 border-t border-red-200 pt-6">
            <button className="w-full px-4 py-3 text-red-600 border-2 border-red-200 rounded-lg hover:bg-red-100 transition-colors font-medium">
              Reset All Preferences
            </button>
            <button className="w-full px-4 py-3 text-red-600 border-2 border-red-200 rounded-lg hover:bg-red-100 transition-colors font-medium">
              Delete My Account
            </button>
          </div>
        </motion.div>

        {/* Save Button */}
        <div className="flex gap-4 justify-end">
          <button className="px-6 py-2 border border-gray-200 text-gray-700 rounded-lg hover:bg-gray-100 transition-colors font-medium">
            Cancel
          </button>
          <button
            onClick={handleSave}
            className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
          >
            Save Settings
          </button>
        </div>
      </div>
    </div>
  );
}
