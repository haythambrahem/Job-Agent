/**
 * Site-wide constants and configuration
 */

export const SITE_CONFIG = {
  name: 'Job Agent',
  domain: 'jobagent.app',
  url: 'https://jobagent.app',
  description: 'Automate job applications, match with opportunities, and land your dream job faster with AI-powered Job Agent.',
  logo: 'https://jobagent.app/logo.png',
  ogImage: 'https://jobagent.app/og-image.png',
  themeColor: '#0066ff',
  
  // Social links
  social: {
    twitter: '@jobagent',
    linkedin: 'https://linkedin.com/company/jobagent',
    email: 'support@jobagent.app',
  },

  // Company info
  company: {
    name: 'Job Agent',
    email: 'support@jobagent.app',
    address: 'US',
  },

  // Navigation links
  nav: {
    home: '/',
    blog: '/blog',
    faq: '/faq',
    pricing: '/pricing',
    features: '/features',
    signin: '/signin',
    signup: '/signup',
  },

  // Keywords
  keywords: [
    'job automation',
    'job search',
    'automated job applications',
    'job matching',
    'AI job search',
    'career automation',
    'employment technology',
    'job board integration',
    'resume optimization',
  ],
};

export const PRICING = {
  free: {
    name: 'Starter',
    price: 0,
    features: ['5 applications/day', 'Basic filters', 'Email support'],
  },
  pro: {
    name: 'Professional',
    price: 29,
    features: ['50 applications/day', 'Advanced filters', 'Priority support', 'Interview prep'],
  },
  enterprise: {
    name: 'Enterprise',
    price: 99,
    features: ['Unlimited applications', 'Custom filters', '24/7 support', 'API access', 'Dedicated manager'],
  },
};
