"use client";

import { useState } from "react";

export default function FAQ() {
  const [openIndex, setOpenIndex] = useState<number | null>(0);

  const faqs = [
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
      answer: "Absolutely! You have complete control over your job criteria. Filter by location, salary range, industry, company size, and more. You can also manually approve or reject jobs before they&apos;re submitted.",
    },
    {
      question: "What if I get an interview?",
      answer: "We&apos;ll notify you immediately and help you prepare. Job Agent includes interview prep guides, company research tools, and follow-up reminders to help you succeed.",
    },
    {
      question: "What integrations do you support?",
      answer: "We integrate with major job boards including LinkedIn, Indeed, Glassdoor, and more. We also sync with your email and calendar to keep everything in one place.",
    },
  ];

  return (
    <section className="py-24 px-4 sm:px-6 lg:px-8">
      <div className="max-w-3xl mx-auto">
        <div className="text-center mb-16">
          <h2 className="text-4xl md:text-5xl font-bold text-white mb-4 text-balance">
            Frequently Asked Questions
          </h2>
          <p className="text-xl text-slate-300 text-balance">
            Everything you need to know about Job Agent
          </p>
        </div>

        <div className="space-y-4">
          {faqs.map((faq, index) => (
            <div
              key={index}
              className="border border-slate-700 rounded-lg overflow-hidden hover:border-slate-600 transition"
            >
              <button
                onClick={() => setOpenIndex(openIndex === index ? null : index)}
                className="w-full px-6 py-4 flex items-center justify-between bg-slate-800/50 hover:bg-slate-800 transition"
              >
                <h3 className="text-lg font-semibold text-white text-left">
                  {faq.question}
                </h3>
                <span className="text-2xl text-blue-600 flex-shrink-0 ml-4">
                  {openIndex === index ? "−" : "+"}
                </span>
              </button>
              {openIndex === index && (
                <div className="px-6 py-4 bg-slate-900/50 border-t border-slate-700">
                  <p className="text-slate-300 leading-relaxed">
                    {faq.answer}
                  </p>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
