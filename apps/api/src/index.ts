import "dotenv/config";
import express from "express";
import http from "node:http";
import path from "node:path";
import fs from "node:fs/promises";
import { Server } from "socket.io";
import type Stripe from "stripe";
import multer from "multer";
import sharp from "sharp";
import bcrypt from "bcryptjs";
import {
  buildEmailHtml,
  type CoverLetterContent,
  createPendingApplication,
  readCV,
  scrapeMatchAndStoreJobs,
  type Application
} from "@job-agent/core";
import { z } from "zod";
import { prisma } from "./lib/prisma.js";
import { stripe, stripeEnabled, resolvePlanFromPriceId, STRIPE_PRICE_PREMIUM, STRIPE_PRICE_PRO } from "./lib/stripe.js";
import { TaskQueue } from "./lib/queue.js";
import { basicRateLimit } from "./middleware/rateLimit.js";
import { requireAuth } from "./middleware/auth.js";
import { requireGmail } from "./middleware/requireGmail.js";
import { requirePlan } from "./middleware/subscription.js";
import { gmailRouter } from "./modules/gmail/gmail.routes.js";
import { logger } from "./lib/logger.js";
import "./workers/email.worker.js";

const AUTO_APPLY_MIN_SCORE = 70;
const AUTO_APPLY_LIMIT = 3;
const AUTO_APPLY_DELAY_RANGE_MS = { min: 2000, max: 5000 };
const FREE_PLAN_MONTHLY_LIMIT = 10;
const PLAN_PRICE_MAP: Record<"pro" | "premium", string> = {
  pro: STRIPE_PRICE_PRO,
  premium: STRIPE_PRICE_PREMIUM
};

type AutoAppliedJob = { title: string; company: string; url: string; score: number; applicationId: string };
type AutoApplySkippedJob = { title: string; company: string; url: string; score: number; reason: string };

const jobSearchSchema = z.object({
  keywords: z.string().min(1),
  location: z.string().optional(),
  limitPerSource: z.number().int().min(1).max(20).optional()
});

const updateProfileSchema = z.object({
  name: z.string().min(1).max(100).optional(),
  phone: z.string().max(30).optional(),
  location: z.string().max(100).optional()
});

const changePasswordSchema = z.object({
  currentPassword: z.string().min(1),
  newPassword: z.string().min(8).max(128)
});

const envSchema = z.object({
  NODE_ENV: z.string().optional(),
  API_PORT: z.string().optional(),
  WEB_ORIGIN: z.string().min(1),
  DATABASE_URL: z.string().min(1),
  NEXTAUTH_SECRET: z.string().min(1),
  GROQ_API_KEY: z.string().optional(),
  REDIS_URL: z.string().min(1),
  TOKEN_ENCRYPTION_SECRET: z.string().min(32),
  GOOGLE_CLIENT_ID: z.string().min(1),
  GOOGLE_CLIENT_SECRET: z.string().min(1),
  GOOGLE_REDIRECT_URI: z.string().url(),
  LOG_LEVEL: z.string().optional(),
  STRIPE_SECRET_KEY: z.string().optional(),
  STRIPE_WEBHOOK_SECRET: z.string().optional(),
  STRIPE_PRO_PRICE_ID: z.string().optional(),
  STRIPE_PREMIUM_PRICE_ID: z.string().optional()
}).superRefine((values, ctx) => {
  const stripeConfigured =
    Boolean(values.STRIPE_SECRET_KEY) ||
    Boolean(values.STRIPE_WEBHOOK_SECRET) ||
    Boolean(values.STRIPE_PRO_PRICE_ID) ||
    Boolean(values.STRIPE_PREMIUM_PRICE_ID);
  const stripeRequired = values.NODE_ENV === "production" || stripeConfigured;

  if (!stripeRequired) return;

  if (!values.STRIPE_SECRET_KEY) {
    ctx.addIssue({ code: "custom", path: ["STRIPE_SECRET_KEY"], message: "STRIPE_SECRET_KEY is required when Stripe is enabled" });
  }
  if (!values.STRIPE_WEBHOOK_SECRET) {
    ctx.addIssue({ code: "custom", path: ["STRIPE_WEBHOOK_SECRET"], message: "STRIPE_WEBHOOK_SECRET is required when Stripe is enabled" });
  } else if (!values.STRIPE_WEBHOOK_SECRET.startsWith("whsec_") && !values.STRIPE_WEBHOOK_SECRET.startsWith("we_")) {
    ctx.addIssue({ code: "custom", path: ["STRIPE_WEBHOOK_SECRET"], message: "STRIPE_WEBHOOK_SECRET must start with whsec_ or we_" });
  }
  if (!values.STRIPE_PRO_PRICE_ID) {
    ctx.addIssue({ code: "custom", path: ["STRIPE_PRO_PRICE_ID"], message: "STRIPE_PRO_PRICE_ID is required when Stripe is enabled" });
  } else if (!values.STRIPE_PRO_PRICE_ID.startsWith("price_")) {
    ctx.addIssue({ code: "custom", path: ["STRIPE_PRO_PRICE_ID"], message: "STRIPE_PRO_PRICE_ID must start with price_" });
  }
  if (!values.STRIPE_PREMIUM_PRICE_ID) {
    ctx.addIssue({ code: "custom", path: ["STRIPE_PREMIUM_PRICE_ID"], message: "STRIPE_PREMIUM_PRICE_ID is required when Stripe is enabled" });
  } else if (!values.STRIPE_PREMIUM_PRICE_ID.startsWith("price_")) {
    ctx.addIssue({ code: "custom", path: ["STRIPE_PREMIUM_PRICE_ID"], message: "STRIPE_PREMIUM_PRICE_ID must start with price_" });
  }
});
const env = envSchema.parse(process.env);

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: { origin: process.env.WEB_ORIGIN || "http://localhost:3000", credentials: true }
});

