import type { NextFunction, Request, Response } from "express";
import { decode } from "next-auth/jwt";
import { prisma } from "../lib/prisma.js";

export async function requireAuth(req: Request, res: Response, next: NextFunction): Promise<void> {
  const authorization = req.headers.authorization;
  if (!authorization || !authorization.startsWith("Bearer ")) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }

  const token = authorization.slice("Bearer ".length).trim();
  if (!token || !process.env.NEXTAUTH_SECRET) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }

  let decoded;
  try {
    decoded = await decode({ token, secret: process.env.NEXTAUTH_SECRET });
  } catch {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }
  if (!decoded?.sub) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }

  const user = await prisma.user.findUnique({ where: { id: decoded.sub }, select: { id: true, email: true, plan: true } });
  if (!user) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }

  req.user = { id: user.id, email: user.email, plan: user.plan };
  next();
}
