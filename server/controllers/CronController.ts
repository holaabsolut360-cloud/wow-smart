import { Request, Response } from "express";
import { buildAdminContainer } from "../container";

export class CronController {
  /**
   * POST /api/cron/check-trials
   * Intended to be called once a day by a Render Cron Job:
   *   curl -X POST https://wow-smart.com/api/cron/check-trials \
   *        -H "Authorization: Bearer $CRON_SECRET"
   * Also safe to call more often -- it's idempotent (only acts on trials
   * that are still marked "Prueba Gratuita" and past their end date).
   */
  static async checkTrials(_req: Request, res: Response) {
    try {
      const { subscriptionService } = buildAdminContainer();
      const result = await subscriptionService.expireOverdueTrials();
      return res.json({ ok: true, ...result });
    } catch (err: any) {
      return res.status(500).json({ error: err.message });
    }
  }
}
