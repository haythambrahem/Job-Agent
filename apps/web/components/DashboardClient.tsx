"use client";

import { useEffect, useMemo, useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import Alert from "@/components/ui/Alert";
import Badge from "@/components/ui/Badge";
import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";
import Card from "@/components/ui/Card";
import { apiFetch, ApiError } from "@/hooks/apiClient";
import { useDashboardOverview } from "@/hooks/useDashboardOverview";
import { useScrapeStatus } from "@/hooks/useScrapeStatus";
import type { Application, ApplicationStatus, Job } from "@/hooks/types";

type Page = "dashboard" | "jobs" | "applications" | "billing";

type RequestError = ApiError;

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
  const queryClient = useQueryClient();
  const [page, setPage] = useState<Page>(initialPage);
  const [keywords, setKeywords] = useState("full stack");
  const [location, setLocation] = useState("Tunisie");
  const [error, setError] = useState<string | null>(null);
  const [toast, setToast] = useState<string | null>(null);
  const [manualEmails, setManualEmails] = useState<Record<string, string>>({});
  const [emailEditJobId, setEmailEditJobId] = useState<string | null>(null);
  const [searchJobId, setSearchJobId] = useState<string | null>(null);

  const dashboardQuery = useDashboardOverview(apiToken, user.id);
  const searchStatusQuery = useScrapeStatus(apiToken, searchJobId);

  const jobs = dashboardQuery.data?.jobs ?? [];
  const applications = dashboardQuery.data?.applications ?? [];
  const subscription = dashboardQuery.data?.subscription ?? null;

  const pendingCount = useMemo(
    () => applications.filter((a) => a.status === "pending").length,
    [applications]
  );
  const sentCount = useMemo(
    () => applications.filter((a) => a.status === "sent").length,
    [applications]
  );
  const approvedCount = useMemo(
    () => applications.filter((a) => a.status === "approved").length,
    [applications]
  );

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

  const searchMutation = useMutation({
    mutationFn: async () =>
      apiFetch<{ jobId: string }>("/jobs/search", apiToken, {
        method: "POST",
        body: JSON.stringify({ keywords, location, limitPerSource: 5 })
      })
  });

  const applyMutation = useMutation({
    mutationFn: async (payload: { jobId: string; email?: string }) =>
      apiFetch("/applications/apply", apiToken, {
        method: "POST",
        body: JSON.stringify(payload)
      })
  });

  const updateMutation = useMutation({
    mutationFn: async (payload: { id: string; action: "approve" | "reject" }) =>
      apiFetch(`/applications/${payload.id}/${payload.action}`, apiToken, { method: "POST" })
  });

  const checkoutMutation = useMutation({
    mutationFn: async (plan: "pro" | "premium") =>
      apiFetch<{ url: string }>("/stripe/checkout", apiToken, {
        method: "POST",
        body: JSON.stringify({ plan })
      })
  });

  const portalMutation = useMutation({
    mutationFn: async () =>
      apiFetch<{ url: string }>("/stripe/portal", apiToken, { method: "POST" })
  });

  useEffect(() => {
    if (!searchJobId) return;
    const status = searchStatusQuery.data?.status;
    if (!status) return;

    if (status === "completed") {
      queryClient.invalidateQueries({ queryKey: ["dashboard-overview", user.id] });
      setSearchJobId(null);
      setToast("Job search completed. Results refreshed.");
    }

    if (status === "failed") {
      setSearchJobId(null);
      setError(searchStatusQuery.data?.error ?? "Job search failed.");
    }
  }, [queryClient, searchJobId, searchStatusQuery.data?.error, searchStatusQuery.data?.status, user.id]);

  async function runSearch() {
    setError(null);
    setToast(null);
    try {
      const response = await searchMutation.mutateAsync();
      setSearchJobId(response.jobId);
      setToast("Job search started. We will refresh when it completes.");
    } catch (err: unknown) {
      setError(getErrorMessage(err));
    }
  }

  async function applyToJob(jobId: string) {
    setError(null);
    setToast(null);
    try {
      const email = manualEmails[jobId]?.trim();
      await applyMutation.mutateAsync({ jobId, email: email || undefined });
      await queryClient.invalidateQueries({ queryKey: ["dashboard-overview", user.id] });
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
    }
  }

  async function updateApplication(id: string, action: "approve" | "reject") {
    setError(null);
    setToast(null);
    try {
      await updateMutation.mutateAsync({ id, action });
      await queryClient.invalidateQueries({ queryKey: ["dashboard-overview", user.id] });
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
      const response = await checkoutMutation.mutateAsync(plan);
      window.location.href = response.url;
    } catch (err: unknown) {
      setError(getErrorMessage(err));
    }
  }

  async function openPortal() {
    setError(null);
    try {
      const response = await portalMutation.mutateAsync();
      window.location.href = response.url;
    } catch (err: unknown) {
      setError(getErrorMessage(err));
    }
  }

  const isSearching =
    searchMutation.isPending ||
    (searchStatusQuery.data?.status !== "completed" && searchStatusQuery.data?.status !== "failed" && Boolean(searchJobId));

  const isBusy =
    dashboardQuery.isLoading ||
    isSearching ||
    applyMutation.isPending ||
    updateMutation.isPending ||
    checkoutMutation.isPending ||
    portalMutation.isPending;

  const displayError = error ?? (dashboardQuery.error ? getErrorMessage(dashboardQuery.error) : null);

  if (dashboardQuery.isLoading && !dashboardQuery.data) {
    return <div>Loading dashboard...</div>;
  }

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
      {displayError && <Alert type="error" message={displayError} onClose={() => setError(null)} />}
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
                  disabled={isBusy}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Location</label>
                <Input
                  type="text"
                  placeholder="e.g., San Francisco, Remote, USA"
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                  disabled={isBusy}
                />
              </div>
              <Button
                onClick={runSearch}
                disabled={isBusy}
                isLoading={isSearching}
                variant="primary"
                className="w-full"
              >
                {isSearching ? "Searching..." : "Search Jobs"}
              </Button>
              {searchStatusQuery.data?.status && searchStatusQuery.data?.status !== "completed" && (
                <p className="text-xs text-gray-500">
                  Search status: {searchStatusQuery.data.status.replace(/_/g, " ")}
                </p>
              )}
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
              jobs.map((job: Job) => (
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
                        isLoading={applyMutation.isPending}
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
              applications.map((application: Application) => (
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
                          isLoading={updateMutation.isPending}
                        >
                          Approve
                        </Button>
                        <Button
                          variant="danger"
                          size="sm"
                          onClick={() => updateApplication(application.id, "reject")}
                          isLoading={updateMutation.isPending}
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
