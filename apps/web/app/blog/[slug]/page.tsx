import Link from "next/link";
import { JsonLdScript } from "@/components/JsonLdScript";
import { generateArticleSchema } from "@/lib/schema";

const blogContent: Record<string, { title: string; excerpt: string; content: string; date: string; author: string; readTime: string }> = {
  "job-automation-guide": {
    title: "The Complete Guide to Job Automation",
    excerpt: "Learn how to leverage job automation tools to save time and land more interviews.",
    date: "2024-03-15",
    author: "Job Agent Team",
    readTime: "8 min read",
    content: `
      Job automation is transforming the way professionals search for opportunities. This comprehensive guide covers everything you need to know to master the art of automated job searching.

      ## Why Job Automation Matters

      The average job search can take weeks or even months, with professionals spending hours filling out repetitive forms and manually applying to positions. Job automation changes this game entirely.

      ## How Job Automation Works

      Job automation platforms use AI and machine learning to:
      - Identify positions matching your criteria
      - Automatically fill out application forms
      - Submit applications on your behalf
      - Track responses and follow-ups

      ## Best Practices for Automation

      1. **Set Accurate Criteria**: Define your ideal job carefully
      2. **Monitor Applications**: Check in regularly on your submissions
      3. **Customize When Needed**: Some applications benefit from personalization
      4. **Stay Engaged**: Respond quickly to interview opportunities

      ## Maximizing Your Success

      The most successful job seekers combine automation with personal engagement. Use automation to handle volume, then focus your energy on standout opportunities.

      Start your journey today with Job Agent and discover how automation can accelerate your career growth.
    `,
  },
  "reduce-job-application-time": {
    title: "How to Reduce Job Application Time by 90%",
    excerpt: "Discover proven strategies to streamline your job search process.",
    date: "2024-03-10",
    author: "Job Agent Team",
    readTime: "5 min read",
    content: `
      Most job seekers spend 40+ hours per month on applications. Here's how to cut that time dramatically.

      ## The Traditional Job Search Problem

      Traditional job searching involves:
      - Browsing multiple job boards
      - Manually filling out forms with the same information repeatedly
      - Writing custom cover letters for each position
      - Tracking applications across different platforms

      ## The 90% Time Reduction Strategy

      By implementing automation and smart workflows:
      - Consolidate your profile information once
      - Let automation handle repetitive applications
      - Focus time on strategic opportunities
      - Use templates for cover letters

      ## Tools That Help

      Modern job automation platforms can significantly reduce your workload. Focus on quality over quantity, but let technology handle the volume.

      ## Your Competitive Advantage

      With 90% less time spent on applications, you can focus on interview preparation, networking, and professional development—the activities that actually lead to jobs.
    `,
  },
  "ai-job-matching": {
    title: "Understanding AI-Powered Job Matching",
    excerpt: "Explore how artificial intelligence is revolutionizing job searching.",
    date: "2024-03-05",
    author: "Job Agent Team",
    readTime: "6 min read",
    content: `
      Artificial intelligence is changing how job seekers find opportunities. Here's what you need to know about AI-powered job matching.

      ## How AI Matching Works

      AI job matching algorithms analyze:
      - Your skills and experience
      - Job requirements and descriptions
      - Company culture and values
      - Industry trends and opportunities

      ## The Accuracy Advantage

      Unlike keyword matching, AI matching understands context. It can find opportunities that align with your career goals even if the exact keywords don't match.

      ## Better Outcomes

      Job seekers using AI matching report:
      - Higher interview rates
      - Better job fit
      - Faster placements
      - Improved job satisfaction

      ## The Future of Job Search

      AI isn't replacing job searching—it's evolving it. By understanding how AI matching works, you can better prepare your profile and increase your visibility to relevant opportunities.
    `,
  },
  "resume-optimization": {
    title: "7 Ways to Optimize Your Resume for ATS",
    excerpt: "Learn how to format your resume for maximum ATS compatibility.",
    date: "2024-02-28",
    author: "Job Agent Team",
    readTime: "7 min read",
    content: `
      Most resumes never reach a human recruiter. Here's how to optimize for ATS (Applicant Tracking Systems).

      ## What is ATS?

      ATS software scans resumes and ranks them based on relevance to the job posting. If your resume doesn't pass this scan, you won't get an interview.

      ## 7 Optimization Strategies

      1. **Use Standard Formatting**: Avoid tables, graphics, and unusual fonts
      2. **Include Keywords**: Mirror language from the job posting
      3. **Use Standard Section Headers**: Use industry-standard section titles
      4. **Save as PDF**: Ensures formatting stays intact
      5. **Optimize for Readability**: Use clear hierarchy and spacing
      6. **Include Quantifiable Achievements**: Numbers stand out to ATS
      7. **List Technical Skills**: Create a dedicated skills section

      ## Testing Your Resume

      Before submitting, test your resume with ATS checkers to ensure maximum compatibility.

      ## The Balance

      While optimizing for ATS is important, remember that humans still read your resume. Optimize for both machines and people.
    `,
  },
  "interview-preparation": {
    title: "AI-Powered Interview Preparation: A New Era",
    excerpt: "Prepare for interviews with AI coaching and real-time feedback.",
    date: "2024-02-20",
    author: "Job Agent Team",
    readTime: "6 min read",
    content: `
      Interview preparation has evolved. Here's how AI is changing the game.

      ## Traditional Interview Prep

      Most people prepare for interviews by:
      - Researching the company
      - Studying common questions
      - Practicing answers alone
      - Hoping for the best

      ## AI-Powered Preparation

      Modern AI interview coaches help you:
      - Practice with realistic scenarios
      - Get real-time feedback on delivery
      - Receive suggestions for improvement
      - Build confidence before the real interview

      ## Key Areas AI Helps With

      - **Speaking Skills**: Clarity, pace, and confidence
      - **Content Quality**: Depth and relevance of answers
      - **Body Language**: Posture and engagement (for video interviews)
      - **Time Management**: Keeping answers concise

      ## Your Interview Advantage

      With AI coaching, you can practice as many times as needed in a risk-free environment. This leads to more confident, impressive interviews.

      ## Get Ready

      Start your interview preparation today with realistic practice and AI-powered feedback.
    `,
  },
  "job-board-comparison": {
    title: "2024 Job Board Comparison: Which Works Best?",
    excerpt: "Compare the top job boards and find the best platforms for your industry.",
    date: "2024-02-15",
    author: "Job Agent Team",
    readTime: "9 min read",
    content: `
      Choosing the right job boards can make or break your job search. Here's our comprehensive comparison.

      ## Major Job Boards Overview

      ### LinkedIn
      - **Best For**: Professional roles and networking
      - **Strengths**: Largest professional network, recruiter outreach
      - **Weaknesses**: Job quantity varies by industry

      ### Indeed
      - **Best For**: High volume of opportunities
      - **Strengths**: Massive job database, resume reviews
      - **Weaknesses**: Can be overwhelming, many low-quality postings

      ### Glassdoor
      - **Best For**: Company research and culture fit
      - **Strengths**: Company reviews, salary data, insights
      - **Weaknesses**: Limited job quantity

      ### Specialized Boards
      - **Best For**: Niche industries and roles
      - **Strengths**: Highly relevant opportunities, less competition
      - **Weaknesses**: Smaller talent pools

      ## The Best Strategy

      Don't choose just one. Use multiple boards, but focus on those relevant to your industry and experience level.

      ## Automation Advantage

      By combining multiple job boards through automation, you can monitor all opportunities without spending hours on manual searches.
    `,
  },
};

