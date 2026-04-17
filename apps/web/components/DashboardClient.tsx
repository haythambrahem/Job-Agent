"use client";

import { useEffect, useMemo, useState } from "react";
import { signOut } from "next-auth/react";

type Page = "dashboard" | "jobs" | "applications";
type ApplicationStatus = "pending" | "approved" | "rejected" | "sent";

type Job = {
  id: string;
  title: string;
  company: string;
  url: string;
  source: string;
  applyEmail?: string | null;
};

type Application = {
  id: string;
  company: string;
  title: string;
  email: string | null;
  coverLetter: string;
  status: ApplicationStatus;
  createdAt: string;
};

type Subscription = {
  plan: "free" | "pro" | "premium";
  usedApplications: number;
  monthlyLimit: number | null;
  subscriptionStatus: string;
};

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:4000";

export default function DashboardClient({
  user,
  apiToken
}: {
  user: { id: string; email: string; plan: "free" | "pro" | "premium" };
  apiToken: string;
}) {
  const [page, setPage] = useState<Page>("dashboard");
  const [jobs, setJobs] = useState<Job[]>([]);
  const [applications, setApplications] = useState<Application[]>([]);
  const [subscription, setSubscription] = useState<Subscription | null>(null);
  const [keywords, setKeywords] = useState("full stack");
  const [location, setLocation] = useState("Tunisie");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [toast, setToast] = useState<string | null>(null);
  const [manualEmails, setManualEmails] = useState<Record<string, string>>({});
  const [emailEditJobId, setEmailEditJobId] = useState<string | null>(null);

  const pendingCount = useMemo(() => applications.filter((a) => a.status === "pending").length, [applications]);
  const sentCount = useMemo(() => applications.filter((a) => a.status === "sent").length, [applications]);
  async function apiCall<T>(path: string, init?: RequestInit): Promise<T> {
    if (!apiToken) {
      throw new Error("Unauthorized");
    }

    const response = await fetch(`${API_BASE_URL}${path}`, {
      ...init,
      credentials: "include",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiToken}`,
        ...(init?.headers || {})
      }
    });

    if (!response.ok) {
      const body = await response.json().catch(() => ({ error: "Request failed" }));
      const requestError = new Error(body.error || "Request failed") as Error & {
        code?: string;
        status?: number;
        jobTitle?: string;
      };
      requestError.code = typeof body.error === "string" ? body.error : undefined;
      requestError.status = response.status;
      requestError.jobTitle = typeof body.jobTitle === "string" ? body.jobTitle : undefined;
      throw requestError;
    }

    return response.json() as Promise<T>;
  }

  async function refresh() {
    const [jobsRes, applicationsRes, subscriptionRes] = await Promise.all([
      apiCall<Job[]>("/jobs"),
      apiCall<Application[]>("/applications"),
      apiCall<Subscription>("/subscription")
    ]);

    setJobs(jobsRes);
    setApplications(applicationsRes);
    setSubscription(subscriptionRes);
  }

  async function runSearch() {
    setIsLoading(true);
    setError(null);
    try {
      await apiCall<{ jobs: Job[] }>("/jobs/search", {
        method: "POST",
        body: JSON.stringify({ keywords, location, limitPerSource: 5 })
      });
      await refresh();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  }

  async function applyToJob(jobId: string) {
    setIsLoading(true);
    setError(null);
    setToast(null);
    try {
      const email = manualEmails[jobId]?.trim();
      await apiCall("/applications/apply", {
        method: "POST",
        body: JSON.stringify({ jobId, email: email || undefined })
      });
      await refresh();
      setEmailEditJobId(null);
      setPage("applications");
    } catch (err: any) {
      if (err?.code === "NO_RECIPIENT_EMAIL") {
        setToast("No contact email found for this job. Add it manually in the job card.");
        setEmailEditJobId(jobId);
        setPage("jobs");
        return;
      }
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  }

  async function updateApplication(id: string, action: "approve" | "reject") {
    setError(null);
    setToast(null);
    try {
      await apiCall(`/applications/${id}/${action}`, { method: "POST" });
      await refresh();
    } catch (err: any) {
      if (err?.code === "NO_RECIPIENT_EMAIL") {
        setToast("No contact email found for this job. Add it manually in the job card.");
        setPage("jobs");
        return;
      }
      setError(err.message);
    }
  }

  async function openCheckout(plan: "pro" | "premium") {
    setError(null);
    try {
      const response = await apiCall<{ url: string }>("/stripe/checkout", {
        method: "POST",
        body: JSON.stringify({ plan })
      });
      window.location.href = response.url;
    } catch (err: any) {
      setError(err.message);
    }
  }

  async function openPortal() {
    setError(null);
    try {
      const response = await apiCall<{ url: string }>("/stripe/portal", { method: "POST" });
      window.location.href = response.url;
    } catch (err: any) {
      setError(err.message);
    }
  }

  useEffect(() => {
    if (!apiToken) {
      return;
    }

    refresh().catch((err) => setError(err.message));
  }, [apiToken]);

  return (
    <div style={{ minHeight: "100vh", display: "flex" }}>
      <aside style={{ width: 250, background: "#0f172a", color: "white", padding: 20 }}>
        <h2>Job Agent SaaS</h2>
        <p style={{ fontSize: 13, opacity: 0.8 }}>{user.email}</p>
        <p style={{ fontSize: 13, opacity: 0.8 }}>Plan: {subscription?.plan || user.plan}</p>
        <div style={{ display: "grid", gap: 8, marginTop: 16 }}>
          <button onClick={() => setPage("dashboard")}>Dashboard</button>
          <button onClick={() => setPage("jobs")}>Jobs</button>
          <button onClick={() => setPage("applications")}>Applications</button>
          <button onClick={() => signOut({ callbackUrl: "/signin" })}>Sign out</button>
        </div>
      </aside>

      <main style={{ flex: 1, padding: 24 }}>
        {error ? <p style={{ color: "#dc2626" }}>{error}</p> : null}
        {toast ? <p style={{ color: "#0a66c2" }}>{toast}</p> : null}

        {page === "dashboard" && (
          <section>
            <h1>Dashboard</h1>
            <p>Pending approvals: {pendingCount}</p>
            <p>Sent applications: {sentCount}</p>
            <p>
              Monthly usage: {subscription?.usedApplications ?? 0}
              {subscription?.monthlyLimit ? ` / ${subscription.monthlyLimit}` : " (unlimited)"}
            </p>
            <p>Subscription status: {subscription?.subscriptionStatus || "inactive"}</p>
            <div style={{ display: "flex", gap: 8 }}>
              <button onClick={() => openCheckout("pro")}>Upgrade to Pro</button>
              <button onClick={() => openCheckout("premium")}>Upgrade to Premium</button>
              <button onClick={openPortal}>Billing portal</button>
            </div>
          </section>
        )}

        {page === "jobs" && (
          <section>
            <h1>Jobs</h1>
            <div style={{ display: "flex", gap: 8, marginBottom: 12 }}>
              <input value={keywords} onChange={(e) => setKeywords(e.target.value)} placeholder="Keywords" />
              <input value={location} onChange={(e) => setLocation(e.target.value)} placeholder="Location" />
              <button onClick={runSearch} disabled={isLoading}>{isLoading ? "Searching..." : "Search"}</button>
            </div>
            <div style={{ display: "grid", gap: 12 }}>
              {jobs.map((job) => (
                <article key={job.id} style={{ background: "white", borderRadius: 8, padding: 12 }}>
                  <strong>{job.title}</strong>
                  <p>{job.company} · {job.source}</p>
                  {emailEditJobId === job.id ? (
                    <div style={{ display: "flex", gap: 8, marginBottom: 10 }}>
                      <input
                        value={manualEmails[job.id] ?? ""}
                        onChange={(e) => setManualEmails((prev) => ({ ...prev, [job.id]: e.target.value }))}
                        placeholder="Add contact email"
                        type="email"
                      />
                    </div>
                  ) : null}
                  <div style={{ display: "flex", gap: 10 }}>
                    <a href={job.url} target="_blank" rel="noreferrer">View</a>
                    <button onClick={() => applyToJob(job.id)}>Apply</button>
                  </div>
                </article>
              ))}
            </div>
          </section>
        )}

        {page === "applications" && (
          <section>
            <h1>Applications</h1>
            <div style={{ display: "grid", gap: 10 }}>
              {applications.map((application) => (
                <article key={application.id} style={{ background: "white", borderRadius: 8, padding: 12 }}>
                  <strong>{application.company}</strong> — {application.title}
                  <p>Status: {application.status}</p>
                  <div style={{ display: "flex", gap: 8 }}>
                    <button onClick={() => updateApplication(application.id, "approve")}>Approve</button>
                    <button onClick={() => updateApplication(application.id, "reject")}>Reject</button>
                  </div>
                </article>
              ))}
            </div>
          </section>
        )}
      </main>
    </div>
  );
}
