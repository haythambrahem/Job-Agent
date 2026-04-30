import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import Link from "next/link";
import Card from "@/components/Card";
import { authOptions } from "@/lib/auth";

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

  const activities = [
    { job: "Senior React Developer", company: "Tech Corp", status: "Interview Scheduled", date: "2 hours ago" },
    { job: "Full Stack Engineer", company: "StartUp Inc", status: "Application Sent", date: "1 day ago" },
    { job: "Frontend Developer", company: "Design Studio", status: "Pending Response", date: "3 days ago" }
  ];

  const quickLinks = [
    { href: "/jobs", icon: "💼", title: "Browse Jobs", desc: "Find new opportunities" },
    { href: "/applications", icon: "📊", title: "View Applications", desc: "Track all your apps" },
    { href: "/profile", icon: "⚙️", title: "Update Profile", desc: "Automation rules" }
  ];

  const getColorClasses = (color: string) => {
    const colors: Record<string, { bg: string; text: string; border: string }> = {
      blue: { bg: "bg-blue-50", text: "text-blue-700", border: "border-blue-200" },
      indigo: { bg: "bg-indigo-50", text: "text-indigo-700", border: "border-indigo-200" },
      green: { bg: "bg-green-50", text: "text-green-700", border: "border-green-200" },
      purple: { bg: "bg-purple-50", text: "text-purple-700", border: "border-purple-200" }
    };
    return colors[color] || colors.blue;
  };

  return (
    <div className="space-y-8">
      {/* Welcome Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Welcome back, {session.user.email?.split("@")[0]}!</h1>
        <p className="mt-2 text-base text-gray-600">You have 12 applications pending response</p>
      </div>

      {/* Stats Grid - Responsive 1/2/4 columns */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
        {stats.map((stat) => {
          const colors = getColorClasses(stat.color);
          return (
            <Card key={stat.label} variant="default" className="hover:shadow-md transition-shadow duration-200">
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1">
                  <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">{stat.label}</p>
                  <p className="mt-4 text-3xl font-bold text-gray-900">{stat.value}</p>
                  <p className="mt-2 text-xs text-gray-600">{stat.trend}</p>
                </div>
                <div className={`${colors.bg} rounded-lg p-3 text-xl`}>{stat.icon}</div>
              </div>
            </Card>
          );
        })}
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Recent Activity */}
        <Card className="lg:col-span-2">
          <div className="mb-6">
            <h2 className="text-lg font-bold text-gray-900">Recent Activity</h2>
            <p className="mt-1 text-sm text-gray-600">Your latest job applications</p>
          </div>

          <div className="divide-y divide-gray-100">
            {activities.map((item, idx) => (
              <div key={idx} className="py-4 first:pt-0 last:pb-0">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <p className="font-semibold text-gray-900">{item.job}</p>
                    <p className="mt-1 text-sm text-gray-600">{item.company}</p>
                  </div>
                  <div className="text-right flex-shrink-0">
                    <span className="inline-block px-3 py-1.5 text-xs font-semibold bg-blue-100 text-blue-700 rounded-full whitespace-nowrap">
                      {item.status}
                    </span>
                    <p className="text-xs text-gray-500 mt-2">{item.date}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </Card>

        {/* Quick Links Sidebar */}
        <div className="space-y-4">
          {quickLinks.map((link) => (
            <Link key={link.href} href={link.href}>
              <Card className="h-full hover:shadow-md transition-shadow duration-200 flex flex-col items-center text-center py-6 cursor-pointer">
                <div className="text-3xl mb-3">{link.icon}</div>
                <p className="font-semibold text-gray-900 text-sm">{link.title}</p>
                <p className="text-xs text-gray-600 mt-1">{link.desc}</p>
              </Card>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
