"use client";

export default function HowItWorks() {
  const steps = [
    {
      number: "01",
      title: "Create Your Profile",
      description: "Sign up and build your professional profile with your skills, experience, and job preferences.",
    },
    {
      number: "02",
      title: "Set Your Criteria",
      description: "Define your ideal job by industry, location, salary, and company. Let our AI understand what you&apos;re looking for.",
    },
    {
      number: "03",
      title: "Watch It Work",
      description: "Our automation engine finds matching jobs and applies on your behalf, 24/7.",
    },
    {
      number: "04",
      title: "Track & Respond",
      description: "Monitor all your applications and respond to opportunities as they come in. Land your dream job.",
    },
  ];

  return (
    <section id="how-it-works" className="py-24 px-4 sm:px-6 lg:px-8 bg-slate-800/50 border-y border-slate-700">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-16">
          <h2 className="text-4xl md:text-5xl font-bold text-white mb-4 text-balance">
            How It Works
          </h2>
          <p className="text-xl text-slate-300 text-balance">
            Get started in minutes and let automation take care of the rest
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-12 lg:gap-20">
          {steps.map((step, index) => (
            <div key={index} className="flex gap-8">
              <div className="flex flex-col items-center">
                <div className="w-16 h-16 rounded-full bg-gradient-to-br from-blue-600 to-blue-700 flex items-center justify-center font-bold text-xl text-white mb-4">
                  {step.number}
                </div>
                {index < steps.length - 1 && (
                  <div className="hidden md:block w-1 h-32 bg-gradient-to-b from-blue-600 to-transparent mt-4" />
                )}
              </div>
              <div className="pt-2">
                <h3 className="text-2xl font-bold text-white mb-3">
                  {step.title}
                </h3>
                <p className="text-slate-300 text-lg leading-relaxed">
                  {step.description}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