const searchQueue = new TaskQueue(2);
const applicationQueue = new TaskQueue(2);

const avatarUpload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    const allowed = ["image/jpeg", "image/png", "image/webp"];
    cb(null, allowed.includes(file.mimetype));
  }
});

const cvUpload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    cb(null, file.mimetype === "application/pdf");
  }
});

function resolveUploadPath(storedPath: string): string {
  return path.join(process.cwd(), storedPath.replace(/^\/+/, ""));
}

function randomInt(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

async function delay(ms: number): Promise<void> {
  await new Promise((resolve) => setTimeout(resolve, ms));
}

function startOfCurrentMonthUtc(): Date {
  const now = new Date();
  return new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1, 0, 0, 0, 0));
}

function startOfNextMonthUtc(monthStart: Date): Date {
  return new Date(Date.UTC(monthStart.getUTCFullYear(), monthStart.getUTCMonth() + 1, 1, 0, 0, 0, 0));
}

function getFirstParam(value: string | string[] | undefined): string | null {
  if (typeof value === "string" && value.length > 0) return value;
  if (Array.isArray(value) && value.length > 0) return value[0] || null;
  return null;
}

function parseCoverLetterContent(serialized: string, fallbackTitle: string, fallbackCompany: string): CoverLetterContent {
  try {
    const parsed = JSON.parse(serialized) as Partial<CoverLetterContent>;
    if (
      typeof parsed.subject === "string" &&
      typeof parsed.opening === "string" &&
      typeof parsed.body === "string" &&
      typeof parsed.closing === "string"
    ) {
      return {
        subject: parsed.subject,
        opening: parsed.opening,
        body: parsed.body,
        closing: parsed.closing
      };
    }
  } catch {
    // fallback below
  }

  return {
    subject: `Application for ${fallbackTitle} — Haytham Brahem`,
    opening: `Dear Hiring Manager at ${fallbackCompany},`,
    body: serialized,
    closing: "Thank you for your time and consideration."
  };
}

app.use((req, res, next) => {
  res.setHeader("Access-Control-Allow-Origin", process.env.WEB_ORIGIN || "http://localhost:3000");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization");
  res.setHeader("Access-Control-Allow-Methods", "GET,POST,PATCH,DELETE,OPTIONS");
  res.setHeader("Access-Control-Allow-Credentials", "true");
  if (req.method === "OPTIONS") {
    res.status(204).end();
    return;
  }
  next();
});