export default async function BlogPostPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const post = blogContent[slug];

  if (!post) {
    return (
      <main className="min-h-screen bg-gradient-to-b from-slate-950 to-slate-900">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-16 pt-32 text-center">
          <h1 className="text-4xl font-bold text-white mb-4">Post Not Found</h1>
          <p className="text-slate-300 mb-8">
            The blog post you're looking for doesn't exist.
          </p>
          <Link
            href="/blog"
            className="inline-block bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg"
          >
            Back to Blog
          </Link>
        </div>
      </main>
    );
  }

  const articleSchema = generateArticleSchema({
    title: post.title,
    description: post.excerpt,
    datePublished: post.date,
    author: post.author,
    url: `https://jobagent.app/blog/${slug}`,
  });

  return (
    <main className="min-h-screen bg-gradient-to-b from-slate-950 to-slate-900">
      <JsonLdScript schema={articleSchema} />

      <article className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-16 pt-32">
        <header className="mb-8">
          <div className="flex items-center gap-2 mb-4">
            <span className="text-blue-400">{post.readTime}</span>
            <span className="text-slate-500">•</span>
            <time className="text-slate-400">
              {new Date(post.date).toLocaleDateString("en-US", {
                year: "numeric",
                month: "long",
                day: "numeric",
              })}
            </time>
          </div>
          <h1 className="text-4xl md:text-5xl font-bold text-white mb-4">
            {post.title}
          </h1>
          <p className="text-xl text-slate-300">{post.excerpt}</p>
        </header>

        <div className="prose prose-invert max-w-none prose-h2:text-2xl prose-h2:font-bold prose-h2:text-white prose-p:text-slate-300 prose-li:text-slate-300">
          {post.content.split("\n\n").map((paragraph, index) => {
            if (paragraph.startsWith("##")) {
              return (
                <h2 key={index} className="text-2xl font-bold text-white mt-8 mb-4">
                  {paragraph.replace("## ", "")}
                </h2>
              );
            }
            if (paragraph.startsWith("- ")) {
              return (
                <ul key={index} className="list-disc list-inside space-y-2 text-slate-300">
                  {paragraph.split("\n").map((item, i) => (
                    <li key={i}>{item.replace("- ", "")}</li>
                  ))}
                </ul>
              );
            }
            if (paragraph.match(/^\d\./)) {
              return (
                <ol key={index} className="list-decimal list-inside space-y-2 text-slate-300">
                  {paragraph.split("\n").map((item, i) => (
                    <li key={i}>{item.replace(/^\d+\. /, "")}</li>
                  ))}
                </ol>
              );
            }
            return (
              <p key={index} className="text-slate-300 leading-relaxed">
                {paragraph}
              </p>
            );
          })}
        </div>

        <div className="border-t border-slate-700 mt-12 pt-8">
          <div className="bg-slate-800/50 border border-slate-700 rounded-lg p-6">
            <p className="text-sm text-slate-400 mb-2">Written by</p>
            <p className="text-lg font-semibold text-white">{post.author}</p>
            <p className="text-slate-400 text-sm mt-2">
              Job Agent team dedicated to helping professionals master their job search.
            </p>
          </div>
        </div>

        <div className="mt-8 text-center">
          <Link
            href="/blog"
            className="inline-block text-blue-400 hover:text-blue-300 font-semibold"
          >
            ← Back to Blog
          </Link>
        </div>
      </article>
    </main>
  );
}
