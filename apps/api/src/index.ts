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
import { z } from "zod";
import { prisma } from "./lib/prisma.js";
import { stripe, resolvePlanFromPriceId } from "./lib/stripe.js";
import { TaskQueue } from "./lib/queue.js";
import { basicRateLimit } from "./middleware/rateLimit.js";
import { authenticateRequest } from "./middleware/auth.js";
import { validateSubscription } from "./middleware/subscription.js";

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: { origin: process.env.WEB_ORIGIN || "http://localhost:3000", credentials: true }
});

const searchQueue = new TaskQueue(2);
const applicationQueue = new TaskQueue(2);

app.use((req, res, next) => {
  res.setHeader("Access-Control-Allow-Origin", process.env.WEB_ORIGIN || "http://localhost:3000");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization");
  res.setHeader("Access-Control-Allow-Methods", "GET,POST,OPTIONS");
  res.setHeader("Access-Control-Allow-Credentials", "true");
  if (req.method === "OPTIONS") {
    res.status(204).end();
    return;
  }
  next();
});

app.post("/stripe/webhook", express.raw({ type: "application/json" }), async (req, res) => {
  const signature = req.headers["stripe-signature"];
  if (!signature || !process.env.STRIPE_WEBHOOK_SECRET) {
    res.status(400).send("Missing Stripe signature or secret");
    return;
  }

  let event;
  try {
    event = stripe.webhooks.constructEvent(req.body, signature, process.env.STRIPE_WEBHOOK_SECRET);
  } catch {
    res.status(400).send("Invalid webhook signature");
    return;
  }

  try {
    if (event.type === "checkout.session.completed") {
      const session = event.data.object;
      const userId = session.client_reference_id;
      const customerId = typeof session.customer === "string" ? session.customer : null;
      const subscriptionId = typeof session.subscription === "string" ? session.subscription : null;
      const plan = (session.metadata?.plan as "pro" | "premium" | undefined) || "free";

      if (userId) {
        await prisma.user.update({
          where: { id: userId },
          data: {
            stripeCustomerId: customerId,
            stripeSubscriptionId: subscriptionId,
            plan,
            subscriptionStatus: "active"
          }
        });
      }
    }

    if (event.type === "customer.subscription.created" || event.type === "customer.subscription.updated" || event.type === "customer.subscription.deleted") {
      const subscription = event.data.object;
      const customerId = typeof subscription.customer === "string" ? subscription.customer : null;
      const subscriptionId = subscription.id;
      const priceId = subscription.items.data[0]?.price?.id;
      const plan = resolvePlanFromPriceId(priceId);
      const status = subscription.status;

      if (customerId) {
        await prisma.user.updateMany({
          where: { OR: [{ stripeCustomerId: customerId }, { stripeSubscriptionId: subscriptionId }] },
          data: {
            stripeSubscriptionId: subscriptionId,
            plan: status === "active" || status === "trialing" ? plan : "free",
            subscriptionStatus:
              status === "active" || status === "trialing"
                ? "active"
                : status === "past_due"
                  ? "past_due"
                  : status === "unpaid"
                    ? "unpaid"
                    : "canceled"
          }
        });
      }
    }

    res.json({ received: true });
  } catch {
    res.status(500).json({ error: "webhook handling failed" });
  }
});

