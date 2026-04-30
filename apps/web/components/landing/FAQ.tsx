'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

export default function FAQ() {
  const [openIndex, setOpenIndex] = useState<number | null>(0);

  const faqs = [
    {
      question: 'How does Job Agent automate applications?',
      answer: 'Job Agent uses AI to scan job listings that match your criteria, automatically fill out application forms with your information, and submit them on your behalf. You set your preferences once, and we handle the rest.',
      icon: '🤖'
    },
    {
      question: 'Is it really free to get started?',
      answer: 'Yes! You get a free 14-day trial with access to all features. No credit card required to start. After the trial, you can choose a paid plan or continue with our free tier with limited applications.',
      icon: '💰'
    },
    {
      question: 'Will employers know my applications are automated?',
      answer: 'No. Your applications look like they come directly from you. We use your actual information and follow all job board guidelines to ensure your applications appear authentic.',
      icon: '🔒'
    },
    {
      question: 'Can I customize what jobs I apply for?',
      answer: 'Absolutely! You have complete control over your job criteria. Filter by location, salary range, industry, company size, and more. You can also manually approve or reject jobs before they\'re submitted.',
      icon: '⚙️'
    },
    {
      question: 'What if I get an interview?',
      answer: 'We\'ll notify you immediately and help you prepare. Job Agent includes interview prep guides, company research tools, and follow-up reminders to help you succeed.',
      icon: '🎯'
    },
    {
      question: 'What integrations do you support?',
      answer: 'We integrate with major job boards including LinkedIn, Indeed, Glassdoor, and more. We also sync with your email and calendar to keep everything in one place.',
      icon: '🔗'
    },
  ];

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: { staggerChildren: 0.1, delayChildren: 0.2 }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 10 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { duration: 0.4 }
    }
  };

  return (
    <section id="faq" className="py-24 px-4">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-16"
        >
          <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">
            Questions? We Have Answers
          </h2>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            Everything you need to know about Job Agent
          </p>
        </motion.div>

        {/* FAQ List */}
        <div className="space-y-4">
          {faqs.map((faq, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 10 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: index * 0.05 }}
              viewport={{ once: true }}
              className="card overflow-hidden"
            >
              <button
                onClick={() => setOpenIndex(openIndex === index ? null : index)}
                className="w-full px-6 py-5 flex items-center justify-between hover:bg-gray-50 transition"
              >
                <div className="flex items-center gap-4 text-left flex-1">
                  <span className="text-2xl flex-shrink-0">{faq.icon}</span>
                  <h3 className="text-lg font-semibold text-gray-900">
                    {faq.question}
                  </h3>
                </div>
                <motion.span
                  animate={{ rotate: openIndex === index ? 180 : 0 }}
                  transition={{ duration: 0.3 }}
                  className="text-2xl text-blue-600 flex-shrink-0 ml-4"
                >
                  ⌄
                </motion.span>
              </button>

              <AnimatePresence>
                {openIndex === index && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    transition={{ duration: 0.3 }}
                    className="overflow-hidden"
                  >
                    <div className="px-6 py-5 bg-gray-50 border-t border-gray-200">
                      <p className="text-gray-600 leading-relaxed">
                        {faq.answer}
                      </p>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          ))}
        </div>

        {/* CTA */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ delay: 0.3 }}
          className="mt-16 text-center"
        >
          <p className="text-gray-600 mb-6">Still have questions?</p>
          <a
            href="mailto:support@jobagent.app"
            className="inline-block px-8 py-4 bg-gray-100 hover:bg-gray-200 text-gray-900 font-semibold rounded-lg transition"
          >
            Contact our support team
          </a>
        </motion.div>
      </div>
    </section>
  );
}
