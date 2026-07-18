import { SupabaseClient } from "@supabase/supabase-js";

export interface AuditLogEntry {
  company_id: string | null;
  user_id: string | null;
  user_name: string;
  action: string;
  resource: string;
  details: string;
}

/**
 * Reuses the existing `audit_logs` table (see 20240101000000_initial_schema.sql)
 * instead of creating a parallel events table.
 */
export class AuditRepository {
  constructor(private readonly client: SupabaseClient) {}

  async record(entry: AuditLogEntry): Promise<void> {
    const { error } = await this.client.from("audit_logs").insert(entry);
    // Audit logging must never break the primary flow (e.g. onboarding).
    if (error) console.error("[AuditRepository] failed to record audit log:", error.message);
  }
}