const stripeWebhookHandler: express.RequestHandler = async (req, res) => {
  const signatureHeader = req.headers["stripe-signature"];
  const signature = typeof signatureHeader === "string" ? signatureHeader : null;
  const webhookSecret = env.STRIPE_WEBHOOK_SECRET;
  if (!signature || !stripe || !webhookSecret) {
    logger.error({ hasSignature: Boolean(signature), hasStripe: Boolean(stripe), hasWebhookSecret: Boolean(webhookSecret) }, "Stripe webhook missing signature or Stripe client");
    res.status(400).json({ error: "Missing webhook configuration" });
    return;
  }

  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(req.body as Buffer, signature, webhookSecret);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    logger.error({ message }, "Stripe webhook signature verification failed");
    res.status(400).json({ error: `Webhook signature invalid: ${message}` });
    return;
  }

  logger.info({ eventType: event.type, eventId: event.id }, "Stripe webhook event received");
  res.status(200).json({ received: true });

  void (async () => {
    try {
      if (event.type === "checkout.session.completed") {
        await handleCheckoutCompleted(event.data.object as Stripe.Checkout.Session);
      }

      if (event.type === "customer.subscription.deleted") {
        await handleSubscriptionCancelled(event.data.object as Stripe.Subscription);
      }

      if (event.type === "customer.subscription.created" || event.type === "customer.subscription.updated") {
        const subscription = event.data.object as Stripe.Subscription;
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
          logger.info({ eventType: event.type, customerId, status, plan }, "Stripe subscription updated");
        }
      }
    } catch (error) {
      logger.error({ eventType: event.type, error }, "Stripe webhook handler error");
    }
  })();
};

async function handleCheckoutCompleted(session: Stripe.Checkout.Session): Promise<void> {
  const userId = session.metadata?.userId;
  const plan = session.metadata?.plan;

  if (!userId) {
    logger.error({ sessionId: session.id }, "Stripe checkout.session.completed missing metadata.userId");
    return;
  }

  if (plan !== "pro" && plan !== "premium") {
    logger.error({ sessionId: session.id, plan }, "Stripe checkout.session.completed invalid metadata.plan");
    return;
  }

  const existingUser = await prisma.user.findUnique({
    where: { id: userId },
    select: { stripeCustomerId: true, stripeSubscriptionId: true }
  });
  if (!existingUser) {
    logger.error({ userId }, "Stripe checkout user not found");
    return;
  }

  const stripeCustomerId = typeof session.customer === "string" ? session.customer : existingUser.stripeCustomerId;
  const stripeSubscriptionId = typeof session.subscription === "string" ? session.subscription : existingUser.stripeSubscriptionId;

  await prisma.user.update({
    where: { id: userId },
    data: {
      plan,
      subscriptionStatus: "active",
      stripeCustomerId,
      stripeSubscriptionId
    }
  });

  logger.info({ userId, plan }, "Stripe user upgraded");
}

async function handleSubscriptionCancelled(subscription: Stripe.Subscription): Promise<void> {
  const userId = subscription.metadata?.userId;
  if (!userId) {
    logger.warn({ subscriptionId: subscription.id }, "Stripe customer.subscription.deleted missing metadata.userId");
    return;
  }

  const existingUser = await prisma.user.findUnique({ where: { id: userId }, select: { id: true } });
  if (!existingUser) {
    logger.error({ userId }, "Stripe subscription cancellation user not found");
    return;
  }

  await prisma.user.update({
    where: { id: userId },
    data: {
      plan: "free",
      subscriptionStatus: "canceled"
    }
  });

  logger.info({ userId }, "Stripe subscription canceled");
}

app.post("/api/stripe/webhook", express.raw({ type: "application/json" }), stripeWebhookHandler);
app.post("/stripe/webhook", express.raw({ type: "application/json" }), stripeWebhookHandler);

app.use(express.json({ limit: "200kb" }));
app.use(basicRateLimit);
app.use("/uploads", express.static(path.join(process.cwd(), "uploads")));
app.use("/gmail", gmailRouter);

