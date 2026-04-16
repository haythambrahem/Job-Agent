import type { NextFunction, Request, Response } from "express";
import { decode } from "next-auth/jwt";
import type { JWT } from "next-auth/jwt";

const VALID_PLANS = ["free", "pro", "premium"] as const;
type ValidPlan = (typeof VALID_PLANS)[number];

function isValidPlan(value: unknown): value is ValidPlan {
  return typeof value === "string" && VALID_PLANS.includes(value as ValidPlan);
}

export async function authenticateRequest(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const authorization = req.headers.authorization;
    if (!authorization || !authorization.startsWith("Bearer ")) {
      res.status(401).json({ error: "Unauthorized" });
      return;
    }

    const bearerToken = authorization.slice("Bearer ".length).trim();
    if (!bearerToken || !process.env.NEXTAUTH_SECRET) {
      res.status(401).json({ error: "Unauthorized" });
      return;
    }

    const decoded = (await decode({
      token: bearerToken,
      secret: process.env.NEXTAUTH_SECRET
    })) as JWT | null;

    const userId = decoded?.sub;
    const email = typeof decoded?.email === "string" ? decoded.email : undefined;
    const plan = decoded?.plan;

    if (!userId || !email || !isValidPlan(plan)) {
      res.status(401).json({ error: "Unauthorized" });
      return;
    }

    req.user = { id: userId, email, plan };
    next();
  } catch {
    res.status(401).json({ error: "Unauthorized" });
  }
}