app.use(express.json({ limit: "200kb" }));
app.use(basicRateLimit);
app.use((req, _res, next) => {
  const user = req.user?.id || "anonymous";
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.path} user=${user}`);
  next();
});

const store = {
  async saveJobs(userId: string, jobs: Array<{ title: string; company: string; url: string; source: string }>): Promise<void> {
    for (const job of jobs) {
      await prisma.job.upsert({
        where: { userId_url: { userId, url: job.url } },
        update: { title: job.title, company: job.company, source: job.source },
        create: { ...job, userId }
      });
    }
  },
  createApplication(
    userId: string,
    input: {
      company: string;
      title: string;
      email: string;
      coverLetter: string;
      status: "pending" | "approved" | "rejected" | "sent";
    }
  ): Promise<Application> {
    return prisma.application.create({ data: { ...input, userId } }) as unknown as Promise<Application>;
  },
  findApplicationById(userId: string, id: string): Promise<Application | null> {
    return prisma.application.findFirst({ where: { id, userId } }) as unknown as Promise<Application | null>;
  },
  async updateApplicationStatus(userId: string, id: string, status: "pending" | "approved" | "rejected" | "sent"): Promise<Application> {
    const existing = await prisma.application.findFirst({ where: { id, userId } });
    if (!existing) throw new Error("Application not found");
    return prisma.application.update({ where: { id }, data: { status } }) as unknown as Promise<Application>;
  },
  async createAIRun(userId: string, input: { type: string; status: string }): Promise<void> {
    await prisma.aIRun.create({ data: { userId, type: input.type, status: input.status } });
  },
  async getCvSummary(userId: string): Promise<string | null> {
    const profile = await prisma.cvProfile.findUnique({ where: { userId } });
    return profile?.summary || profile?.rawText || null;
  }
};

app.get("/health", (_req, res) => {
  res.json({ ok: true });
});

app.use(authenticateRequest);

app.get("/subscription", async (req, res) => {
  const userId = req.user!.id;
  const now = new Date();
  const monthStart = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1));

  const usedApplications = await prisma.application.count({
    where: { userId, createdAt: { gte: monthStart } }
  });

  const user = await prisma.user.findUnique({ where: { id: userId } });

  res.json({
    plan: user?.plan || "free",
    usedApplications,
    monthlyLimit: user?.plan === "free" ? 10 : null,
    subscriptionStatus: user?.subscriptionStatus || "inactive"
  });
});

app.post("/stripe/checkout", async (req, res) => {
  const schema = z.object({ plan: z.enum(["pro", "premium"]) });
  const parsed = schema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "Invalid plan" });
    return;
  }

  const userId = req.user!.id;
  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }

  const selectedPlan = parsed.data.plan;
  const priceId = selectedPlan === "pro" ? process.env.STRIPE_PRICE_PRO : process.env.STRIPE_PRICE_PREMIUM;
  if (!priceId) {
    res.status(500).json({ error: "Missing Stripe price configuration" });
    return;
  }

  const session = await stripe.checkout.sessions.create({
    mode: "subscription",
    customer: user.stripeCustomerId || undefined,
    customer_email: user.stripeCustomerId ? undefined : user.email,
    line_items: [{ price: priceId, quantity: 1 }],
    success_url: `${process.env.WEB_ORIGIN || "http://localhost:3000"}/dashboard?billing=success`,
    cancel_url: `${process.env.WEB_ORIGIN || "http://localhost:3000"}/dashboard?billing=cancel`,
    client_reference_id: user.id,
    metadata: { plan: selectedPlan }
  });

  if (typeof session.customer === "string" && !user.stripeCustomerId) {
    await prisma.user.update({ where: { id: userId }, data: { stripeCustomerId: session.customer } });
  }

  res.json({ url: session.url });
});

app.post("/stripe/portal", async (req, res) => {
  const user = await prisma.user.findUnique({ where: { id: req.user!.id } });
  if (!user?.stripeCustomerId) {
    res.status(400).json({ error: "No billing customer found" });
    return;
  }

  const session = await stripe.billingPortal.sessions.create({
    customer: user.stripeCustomerId,
    return_url: `${process.env.WEB_ORIGIN || "http://localhost:3000"}/dashboard`
  });

  res.json({ url: session.url });
});

app.get("/jobs", async (req, res) => {
  const jobs = await prisma.job.findMany({ where: { userId: req.user!.id }, orderBy: { createdAt: "desc" } });
  res.json(jobs);
});

app.post("/jobs/search", validateSubscription("pro"), async (req, res) => {
  const schema = z.object({
    keywords: z.string().min(1),
    location: z.string().optional(),
    limitPerSource: z.number().int().min(1).max(20).optional()
  });
  const parsed = schema.safeParse(req.body);

  if (!parsed.success) {
    res.status(400).json({ error: "Invalid search payload" });
    return;
  }

  const userId = req.user!.id;

  try {
    const jobs = await searchQueue.enqueue(() =>
      scrapeMatchAndStoreJobs(
        userId,
        {
          keywords: parsed.data.keywords,
          location: parsed.data.location,
          limitPerSource: parsed.data.limitPerSource ?? 5
        },
        store
      )
    );
    res.json({ jobs });
  } catch (error: any) {
    res.status(500).json({ error: error?.message || "job search failed" });
  }
});

app.get("/applications", async (req, res) => {
  const applications = await prisma.application.findMany({
    where: { userId: req.user!.id },
    orderBy: { createdAt: "desc" }
  });
  res.json(applications);
});

app.post("/applications/apply", async (req, res) => {
  const schema = z.object({ jobId: z.string().min(1), email: z.string().email() });
  const parsed = schema.safeParse(req.body);

  if (!parsed.success) {
    res.status(400).json({ error: "jobId and valid email are required" });
    return;
  }

  const userId = req.user!.id;
  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }

  if (user.plan === "free") {
    const now = new Date();
    const monthStart = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1));
    const monthlyCount = await prisma.application.count({ where: { userId, createdAt: { gte: monthStart } } });
    if (monthlyCount >= 10) {
      res.status(403).json({ error: "Free plan limit reached", monthlyLimit: 10 });
      return;
    }
  }

  const job = await prisma.job.findFirst({ where: { id: parsed.data.jobId, userId } });
  if (!job) {
    res.status(404).json({ error: "Job not found" });
    return;
  }

  try {
    const application = await applicationQueue.enqueue(() =>
      createPendingApplication(userId, {
        company: job.company,
        title: job.title,
        email: parsed.data.email,
        jobDescription: `Application for ${job.title} at ${job.company}. Source: ${job.source}. URL: ${job.url}`,
        store
      })
    );


    res.status(201).json(application);
  } catch (error: any) {
    res.status(500).json({ error: error?.message || "application pipeline failed" });
  }
});

app.get("/applications/:id/preview", async (req, res) => {
  const userId = req.user!.id;
  const application = await prisma.application.findFirst({ where: { id: req.params.id, userId } });
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
    const userId = req.user!.id;
    const application = await applicationQueue.enqueue(() => approveAndSendApplication(userId, req.params.id, store));
    res.json(application);
  } catch (error: any) {
    res.status(400).json({ error: error?.message || "approval failed" });
  }
});

app.post("/applications/:id/reject", async (req, res) => {
  try {
    const userId = req.user!.id;
    const current = await prisma.application.findFirst({ where: { id: req.params.id, userId } });
    if (!current) {
      res.status(404).json({ error: "Application not found" });
      return;
    }

    if (current.status === "sent") {
      res.status(400).json({ error: "Cannot reject sent application" });
      return;
    }

    const updated = await prisma.application.update({ where: { id: req.params.id }, data: { status: "rejected" } });
    res.json(updated);
  } catch (error: any) {
    res.status(400).json({ error: error?.message || "rejection failed" });
  }
});

const port = Number(process.env.API_PORT || 4000);
server.listen(port, () => {
  console.log(`API running on http://localhost:${port}`);
});
