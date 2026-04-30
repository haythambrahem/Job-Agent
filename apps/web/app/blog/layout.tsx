import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Blog - Job Agent",
  description: "Articles and resources about job automation, career development, and finding your dream job with AI-powered matching.",
  keywords: ["job automation", "career tips", "job search tips", "resume optimization"],
};

export default function BlogLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
