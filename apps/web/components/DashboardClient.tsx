"use client";

import { useEffect, useMemo, useState } from "react";
import Alert from "@/components/ui/Alert";
import Badge from "@/components/ui/Badge";
import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";
import Card from "@/components/ui/Card";

type Page = "dashboard" | "jobs" | "applications" | "billing";
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

type RequestError = Error & {
  code?: string;
};

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:4000";

// KPI Card Component
function KPICard({
  label,
  value,
  subtext,
  icon,
  color = "blue",
}: {
  label: string;
  value: string | number;
  subtext?: string;
  icon: React.ReactNode;
  color?: "blue" | "emerald" | "orange" | "purple";
}) {
  const colorStyles = {
    blue: "bg-blue-50 text-blue-600",
    emerald: "bg-emerald-50 text-emerald-600",
    orange: "bg-orange-50 text-orange-600",
    purple: "bg-purple-50 text-purple-600",
  };

  return (
    <Card hover className="text-center">
      <div className={`inline-flex items-center justify-center w-12 h-12 rounded-lg ${colorStyles[color]} mb-4`}>
        {icon}
      </div>
      <h4 className="text-gray-600 text-sm font-medium mb-1">{label}</h4>
      <p className="text-3xl font-bold text-gray-900">{value}</p>
      {subtext && <p className="text-xs text-gray-500 mt-2">{subtext}</p>}
    </Card>
  );
}

