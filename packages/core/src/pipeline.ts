import type { Application, RankedJob } from "./types.js";
import { scrapeJobs, type ScrapeJobsInput } from "./scraper.service.js";
import { filterRankedJobs, rankJobsByCv } from "./ranking.js";
import { generateCoverLetter, type CoverLetterContent } from "./coverLetter.js";
import type { MailProvider } from "./providers/mail/mail.provider.js";

export interface PipelineStore {
  saveJobs(userId: string, jobs: Array<{ title: string; company: string; url: string; source: string; applyEmail?: string | null }>): Promise<void>;
  createApplication(userId: string, input: {
    company: string;
    title: string;
    email?: string | null;
    coverLetter: string;
    status: "pending" | "approved" | "rejected" | "sent";
  }): Promise<Application>;
  findApplicationById(userId: string, id: string): Promise<Application | null>;
  updateApplicationStatus(userId: string, id: string, status: "pending" | "approved" | "rejected" | "sent"): Promise<Application>;
  createAIRun(userId: string, input: { type: string; status: string }): Promise<void>;
  getCvSummary(userId: string): Promise<string | null>;
}

const DEFAULT_CV_SUMMARY = "Développeur full-stack, Java, Spring Boot, Angular, 3 ans d'expérience";

function serializeCoverLetter(content: CoverLetterContent): string {
  return JSON.stringify(content);
}

export async function scrapeMatchAndStoreJobs(opts: {
  userId: string;
  input: ScrapeJobsInput;
  store: PipelineStore;
  minScore?: number;
}): Promise<RankedJob[]> {
  const minScore = opts.minScore ?? 70;
  await opts.store.createAIRun(opts.userId, { type: "job_match", status: "started" });

  const jobs = await scrapeJobs(opts.input);
  const cvText = (await opts.store.getCvSummary(opts.userId)) || DEFAULT_CV_SUMMARY;
  const rankedJobs = await rankJobsByCv(jobs, cvText);
  const matched = filterRankedJobs(rankedJobs, minScore);

  await opts.store.saveJobs(
    opts.userId,
    matched.map((job) => ({
      title: job.title,
      company: job.company,
      url: job.url,
      source: job.source,
      applyEmail: job.applyEmail ?? null
    }))
  );

  await opts.store.createAIRun(opts.userId, { type: "job_match", status: "completed" });
  return matched;
}

export async function createPendingApplication(userId: string, input: {
  company: string;
  title: string;
  recipientEmail?: string | null;
  jobDescription: string;
  store: PipelineStore;
}): Promise<Application> {
  const cvSummary = (await input.store.getCvSummary(userId)) || undefined;
  const coverLetter = await generateCoverLetter({
    jobTitle: input.title,
    company: input.company,
    jobDescription: input.jobDescription,
    cvSummary
  });

  return input.store.createApplication(userId, {
    company: input.company,
    title: input.title,
    email: input.recipientEmail ?? null,
    coverLetter: serializeCoverLetter(coverLetter),
    status: "pending"
  });
}

export async function sendApplicationEmail(opts: {
  provider: MailProvider;
  to: string;
  subject: string;
  htmlBody: string;
  attachments?: Array<{ filename: string; mimeType: string; data: Buffer }>;
}): Promise<void> {
  await opts.provider.sendEmail({
    to: opts.to,
    subject: opts.subject,
    htmlBody: opts.htmlBody,
    attachments: opts.attachments
  });
}
