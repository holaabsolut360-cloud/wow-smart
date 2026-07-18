import { createClient, SupabaseClient } from "@supabase/supabase-js";
import { env } from "../config/env";

let adminClient: SupabaseClient | null | undefined;

/**
 * Service-role client. Bypasses RLS -- only for trusted server-side
 * operations (SuperAdmin actions, cron jobs). Never expose to the client.
 */
export function getAdminClient(): SupabaseClient | null {
  if (adminClient !== undefined) return adminClient;

  adminClient = env.supabaseUrl && env.supabaseServiceRoleKey
    ? createClient(env.supabaseUrl, env.supabaseServiceRoleKey, {
        auth: { persistSession: false, autoRefreshToken: false },
      })
    : null;

  return adminClient;
}

/**
 * Client scoped to the requesting user's JWT, so RLS policies apply
 * (e.g. "companies_insert_own"). Used for actions a regular user is
 * allowed to perform on their own data.
 */
export function getUserClient(authHeader?: string): SupabaseClient | null {
  if (!env.supabaseUrl || !env.supabaseAnonKey) return null;

  return createClient(env.supabaseUrl, env.supabaseAnonKey, {
    global: {
      headers: authHeader ? { Authorization: authHeader } : {},
    },
  });
}

/**
 * Prefer the admin client when available (so onboarding/payments work even
 * if a company-level RLS policy is missing), falling back to the
 * user-scoped client otherwise.
 */
export function getPreferredClient(authHeader?: string): SupabaseClient | null {
  return getAdminClient() || getUserClient(authHeader);
}
