import { Metadata } from "next";
import { JsonLdScript } from "@/components/JsonLdScript";
import { generateSoftwareApplicationSchema, generateOrganizationSchema, generateFAQSchema } from "@/lib/schema";
import { SITE_CONFIG } from "@/lib/constants";
import LandingPage from "@/components/landing/LandingPage";

export const metadata: Metadata = {
  title: `${SITE_CONFIG.name} | Automate Your Job Applications & Find Jobs Faster`,
  description: SITE_CONFIG.description,
  keywords: SITE_CONFIG.keywords,
  openGraph: {
    title: `${SITE_CONFIG.name} | Automate Your Job Applications`,
    description: "Automate job applications and find jobs faster with AI-powered matching.",
    type: "website",
    url: SITE_CONFIG.url,
    siteName: SITE_CONFIG.name,
    images: [
      {
        url: SITE_CONFIG.ogImage,
        width: 1200,
        height: 630,
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: `${SITE_CONFIG.name} | Automate Your Job Applications`,
    description: "Automate job applications and find jobs faster with AI-powered matching.",
    creator: SITE_CONFIG.social.twitter,
  },
};

export default function HomePage() {
  const softwareSchema = generateSoftwareApplicationSchema();
  const organizationSchema = generateOrganizationSchema();
  const faqSchema = generateFAQSchema();

  return (
    <>
      <JsonLdScript schema={softwareSchema} />
      <JsonLdScript schema={organizationSchema} />
      <JsonLdScript schema={faqSchema} />
      <LandingPage />
    </>
  );
}
