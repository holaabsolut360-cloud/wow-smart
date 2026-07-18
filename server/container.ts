import { SupabaseClient } from "@supabase/supabase-js";
import { getAdminClient } from "./db/supabaseClient";
import { env } from "./config/env";

import { CompanyRepository } from "./repositories/CompanyRepository";
import { PaymentRepository } from "./repositories/PaymentRepository";
import { AuditRepository } from "./repositories/AuditRepository";
import { FeatureFlagRepository } from "./repositories/FeatureFlagRepository";

import { AuditService } from "./services/AuditService";
import { NotificationService, ResendEmailProvider, NullEmailProvider } from "./services/NotificationService";
import { FeatureFlagService } from "./services/FeatureFlagService";
import { SubscriptionService } from "./services/SubscriptionService";
import { PaymentService } from "./services/PaymentService";
import { StorageService } from "./services/StorageService";

/**
 * Builds the full dependency graph for a given Supabase client. A fresh
 * client is passed in per-request when RLS needs to apply (user-scoped
 * actions); the admin client is used for SuperAdmin/cron actions that must
 * bypass RLS. Either way, this is the only place `new XService(...)` should
 * appear -- controllers just call `buildContainer(client)`.
 */
export function buildContainer(client: SupabaseClient) {
  const companyRepository = new CompanyRepository(client);
  const paymentRepository = new PaymentRepository(client);
  const auditRepository = new AuditRepository(client);
  const featureFlagRepository = new FeatureFlagRepository(client);

  const auditService = new AuditService(auditRepository);
  const emailProvider = env.resendApiKey
    ? new ResendEmailProvider(env.resendApiKey, env.emailFrom)
    : new NullEmailProvider();
  const notificationService = new NotificationService(emailProvider);
  const featureFlagService = new FeatureFlagService(featureFlagRepository);
  const subscriptionService = new SubscriptionService(companyRepository, notificationService, auditService);
  const storageService = new StorageService(client);
  const paymentService = new PaymentService(
    paymentRepository,
    companyRepository,
    subscriptionService,
    notificationService,
    auditService,
    storageService,
  );

  return {
    companyRepository,
    paymentRepository,
    auditService,
    notificationService,
    featureFlagService,
    subscriptionService,
    paymentService,
    storageService,
  };
}

/** Convenience for cron/superadmin flows that always use the service role. */
export function buildAdminContainer() {
  const client = getAdminClient();
  if (!client) throw new Error("Supabase admin client is not configured");
  return buildContainer(client);
}
