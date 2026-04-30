import type { MetadataRoute } from 'next'

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: '*',
        allow: '/',
        disallow: [
          '/dashboard',
          '/api/',
          '/profile',
          '/settings',
          '/billing',
          '/jobs',
          '/applications',
          '/*.json$',
          '/*?*sort=',
          '/*?*filter=',
        ],
      },
      {
        userAgent: 'GPTBot',
        disallow: '/',
      },
      {
        userAgent: 'ChatGPT-User',
        disallow: '/',
      },
    ],
    sitemap: 'https://jobagent.app/sitemap.xml',
  }
}
