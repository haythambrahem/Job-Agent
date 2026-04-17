import type { NextFunction, Request, Response } from "express";

export function requireAuth(req: Request, res: Response, next: NextFunction): void {
  const authorization = req.headers.authorization;
  if (!authorization || !authorization.startsWith("Bearer ")) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }

  const userId = authorization.slice("Bearer ".length).trim();
  if (!userId) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }

  req.user = { id: userId };
  next();
}
