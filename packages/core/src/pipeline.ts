import type { Application, ScrapedJob } from "./types.js";
import { scrapeJobs, type ScrapeJobsInput } from "./scraper.js";
import { matchJobToCV } from "./matcher.js";
import { generateCoverLetter } from "./coverLetter.js";
import { sendEmail } from "./email.js";

export interface PipelineStore {
  saveJobs(userId: string, jobs: Array<{ title: string; company: string; url: string; source: string }>): Promise<void>;
  createApplication(userId: string, input: {
    company: string;
    title: string;
    email: string;
    coverLetter: string;
    status: "pending" | "approved" | "rejected" | "sent";
  }): Promise<Application>;
  findApplicationById(userId: string, id: string): Promise<Application | null>;
  updateApplicationStatus(userId: string, id: string, status: "pending" | "approved" | "rejected" | "sent"): Promise<Application>;
  createAIRun(userId: string, input: { type: string; status: string }): Promise<void>;
  getCvSummary(userId: string): Promise<string | null>;
}

const DEFAULT_CV_SUMMARY = "Développeur full-stack, Java, Spring Boot, Angular, 3 ans d'expérience";

export async function scrapeMatchAndStoreJobs(
  userId: string,
  input: ScrapeJobsInput,
  store: PipelineStore,
  minScore = 60
): Promise<ScrapedJob[]> {
  await store.createAIRun(userId, { type: "job_match", status: "started" });

  const jobs = await scrapeJobs(input);
  const cvText = (await store.getCvSummary(userId)) || DEFAULT_CV_SUMMARY;
  const matched: ScrapedJob[] = [];

  for (const job of jobs) {
    const match = await matchJobToCV(job.description, cvText);
    if (match.score >= minScore) matched.push(job);
  }

  await store.saveJobs(
    userId,
    matched.map((job) => ({
      title: job.title,
      company: job.company,
      url: job.url,
      source: job.source
    }))
  );

  await store.createAIRun(userId, { type: "job_match", status: "completed" });
  return matched;
}

export async function createPendingApplication(userId: string, input: {
  company: string;
  title: string;
  email: string;
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
    email: input.email,
    coverLetter,
    status: "pending"
  });
}

export async function approveAndSendApplication(userId: string, id: string, store: PipelineStore): Promise<Application> {
  await store.updateApplicationStatus(userId, id, "approved");
  const approved = await store.findApplicationById(userId, id);

  if (!approved || approved.status !== "approved") {
    throw new Error("Application must be approved before sending");
  }

  await sendEmail({
    toEmail: approved.email,
    company: approved.company,
    jobTitle: approved.title,
    coverLetter: approved.coverLetter
  });

  return store.updateApplicationStatus(userId, id, "sent");
}
