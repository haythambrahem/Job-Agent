import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import Link from "next/link";
import Card from "@/components/Card";
import { authOptions } from "@/lib/auth";
import Card from "@/components/Card";

export default async function DashboardPage() {
  const session = await getServerSession(authOptions);

  if (!session?.user) {
    redirect("/signin");
  }

  // Mock data - replace with actual database queries
  const stats = [
    { label: "Applications Today", value: "12", trend: "+3 from yesterday", icon: "📧", color: "blue" },
    { label: "Total Applications", value: "156", trend: "+24 this month", icon: "📋", color: "indigo" },
    { label: "Positive Responses", value: "34", trend: "21.8% rate", icon: "✅", color: "green" },
    { label: "Success Rate", value: "98%", trend: "↑ +2% this week", icon: "🎯", color: "purple" }
  ];

  const recentActivities = [
    { id: "react-dev-tech-corp", job: "Senior React Developer", company: "Tech Corp", status: "Interview Scheduled", date: "2 hours ago" },
    { id: "fullstack-startup-inc", job: "Full Stack Engineer", company: "StartUp Inc", status: "Application Sent", date: "1 day ago" },
    { id: "frontend-design-studio", job: "Frontend Developer", company: "Design Studio", status: "Pending Response", date: "3 days ago" }
  ];

  const quickLinks = [
    { href: "/jobs", icon: "💼", title: "Browse Jobs", description: "Find new opportunities" },
    { href: "/applications", icon: "📊", title: "Applications", description: "Track your pipeline" },
    { href: "/profile", icon: "⚙️", title: "Profile Settings", description: "Update automation rules" }
  ];

  return (
    <div className="flex flex-col gap-8">
      <section className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-3xl font-semibold text-gray-900">
            Welcome back, {session.user.email?.split("@")[0]}!
          </h1>
          <p className="mt-2 text-sm text-gray-600">You have 12 applications pending response.</p>
        </div>
        <div className="flex flex-col gap-3 sm:flex-row">
          <Link
            href="/jobs"
            className="inline-flex items-center justify-center rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white shadow-sm transition-colors duration-200 hover:bg-blue-700"
          >
            Find Jobs
          </Link>
          <Link
            href="/applications"
            className="inline-flex items-center justify-center rounded-lg border border-gray-200 px-4 py-2 text-sm font-semibold text-gray-700 transition-colors duration-200 hover:bg-gray-50"
          >
            View Applications
          </Link>
        </div>
      </section>

      <section className="grid grid-cols-1 gap-6 sm:grid-cols-2 xl:grid-cols-4">
        {stats.map((stat) => (
          <Card key={stat.label} className="flex flex-col gap-4">
            <div className="flex items-start justify-between">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-50 text-lg text-blue-600">
                {stat.icon}
              </div>
              <span className="text-xs font-medium text-gray-500">This week</span>
            </div>
            <div>
              <p className="text-sm font-medium text-gray-500">{stat.label}</p>
              <p className="mt-2 text-2xl font-semibold text-gray-900">{stat.value}</p>
              <p className="mt-1 text-sm text-gray-500">{stat.trend}</p>
            </div>
          </Card>
        ))}
      </section>

      <section className="grid grid-cols-1 gap-6 xl:grid-cols-3">
        <Card className="xl:col-span-2">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <h2 className="text-xl font-semibold text-gray-900">Recent Activity</h2>
            <Link href="/applications" className="text-sm font-medium text-blue-600 hover:text-blue-700">
              View all
            </Link>
          </div>
          <div className="mt-6 divide-y divide-gray-100">
            {recentActivities.map((item) => (
              <div
                key={item.id}
                className="flex flex-col gap-3 py-4 sm:flex-row sm:items-center sm:justify-between"
              >
                <div>
                  <p className="text-sm font-semibold text-gray-900">{item.job}</p>
                  <p className="text-sm text-gray-500">{item.company}</p>
                </div>
                <div className="flex items-center gap-3 sm:flex-col sm:items-end">
                  <span className="inline-flex items-center rounded-full bg-blue-50 px-3 py-1 text-xs font-semibold text-blue-700">
                    {item.status}
                  </span>
                  <p className="text-xs text-gray-500">{item.date}</p>
                </div>
              </div>
            ))}
          </div>
        </Card>

        <Card>
          <h2 className="text-xl font-semibold text-gray-900">Quick Actions</h2>
          <div className="mt-6 space-y-3">
            {quickLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="flex items-center gap-4 rounded-lg border border-gray-200 px-4 py-4 text-left transition-colors duration-200 hover:border-blue-200 hover:bg-blue-50"
              >
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-gray-100 text-lg">
                  {link.icon}
                </div>
                <div>
                  <p className="text-sm font-semibold text-gray-900">{link.title}</p>
                  <p className="text-sm text-gray-500">{link.description}</p>
                </div>
              </Link>
            ))}
          </div>
        </Card>
      </section>
    </div>
  );
}
