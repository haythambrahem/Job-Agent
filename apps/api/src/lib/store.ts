import type { Application } from "@job-agent/core";
import { prisma } from "./prisma.js";

export const store = {
  async saveJobs(
    userId: string,
    jobs: Array<{ title: string; company: string; url: string; source: string; applyEmail?: string | null }>
  ): Promise<void> {
    for (const job of jobs) {
      await prisma.job.upsert({
        where: { userId_url: { userId, url: job.url } },
        update: { title: job.title, company: job.company, source: job.source, applyEmail: job.applyEmail ?? null },
        create: { ...job, userId }
      });
    }
  },
  createApplication(
    userId: string,
    input: {
      company: string;
      title: string;
      email?: string | null;
      coverLetter: string;
      status: "pending" | "approved" | "rejected" | "sent";
    }
  ): Promise<Application> {
    return prisma.application.create({ data: { ...input, userId } }) as unknown as Promise<Application>;
  },
  findApplicationById(userId: string, id: string): Promise<Application | null> {
    return prisma.application.findFirst({ where: { id, userId } }) as unknown as Promise<Application | null>;
  },
  async updateApplicationStatus(
    userId: string,
    id: string,
    status: "pending" | "approved" | "rejected" | "sent"
  ): Promise<Application> {
    return prisma.application.update({ where: { id_userId: { id, userId } }, data: { status } }) as unknown as Promise<Application>;
  },
  async createAIRun(userId: string, input: { type: string; status: string }): Promise<void> {
    await prisma.aIRun.create({ data: { userId, type: input.type, status: input.status } });
  },
  async getCvSummary(userId: string): Promise<string | null> {
    const profile = await prisma.cvProfile.findUnique({ where: { userId } });
    return profile?.summary || profile?.rawText || null;
  }
};
