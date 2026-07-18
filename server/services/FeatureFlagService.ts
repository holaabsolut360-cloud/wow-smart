import { FeatureFlagRepository } from "../repositories/FeatureFlagRepository";

// Fallback used only if the `plan_features` table is empty/unreachable
// (e.g. migration not yet applied). Keeps the app usable, but the DB table
// is the real source of truth going forward.
const DEFAULT_FEATURES_BY_PLAN: Record<string, string[]> = {
  Emprendedor: ["catalog", "whatsapp_orders", "qr_code"],
  Negocio: ["catalog", "whatsapp_orders", "qr_code", "pos", "inventory", "crm", "recipes"],
  Empresa: ["catalog", "whatsapp_orders", "qr_code", "pos", "inventory", "crm", "recipes", "multi_branch"],
};

export class FeatureFlagService {
  constructor(private readonly featureFlagRepository: FeatureFlagRepository) {}

  /** List of enabled feature keys for a given plan. */
  async getFeaturesForPlan(plan: string): Promise<string[]> {
    try {
      const rows = await this.featureFlagRepository.listByPlan(plan);
      if (rows.length > 0) return rows.map(r => r.feature);
    } catch (err) {
      console.error("[FeatureFlagService] falling back to defaults:", (err as Error).message);
    }
    return DEFAULT_FEATURES_BY_PLAN[plan] || [];
  }

  async hasFeature(plan: string, feature: string): Promise<boolean> {
    const features = await this.getFeaturesForPlan(plan);
    return features.includes(feature);
  }
}
