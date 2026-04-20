import type { Application, RankedJob, ScrapedJob } from "./types.js";
import { scrapeJobs, type ScrapeJobsInput } from "./scraper.js";
import { filterRankedJobs, rankJobsByCv } from "./ranking.js";
import { generateCoverLetter, type CoverLetterContent } from "./coverLetter.js";
import { sendEmail } from "./email.js";
import { buildEmailHtml } from "./emailTemplate.js";
import { extractCvText } from "./cv.js";

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
const DEFAULT_CV_PDF_PATH = "./assets/cv-haytham-brahem.pdf";

function serializeCoverLetter(content: CoverLetterContent): string {
  return JSON.stringify(content);
}

function fallbackCoverLetterContent(application: Application): CoverLetterContent {
  return {
    subject: `Application for ${application.title} — Haytham Brahem`,
    opening: `Dear Hiring Manager at ${application.company},`,
    body: application.coverLetter,
    closing: "Thank you for your time and consideration."
  };
}

function deserializeCoverLetter(application: Application): CoverLetterContent {
  try {
    const parsed = JSON.parse(application.coverLetter) as Partial<CoverLetterContent>;
    if (typeof parsed.subject === "string" && typeof parsed.opening === "string" && typeof parsed.body === "string" && typeof parsed.closing === "string") {
      return {
        subject: parsed.subject,
        opening: parsed.opening,
        body: parsed.body,
        closing: parsed.closing
      };
    }
  } catch {
    // fallback below
  }
  return fallbackCoverLetterContent(application);
}

export async function scrapeMatchAndStoreJobs(
  opts: {
    userId: string;
    cvPath: string;
    cvText?: string;
    input: ScrapeJobsInput;
    store: PipelineStore;
  },
  minScore = 70
): Promise<RankedJob[]> {
  await opts.store.createAIRun(opts.userId, { type: "job_match", status: "started" });

  const jobs = await scrapeJobs(opts.input);
  const cvText = opts.cvText || (await extractCvText(opts.cvPath)) || DEFAULT_CV_SUMMARY;
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

export async function approveAndSendApplication(userId: string, id: string, store: PipelineStore): Promise<Application> {
  await store.updateApplicationStatus(userId, id, "approved");
  const approved = await store.findApplicationById(userId, id);

  if (!approved || approved.status !== "approved") {
    throw new Error("Application must be approved before sending");
  }

  if (!approved.email) {
    const noRecipientError = new Error("NO_RECIPIENT_EMAIL");
    noRecipientError.name = "NoRecipientEmailError";
    throw noRecipientError;
  }

  const content = deserializeCoverLetter(approved);

  await sendEmail({
    to: approved.email,
    subject: content.subject,
    htmlBody: buildEmailHtml(content),
    cvPdfPath: process.env.CV_PDF_PATH || DEFAULT_CV_PDF_PATH
  });

  return store.updateApplicationStatus(userId, id, "sent");
}
