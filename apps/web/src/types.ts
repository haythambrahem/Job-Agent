export type ApplicationStatus = "pending" | "approved" | "rejected" | "sent";

export interface Job {
  id: string;
  title: string;
  company: string;
  url: string;
  source: string;
}

export interface Application {
  id: string;
  company: string;
  title: string;
  email: string;
  coverLetter: string;
  status: ApplicationStatus;
  createdAt: string;
}
