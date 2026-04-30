import { Metadata } from "next";
import { JsonLdScript } from "@/components/JsonLdScript";
import { generateSoftwareApplicationSchema, generateOrganizationSchema } from "@/lib/schema";
import LandingPage from "@/components/landing/LandingPage";

export const metadata: Metadata = {
  title: "Job Agent | Automate Your Job Applications & Find Jobs Faster",
  description: "Automate job applications, match with opportunities, and land your dream job faster. Job Agent uses AI to streamline your job search process.",
  keywords: ["job automation", "job search", "automated job applications", "job matching", "AI job search"],
  openGraph: {
    title: "Job Agent | Automate Your Job Applications",
    description: "Automate job applications and find jobs faster with AI-powered matching.",
    type: "website",
    url: "https://jobagent.app",
  },
};

export default function HomePage() {
  const softwareSchema = generateSoftwareApplicationSchema();
  const organizationSchema = generateOrganizationSchema();

  return (
    <>
      <JsonLdScript schema={softwareSchema} />
      <JsonLdScript schema={organizationSchema} />
      <LandingPage />
    </>
  );
}
