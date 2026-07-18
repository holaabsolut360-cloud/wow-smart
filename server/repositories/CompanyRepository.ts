import { SupabaseClient } from "@supabase/supabase-js";

export interface CompanyRow {
  id: string;
  user_id: string;
  name: string;
  slug: string;
  plan: "Emprendedor" | "Negocio" | "Empresa";
  subscription_status: string;
  subscription_ends_at: string | null;
  [key: string]: any;
}

/**
 * All reads/writes against the `companies` table for subscription-related
 * concerns go through here. Nothing above this layer knows about table or
 * column names.
 */
export class CompanyRepository {
  constructor(private readonly client: SupabaseClient) {}

  async findById(companyId: string): Promise<CompanyRow | null> {
    const { data, error } = await this.client
      .from("companies")
      .select("*")
      .eq("id", companyId)
      .single();

    if (error) return null;
    return data as CompanyRow;
  }

  async insert(company: Record<string, any>): Promise<CompanyRow> {
    const { data, error } = await this.client
      .from("companies")
      .insert(company)
      .select("*")
      .single();

    if (error) throw new Error(error.message);
    return data as CompanyRow;
  }

  async updateSubscription(
    companyId: string,
    fields: Partial<Pick<CompanyRow, "plan" | "subscription_status" | "subscription_ends_at">>,
  ): Promise<CompanyRow> {
    const { data, error } = await this.client
      .from("companies")
      .update(fields)
      .eq("id", companyId)
      .select("*")
      .single();

    if (error) throw new Error(error.message);
    return data as CompanyRow;
  }

  /**
   * Trial accounts whose subscription_ends_at has already passed and are
   * still marked as "Prueba Gratuita". Used by the daily cron job.
   */
  async findExpiredTrials(nowIso: string): Promise<CompanyRow[]> {
    const { data, error } = await this.client
      .from("companies")
      .select("*")
      .eq("subscription_status", "Prueba Gratuita")
      .lt("subscription_ends_at", nowIso);

    if (error) throw new Error(error.message);
    return (data || []) as CompanyRow[];
  }
}
