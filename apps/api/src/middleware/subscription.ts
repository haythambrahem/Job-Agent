import type { NextFunction, Request, Response } from "express";
import type { Plan } from "@prisma/client";
import { prisma } from "../lib/prisma.js";

const ORDER: Record<Plan, number> = {
  free: 0,
  pro: 1,
  premium: 2
};

export function validateSubscription(minimumPlan: Plan) {
  return async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    const userId = req.user?.id;
    if (!userId) {
      res.status(401).json({ error: "Unauthorized" });
      return;
    }

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { plan: true }
    });

    if (!user) {
      res.status(401).json({ error: "Unauthorized" });
      return;
    }

    if (ORDER[user.plan] < ORDER[minimumPlan]) {
      res.status(403).json({
        error: "Plan upgrade required",
        requiredPlan: minimumPlan,
        currentPlan: user.plan
      });
      return;
    }

    next();
  };
}

export function requirePlan(minimumPlan: Plan) {
  return validateSubscription(minimumPlan);
}