const store = {
  async saveJobs(userId: string, jobs: Array<{ title: string; company: string; url: string; source: string; applyEmail?: string | null }>): Promise<void> {
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
  async updateApplicationStatus(userId: string, id: string, status: "pending" | "approved" | "rejected" | "sent"): Promise<Application> {
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

app.get("/health", (_req, res) => {
  res.json({ ok: true });
});

app.use(requireAuth);
app.use((req, _res, next) => {
  const user = req.user?.id || "anonymous";
  logger.info({ method: req.method, path: req.path, user, timestamp: new Date().toISOString() }, "Incoming request");
  next();
});

app.get("/profile", async (req, res) => {
  const userId = req.user?.id;
  if (!userId) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      id: true,
      name: true,
      email: true,
      image: true,
      phone: true,
      location: true,
      plan: true,
      subscriptionStatus: true,
      cvPath: true,
      cvOriginalName: true,
      cvUploadedAt: true,
      createdAt: true
    }
  });

  if (!user) {
    res.status(404).json({ error: "User not found" });
    return;
  }

  res.json(user);
});

app.patch("/profile", async (req, res) => {
  const userId = req.user?.id;
  if (!userId) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }

  const body = updateProfileSchema.safeParse(req.body);
  if (!body.success) {
    res.status(400).json({ error: body.error.flatten() });
    return;
  }

  const updated = await prisma.user.update({
    where: { id: userId },
    data: body.data,
    select: { id: true, name: true, phone: true, location: true }
  });

  res.json(updated);
});

app.post("/profile/avatar", basicRateLimit, avatarUpload.single("avatar"), async (req, res) => {
  const userId = req.user?.id;
  if (!userId) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }

  if (!req.file) {
    res.status(400).json({ error: "No image file provided" });
    return;
  }

  const filename = `${userId}.webp`;
  const outputPath = path.join(process.cwd(), "uploads", "avatars", filename);

  await sharp(req.file.buffer)
    .resize(256, 256, { fit: "cover", position: "center" })
    .webp({ quality: 85 })
    .toFile(outputPath);

  const imageUrl = `/uploads/avatars/${filename}?t=${Date.now()}`;

  await prisma.user.update({
    where: { id: userId },
    data: { image: imageUrl }
  });

  res.json({ image: imageUrl });
});

app.post("/profile/cv", basicRateLimit, cvUpload.single("cv"), async (req, res) => {
  const userId = req.user?.id;
  if (!userId) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }

  if (!req.file) {
    res.status(400).json({ error: "No PDF file provided" });
    return;
  }

  const filename = `${userId}.pdf`;
  const outputPath = path.join(process.cwd(), "uploads", "cvs", filename);

  await fs.writeFile(outputPath, req.file.buffer);

  const cvPath = `/uploads/cvs/${filename}`;
  const now = new Date();

  await prisma.user.update({
    where: { id: userId },
    data: {
      cvPath,
      cvOriginalName: req.file.originalname,
      cvUploadedAt: now
    }
  });

  try {
    const text = await readCV(outputPath);
    await prisma.cvProfile.upsert({
      where: { userId },
      create: { userId, rawText: text },
      update: { rawText: text }
    });
  } catch (error) {
    logger.error({ userId, error }, "CV text extraction failed");
  }

  res.json({ cvPath, cvOriginalName: req.file.originalname, cvUploadedAt: now });
});

app.delete("/profile/cv", async (req, res) => {
  const userId = req.user?.id;
  if (!userId) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { cvPath: true }
  });

  if (user?.cvPath) {
    const filePath = resolveUploadPath(user.cvPath);
    await fs.unlink(filePath).catch(() => undefined);
  }

  await prisma.user.update({
    where: { id: userId },
    data: { cvPath: null, cvOriginalName: null, cvUploadedAt: null }
  });

  await prisma.cvProfile.deleteMany({ where: { userId } });

  res.json({ success: true });
});

