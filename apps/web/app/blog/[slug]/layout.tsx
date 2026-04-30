import { Metadata } from "next";

const blogPostsMetadata: Record<string, { title: string; description: string }> = {
  "job-automation-guide": {
    title: "The Complete Guide to Job Automation",
    description: "Learn how to leverage job automation tools to save time and land more interviews.",
  },
  "reduce-job-application-time": {
    title: "How to Reduce Job Application Time by 90%",
    description: "Discover proven strategies to streamline your job search process.",
  },
  "ai-job-matching": {
    title: "Understanding AI-Powered Job Matching",
    description: "Explore how artificial intelligence is revolutionizing job searching.",
  },
  "resume-optimization": {
    title: "7 Ways to Optimize Your Resume for ATS",
    description: "Learn how to format your resume for maximum ATS compatibility.",
  },
  "interview-preparation": {
    title: "AI-Powered Interview Preparation: A New Era",
    description: "Prepare for interviews with AI coaching and real-time feedback.",
  },
  "job-board-comparison": {
    title: "2024 Job Board Comparison: Which Works Best?",
    description: "Compare the top job boards and find the best platforms for your industry.",
  },
};

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const post = blogPostsMetadata[slug];

  return {
    title: `${post?.title || "Blog Post"} - Job Agent`,
    description:
      post?.description ||
      "Read more on the Job Agent blog about job automation and career development.",
    openGraph: {
      title: post?.title,
      description: post?.description,
      type: "article",
      url: `https://jobagent.app/blog/${slug}`,
    },
  };
}

export function generateStaticParams() {
  return Object.keys(blogPostsMetadata).map((slug) => ({
    slug,
  }));
}

export default function BlogPostLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
