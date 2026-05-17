import { Worker } from "bullmq";
import { buildEmailHtml, createPendingApplication, scrapeMatchAndStoreJobs } from "@job-agent/core";
import { prisma } from "../lib/prisma.js";
import { redisConnection } from "../lib/redis.js";
import { logger } from "../lib/logger.js";
import { store } from "../lib/store.js";
import { parseCoverLetterContent } from "../lib/coverLetter.js";
import { AUTO_APPLY_DELAY_RANGE_MS, AUTO_APPLY_LIMIT, AUTO_APPLY_MIN_SCORE } from "../lib/scrapeConfig.js";
import { delay, randomInt } from "../lib/scrapeUtils.js";
import { emailQueue } from "../queues/email.queue.js";
import type { ScrapeJobData, ScrapeJobResult } from "../queues/scrape.queue.js";

type AutoAppliedJob = { title: string; company: string; url: string; score: number; applicationId: string };
type AutoApplySkippedJob = { title: string; company: string; url: string; score: number; reason: string };

const SCRAPE_WORKER_CONCURRENCY = Number(process.env.SCRAPE_WORKER_CONCURRENCY ?? 2);

export const scrapeWorker = new Worker<ScrapeJobData, ScrapeJobResult>(
  "scrape",
  async (job) => {
    const { userId, input, type } = job.data;

    logger.info({ jobId: job.id, userId, type }, "Scrape job started");

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { cvPath: true }
    });

    if (!user?.cvPath) {
      throw new Error("NO_CV_UPLOADED");
    }

    if (type === "search") {
      const jobs = await scrapeMatchAndStoreJobs({
        userId,
        input: {
          keywords: input.keywords,
          location: input.location,
          limitPerSource: input.limitPerSource ?? 5
        },
        store,
        minScore: AUTO_APPLY_MIN_SCORE
      });

      logger.info({ userId, jobs: jobs.length }, "Scrape job search completed");
      return { jobsCount: jobs.length };
    }

    logger.info({ userId, keywords: input.keywords }, "Auto-apply started");
    const rankedJobs = await scrapeMatchAndStoreJobs({
      userId,
      input: {
        keywords: input.keywords,
        location: input.location,
        limitPerSource: input.limitPerSource ?? 5
      },
      store,
      minScore: AUTO_APPLY_MIN_SCORE
    });

    logger.info({ userId, rankedJobs: rankedJobs.length }, "Auto-apply ranked jobs");

    const candidates = rankedJobs.filter((jobItem) => jobItem.score >= AUTO_APPLY_MIN_SCORE).slice(0, AUTO_APPLY_LIMIT);
    logger.info({ userId, selectedJobs: candidates.length }, "Auto-apply selected jobs");

    const applied: AutoAppliedJob[] = [];
    const skipped: AutoApplySkippedJob[] = [];

    for (let index = 0; index < candidates.length; index += 1) {
      const jobItem = candidates[index];
      if (!jobItem) continue;
      logger.info({ userId, index: index + 1, total: candidates.length, title: jobItem.title, score: jobItem.score }, "Auto-apply attempting job");

      if (!jobItem.applyEmail) {
        logger.info({ userId, title: jobItem.title }, "Auto-apply skipped missing recipient email");
        skipped.push({
          title: jobItem.title,
          company: jobItem.company,
          url: jobItem.url,
          score: jobItem.score,
          reason: "missing_apply_email"
        });
        continue;
      }

      try {
        const application = await createPendingApplication(userId, {
          company: jobItem.company,
          title: jobItem.title,
          recipientEmail: jobItem.applyEmail,
          jobDescription: jobItem.description,
          store
        });
        const coverLetter = parseCoverLetterContent(application.coverLetter, application.title, application.company);
        const recipientTo = application.email ?? jobItem.applyEmail;
        if (!recipientTo) {
          throw new Error("NO_RECIPIENT_EMAIL");
        }
        await prisma.application.update({
          where: { id_userId: { id: application.id, userId } },
          data: { status: "approved" }
        });
        await emailQueue.add("application-email", {
          userId,
          type: "application",
          to: recipientTo,
          subject: coverLetter.subject,
          htmlBody: buildEmailHtml(coverLetter),
          applicationId: application.id,
          cvPath: user.cvPath ?? undefined
        });
        applied.push({ title: jobItem.title, company: jobItem.company, url: jobItem.url, score: jobItem.score, applicationId: application.id });
        logger.info({ userId, applicationId: application.id, title: jobItem.title }, "Auto-apply queued application");
      } catch (error: unknown) {
        logger.error({ userId, title: jobItem.title, error: error instanceof Error ? error.message : String(error) }, "Auto-apply failed");
        skipped.push({
          title: jobItem.title,
          company: jobItem.company,
          url: jobItem.url,
          score: jobItem.score,
          reason: "apply_failed"
        });
      }

      if (index < candidates.length - 1) {
        const delayMs = randomInt(AUTO_APPLY_DELAY_RANGE_MS.min, AUTO_APPLY_DELAY_RANGE_MS.max);
        logger.info({ userId, delayMs }, "Auto-apply waiting before next application");
        await delay(delayMs);
      }
    }

    logger.info({ userId, applied: applied.length, skipped: skipped.length }, "Auto-apply completed");
    return {
      rankedCount: rankedJobs.length,
      appliedCount: applied.length,
      skippedCount: skipped.length
    };
  },
  {
    connection: redisConnection,
    concurrency: SCRAPE_WORKER_CONCURRENCY
  }
);

scrapeWorker.on("failed", (job, err) => {
  logger.error({ jobId: job?.id, error: err.message }, "Scrape job permanently failed");
});
