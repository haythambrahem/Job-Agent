import { SITE_CONFIG } from './constants';

export function generateSoftwareApplicationSchema() {
  return {
    '@context': 'https://schema.org',
    '@type': 'SoftwareApplication',
    name: SITE_CONFIG.name,
    description: SITE_CONFIG.description,
    url: SITE_CONFIG.url,
    image: SITE_CONFIG.ogImage,
    applicationCategory: 'Business/Productivity',
    operatingSystem: 'Web',
    aggregateRating: {
      '@type': 'AggregateRating',
      ratingValue: '4.8',
      ratingCount: '128',
      bestRating: '5',
      worstRating: '1',
    },
    offers: {
      '@type': 'Offer',
      priceCurrency: 'USD',
      price: '0',
      priceValidUntil: '2025-12-31',
      availability: 'https://schema.org/InStock',
      description: `${SITE_CONFIG.name} offers free and premium plans`,
    },
    author: {
      '@type': 'Organization',
      name: SITE_CONFIG.name,
      url: SITE_CONFIG.url,
      logo: SITE_CONFIG.logo,
      sameAs: [
        `https://twitter.com/${SITE_CONFIG.social.twitter.replace('@', '')}`,
        SITE_CONFIG.social.linkedin,
      ],
    },
  }
}

export function generateFAQSchema(faqs?: Array<{ question: string; answer: string }>) {
  // Default FAQ data if not provided
  const defaultFaqs = [
    {
      question: 'How does Job Agent automate applications?',
      answer: 'Job Agent uses AI to scan job listings that match your criteria, automatically fill out application forms with your information, and submit them on your behalf. You set your preferences once, and we handle the rest.',
    },
    {
      question: 'Is it really free to get started?',
      answer: 'Yes! You get a free 14-day trial with access to all features. No credit card required to start. After the trial, you can choose a paid plan or continue with our free tier with limited applications.',
    },
    {
      question: 'Will employers know my applications are automated?',
      answer: 'No. Your applications look like they come directly from you. We use your actual information and follow all job board guidelines to ensure your applications appear authentic.',
    },
    {
      question: 'Can I customize what jobs I apply for?',
      answer: 'Absolutely! You have complete control over your job criteria. Filter by location, salary range, industry, company size, and more. You can also manually approve or reject jobs before they\'re submitted.',
    },
    {
      question: 'What if I get an interview?',
      answer: 'We\'ll notify you immediately and help you prepare. Job Agent includes interview prep guides, company research tools, and follow-up reminders to help you succeed.',
    },
    {
      question: 'What integrations do you support?',
      answer: 'We integrate with major job boards including LinkedIn, Indeed, Glassdoor, and more. We also sync with your email and calendar to keep everything in one place.',
    },
  ];

  const faqData = faqs || defaultFaqs;

  return {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: faqData.map((faq: any) => ({
      '@type': 'Question',
      name: faq.question,
      acceptedAnswer: {
        '@type': 'Answer',
        text: faq.answer,
      },
    })),
  }
}

export function generateOrganizationSchema() {
  return {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    name: SITE_CONFIG.name,
    url: SITE_CONFIG.url,
    logo: SITE_CONFIG.logo,
    description: SITE_CONFIG.description,
    sameAs: [
      `https://twitter.com/${SITE_CONFIG.social.twitter.replace('@', '')}`,
      SITE_CONFIG.social.linkedin,
    ],
    address: {
      '@type': 'PostalAddress',
      addressCountry: SITE_CONFIG.company.address,
    },
    contactPoint: {
      '@type': 'ContactPoint',
      contactType: 'Customer Support',
      email: SITE_CONFIG.social.email,
    },
  }
}

export function generateBreadcrumbSchema(breadcrumbs: Array<{ name: string; url: string }>) {
  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: breadcrumbs.map((crumb, index) => ({
      '@type': 'ListItem',
      position: index + 1,
      name: crumb.name,
      item: crumb.url,
    })),
  }
}

export function generateArticleSchema(article: {
  title: string
  description: string
  image?: string
  datePublished: string
  dateModified?: string
  author?: string
  url: string
}) {
  return {
    '@context': 'https://schema.org',
    '@type': 'Article',
    headline: article.title,
    description: article.description,
    image: article.image || 'https://jobagent.app/og-image.png',
    datePublished: article.datePublished,
    dateModified: article.dateModified || article.datePublished,
    author: {
      '@type': 'Organization',
      name: article.author || 'Job Agent',
      url: 'https://jobagent.app',
    },
    mainEntityOfPage: {
      '@type': 'WebPage',
      '@id': article.url,
    },
    publisher: {
      '@type': 'Organization',
      name: 'Job Agent',
      logo: {
        '@type': 'ImageObject',
        url: 'https://jobagent.app/logo.png',
      },
    },
  }
}
