import type { NextFunction, Request, Response } from "express";
import { getToken } from "next-auth/jwt";
import { prisma } from "../lib/prisma.js";

export async function authenticateRequest(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const token = await getToken({ req: req as any, secret: process.env.NEXTAUTH_SECRET });
    const subject = token?.sub;

    if (!subject) {
      res.status(401).json({ error: "Unauthorized" });
      return;
    }

    const user = await prisma.user.findUnique({ where: { id: subject } });
    if (!user) {
      res.status(401).json({ error: "Unauthorized" });
      return;
    }

    req.user = { id: user.id, email: user.email, plan: user.plan };
    next();
  } catch {
    res.status(401).json({ error: "Unauthorized" });
  }
}
