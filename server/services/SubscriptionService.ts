import { CompanyRepository, CompanyRow } from "../repositories/CompanyRepository";
import { NotificationService } from "./NotificationService";
import { AuditService } from "./AuditService";
import { addBusinessDays } from "../lib/businessDays";
import { env } from "../config/env";

export type SubscriptionStatus = "Prueba Gratuita" | "Activa" | "Pendiente" | "Suspendida" | "Vencida";

/**
 * Single source of truth for how a company's subscription moves through its
 * lifecycle. Every place that needs to start a trial, activate a paid plan,
 * suspend an account, or expire an overdue trial MUST go through this
 * service instead of writing to `companies` directly, so the rules never
 * drift between the onboarding flow, the SuperAdmin panel, and the cron job.
 */
export class SubscriptionService {
  constructor(
    private readonly companyRepository: CompanyRepository,
    private readonly notificationService: NotificationService,
    private readonly auditService: AuditService,
  ) {}

  /**
   * Starts a 15-business-day free trial. The trial always grants the
   * "Emprendedor" plan tier as the billing plan (what they'd pay for if
   * they never upgrade), but full feature access is unlocked separately in
   * the frontend/feature-flag layer while subscriptionStatus is
   * "Prueba Gratuita" so the client experiences the complete product
   * before deciding which paid plan fits them.
   */
  computeTrialEndDate(startDate: Date = new Date()): Date {
    return addBusinessDays(startDate, env.trialDurationBusinessDays);
  }

  async startTrial(companyId: string, ownerEmail?: string): Promise<CompanyRow> {
    const endsAt = this.computeTrialEndDate();

    const company = await this.companyRepository.updateSubscription(companyId, {
      subscription_status: "Prueba Gratuita",
      subscription_ends_at: endsAt.toISOString(),
    });

    if (ownerEmail) {
      await this.notificationService.notifyTrialStarted(
        ownerEmail,
        company.name,
        endsAt.toLocaleDateString("es-PE"),
      );
    }

    await this.auditService.log({
      companyId,
      userId: company.user_id,
      userName: company.name,
      action: "TRIAL_STARTED",
      resource: "companies",
      details: `Prueba gratuita iniciada, vence el ${endsAt.toISOString().split("T")[0]} (${env.trialDurationBusinessDays} días hábiles)`,
    });

    return company;
  }

  async activatePlan(companyId: string, plan: "Emprendedor" | "Negocio" | "Empresa"): Promise<CompanyRow> {
    const endsAt = new Date();
    endsAt.setDate(endsAt.getDate() + env.billingCycleDays);

    const company = await this.companyRepository.updateSubscription(companyId, {
      plan,
      subscription_status: "Activa",
      subscription_ends_at: endsAt.toISOString(),
    });

    await this.auditService.log({
      companyId,
      userId: company.user_id,
      userName: company.name,
      action: "PLAN_ACTIVATED",
      resource: "companies",
      details: `Plan ${plan} activado, próximo vencimiento ${endsAt.toISOString().split("T")[0]}`,
    });

    return company;
  }

  async suspend(companyId: string, reason: string): Promise<CompanyRow> {
    const company = await this.companyRepository.updateSubscription(companyId, {
      subscription_status: "Suspendida",
    });

    await this.auditService.log({
      companyId,
      userId: company.user_id,
      userName: company.name,
      action: "SUBSCRIPTION_SUSPENDED",
      resource: "companies",
      details: reason,
    });

    return company;
  }

  /**
   * Called by the daily cron job. Finds every trial whose end date has
   * passed and flips it to "Vencida" so the dashboard shows the upgrade
   * paywall message instead of full access.
   */
  async expireOverdueTrials(): Promise<{ expired: number }> {
    const nowIso = new Date().toISOString();
    const overdue = await this.companyRepository.findExpiredTrials(nowIso);

    for (const company of overdue) {
      await this.companyRepository.updateSubscription(company.id, {
        subscription_status: "Vencida",
      });

      if (company.email) {
        await this.notificationService.notifyTrialExpired(company.email, company.name);
      }

      await this.auditService.log({
        companyId: company.id,
        userId: company.user_id,
        userName: company.name,
        action: "TRIAL_EXPIRED",
        resource: "companies",
        details: "Prueba gratuita vencida automáticamente por el cron diario",
      });
    }

    return { expired: overdue.length };
  }
}
