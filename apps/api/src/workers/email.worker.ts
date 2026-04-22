import { readFile } from "node:fs/promises";
import path from "node:path";
import { Worker } from "bullmq";
import { prisma } from "../lib/prisma.js";
import { redisConnection } from "../lib/redis.js";
import { logger } from "../lib/logger.js";
import { GmailService } from "../modules/gmail/gmail.service.js";
import type { EmailJobData } from "../queues/email.queue.js";
import { sendApplicationEmail } from "@job-agent/core";

const gmailService = new GmailService(prisma);
const lastSentAt = new Map<string, number>();

function getDelayMs(): number {
  return (2 * 60 + Math.floor(Math.random() * 3 * 60)) * 1000;
}

export const emailWorker = new Worker<EmailJobData>(
  "email",
  async (job) => {
    const { userId, to, subject, htmlBody, applicationId, cvPath } = job.data;

    const lastSent = lastSentAt.get(userId) ?? 0;
    const minDelay = getDelayMs();
    const elapsed = Date.now() - lastSent;

    if (elapsed < minDelay) {
      const waitMs = minDelay - elapsed;
      logger.info({ userId, waitMs }, "Email throttled, delaying");
      await new Promise((resolve) => setTimeout(resolve, waitMs));
    }

    const emailLog = await prisma.emailLog.create({
      data: {
        userId,
        applicationId: applicationId ?? null,
        to,
        subject,
        status: "queued",
        provider: "gmail"
      }
    });

    try {
      const provider = await gmailService.buildProviderForUser(userId);

      const attachments: Array<{ filename: string; mimeType: string; data: Buffer }> = [];
      if (cvPath) {
        const fullPath = path.join(process.cwd(), "apps/api", cvPath);
        const data = await readFile(fullPath);
        attachments.push({
          filename: "CV-Haytham-Brahem.pdf",
          mimeType: "application/pdf",
          data
        });
      }

      await sendApplicationEmail({ provider, to, subject, htmlBody, attachments });

      await prisma.emailLog.updateMany({
        where: { id: emailLog.id, userId },
        data: { status: "sent", sentAt: new Date() }
      });

      if (applicationId) {
        await prisma.application.update({
          where: { id_userId: { id: applicationId, userId } },
          data: { status: "sent" }
        });
      }

      lastSentAt.set(userId, Date.now());
      logger.info({ userId, to, applicationId }, "Email sent successfully");
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);

      await prisma.emailLog.updateMany({
        where: { id: emailLog.id, userId },
        data: {
          status: "failed",
          errorMessage: message,
          retryCount: { increment: 1 }
        }
      });

      logger.error({ userId, to, error: message }, "Email send failed");
      throw err;
    }
  },
  {
    connection: redisConnection,
    concurrency: 5
  }
);

emailWorker.on("failed", (job, err) => {
  logger.error({ jobId: job?.id, error: err.message }, "Email job permanently failed");
});
