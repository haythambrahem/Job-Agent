import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import Link from "next/link";
import { authOptions } from "@/lib/auth";

export default async function DashboardPage() {
  const session = await getServerSession(authOptions);

  if (!session?.user) {
    redirect("/signin");
  }

  // Mock data - replace with actual database queries
  const stats = [
    { label: "Applications Today", value: "12", trend: "+3 from yesterday", icon: "📧" },
    { label: "Total Applications", value: "156", trend: "+24 this month", icon: "📋" },
    { label: "Positive Responses", value: "34", trend: "21.8% rate", icon: "✅" },
    { label: "Success Rate", value: "98%", trend: "↑ +2% this week", icon: "🎯" }
  ];

  return (
    <div className="space-y-8">
      {/* Welcome Section */}
      <div>
        <h1 className="text-4xl font-bold text-gray-900">Welcome back, {session.user.email?.split("@")[0]}!</h1>
        <p className="mt-2 text-lg text-gray-600">You have 12 applications pending response</p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat) => (
          <div key={stat.label} className="card">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">{stat.label}</p>
                <p className="mt-3 text-3xl font-bold text-gray-900">{stat.value}</p>
                <p className="mt-2 text-sm text-gray-500">{stat.trend}</p>
              </div>
              <span className="text-3xl">{stat.icon}</span>
            </div>
          </div>
        ))}
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 card">
          <h2 className="text-lg font-bold text-gray-900 mb-4">Recent Activity</h2>
          <div className="space-y-4">
            {[
              { job: "Senior React Developer", company: "Tech Corp", status: "Interview Scheduled", date: "2 hours ago" },
              { job: "Full Stack Engineer", company: "StartUp Inc", status: "Application Sent", date: "1 day ago" },
              { job: "Frontend Developer", company: "Design Studio", status: "Pending Response", date: "3 days ago" }
            ].map((item, idx) => (
              <div key={idx} className="flex items-center justify-between pb-4 border-b border-gray-100 last:border-0">
                <div>
                  <p className="font-medium text-gray-900">{item.job}</p>
                  <p className="text-sm text-gray-500">{item.company}</p>
                </div>
                <div className="text-right">
                  <span className="inline-block px-3 py-1 text-xs font-semibold bg-blue-100 text-blue-700 rounded-full">
                    {item.status}
                  </span>
                  <p className="text-xs text-gray-500 mt-2">{item.date}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Quick Links */}
        <div className="space-y-3">
          <Link
            href="/jobs"
            className="block card text-center hover:border-blue-500 transition-colors duration-200"
          >
            <p className="text-3xl mb-2">💼</p>
            <p className="font-semibold text-gray-900">Browse Jobs</p>
            <p className="text-sm text-gray-500">Find new opportunities</p>
          </Link>
          <Link
            href="/applications"
            className="block card text-center hover:border-blue-500 transition-colors duration-200"
          >
            <p className="text-3xl mb-2">📊</p>
            <p className="font-semibold text-gray-900">View Applications</p>
            <p className="text-sm text-gray-500">Track all your apps</p>
          </Link>
          <Link
            href="/profile"
            className="block card text-center hover:border-blue-500 transition-colors duration-200"
          >
            <p className="text-3xl mb-2">⚙️</p>
            <p className="font-semibold text-gray-900">Update Profile</p>
            <p className="text-sm text-gray-500">Automation rules</p>
          </Link>
        </div>
      </div>
    </div>
  );
}