export default function DashboardClient({
  user,
  apiToken,
  initialPage = "dashboard"
}: {
  user: { id: string; email: string; plan: "free" | "pro" | "premium" };
  apiToken: string;
  initialPage?: Page;
}) {
  const [page, setPage] = useState<Page>(initialPage);
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
  const approvedCount = useMemo(() => applications.filter((a) => a.status === "approved").length, [applications]);

  function getErrorMessage(error: unknown): string {
    return error instanceof Error ? error.message : "Request failed";
  }

  function getErrorCode(error: unknown): string | undefined {
    if (typeof error === "object" && error && "code" in error) {
      const code = (error as RequestError).code;
      return typeof code === "string" ? code : undefined;
    }
    return undefined;
  }

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
      };
      requestError.code = typeof body.error === "string" ? body.error : undefined;
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
    } catch (err: unknown) {
      setError(getErrorMessage(err));
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
    } catch (err: unknown) {
      if (getErrorCode(err) === "NO_RECIPIENT_EMAIL") {
        setToast("No contact email found for this job. Add it manually in the job card.");
        setEmailEditJobId(jobId);
        setPage("jobs");
        return;
      }
      setError(getErrorMessage(err));
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
    } catch (err: unknown) {
      if (getErrorCode(err) === "NO_RECIPIENT_EMAIL") {
        setToast("No contact email found for this job. Add it manually in the job card.");
        setPage("jobs");
        return;
      }
      setError(getErrorMessage(err));
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
    } catch (err: unknown) {
      setError(getErrorMessage(err));
    }
  }

  async function openPortal() {
    setError(null);
    try {
      const response = await apiCall<{ url: string }>("/stripe/portal", { method: "POST" });
      window.location.href = response.url;
    } catch (err: unknown) {
      setError(getErrorMessage(err));
    }
  }

  useEffect(() => {
    if (!apiToken) {
      return;
    }

    refresh().catch((err: unknown) => setError(getErrorMessage(err)));
  }, [apiToken]);

  const getStatusColor = (status: ApplicationStatus) => {
    switch (status) {
      case "pending":
        return "primary";
      case "approved":
        return "success";
      case "rejected":
        return "danger";
      case "sent":
        return "warning";
      default:
        return "info";
    }
  };

  return (
    <div className="space-y-6">
      {error && <Alert type="error" message={error} onClose={() => setError(null)} />}
      {toast && <Alert type="info" message={toast} onClose={() => setToast(null)} />}

      {page === "dashboard" && (
        <div className="space-y-8">
          <div>
            <h1 className="text-4xl font-bold text-gray-900 mb-2">Dashboard</h1>
            <p className="text-gray-600">Welcome back! Here's your application overview.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <KPICard
              label="Pending Approvals"
              value={pendingCount}
              subtext="Applications awaiting review"
              icon={<svg className="w-6 h-6" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M6 2a1 1 0 00-1 1v1H4a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2h-1V3a1 1 0 10-2 0v1H7V3a1 1 0 00-1-1zm0 5a1 1 0 000 2h8a1 1 0 100-2H6z" clipRule="evenodd" /></svg>}
              color="orange"
            />
            <KPICard
              label="Sent Applications"
              value={sentCount}
              subtext="Successfully submitted"
              icon={<svg className="w-6 h-6" fill="currentColor" viewBox="0 0 20 20"><path d="M3 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1z" /></svg>}
              color="emerald"
            />
            <KPICard
              label="Approved"
              value={approvedCount}
              subtext="Ready to apply"
              icon={<svg className="w-6 h-6" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" /></svg>}
              color="blue"
            />
            <KPICard
              label="Monthly Usage"
              value={`${subscription?.usedApplications ?? 0}${subscription?.monthlyLimit ? ` / ${subscription.monthlyLimit}` : ""}`}
              subtext={subscription?.monthlyLimit ? "of your monthly limit" : "Unlimited"}
              icon={<svg className="w-6 h-6" fill="currentColor" viewBox="0 0 20 20"><path d="M2 11a1 1 0 011-1h2a1 1 0 011 1v5a1 1 0 01-1 1H3a1 1 0 01-1-1v-5zM8 7a1 1 0 011-1h2a1 1 0 011 1v9a1 1 0 01-1 1H9a1 1 0 01-1-1V7zM14 4a1 1 0 011-1h2a1 1 0 011 1v12a1 1 0 01-1 1h-2a1 1 0 01-1-1V4z" /></svg>}
              color="purple"
            />
          </div>

          <Card>
            <h3 className="text-lg font-bold text-gray-900 mb-4">Subscription Status</h3>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-gray-600">Current Plan</span>
                <Badge variant="primary">{subscription?.plan?.toUpperCase() || user.plan.toUpperCase()}</Badge>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-gray-600">Status</span>
                <Badge variant={subscription?.subscriptionStatus === "active" ? "success" : "warning"}>
                  {subscription?.subscriptionStatus || "inactive"}
                </Badge>
              </div>
            </div>
          </Card>
        </div>
      )}

      {page === "jobs" && (
        <div className="space-y-6">
          <div>
            <h1 className="text-4xl font-bold text-gray-900 mb-2">Jobs</h1>
            <p className="text-gray-600">Search and discover job opportunities.</p>
          </div>

          <Card>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Keywords</label>
                <Input
                  type="text"
                  placeholder="e.g., React, Full Stack, Web Developer"
                  value={keywords}
                  onChange={(e) => setKeywords(e.target.value)}
                  disabled={isLoading}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Location</label>
                <Input
                  type="text"
                  placeholder="e.g., San Francisco, Remote, USA"
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                  disabled={isLoading}
                />
              </div>
              <Button
                onClick={runSearch}
                disabled={isLoading}
                isLoading={isLoading}
                variant="primary"
                className="w-full"
              >
                Search Jobs
              </Button>
            </div>
          </Card>

          <div className="grid gap-4">
            {jobs.length === 0 ? (
              <Card className="text-center py-12">
                <svg className="w-12 h-12 text-gray-300 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
                <p className="text-gray-500 text-sm">No jobs found. Try searching with different keywords.</p>
              </Card>
            ) : (
              jobs.map((job) => (
                <Card key={job.id} hover>
                  <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
                    <div className="flex-1">
                      <h3 className="text-lg font-bold text-gray-900 mb-1">{job.title}</h3>
                      <p className="text-gray-600 mb-3">{job.company}</p>
                      <div className="flex gap-2 mb-4">
                        <Badge variant="info">{job.source}</Badge>
                      </div>
                      {emailEditJobId === job.id && (
                        <div className="mb-4">
                          <Input
                            type="email"
                            placeholder="contact@company.com"
                            value={manualEmails[job.id] ?? ""}
                            onChange={(e) => setManualEmails((prev) => ({ ...prev, [job.id]: e.target.value }))}
                            label="Contact Email"
                          />
                        </div>
                      )}
                    </div>
                    <div className="flex gap-2">
                      <Button
                        variant="tertiary"
                        size="sm"
                        onClick={() => window.open(job.url, "_blank")}
                      >
                        View
                      </Button>
                      <Button
                        variant="primary"
                        size="sm"
                        onClick={() => {
                          if (!emailEditJobId) {
                            setEmailEditJobId(job.id);
                          } else {
                            applyToJob(job.id);
                          }
                        }}
                        isLoading={isLoading}
                      >
                        {emailEditJobId === job.id ? "Submit" : "Apply"}
                      </Button>
                    </div>
                  </div>
                </Card>
              ))
            )}
          </div>
        </div>
      )}

      {page === "applications" && (
        <div className="space-y-6">
          <div>
            <h1 className="text-4xl font-bold text-gray-900 mb-2">Applications</h1>
            <p className="text-gray-600">Track your job applications and their status.</p>
          </div>

          <div className="grid gap-4">
            {applications.length === 0 ? (
              <Card className="text-center py-12">
                <svg className="w-12 h-12 text-gray-300 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                <p className="text-gray-500 text-sm">No applications yet. Search for jobs and apply to get started.</p>
              </Card>
            ) : (
              applications.map((application) => (
                <Card key={application.id} hover>
                  <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
                    <div className="flex-1">
                      <h3 className="text-lg font-bold text-gray-900 mb-1">{application.company}</h3>
                      <p className="text-gray-600 mb-3">{application.title}</p>
                      <div className="flex gap-2 items-center">
                        <Badge variant={getStatusColor(application.status as ApplicationStatus)}>
                          {application.status.charAt(0).toUpperCase() + application.status.slice(1)}
                        </Badge>
                        <span className="text-xs text-gray-500">
                          {new Date(application.createdAt).toLocaleDateString()}
                        </span>
                      </div>
                    </div>
                    {application.status === "pending" && (
                      <div className="flex gap-2">
                        <Button
                          variant="primary"
                          size="sm"
                          onClick={() => updateApplication(application.id, "approve")}
                          isLoading={isLoading}
                        >
                          Approve
                        </Button>
                        <Button
                          variant="danger"
                          size="sm"
                          onClick={() => updateApplication(application.id, "reject")}
                          isLoading={isLoading}
                        >
                          Reject
                        </Button>
                      </div>
                    )}
                  </div>
                </Card>
              ))
            )}
          </div>
        </div>
      )}

      {page === "billing" && (
        <div className="space-y-6">
          <div>
            <h1 className="text-4xl font-bold text-gray-900 mb-2">Billing & Plans</h1>
            <p className="text-gray-600">Manage your subscription and billing information.</p>
          </div>

          <div className="grid md:grid-cols-3 gap-6">
            {[
              {
                name: "Free",
                price: "$0",
                description: "Perfect for getting started",
                features: ["Up to 10 applications/month", "Basic job search", "Email support"],
                current: subscription?.plan === "free",
                button: null,
              },
              {
                name: "Pro",
                price: "$29",
                description: "For active job seekers",
                features: ["100 applications/month", "Advanced filters", "Priority support", "Gmail integration"],
                current: subscription?.plan === "pro",
                button: <Button variant="primary" onClick={() => openCheckout("pro")}>Upgrade to Pro</Button>,
              },
              {
                name: "Premium",
                price: "$99",
                description: "Full automation power",
                features: ["Unlimited applications", "Advanced AI matching", "24/7 support", "API access"],
                current: subscription?.plan === "premium",
                button: <Button variant="primary" onClick={() => openCheckout("premium")}>Upgrade to Premium</Button>,
              },
            ].map((plan) => (
              <Card key={plan.name} hover={!plan.current} className={plan.current ? "border-2 border-blue-500" : ""}>
                <div className="space-y-4">
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <h3 className="text-xl font-bold text-gray-900">{plan.name}</h3>
                      {plan.current && <Badge variant="primary">Current Plan</Badge>}
                    </div>
                    <p className="text-gray-600 text-sm mb-2">{plan.description}</p>
                  </div>
                  <div>
                    <span className="text-3xl font-bold text-gray-900">{plan.price}</span>
                    <span className="text-gray-600 text-sm">/month</span>
                  </div>
                  <ul className="space-y-2">
                    {plan.features.map((feature) => (
                      <li key={feature} className="flex items-center gap-2 text-gray-700">
                        <svg className="w-5 h-5 text-emerald-600" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                        </svg>
                        <span className="text-sm">{feature}</span>
                      </li>
                    ))}
                  </ul>
                  {plan.button && <div className="pt-2">{plan.button}</div>}
                  {subscription?.plan !== "free" && (
                    <Button
                      variant="secondary"
                      className="w-full"
                      onClick={openPortal}
                    >
                      Billing Portal
                    </Button>
                  )}
                </div>
              </Card>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
