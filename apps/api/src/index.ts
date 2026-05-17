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
import compression from "compression";
import {
  buildEmailHtml,
  createPendingApplication,
  readCV
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
import { store } from "./lib/store.js";
import { parseCoverLetterContent } from "./lib/coverLetter.js";
import { scrapeQueue } from "./queues/scrape.queue.js";
import "./workers/email.worker.js";
import "./workers/scrape.worker.js";

const FREE_PLAN_MONTHLY_LIMIT = 10;
const DEFAULT_PAGE_SIZE = 50;
const MAX_PAGE_SIZE = 200;
const PLAN_PRICE_MAP: Record<"pro" | "premium", string> = {
  pro: STRIPE_PRICE_PRO,
  premium: STRIPE_PRICE_PREMIUM
};

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
  EMAIL_WORKER_CONCURRENCY: z.string().optional(),
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

function parsePagination(query: Record<string, unknown>) {
  const pageParam = getFirstParam(query.page as string | string[] | undefined);
  const pageSizeParam =
    getFirstParam(query.pageSize as string | string[] | undefined) ||
    getFirstParam(query.limit as string | string[] | undefined);

  const pageNumber = pageParam ? Number(pageParam) : 1;
  const pageSizeNumber = pageSizeParam ? Number(pageSizeParam) : DEFAULT_PAGE_SIZE;

  const page = Number.isFinite(pageNumber) && pageNumber > 0 ? pageNumber : 1;
  const pageSize =
    Number.isFinite(pageSizeNumber) && pageSizeNumber > 0
      ? Math.min(pageSizeNumber, MAX_PAGE_SIZE)
      : DEFAULT_PAGE_SIZE;

  return {
    page,
    pageSize,
    skip: (page - 1) * pageSize,
    take: pageSize
  };
}

function getErrorMessage(error: unknown, fallback: string): string {
  return error instanceof Error ? error.message : fallback;
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

app.use(compression({ level: 6 }));
app.set("json spaces", 0);
app.use(express.json({ limit: "200kb" }));
app.use(basicRateLimit);
app.use("/uploads", express.static(path.join(process.cwd(), "uploads")));
app.use("/gmail", gmailRouter);

const PROFILE_SELECT = {
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
} as const;

async function getProfileSnapshot(userId: string) {
  return prisma.user.findUnique({
    where: { id: userId },
    select: PROFILE_SELECT
  });
}

async function getSubscriptionSnapshot(userId: string) {
  const monthStart = startOfCurrentMonthUtc();
  const nextMonthStart = startOfNextMonthUtc(monthStart);

  const [usedApplications, user] = await Promise.all([
    prisma.application.count({
      where: { userId, createdAt: { gte: monthStart, lt: nextMonthStart } }
    }),
    prisma.user.findUnique({ where: { id: userId } })
  ]);

  const plan = user?.plan || "free";

  return {
    plan,
    usedApplications,
    monthlyLimit: plan === "free" ? FREE_PLAN_MONTHLY_LIMIT : null,
    subscriptionStatus: user?.subscriptionStatus || "inactive"
  };
}

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

  const user = await getProfileSnapshot(userId);

  if (!user) {
    res.status(404).json({ error: "User not found" });
    return;
  }

  res.json(user);
});

app.get("/dashboard/overview", async (req, res) => {
  const userId = req.user?.id;
  if (!userId) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }

  const { skip, take } = parsePagination(req.query as Record<string, unknown>);

  const [profile, jobs, applications, subscription] = await Promise.all([
    getProfileSnapshot(userId),
    prisma.job.findMany({
      where: { userId },
      orderBy: { createdAt: "desc" },
      skip,
      take
    }),
    prisma.application.findMany({
      where: { userId },
      orderBy: { createdAt: "desc" },
      skip,
      take
    }),
    getSubscriptionSnapshot(userId)
  ]);

  if (!profile) {
    res.status(404).json({ error: "User not found" });
    return;
  }

  res.json({ profile, jobs, applications, subscription });
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
  const snapshot = await getSubscriptionSnapshot(userId);
  res.json(snapshot);
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
  const { skip, take } = parsePagination(req.query as Record<string, unknown>);
  const jobs = await prisma.job.findMany({
    where: { userId: req.user!.id },
    orderBy: { createdAt: "desc" },
    skip,
    take
  });
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
    const job = await scrapeQueue.add("job-search", {
      userId,
      type: "search",
      input: {
        keywords: parsed.data.keywords,
        location: parsed.data.location,
        limitPerSource: parsed.data.limitPerSource ?? 5
      }
    });
    res.status(202).json({ jobId: job.id });
  } catch (error: unknown) {
    res.status(500).json({ error: getErrorMessage(error, "job search failed") });
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
    const job = await scrapeQueue.add("job-auto-apply", {
      userId,
      type: "auto-apply",
      input: {
        keywords: parsed.data.keywords,
        location: parsed.data.location,
        limitPerSource: parsed.data.limitPerSource ?? 5
      }
    });
    res.status(202).json({ jobId: job.id });
  } catch (error: unknown) {
    res.status(500).json({ error: getErrorMessage(error, "auto-apply failed") });
  }
});

app.get("/scrape/status/:id", async (req, res) => {
  const jobId = getFirstParam(req.params.id);
  if (!jobId) {
    res.status(400).json({ error: "Invalid job id" });
    return;
  }

  const job = await scrapeQueue.getJob(jobId);
  if (!job) {
    res.status(404).json({ error: "Job not found" });
    return;
  }

  const status = await job.getState();
  res.json({
    id: job.id,
    status,
    type: job.data.type,
    result: status === "completed" ? job.returnvalue : undefined,
    error: status === "failed" ? job.failedReason : undefined
  });
});

app.get("/applications", async (req, res) => {
  const { skip, take } = parsePagination(req.query as Record<string, unknown>);
  const applications = await prisma.application.findMany({
    where: { userId: req.user!.id },
    orderBy: { createdAt: "desc" },
    skip,
    take
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
    const updatedCount = await prisma.job.updateMany({
      where: { id: parsed.data.jobId, userId },
      data: { applyEmail: trimmedEmail }
    }).catch(() => ({ count: 0 }));
    if (updatedCount.count === 0) {
      res.status(404).json({ error: "Job not found" });
      return;
    }
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
  } catch (error: unknown) {
    res.status(500).json({ error: getErrorMessage(error, "application pipeline failed") });
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

    res.json({ queueStatus: "queued", applicationStatus: updated?.status ?? "approved", application: updated });
  } catch (error: unknown) {
    if (error instanceof Error && error.message === "NO_RECIPIENT_EMAIL") {
      res.status(422).json({ error: "NO_RECIPIENT_EMAIL", jobTitle: current?.title || "Unknown role" });
      return;
    }
    res.status(400).json({ error: getErrorMessage(error, "approval failed") });
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
  } catch (error: unknown) {
    res.status(400).json({ error: getErrorMessage(error, "rejection failed") });
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
