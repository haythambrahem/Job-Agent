import { Queue } from "bullmq";
import { redisConnection } from "../lib/redis.js";

export interface EmailJobData {
  userId: string;
  type: "application" | "test";
  to: string;
  subject: string;
  htmlBody: string;
  applicationId?: string;
  cvPath?: string;
}

export const emailQueue = new Queue<EmailJobData>("email", {
  connection: redisConnection,
  defaultJobOptions: {
    attempts: 3,
    backoff: {
      type: "exponential",
      delay: 60_000
    },
    removeOnComplete: { count: 1000 },
    removeOnFail: { count: 500 }
  }
});
