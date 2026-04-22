import type { RequestHandler } from "express";
import { prisma } from "../lib/prisma.js";

export const requireGmail: RequestHandler = async (req, res, next) => {
  const userId = req.user?.id;
  if (!userId) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }

  const account = await prisma.connectedAccount.findUnique({
    where: {
      userId_provider: { userId, provider: "gmail" }
    },
    select: { id: true }
  });

  if (!account) {
    res.status(400).json({
      error: "GMAIL_NOT_CONNECTED",
      message: "Please connect your Gmail account in Profile before applying.",
      connectUrl: "/gmail/connect"
    });
    return;
  }

  next();
};
