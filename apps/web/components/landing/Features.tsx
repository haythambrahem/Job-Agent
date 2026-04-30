"use client";

export default function Features() {
  const features = [
    {
      title: "AI-Powered Matching",
      description: "Our AI algorithm matches you with the most relevant job opportunities based on your skills, experience, and preferences.",
      icon: "🤖",
    },
    {
      title: "Automated Applications",
      description: "Automatically fill out and submit job applications with your information. Save hours every week on repetitive tasks.",
      icon: "⚡",
    },
    {
      title: "Smart Profile Management",
      description: "Create once, apply everywhere. Manage your professional profile and watch it populate forms automatically.",
      icon: "📋",
    },
    {
      title: "Real-time Alerts",
      description: "Get notified instantly when jobs matching your criteria are posted. Never miss an opportunity.",
      icon: "🔔",
    },
    {
      title: "Application Tracking",
      description: "Track all your applications in one place. Monitor responses and follow-ups with built-in reminders.",
      icon: "📊",
    },
    {
      title: "Resume Optimization",
      description: "Get AI-powered suggestions to optimize your resume for better ATS scores and higher interview rates.",
      icon: "✨",
    },
  ];

  return (
    <section className="py-24 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-16">
          <h2 className="text-4xl md:text-5xl font-bold text-white mb-4 text-balance">
            Powerful Features Built for Job Seekers
          </h2>
          <p className="text-xl text-slate-300 text-balance">
            Everything you need to automate your job search and land your dream role
          </p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
          {features.map((feature, index) => (
            <div
              key={index}
              className="bg-slate-800/50 border border-slate-700 rounded-2xl p-8 hover:border-slate-600 hover:bg-slate-800/70 transition"
            >
              <div className="text-4xl mb-4">{feature.icon}</div>
              <h3 className="text-xl font-bold text-white mb-3">
                {feature.title}
              </h3>
              <p className="text-slate-300">{feature.description}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
