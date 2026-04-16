import "dotenv/config";
import express from "express";
import http from "node:http";
import { Server } from "socket.io";
import {
  approveAndSendApplication,
  createPendingApplication,
  scrapeMatchAndStoreJobs,
  type Application
} from "@job-agent/core";
import { prisma } from "./lib/prisma.js";
import { TaskQueue } from "./lib/queue.js";
import { basicRateLimit } from "./middleware/rateLimit.js";

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: { origin: process.env.WEB_ORIGIN || "http://localhost:5173" }
});

const searchQueue = new TaskQueue(2);
const applicationQueue = new TaskQueue(2);

app.use((req, res, next) => {
  res.setHeader("Access-Control-Allow-Origin", process.env.WEB_ORIGIN || "http://localhost:5173");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
  res.setHeader("Access-Control-Allow-Methods", "GET,POST,OPTIONS");
  if (req.method === "OPTIONS") {
    res.status(204).end();
    return;
  }
  next();
});

app.use(express.json({ limit: "100kb" }));
app.use(basicRateLimit);
app.use((req, _res, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.path}`);
  next();
});

const store = {
  async saveJobs(jobs: Array<{ title: string; company: string; url: string; source: string }>): Promise<void> {
    for (const job of jobs) {
      const exists = await prisma.job.findFirst({ where: { title: job.title, company: job.company, url: job.url } });
      if (!exists) {
        await prisma.job.create({ data: job });
      }
    }
  },
  createApplication(input: {
    company: string;
    title: string;
    email: string;
    coverLetter: string;
    status: "pending" | "approved" | "rejected" | "sent";
  }): Promise<Application> {
    return prisma.application.create({ data: input }) as unknown as Promise<Application>;
  },
  findApplicationById(id: string): Promise<Application | null> {
    return prisma.application.findUnique({ where: { id } }) as unknown as Promise<Application | null>;
  },
  updateApplicationStatus(id: string, status: "pending" | "approved" | "rejected" | "sent"): Promise<Application> {
    return prisma.application.update({ where: { id }, data: { status } }) as unknown as Promise<Application>;
  }
};

app.get("/health", (_req, res) => {
  res.json({ ok: true });
});

app.get("/jobs", async (_req, res) => {
  const jobs = await prisma.job.findMany({ orderBy: { id: "desc" } });
  res.json(jobs);
});

app.post("/jobs/search", async (req, res) => {
  const keywords = typeof req.body?.keywords === "string" ? req.body.keywords.trim() : "";
  const location = typeof req.body?.location === "string" ? req.body.location.trim() : "";
  const limitPerSource = typeof req.body?.limitPerSource === "number" ? req.body.limitPerSource : 5;

  if (!keywords) {
    res.status(400).json({ error: "keywords is required" });
    return;
  }

  try {
    const jobs = await searchQueue.enqueue(() =>
      scrapeMatchAndStoreJobs(
        { keywords, location: location || undefined, limitPerSource },
        store
      )
    );
    io.emit("jobs:new", { count: jobs.length });
    res.json({ jobs });
  } catch (error: any) {
    res.status(500).json({ error: error?.message || "job search failed" });
  }
});

app.get("/applications", async (_req, res) => {
  const applications = await prisma.application.findMany({ orderBy: { createdAt: "desc" } });
  res.json(applications);
});

app.post("/applications/apply", async (req, res) => {
  const jobId = typeof req.body?.jobId === "string" ? req.body.jobId : "";
  const email = typeof req.body?.email === "string" ? req.body.email.trim() : "";

  if (!jobId || !email) {
    res.status(400).json({ error: "jobId and email are required" });
    return;
  }

  const job = await prisma.job.findUnique({ where: { id: jobId } });
  if (!job) {
    res.status(404).json({ error: "Job not found" });
    return;
  }

  try {
    const application = await applicationQueue.enqueue(() =>
      createPendingApplication({
        company: job.company,
        title: job.title,
        email,
        jobDescription: `Application for ${job.title} at ${job.company}. Source: ${job.source}. URL: ${job.url}`,
        store
      })
    );

    io.emit("approval:needed", {
      id: application.id,
      company: application.company,
      title: application.title
    });

    res.status(201).json(application);
  } catch (error: any) {
    res.status(500).json({ error: error?.message || "application pipeline failed" });
  }
});

app.get("/applications/:id/preview", async (req, res) => {
  const application = await prisma.application.findUnique({ where: { id: req.params.id } });
  if (!application) {
    res.status(404).json({ error: "Application not found" });
    return;
  }

  res.json({
    id: application.id,
    title: application.title,
    company: application.company,
    email: application.email,
    coverLetter: application.coverLetter,
    status: application.status
  });
});

app.post("/applications/:id/approve", async (req, res) => {
  try {
    const application = await applicationQueue.enqueue(() => approveAndSendApplication(req.params.id, store));
    io.emit("applications:updated", { id: application.id, status: application.status });
    res.json(application);
  } catch (error: any) {
    res.status(400).json({ error: error?.message || "approval failed" });
  }
});

app.post("/applications/:id/reject", async (req, res) => {
  try {
    const current = await prisma.application.findUnique({ where: { id: req.params.id } });
    if (!current) {
      res.status(404).json({ error: "Application not found" });
      return;
    }

    if (current.status === "sent") {
      res.status(400).json({ error: "Cannot reject sent application" });
      return;
    }

    const updated = await prisma.application.update({ where: { id: req.params.id }, data: { status: "rejected" } });
    io.emit("applications:updated", { id: updated.id, status: updated.status });
    res.json(updated);
  } catch (error: any) {
    res.status(400).json({ error: error?.message || "rejection failed" });
  }
});

const port = Number(process.env.API_PORT || 4000);
server.listen(port, () => {
  console.log(`API running on http://localhost:${port}`);
});
