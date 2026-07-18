import { Request, Response, NextFunction } from "express";
import { env } from "../config/env";

/**
 * Protects cron-triggered endpoints (e.g. Render Cron Jobs calling
 * POST /api/cron/check-trials). The caller must send
 * `Authorization: Bearer <CRON_SECRET>`.
 */
export function requireCronSecret(req: Request, res: Response, next: NextFunction) {
  if (!env.cronSecret) {
    return res.status(503).json({ error: "CRON_SECRET is not configured" });
  }

  const authHeader = req.headers.authorization || "";
  const token = authHeader.startsWith("Bearer ") ? authHeader.slice(7) : "";

  if (token !== env.cronSecret) {
    return res.status(401).json({ error: "Unauthorized" });
  }

  next();
}
