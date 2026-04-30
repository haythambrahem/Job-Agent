import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { authOptions } from "@/lib/auth";

export default async function JobsPage() {
  const session = await getServerSession(authOptions);

  if (!session?.user) {
    redirect("/signin");
  }

  // Mock job listings
  const jobs = [
    {
      id: 1,
      title: "Senior React Developer",
      company: "Tech Corp",
      logo: "🚀",
      location: "San Francisco, CA",
      remote: true,
      salary: "$150K - $200K",
      type: "Full-time",
      posted: "2 days ago",
      description: "Build amazing web applications with React and TypeScript"
    },
    {
      id: 2,
      title: "Full Stack Engineer",
      company: "StartUp Inc",
      logo: "⚡",
      location: "Remote",
      remote: true,
      salary: "$120K - $160K",
      type: "Full-time",
      posted: "1 week ago",
      description: "Join our team to build the future of SaaS"
    },
    {
      id: 3,
      title: "Frontend Developer",
      company: "Design Studio",
      logo: "🎨",
      location: "New York, NY",
      remote: false,
      salary: "$100K - $140K",
      type: "Full-time",
      posted: "3 days ago",
      description: "Create beautiful, accessible user interfaces"
    },
    {
      id: 4,
      title: "DevOps Engineer",
      company: "Cloud Systems",
      logo: "☁️",
      location: "Remote",
      remote: true,
      salary: "$130K - $180K",
      type: "Full-time",
      posted: "1 day ago",
      description: "Manage and optimize cloud infrastructure"
    }
  ];

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-4xl font-bold text-gray-900">Job Listings</h1>
        <p className="mt-2 text-lg text-gray-600">Browse and apply to job opportunities</p>
      </div>

      {/* Filters & Search */}
      <div className="card">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Search</label>
            <input
              type="text"
              placeholder="Job title or company..."
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Location</label>
            <select className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent">
              <option>All Locations</option>
              <option>Remote</option>
              <option>San Francisco, CA</option>
              <option>New York, NY</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Job Type</label>
            <select className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent">
              <option>All Types</option>
              <option>Full-time</option>
              <option>Part-time</option>
              <option>Contract</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Salary Range</label>
            <select className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent">
              <option>Any</option>
              <option>$100K - $150K</option>
              <option>$150K - $200K</option>
              <option>$200K+</option>
            </select>
          </div>
        </div>
      </div>

      {/* Job Cards */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {jobs.map((job) => (
          <div key={job.id} className="card hover:shadow-lg transition-all duration-200">
            <div className="flex items-start justify-between mb-4">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-gray-100 rounded-lg flex items-center justify-center text-2xl">
                  {job.logo}
                </div>
                <div>
                  <h3 className="text-lg font-bold text-gray-900">{job.title}</h3>
                  <p className="text-sm text-gray-600">{job.company}</p>
                </div>
              </div>
              <button className="text-2xl hover:scale-110 transition-transform duration-200">⭐</button>
            </div>

            <p className="text-gray-600 mb-4 line-clamp-2">{job.description}</p>

            <div className="flex flex-wrap gap-2 mb-4">
              <span className="px-3 py-1 bg-blue-100 text-blue-700 text-xs font-semibold rounded-full">
                {job.type}
              </span>
              <span className="px-3 py-1 bg-green-100 text-green-700 text-xs font-semibold rounded-full">
                {job.remote ? "Remote" : job.location}
              </span>
              <span className="px-3 py-1 bg-purple-100 text-purple-700 text-xs font-semibold rounded-full">
                {job.salary}
              </span>
            </div>

            <div className="flex items-center justify-between pt-4 border-t border-gray-100">
              <p className="text-sm text-gray-500">{job.posted}</p>
              <button className="px-4 py-2 bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-semibold rounded-lg hover:shadow-lg transition-all duration-200">
                Apply Now
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
