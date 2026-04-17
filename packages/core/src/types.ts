export type ApplicationStatus = "pending" | "approved" | "rejected" | "sent";

export interface Job {
  id?: string;
  userId?: string;
  title: string;
  company: string;
  url: string;
  source: string;
  applyEmail?: string | null;
}

export interface ScrapedJob extends Job {
  description: string;
  location: string;
}

export interface MatchResult {
  score: number;
  reasons: string[];
  matchedSkills: string[];
}

export interface RankedJob extends ScrapedJob, MatchResult {}

export interface Application {
  id: string;
  userId?: string;
  company: string;
  title: string;
  email: string | null;
  coverLetter: string;
  status: ApplicationStatus;
  createdAt: Date;
}

export interface GenerateCoverLetterInput {
  jobTitle: string;
  company: string;
  jobDescription: string;
  cvSummary?: string;
}
