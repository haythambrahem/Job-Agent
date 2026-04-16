export type ApplicationStatus = "pending" | "approved" | "rejected" | "sent";

export interface Job {
  id?: string;
  title: string;
  company: string;
  url: string;
  source: string;
}

export interface ScrapedJob extends Job {
  description: string;
  location: string;
  email?: string;
}

export interface MatchResult {
  score: number;
  reasons: string[];
  matchedSkills: string[];
}

export interface Application {
  id: string;
  company: string;
  title: string;
  email: string;
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

export interface SendEmailInput {
  toEmail: string;
  company: string;
  jobTitle: string;
  coverLetter: string;
}
