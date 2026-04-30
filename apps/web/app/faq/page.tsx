import { Metadata } from "next";
import { JsonLdScript } from "@/components/JsonLdScript";
import { generateFAQSchema } from "@/lib/schema";
import FAQSection from "@/components/landing/FAQ";

export const metadata: Metadata = {
  title: "FAQ - Job Agent",
  description: "Frequently asked questions about Job Agent, job automation, and how to maximize your job search success.",
  keywords: ["job automation faq", "job agent questions", "job search help"],
};

const faqData = [
  {
    question: "How does Job Agent automate applications?",
    answer: "Job Agent uses AI to scan job listings that match your criteria, automatically fill out application forms with your information, and submit them on your behalf. You set your preferences once, and we handle the rest.",
  },
  {
    question: "Is it really free to get started?",
    answer: "Yes! You get a free 14-day trial with access to all features. No credit card required to start. After the trial, you can choose a paid plan or continue with our free tier with limited applications.",
  },
  {
    question: "Will employers know my applications are automated?",
    answer: "No. Your applications look like they come directly from you. We use your actual information and follow all job board guidelines to ensure your applications appear authentic.",
  },
  {
    question: "Can I customize what jobs I apply for?",
    answer: "Absolutely! You have complete control over your job criteria. Filter by location, salary range, industry, company size, and more. You can also manually approve or reject jobs before they're submitted.",
  },
  {
    question: "What if I get an interview?",
    answer: "We'll notify you immediately and help you prepare. Job Agent includes interview prep guides, company research tools, and follow-up reminders to help you succeed.",
  },
  {
    question: "What integrations do you support?",
    answer: "We integrate with major job boards including LinkedIn, Indeed, Glassdoor, and more. We also sync with your email and calendar to keep everything in one place.",
  },
  {
    question: "How does the AI matching work?",
    answer: "Our AI analyzes your skills, experience, and preferences to find jobs that match your profile. Unlike keyword matching, our algorithm understands context and can identify opportunities that truly align with your career goals.",
  },
  {
    question: "Can I use Job Agent on my phone?",
    answer: "Yes! Job Agent is fully mobile-optimized. You can manage your applications, check interview requests, and update your preferences from anywhere using our mobile app or responsive web app.",
  },
  {
    question: "What happens to my data?",
    answer: "Your data is encrypted and stored securely. We never share your information with third parties without your consent. For detailed information, please review our Privacy Policy.",
  },
  {
    question: "How do I cancel my subscription?",
    answer: "You can cancel your subscription at any time from your account settings. You'll have access until the end of your billing period. No hidden fees or cancellation penalties.",
  },
];

const faqSchema = generateFAQSchema(faqData);

export default function FAQPage() {
  return (
    <main className="min-h-screen bg-gradient-to-b from-slate-950 to-slate-900">
      <JsonLdScript schema={faqSchema} />

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-16 pt-32">
        <div className="text-center mb-16">
          <h1 className="text-4xl md:text-5xl font-bold text-white mb-4 text-balance">
            Frequently Asked Questions
          </h1>
          <p className="text-xl text-slate-300 text-balance">
            Everything you need to know about Job Agent and job automation
          </p>
        </div>

        <div className="space-y-4 mb-16">
          {faqData.map((faq, index) => (
            <details
              key={index}
              className="group border border-slate-700 rounded-lg hover:border-slate-600 transition"
            >
              <summary className="flex cursor-pointer items-center justify-between px-6 py-4 bg-slate-800/50 hover:bg-slate-800 transition font-semibold text-white">
                {faq.question}
                <span className="ml-4 flex-shrink-0 text-2xl text-blue-600 group-open:-rotate-180 transition-transform">
                  ▼
                </span>
              </summary>
              <div className="px-6 py-4 bg-slate-900/50 border-t border-slate-700 text-slate-300">
                {faq.answer}
              </div>
            </details>
          ))}
        </div>

        <div className="bg-gradient-to-r from-blue-600/20 to-purple-600/20 border border-slate-700 rounded-lg p-8 text-center">
          <h2 className="text-2xl font-bold text-white mb-2">
            Still have questions?
          </h2>
          <p className="text-slate-300 mb-6">
            Can't find the answer you're looking for? Our support team is here to help.
          </p>
          <a
            href="mailto:support@jobagent.app"
            className="inline-block bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg font-semibold transition"
          >
            Contact Support
          </a>
        </div>
      </div>
    </main>
  );
}
