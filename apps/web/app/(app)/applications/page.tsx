import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { authOptions } from "@/lib/auth";

export default async function ApplicationsPage() {
  const session = await getServerSession(authOptions);

  if (!session?.user) {
    redirect("/signin");
  }

  // Mock applications data
  const applications = [
    {
      id: 1,
      jobTitle: "Senior React Developer",
      company: "Tech Corp",
      status: "interview",
      dateApplied: "2024-01-10",
      daysAgo: "2 days ago"
    },
    {
      id: 2,
      jobTitle: "Full Stack Engineer",
      company: "StartUp Inc",
      status: "pending",
      dateApplied: "2024-01-08",
      daysAgo: "4 days ago"
    },
    {
      id: 3,
      jobTitle: "Frontend Developer",
      company: "Design Studio",
      status: "accepted",
      dateApplied: "2024-01-05",
      daysAgo: "1 week ago"
    },
    {
      id: 4,
      jobTitle: "DevOps Engineer",
      company: "Cloud Systems",
      status: "rejected",
      dateApplied: "2024-01-03",
      daysAgo: "1 week ago"
    },
    {
      id: 5,
      jobTitle: "Backend Developer",
      company: "Web Services",
      status: "pending",
      dateApplied: "2024-01-02",
      daysAgo: "2 weeks ago"
    }
  ];

  const getStatusColor = (status: string) => {
    switch (status) {
      case "pending":
        return "bg-yellow-100 text-yellow-700";
      case "interview":
        return "bg-blue-100 text-blue-700";
      case "accepted":
        return "bg-green-100 text-green-700";
      case "rejected":
        return "bg-red-100 text-red-700";
      default:
        return "bg-gray-100 text-gray-700";
    }
  };

  const getStatusLabel = (status: string) => {
    return status.charAt(0).toUpperCase() + status.slice(1);
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-4xl font-bold text-gray-900">My Applications</h1>
        <p className="mt-2 text-lg text-gray-600">Track and manage all your job applications</p>
      </div>

      {/* Filter Tabs */}
      <div className="flex gap-2 flex-wrap">
        {["All", "Pending", "Interview", "Accepted", "Rejected"].map((filter) => (
          <button
            key={filter}
            className={`px-4 py-2 font-medium rounded-lg transition-colors duration-200 ${
              filter === "All"
                ? "bg-blue-600 text-white"
                : "bg-gray-200 text-gray-700 hover:bg-gray-300"
            }`}
          >
            {filter}
          </button>
        ))}
      </div>

      {/* Applications Table */}
      <div className="card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-200 bg-gray-50">
                <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">Job Title</th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">Company</th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">Status</th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">Applied</th>
                <th className="px-6 py-4 text-center text-sm font-semibold text-gray-900">Actions</th>
              </tr>
            </thead>
            <tbody>
              {applications.map((app) => (
                <tr key={app.id} className="border-b border-gray-100 hover:bg-gray-50 transition-colors duration-200">
                  <td className="px-6 py-4">
                    <p className="font-medium text-gray-900">{app.jobTitle}</p>
                  </td>
                  <td className="px-6 py-4">
                    <p className="text-gray-600">{app.company}</p>
                  </td>
                  <td className="px-6 py-4">
                    <span className={`px-3 py-1 text-xs font-semibold rounded-full ${getStatusColor(app.status)}`}>
                      {getStatusLabel(app.status)}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <p className="text-sm text-gray-600">{app.daysAgo}</p>
                  </td>
                  <td className="px-6 py-4 text-center">
                    <div className="flex gap-2 justify-center">
                      <button className="px-3 py-1 text-sm text-blue-600 hover:bg-blue-50 rounded transition-colors duration-200">
                        View
                      </button>
                      <button className="px-3 py-1 text-sm text-gray-600 hover:bg-gray-100 rounded transition-colors duration-200">
                        Update
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="card text-center">
          <p className="text-sm text-gray-600">Total Applications</p>
          <p className="text-3xl font-bold text-gray-900 mt-2">{applications.length}</p>
        </div>
        <div className="card text-center">
          <p className="text-sm text-gray-600">Pending</p>
          <p className="text-3xl font-bold text-yellow-600 mt-2">
            {applications.filter(a => a.status === "pending").length}
          </p>
        </div>
        <div className="card text-center">
          <p className="text-sm text-gray-600">Interviews</p>
          <p className="text-3xl font-bold text-blue-600 mt-2">
            {applications.filter(a => a.status === "interview").length}
          </p>
        </div>
        <div className="card text-center">
          <p className="text-sm text-gray-600">Accepted</p>
          <p className="text-3xl font-bold text-green-600 mt-2">
            {applications.filter(a => a.status === "accepted").length}
          </p>
        </div>
      </div>
    </div>
  );
}
