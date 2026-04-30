import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Blog - Job Agent | Career Tips & Job Automation Guides",
  description: "Read expert articles and resources about job automation, career development, and finding your dream job with AI-powered matching.",
  keywords: ["job automation", "career tips", "job search tips", "resume optimization", "interview prep", "job boards"],
  openGraph: {
    title: "Job Agent Blog | Career Tips & Job Automation Guides",
    description: "Expert articles on job automation, career development, and job search strategies.",
    type: "website",
    url: "https://jobagent.app/blog",
    siteName: "Job Agent",
  },
};

export default function BlogLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
