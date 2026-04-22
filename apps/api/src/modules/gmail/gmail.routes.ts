import { Router } from "express";
import { prisma } from "../../lib/prisma.js";
import { logger } from "../../lib/logger.js";
import { requireAuth } from "../../middleware/auth.js";
import { GmailService } from "./gmail.service.js";

const router = Router();
const gmailService = new GmailService(prisma);

router.get("/connect", requireAuth, (req, res) => {
  const userId = req.user?.id;
  if (!userId) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }
  const url = gmailService.getAuthUrl(userId);
  if ((req.get("accept") || "").includes("application/json")) {
    res.json({ url });
    return;
  }
  res.redirect(url);
});

router.get("/callback", async (req, res) => {
  const { code, state: userId, error } = req.query;

  if (error) {
    res.redirect(`${process.env.WEB_ORIGIN}/profile?gmail=denied`);
    return;
  }

  if (!code || !userId || typeof code !== "string" || typeof userId !== "string") {
    res.status(400).json({ error: "Missing code or state" });
    return;
  }

  try {
    await gmailService.handleCallback(code, userId);
    res.redirect(`${process.env.WEB_ORIGIN}/profile?gmail=connected`);
  } catch (err) {
    logger.error({ error: err, userId }, "Gmail callback failed");
    res.redirect(`${process.env.WEB_ORIGIN}/profile?gmail=error`);
  }
});

router.get("/status", requireAuth, async (req, res) => {
  const userId = req.user?.id;
  if (!userId) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }
  const status = await gmailService.getStatus(userId);
  res.json(status);
});

router.delete("/disconnect", requireAuth, async (req, res) => {
  const userId = req.user?.id;
  if (!userId) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }
  await gmailService.disconnect(userId);
  res.json({ success: true });
});

router.post("/test", requireAuth, async (req, res) => {
  const userId = req.user?.id;
  if (!userId) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }

  const status = await gmailService.getStatus(userId);
  if (!status.connected || !status.email) {
    res.status(400).json({ error: "Gmail not connected" });
    return;
  }

  const { emailQueue } = await import("../../queues/email.queue.js");
  await emailQueue.add(
    "test-email",
    {
      userId,
      type: "test",
      to: status.email,
      subject: "JobAgent — Gmail connection test",
      htmlBody: "<p>Your Gmail is connected and working.</p>"
    },
    { attempts: 1 }
  );
  res.json({ message: "Test email queued successfully" });
});

export { router as gmailRouter };