app.patch("/profile/password", async (req, res) => {
  const userId = req.user?.id;
  if (!userId) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }

  const body = changePasswordSchema.safeParse(req.body);
  if (!body.success) {
    res.status(400).json({ error: body.error.flatten() });
    return;
  }

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { password: true }
  });

  if (!user?.password) {
    res.status(400).json({ error: "No password set on this account" });
    return;
  }

  const valid = await bcrypt.compare(body.data.currentPassword, user.password);
  if (!valid) {
    res.status(401).json({ error: "Current password is incorrect" });
    return;
  }

  const hashed = await bcrypt.hash(body.data.newPassword, 12);

  await prisma.user.update({
    where: { id: userId },
    data: { password: hashed }
  });

  logger.info({ userId }, "Profile password changed");
  res.json({ success: true });
});

app.get("/subscription", async (req, res) => {
  const userId = req.user?.id;
  if (!userId) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }
  const monthStart = startOfCurrentMonthUtc();
  const nextMonthStart = startOfNextMonthUtc(monthStart);

  const usedApplications = await prisma.application.count({
    where: { userId, createdAt: { gte: monthStart, lt: nextMonthStart } }
  });

  const user = await prisma.user.findUnique({ where: { id: userId } });
  const plan = user?.plan || "free";

  res.json({
    plan,
    usedApplications,
    monthlyLimit: plan === "free" ? FREE_PLAN_MONTHLY_LIMIT : null,
    subscriptionStatus: user?.subscriptionStatus || "inactive"
  });
});

app.post("/stripe/checkout", async (req, res) => {
  if (!stripeEnabled) {
    res.status(503).json({ error: "Stripe disabled in development" });
    return;
  }

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
  const priceId = PLAN_PRICE_MAP[selectedPlan];
  if (!priceId || !stripe) {
    res.status(503).json({ error: "Stripe billing not configured or invalid plan selected." });
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
    metadata: { userId: user.id, plan: selectedPlan },
    subscription_data: {
      metadata: { userId: user.id, plan: selectedPlan }
    }
  });

  if (typeof session.customer === "string" && !user.stripeCustomerId) {
    await prisma.user.update({ where: { id: userId }, data: { stripeCustomerId: session.customer } });
  }

  res.json({ url: session.url });
});

app.post("/stripe/portal", async (req, res) => {
  if (!stripeEnabled || !stripe) {
    res.status(503).json({ error: "Stripe disabled in development" });
    return;
  }

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

app.post("/jobs/search", requirePlan("pro"), requireGmail, async (req, res) => {
  const parsed = jobSearchSchema.safeParse(req.body);

  if (!parsed.success) {
    res.status(400).json({ error: "Invalid search payload" });
    return;
  }

  const userId = req.user!.id;
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { cvPath: true }
  });

  if (!user?.cvPath) {
    res.status(400).json({
      error: "NO_CV_UPLOADED",
      message: "Please upload your CV in your profile before searching for jobs."
    });
    return;
  }

  try {
    const jobs = await searchQueue.enqueue(() =>
      scrapeMatchAndStoreJobs({
        userId,
        input: {
          keywords: parsed.data.keywords,
          location: parsed.data.location,
          limitPerSource: parsed.data.limitPerSource ?? 5
        },
        store,
        minScore: AUTO_APPLY_MIN_SCORE
      })
    );
    res.json({ jobs });
  } catch (error: any) {
    res.status(500).json({ error: error?.message || "job search failed" });
  }
});

