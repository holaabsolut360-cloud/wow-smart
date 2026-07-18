import { SupabaseClient } from "@supabase/supabase-js";

export interface PlanFeatureRow {
  plan: string;
  feature: string;
  enabled: boolean;
}

export class FeatureFlagRepository {
  constructor(private readonly client: SupabaseClient) {}

  async listByPlan(plan: string): Promise<PlanFeatureRow[]> {
    const { data, error } = await this.client
      .from("plan_features")
      .select("*")
      .eq("plan", plan)
      .eq("enabled", true);

    if (error) throw new Error(error.message);
    return (data || []) as PlanFeatureRow[];
  }

  async listAll(): Promise<PlanFeatureRow[]> {
    const { data, error } = await this.client.from("plan_features").select("*");
    if (error) throw new Error(error.message);
    return (data || []) as PlanFeatureRow[];
  }
}
