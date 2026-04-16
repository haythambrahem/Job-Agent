import type { Application, ScrapedJob } from "./types.js";
import { readCV } from "./cv.js";
import { scrapeJobs, type ScrapeJobsInput } from "./scraper.js";
import { matchJobToCV } from "./matcher.js";
import { generateCoverLetter } from "./coverLetter.js";
import { sendEmail } from "./email.js";

export interface PipelineStore {
  saveJobs(jobs: Array<{ title: string; company: string; url: string; source: string }>): Promise<void>;
  createApplication(input: {
    company: string;
    title: string;
    email: string;
    coverLetter: string;
    status: "pending" | "approved" | "rejected" | "sent";
  }): Promise<Application>;
  findApplicationById(id: string): Promise<Application | null>;
  updateApplicationStatus(id: string, status: "pending" | "approved" | "rejected" | "sent"): Promise<Application>;
}

export async function scrapeMatchAndStoreJobs(input: ScrapeJobsInput, store: PipelineStore): Promise<ScrapedJob[]> {
  const jobs = await scrapeJobs(input);
  const cvText = await readCV();
  const matched: ScrapedJob[] = [];

  for (const job of jobs) {
    const match = await matchJobToCV(job.description, cvText);
    if (match.score >= 60) matched.push(job);
  }

  await store.saveJobs(
    matched.map((job) => ({
      title: job.title,
      company: job.company,
      url: job.url,
      source: job.source
    }))
  );

  return matched;
}

export async function createPendingApplication(input: {
  company: string;
  title: string;
  email: string;
  jobDescription: string;
  store: PipelineStore;
}): Promise<Application> {
  const coverLetter = await generateCoverLetter({
    jobTitle: input.title,
    company: input.company,
    jobDescription: input.jobDescription
  });

  return input.store.createApplication({
    company: input.company,
    title: input.title,
    email: input.email,
    coverLetter,
    status: "pending"
  });
}

export async function approveAndSendApplication(id: string, store: PipelineStore): Promise<Application> {
  await store.updateApplicationStatus(id, "approved");
  const approved = await store.findApplicationById(id);

  if (!approved || approved.status !== "approved") {
    throw new Error("Application must be approved before sending");
  }

  await sendEmail({
    toEmail: approved.email,
    company: approved.company,
    jobTitle: approved.title,
    coverLetter: approved.coverLetter
  });

  return store.updateApplicationStatus(id, "sent");
}
