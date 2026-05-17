export type ApplicationStatus = "pending" | "approved" | "rejected" | "sent";

export interface Job {
  id: string;
  title: string;
  company: string;
  url: string;
  source: string;
  applyEmail?: string | null;
}

export interface Application {
  id: string;
  company: string;
  title: string;
  email: string | null;
  coverLetter: string;
  status: ApplicationStatus;
  createdAt: string;
}

export interface Subscription {
  plan: "free" | "pro" | "premium";
  usedApplications: number;
  monthlyLimit: number | null;
  subscriptionStatus: string;
}

export interface Profile {
  id: string;
  name: string | null;
  email: string;
  image: string | null;
  phone: string | null;
  location: string | null;
  plan: string;
  subscriptionStatus: string;
  cvPath: string | null;
  cvOriginalName: string | null;
  cvUploadedAt: string | null;
}

export interface DashboardOverview {
  jobs: Job[];
  applications: Application[];
  subscription: Subscription;
  profile: Profile;
}

export interface ScrapeJobResult {
  jobsCount?: number;
  rankedCount?: number;
  appliedCount?: number;
  skippedCount?: number;
}

export interface ScrapeStatus {
  id: string;
  status: "waiting" | "active" | "completed" | "failed" | "delayed" | "paused" | "waiting-children";
  type: "search" | "auto-apply";
  result?: ScrapeJobResult;
  error?: string;
}

export interface GmailStatus {
  connected: boolean;
  email?: string;
  expiresAt?: number;
}
