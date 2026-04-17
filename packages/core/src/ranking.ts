import type { MatchResult, RankedJob, ScrapedJob } from "./types.js";
import { matchJobToCV } from "./matcher.js";

export async function rankJobsByCv(jobs: ScrapedJob[], cvText: string): Promise<RankedJob[]> {
  const ranked: RankedJob[] = [];
  for (const job of jobs) {
    const match: MatchResult = await matchJobToCV(job.description, cvText, job.title);
    ranked.push({ ...job, ...match });
  }
  return ranked.sort((left, right) => right.score - left.score);
}

export function filterRankedJobs(jobs: RankedJob[], minScore: number): RankedJob[] {
  return jobs.filter((job) => job.score >= minScore);
}
