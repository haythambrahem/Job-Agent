import type { NextFunction, Request, Response } from "express";
import type { Plan } from "@prisma/client";

const ORDER: Record<Plan, number> = {
  free: 0,
  pro: 1,
  premium: 2
};

export function validateSubscription(minimumPlan: Plan) {
  return (req: Request, res: Response, next: NextFunction): void => {
    const current = req.user?.plan;
    if (!current) {
      res.status(401).json({ error: "Unauthorized" });
      return;
    }

    if (ORDER[current] < ORDER[minimumPlan]) {
      res.status(403).json({
        error: "Plan upgrade required",
        requiredPlan: minimumPlan,
        currentPlan: current
      });
      return;
    }

    next();
  };
}
