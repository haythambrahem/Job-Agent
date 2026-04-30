'use client';

import { motion } from 'framer-motion';
import { useState, useEffect } from 'react';

const testimonials = [
  {
    name: 'Sarah Chen',
    role: 'Marketing Manager',
    company: 'Tech Startup',
    image: '👩‍💼',
    rating: 5,
    text: 'Job Agent cut my job search time from 3 months to just 2 weeks. The AI matching is incredible - I only got relevant opportunities.'
  },
  {
    name: 'Michael Rodriguez',
    role: 'Software Engineer',
    company: 'Fortune 500',
    image: '👨‍💻',
    rating: 5,
    text: 'Applied to 150+ jobs in the time it would have taken me to manually apply to 30. Landed 5 interviews. Best investment ever.'
  },
  {
    name: 'Emily Watson',
    role: 'Product Manager',
    company: 'Scale-up',
    image: '👩‍💻',
    rating: 5,
    text: 'The resume optimization feature alone is worth it. Got called back by companies I thought were out of reach.'
  },
  {
    name: 'David Kim',
    role: 'Data Scientist',
    company: 'AI Company',
    image: '👨‍🔬',
    rating: 5,
    text: 'Finally have time for actual interview prep instead of spending hours applying. Already got 3 offers.'
  }
];

export default function Testimonials() {
  const [current, setCurrent] = useState(0);
  const [direction, setDirection] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setDirection(1);
      setCurrent((prev) => (prev + 1) % testimonials.length);
    }, 5000);
    return () => clearInterval(timer);
  }, []);

  const slideVariants = {
    enter: (direction: number) => ({
      x: direction > 0 ? 1000 : -1000,
      opacity: 0
    }),
    center: {
      zIndex: 1,
      x: 0,
      opacity: 1
    },
    exit: (direction: number) => ({
      zIndex: 0,
      x: direction > 0 ? -1000 : 1000,
      opacity: 0
    })
  };

  const swipeConfidenceThreshold = 10000;
  const swipePower = (offset: number, velocity: number) => {
    return Math.abs(offset) * velocity;
  };

  return (
    <section className="py-24 px-4">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-16"
        >
          <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">
            Loved by Job Seekers
          </h2>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            Join thousands of professionals who found their dream jobs faster
          </p>
        </motion.div>

        {/* Testimonials Grid */}
        <div className="grid md:grid-cols-2 gap-8 mb-12">
          {testimonials.map((testimonial, idx) => (
            <motion.div
              key={idx}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: idx * 0.1 }}
              viewport={{ once: true }}
              className="card"
            >
              <div className="flex gap-1 mb-4">
                {Array(testimonial.rating).fill(null).map((_, i) => (
                  <span key={i} className="text-lg">⭐</span>
                ))}
              </div>

              <p className="text-gray-700 leading-relaxed mb-6 italic">
                "{testimonial.text}"
              </p>

              <div className="flex items-center gap-4 pt-6 border-t border-gray-200">
                <div className="text-4xl">{testimonial.image}</div>
                <div>
                  <p className="font-semibold text-gray-900">{testimonial.name}</p>
                  <p className="text-sm text-gray-600">{testimonial.role}</p>
                  <p className="text-xs text-gray-500">{testimonial.company}</p>
                </div>
              </div>
            </motion.div>
          ))}
        </div>

        {/* Company logos */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="border-t border-gray-200 pt-12 text-center"
        >
          <p className="text-gray-600 text-sm mb-8">Used by professionals from</p>
          <div className="flex flex-wrap items-center justify-center gap-8">
            {['Google', 'Amazon', 'Microsoft', 'Meta', 'Apple'].map((company) => (
              <div key={company} className="text-gray-600 font-semibold text-sm">
                {company}
              </div>
            ))}
          </div>
        </motion.div>
      </div>
    </section>
  );
}
