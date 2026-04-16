import type { NextFunction, Request, Response } from "express";
import { decode } from "next-auth/jwt";
import type { JWT } from "next-auth/jwt";

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

    if (!userId || !email || (plan !== "free" && plan !== "pro" && plan !== "premium")) {
      res.status(401).json({ error: "Unauthorized" });
      return;
    }

    req.user = { id: userId, email, plan };
    next();
  } catch {
    res.status(401).json({ error: "Unauthorized" });
  }
}
