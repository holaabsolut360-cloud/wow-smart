import { Request, Response } from "express";
import { getPreferredClient } from "../db/supabaseClient";
import { buildContainer } from "../container";

export class FeatureController {
  /** GET /api/plans/:plan/features */
  static async getFeaturesForPlan(req: Request, res: Response) {
    const { plan } = req.params;

    const client = getPreferredClient(req.headers.authorization);
    if (!client) return res.status(503).json({ error: "Supabase is not configured" });

    try {
      const { featureFlagService } = buildContainer(client);
      const features = await featureFlagService.getFeaturesForPlan(plan);
      return res.json({ plan, features });
    } catch (err: any) {
      return res.status(500).json({ error: err.message });
    }
  }
}
