import Link from "next/link";
import { JsonLdScript } from "@/components/JsonLdScript";

const blogPosts = [
  {
    slug: "job-automation-guide",
    title: "The Complete Guide to Job Automation",
    excerpt: "Learn how to leverage job automation tools to save time and land more interviews. Our comprehensive guide covers strategies, best practices, and common pitfalls.",
    date: "2024-03-15",
    readTime: "8 min read",
    category: "Guide",
  },
  {
    slug: "reduce-job-application-time",
    title: "How to Reduce Job Application Time by 90%",
    excerpt: "Discover proven strategies to streamline your job search process. From automation to profile optimization, we share insider tips used by successful job seekers.",
    date: "2024-03-10",
    readTime: "5 min read",
    category: "Tips",
  },
  {
    slug: "ai-job-matching",
    title: "Understanding AI-Powered Job Matching",
    excerpt: "Explore how artificial intelligence is revolutionizing job searching. Learn how AI matching algorithms work and why they&apos;re more effective than traditional search.",
    date: "2024-03-05",
    readTime: "6 min read",
    category: "Career",
  },
  {
    slug: "resume-optimization",
    title: "7 Ways to Optimize Your Resume for ATS",
    excerpt: "ATS (Applicant Tracking Systems) scan most resumes before human eyes see them. Learn how to format your resume for maximum ATS compatibility and visibility.",
    date: "2024-02-28",
    readTime: "7 min read",
    category: "Resume",
  },
  {
    slug: "interview-preparation",
    title: "AI-Powered Interview Preparation: A New Era",
    excerpt: "Prepare for interviews like never before with AI coaching. Get real-time feedback, practice common questions, and build confidence before your big day.",
    date: "2024-02-20",
    readTime: "6 min read",
    category: "Interview",
  },
  {
    slug: "job-board-comparison",
    title: "2024 Job Board Comparison: Which Works Best?",
    excerpt: "Compare the top job boards and find the best platforms for your industry. We analyze features, job quality, and success rates for different career paths.",
    date: "2024-02-15",
    readTime: "9 min read",
    category: "Resources",
  },
];

const blogSchema = {
  "@context": "https://schema.org",
  "@type": "Blog",
  name: "Job Agent Blog",
  description: "Articles and resources about job automation and career development",
  url: "https://jobagent.app/blog",
  author: {
    "@type": "Organization",
    name: "Job Agent",
    url: "https://jobagent.app",
  },
  blogPost: blogPosts.map((post) => ({
    "@type": "BlogPosting",
    headline: post.title,
    description: post.excerpt,
    datePublished: post.date,
    url: `https://jobagent.app/blog/${post.slug}`,
    author: {
      "@type": "Organization",
      name: "Job Agent",
    },
  })),
};

export default function BlogPage() {
  return (
    <main className="min-h-screen bg-gradient-to-b from-slate-950 to-slate-900">
      <JsonLdScript schema={blogSchema} />
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 pt-32">
        <div className="text-center mb-16">
          <h1 className="text-4xl md:text-5xl font-bold text-white mb-4 text-balance">
            Job Agent Blog
          </h1>
          <p className="text-xl text-slate-300 text-balance">
            Articles, tips, and resources to help you master job automation and land your dream role
          </p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
          {blogPosts.map((post) => (
            <article
              key={post.slug}
              className="bg-slate-800/50 border border-slate-700 rounded-lg overflow-hidden hover:border-slate-600 hover:bg-slate-800/70 transition group"
            >
              <div className="p-6 flex flex-col h-full">
                <div className="flex items-center gap-2 mb-3">
                  <span className="inline-block px-3 py-1 bg-blue-600/20 text-blue-400 text-xs font-semibold rounded-full">
                    {post.category}
                  </span>
                  <span className="text-sm text-slate-400">{post.readTime}</span>
                </div>

                <h2 className="text-xl font-bold text-white mb-3 group-hover:text-blue-400 transition line-clamp-2">
                  {post.title}
                </h2>

                <p className="text-slate-300 mb-4 flex-grow line-clamp-3">
                  {post.excerpt}
                </p>

                <div className="flex items-center justify-between pt-4 border-t border-slate-700">
                  <time className="text-sm text-slate-400">
                    {new Date(post.date).toLocaleDateString("en-US", {
                      year: "numeric",
                      month: "short",
                      day: "numeric",
                    })}
                  </time>
                  <Link
                    href={`/blog/${post.slug}`}
                    className="text-blue-400 hover:text-blue-300 font-semibold text-sm"
                  >
                    Read →
                  </Link>
                </div>
              </div>
            </article>
          ))}
        </div>
      </div>
    </main>
  );
}
