export function generateSoftwareApplicationSchema() {
  return {
    '@context': 'https://schema.org',
    '@type': 'SoftwareApplication',
    name: 'Job Agent',
    description: 'Automate job applications, match with opportunities, and land your dream job faster. Job Agent uses AI to streamline your job search process.',
    url: 'https://jobagent.app',
    image: 'https://jobagent.app/og-image.png',
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
      description: 'Job Agent offers free and premium plans',
    },
    author: {
      '@type': 'Organization',
      name: 'Job Agent',
      url: 'https://jobagent.app',
      logo: 'https://jobagent.app/logo.png',
      sameAs: [
        'https://twitter.com/jobagent',
        'https://linkedin.com/company/jobagent',
      ],
    },
  }
}

export function generateFAQSchema(faqs: Array<{ question: string; answer: string }>) {
  return {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: faqs.map((faq) => ({
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
    name: 'Job Agent',
    url: 'https://jobagent.app',
    logo: 'https://jobagent.app/logo.png',
    description: 'Automate job applications and find jobs faster with AI-powered matching.',
    sameAs: [
      'https://twitter.com/jobagent',
      'https://linkedin.com/company/jobagent',
    ],
    address: {
      '@type': 'PostalAddress',
      addressCountry: 'US',
    },
    contactPoint: {
      '@type': 'ContactPoint',
      contactType: 'Customer Support',
      email: 'support@jobagent.app',
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
