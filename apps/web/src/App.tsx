import { useEffect, useMemo, useState } from "react";
import { io } from "socket.io-client";
import { api } from "./api";
import { ApprovalModal } from "./components/ApprovalModal";
import type { Application, Job } from "./types";

type Page = "dashboard" | "jobs" | "applications";

function App() {
  const [page, setPage] = useState<Page>("dashboard");
  const [jobs, setJobs] = useState<Job[]>([]);
  const [applications, setApplications] = useState<Application[]>([]);
  const [selectedApplication, setSelectedApplication] = useState<Application | null>(null);
  const [keywords, setKeywords] = useState("full stack");
  const [location, setLocation] = useState("Tunisie");
  const [isLoading, setIsLoading] = useState(false);

  const pendingCount = useMemo(() => applications.filter((a) => a.status === "pending").length, [applications]);
  const sentCount = useMemo(() => applications.filter((a) => a.status === "sent").length, [applications]);
  const successRate = useMemo(() => {
    if (applications.length === 0) return 0;
    return Math.round((sentCount / applications.length) * 100);
  }, [applications.length, sentCount]);

  async function refresh() {
    const [jobsRes, applicationsRes] = await Promise.all([api.get<Job[]>("/jobs"), api.get<Application[]>("/applications")]);
    setJobs(jobsRes.data);
    setApplications(applicationsRes.data);
  }

  async function runSearch() {
    setIsLoading(true);
    try {
      await api.post("/jobs/search", { keywords, location, limitPerSource: 5 });
      await refresh();
    } finally {
      setIsLoading(false);
    }
  }

  async function applyToJob(jobId: string) {
    const email = window.prompt("Enter recipient email for this application:");
    if (!email) return;

    setIsLoading(true);
    try {
      await api.post("/applications/apply", { jobId, email });
      await refresh();
      setPage("applications");
    } finally {
      setIsLoading(false);
    }
  }

  async function openPreview(id: string) {
    const response = await api.get<Application>(`/applications/${id}/preview`);
    setSelectedApplication(response.data);
  }

  async function approveApplication(id: string) {
    await api.post(`/applications/${id}/approve`);
    setSelectedApplication(null);
    await refresh();
  }

  async function rejectApplication(id: string) {
    await api.post(`/applications/${id}/reject`);
    setSelectedApplication(null);
    await refresh();
  }

  useEffect(() => {
    refresh().catch(console.error);

    const socket = io(import.meta.env.VITE_API_BASE_URL || "http://localhost:4000");
    socket.on("jobs:new", refresh);
    socket.on("approval:needed", refresh);
    socket.on("applications:updated", refresh);

    return () => {
      socket.disconnect();
    };
  }, []);

  return (
    <div className="min-h-screen">
      <div className="mx-auto flex max-w-7xl">
        <aside className="min-h-screen w-64 bg-slate-900 p-6 text-white">
          <h1 className="mb-8 text-xl font-bold">AI Job Agent</h1>
          <nav className="space-y-2">
            {(["dashboard", "jobs", "applications"] as const).map((item) => (
              <button
                key={item}
                className={`w-full rounded px-3 py-2 text-left capitalize ${page === item ? "bg-slate-700" : "hover:bg-slate-800"}`}
                onClick={() => setPage(item)}
              >
                {item}
              </button>
            ))}
          </nav>
        </aside>

        <main className="flex-1 p-8">
          {page === "dashboard" && (
            <div className="space-y-4">
              <h2 className="text-2xl font-semibold">Dashboard</h2>
              <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                <div className="rounded-xl bg-white p-5 shadow">
                  <p className="text-sm text-slate-500">Total applications</p>
                  <p className="text-2xl font-bold">{applications.length}</p>
                </div>
                <div className="rounded-xl bg-white p-5 shadow">
                  <p className="text-sm text-slate-500">Pending approvals</p>
                  <p className="text-2xl font-bold">{pendingCount}</p>
                </div>
                <div className="rounded-xl bg-white p-5 shadow">
                  <p className="text-sm text-slate-500">Success rate</p>
                  <p className="text-2xl font-bold">{successRate}%</p>
                </div>
              </div>
            </div>
          )}

          {page === "jobs" && (
            <div className="space-y-4">
              <h2 className="text-2xl font-semibold">Jobs</h2>
              <div className="flex flex-wrap gap-2 rounded-xl bg-white p-4 shadow">
                <input
                  className="rounded border px-3 py-2"
                  value={keywords}
                  onChange={(event) => setKeywords(event.target.value)}
                  placeholder="Keywords"
                />
                <input
                  className="rounded border px-3 py-2"
                  value={location}
                  onChange={(event) => setLocation(event.target.value)}
                  placeholder="Location"
                />
                <button className="rounded bg-indigo-600 px-4 py-2 font-semibold text-white" onClick={runSearch}>
                  {isLoading ? "Searching..." : "Search Jobs"}
                </button>
              </div>

              <div className="space-y-3">
                {jobs.map((job) => (
                  <div key={job.id} className="rounded-xl bg-white p-4 shadow">
                    <p className="font-semibold">{job.title}</p>
                    <p className="text-sm text-slate-500">{job.company} • {job.source}</p>
                    <div className="mt-2 flex gap-2">
                      <a className="text-sm text-indigo-600" href={job.url} target="_blank" rel="noreferrer">View job</a>
                      <button className="text-sm font-semibold text-emerald-600" onClick={() => applyToJob(job.id)}>
                        Apply
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {page === "applications" && (
            <div className="space-y-4">
              <h2 className="text-2xl font-semibold">Applications</h2>
              <div className="overflow-hidden rounded-xl bg-white shadow">
                <table className="min-w-full text-sm">
                  <thead className="bg-slate-50 text-left text-slate-500">
                    <tr>
                      <th className="px-4 py-3">Company</th>
                      <th className="px-4 py-3">Position</th>
                      <th className="px-4 py-3">Status</th>
                      <th className="px-4 py-3">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {applications.map((application) => (
                      <tr key={application.id} className="border-t">
                        <td className="px-4 py-3">{application.company}</td>
                        <td className="px-4 py-3">{application.title}</td>
                        <td className="px-4 py-3 capitalize">{application.status}</td>
                        <td className="px-4 py-3">
                          <div className="flex gap-2">
                            <button className="text-indigo-600" onClick={() => openPreview(application.id)}>View</button>
                            <button className="text-emerald-600" onClick={() => approveApplication(application.id)}>Approve</button>
                            <button className="text-rose-600" onClick={() => rejectApplication(application.id)}>Reject</button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </main>
      </div>

      <ApprovalModal
        application={selectedApplication}
        onClose={() => setSelectedApplication(null)}
        onApprove={approveApplication}
        onReject={rejectApplication}
      />
    </div>
  );
}

export default App;
