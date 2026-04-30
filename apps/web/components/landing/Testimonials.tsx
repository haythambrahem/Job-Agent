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
    <section className="relative py-24 px-4 sm:px-6 lg:px-8">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-16"
        >
          <h2 className="text-4xl md:text-5xl font-bold text-white mb-4">
            Loved by <span className="gradient-text">Job Seekers</span>
          </h2>
          <p className="text-xl text-slate-300 max-w-2xl mx-auto">
            Join thousands of professionals who found their dream jobs faster with Job Agent
          </p>
        </motion.div>

        {/* Testimonial Carousel */}
        <div className="relative h-96 mb-8">
          <motion.div
            key={current}
            custom={direction}
            variants={slideVariants}
            initial="enter"
            animate="center"
            exit="exit"
            transition={{
              x: { type: 'spring', stiffness: 300, damping: 30 },
              opacity: { duration: 0.5 }
            }}
            drag="x"
            dragElastic={1}
            dragConstraints={{ left: 0, right: 0 }}
            dragTransition={{
              power: 0.2,
              restDelta: 50
            }}
            onDragEnd={(e, { offset, velocity }) => {
              const swipe = swipePower(offset.x, velocity.x);

              if (swipe < -swipeConfidenceThreshold) {
                setDirection(1);
                setCurrent((prev) => (prev + 1) % testimonials.length);
              } else if (swipe > swipeConfidenceThreshold) {
                setDirection(-1);
                setCurrent((prev) => (prev - 1 + testimonials.length) % testimonials.length);
              }
            }}
            className="absolute w-full"
          >
            <div className="glass rounded-2xl p-8 h-full flex flex-col justify-between">
              {/* Stars */}
              <div className="flex gap-1">
                {Array(testimonials[current].rating).fill(null).map((_, i) => (
                  <span key={i} className="text-2xl">⭐</span>
                ))}
              </div>

              {/* Quote */}
              <p className="text-2xl text-white leading-relaxed italic">
                "{testimonials[current].text}"
              </p>

              {/* Author */}
              <div className="flex items-center gap-4 pt-4 border-t border-white/10">
                <div className="text-5xl">{testimonials[current].image}</div>
                <div>
                  <p className="text-white font-semibold">{testimonials[current].name}</p>
                  <p className="text-slate-400 text-sm">{testimonials[current].role}</p>
                  <p className="text-slate-400 text-xs">{testimonials[current].company}</p>
                </div>
              </div>
            </div>
          </motion.div>
        </div>

        {/* Carousel Controls */}
        <div className="flex items-center justify-center gap-4">
          <button
            onClick={() => {
              setDirection(-1);
              setCurrent((prev) => (prev - 1 + testimonials.length) % testimonials.length);
            }}
            className="glass hover:bg-white/10 text-white p-3 rounded-full transition"
          >
            ←
          </button>

          {/* Dots */}
          <div className="flex gap-2">
            {testimonials.map((_, idx) => (
              <motion.button
                key={idx}
                onClick={() => {
                  setDirection(idx > current ? 1 : -1);
                  setCurrent(idx);
                }}
                animate={{
                  scale: idx === current ? 1.2 : 1,
                  backgroundColor: idx === current ? '#3b82f6' : 'rgba(255,255,255,0.1)'
                }}
                className="h-2 rounded-full transition"
                style={{ width: idx === current ? 24 : 8 }}
              />
            ))}
          </div>

          <button
            onClick={() => {
              setDirection(1);
              setCurrent((prev) => (prev + 1) % testimonials.length);
            }}
            className="glass hover:bg-white/10 text-white p-3 rounded-full transition"
          >
            →
          </button>
        </div>

        {/* Logos */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ delay: 0.3 }}
          className="mt-16 pt-16 border-t border-white/10 text-center"
        >
          <p className="text-slate-400 text-sm mb-8">Used by professionals from leading companies</p>
          <div className="flex flex-wrap items-center justify-center gap-8 opacity-60">
            {['Google', 'Amazon', 'Microsoft', 'Meta', 'Apple'].map((company) => (
              <div key={company} className="text-slate-400 font-semibold text-sm hover:text-white transition">
                {company}
              </div>
            ))}
          </div>
        </motion.div>
      </div>
    </section>
  );
}
