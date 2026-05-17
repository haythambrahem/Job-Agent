import { Queue } from "bullmq";
import { redisConnection } from "../lib/redis.js";

export type ScrapeJobType = "search" | "auto-apply";

export interface ScrapeJobInput {
  keywords: string;
  location?: string;
  limitPerSource?: number;
}

export interface ScrapeJobData {
  userId: string;
  type: ScrapeJobType;
  input: ScrapeJobInput;
}

export interface ScrapeJobResult {
  jobsCount?: number;
  rankedCount?: number;
  appliedCount?: number;
  skippedCount?: number;
}

export const scrapeQueue = new Queue<ScrapeJobData, ScrapeJobResult>("scrape", {
  connection: redisConnection,
  defaultJobOptions: {
    attempts: 3,
    backoff: {
      type: "exponential",
      delay: 60_000
    },
    removeOnComplete: { count: 500 },
    removeOnFail: { count: 500 }
  }
});
