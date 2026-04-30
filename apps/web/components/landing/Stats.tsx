"use client";

export default function Stats() {
  const stats = [
    {
      value: "10,000+",
      label: "Job Applications Submitted",
      icon: "📤",
    },
    {
      value: "98%",
      label: "Time Saved on Applications",
      icon: "⏱️",
    },
    {
      value: "5,200+",
      label: "Happy Users",
      icon: "😊",
    },
    {
      value: "3.2x",
      label: "Faster Job Matching",
      icon: "🎯",
    },
  ];

  return (
    <section className="py-16 px-4 bg-blue-50 border-y border-blue-200">
      <div className="max-w-7xl mx-auto">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
          {stats.map((stat, index) => (
            <div key={index} className="text-center">
              <div className="text-3xl mb-2">{stat.icon}</div>
              <div className="text-3xl md:text-4xl font-bold text-gray-900 mb-2">
                {stat.value}
              </div>
              <p className="text-gray-600">{stat.label}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