app.post("/jobs/auto-apply", requirePlan("premium"), requireGmail, async (req, res) => {
  const parsed = jobSearchSchema.safeParse(req.body);

  if (!parsed.success) {
    res.status(400).json({ error: "Invalid auto-apply payload" });
    return;
  }

  const userId = req.user!.id;
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { cvPath: true }
  });

  if (!user?.cvPath) {
    res.status(400).json({
      error: "NO_CV_UPLOADED",
      message: "Please upload your CV in your profile before searching for jobs."
    });
    return;
  }

  try {
    const result = await searchQueue.enqueue(async () => {
      logger.info({ userId, keywords: parsed.data.keywords }, "Auto-apply started");
      const rankedJobs = await scrapeMatchAndStoreJobs({
        userId,
        input: {
          keywords: parsed.data.keywords,
          location: parsed.data.location,
          limitPerSource: parsed.data.limitPerSource ?? 5
        },
        store,
        minScore: AUTO_APPLY_MIN_SCORE
      });
      logger.info({ userId, rankedJobs: rankedJobs.length }, "Auto-apply ranked jobs");

      const candidates = rankedJobs.filter((job) => job.score >= AUTO_APPLY_MIN_SCORE).slice(0, AUTO_APPLY_LIMIT);
      logger.info({ userId, selectedJobs: candidates.length }, "Auto-apply selected jobs");

      const applied: AutoAppliedJob[] = [];
      const skipped: AutoApplySkippedJob[] = [];

      for (let index = 0; index < candidates.length; index += 1) {
        const job = candidates[index];
        if (!job) continue;
        logger.info({ userId, index: index + 1, total: candidates.length, title: job.title, score: job.score }, "Auto-apply attempting job");

        if (!job.applyEmail) {
          logger.info({ userId, title: job.title }, "Auto-apply skipped missing recipient email");
          skipped.push({ title: job.title, company: job.company, url: job.url, score: job.score, reason: "missing_apply_email" });
          continue;
        }

        try {
          const sent = await applicationQueue.enqueue(async () => {
            const application = await createPendingApplication(userId, {
              company: job.company,
              title: job.title,
              recipientEmail: job.applyEmail,
              jobDescription: job.description,
              store
            });
            const coverLetter = parseCoverLetterContent(application.coverLetter, application.title, application.company);
            await prisma.application.update({
              where: { id_userId: { id: application.id, userId } },
              data: { status: "approved" }
            });
            const { emailQueue } = await import("./queues/email.queue.js");
            await emailQueue.add("application-email", {
              userId,
              type: "application",
              to: application.email ?? job.applyEmail,
              subject: coverLetter.subject,
              htmlBody: buildEmailHtml(coverLetter),
              applicationId: application.id,
              cvPath: user.cvPath ?? undefined
            });
            return prisma.application.findFirstOrThrow({
              where: { id: application.id, userId }
            });
          });
          applied.push({ title: job.title, company: job.company, url: job.url, score: job.score, applicationId: sent.id });
          logger.info({ userId, applicationId: sent.id, title: job.title }, "Auto-apply queued application");
        } catch (error: any) {
          logger.error({ userId, title: job.title, error: error?.message || "unknown" }, "Auto-apply failed");
          skipped.push({ title: job.title, company: job.company, url: job.url, score: job.score, reason: "apply_failed" });
        }

        if (index < candidates.length - 1) {
          const delayMs = randomInt(AUTO_APPLY_DELAY_RANGE_MS.min, AUTO_APPLY_DELAY_RANGE_MS.max);
          logger.info({ userId, delayMs }, "Auto-apply waiting before next application");
          await delay(delayMs);
        }
      }

      logger.info({ userId, applied: applied.length, skipped: skipped.length }, "Auto-apply completed");
      return { rankedJobs, applied, skipped };
    });

    res.json(result);
  } catch (error: any) {
    res.status(500).json({ error: error?.message || "auto-apply failed" });
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
  const schema = z.object({ jobId: z.string().min(1), email: z.string().email().optional() });
  const parsed = schema.safeParse(req.body);

  if (!parsed.success) {
    res.status(400).json({ error: "jobId must be a non-empty string and email must be valid when provided" });
    return;
  }

  const userId = req.user?.id;
  if (!userId) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }
  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }

  const plan = user.plan ?? "free";

  if (plan === "free") {
    const monthStart = startOfCurrentMonthUtc();
    const resetAt = startOfNextMonthUtc(monthStart);
    let monthlyCount = 0;
    try {
      monthlyCount = (await prisma.application.count({
        where: { userId, createdAt: { gte: monthStart, lt: resetAt } }
      })) ?? 0;
    } catch (error) {
      monthlyCount = 0;
      logger.error({ userId, error }, "Applications usage count failed");
    }

    if (monthlyCount >= FREE_PLAN_MONTHLY_LIMIT) {
      logger.info({ userId, monthlyCount }, "Applications free-plan limit reached");
      res.status(403).json({
        error: `Free plan limit reached (${FREE_PLAN_MONTHLY_LIMIT} applications/month). Upgrade required.`,
        code: "FREE_LIMIT_REACHED",
        used: monthlyCount,
        limit: FREE_PLAN_MONTHLY_LIMIT,
        resetsAt: resetAt.toISOString()
      });
      return;
    }
  }

  const job = await prisma.job.findFirst({ where: { id: parsed.data.jobId, userId } });
  if (!job) {
    res.status(404).json({ error: "Job not found" });
    return;
  }

  const recipientEmail = parsed.data.email?.trim() || job.applyEmail || null;

  if (!recipientEmail) {
    res.status(422).json({ error: "NO_RECIPIENT_EMAIL", jobTitle: job.title });
    return;
  }

  const trimmedEmail = parsed.data.email?.trim();

  if (trimmedEmail && trimmedEmail !== job.applyEmail) {
    await prisma.job.update({
      where: { userId_url: { userId, url: job.url } },
      data: { applyEmail: trimmedEmail }
    }).catch(() => undefined);
  }

  try {
    const application = await applicationQueue.enqueue(() =>
      createPendingApplication(userId, {
        company: job.company,
        title: job.title,
        recipientEmail,
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
  const applicationId = getFirstParam(req.params.id);
  if (!applicationId) {
    res.status(400).json({ error: "Invalid application id" });
    return;
  }
  const application = await prisma.application.findFirst({ where: { id: applicationId, userId } });
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

app.post("/applications/:id/approve", requirePlan("pro"), requireGmail, async (req, res) => {
  const userId = req.user!.id;
  const applicationId = getFirstParam(req.params.id);
  if (!applicationId) {
    res.status(400).json({ error: "Invalid application id" });
    return;
  }
  let current: { id: string; title: string; company: string; email: string | null; coverLetter: string } | null = null;
  try {
    current = await prisma.application.findFirst({
      where: { id: applicationId, userId },
      select: { id: true, title: true, company: true, email: true, coverLetter: true }
    });
    if (!current) {
      res.status(404).json({ error: "Application not found" });
      return;
    }

    if (!current.email) {
      res.status(422).json({ error: "NO_RECIPIENT_EMAIL", jobTitle: current.title });
      return;
    }

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { cvPath: true }
    });
    const coverLetter = parseCoverLetterContent(current.coverLetter, current.title, current.company);

    await prisma.application.update({
      where: { id_userId: { id: applicationId, userId } },
      data: { status: "approved" }
    });

    const { emailQueue } = await import("./queues/email.queue.js");
    await emailQueue.add("application-email", {
      userId,
      type: "application",
      to: current.email,
      subject: coverLetter.subject,
      htmlBody: buildEmailHtml(coverLetter),
      applicationId: current.id,
      cvPath: user?.cvPath ?? undefined
    });

    const updated = await prisma.application.findFirst({
      where: { id: applicationId, userId }
    });

    res.json({ status: "queued", application: updated });
  } catch (error: any) {
    if (error?.message === "NO_RECIPIENT_EMAIL") {
      res.status(422).json({ error: "NO_RECIPIENT_EMAIL", jobTitle: current?.title || "Unknown role" });
      return;
    }
    res.status(400).json({ error: error?.message || "approval failed" });
  }
});

app.post("/applications/:id/reject", requirePlan("pro"), async (req, res) => {
  try {
    const userId = req.user!.id;
    const applicationId = getFirstParam(req.params.id);
    if (!applicationId) {
      res.status(400).json({ error: "Invalid application id" });
      return;
    }
    const current = await prisma.application.findFirst({ where: { id: applicationId, userId } });
    if (!current) {
      res.status(404).json({ error: "Application not found" });
      return;
    }

    if (current.status === "sent") {
      res.status(400).json({ error: "Cannot reject sent application" });
      return;
    }

    const updated = await prisma.application.update({
      where: { id_userId: { id: applicationId, userId } },
      data: { status: "rejected" }
    });
    res.json(updated);
  } catch (error: any) {
    res.status(400).json({ error: error?.message || "rejection failed" });
  }
});


app.use((_req, res) => {
  res.status(404).json({ error: "Not found" });
});

app.use((error: unknown, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  const message = error instanceof Error ? error.message : "Internal server error";
  res.status(500).json({ error: message });
});

const port = Number(process.env.API_PORT || 4000);
server.listen(port, () => {
  logger.info({ port }, "API server started");
});
