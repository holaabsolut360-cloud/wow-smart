import { PaymentRepository, PaymentRow } from "../repositories/PaymentRepository";
import { CompanyRepository } from "../repositories/CompanyRepository";
import { SubscriptionService } from "./SubscriptionService";
import { NotificationService } from "./NotificationService";
import { AuditService } from "./AuditService";
import { StorageService } from "./StorageService";
import { env } from "../config/env";

const PLAN_PRICES: Record<string, number> = {
  Emprendedor: 15,
  Negocio: 39,
  Empresa: 79,
};

export class PaymentImmutableError extends Error {}

export interface ProofFileInput {
  base64Data: string;
  mimeType: string;
  fileName?: string;
}

export class PaymentService {
  constructor(
    private readonly paymentRepository: PaymentRepository,
    private readonly companyRepository: CompanyRepository,
    private readonly subscriptionService: SubscriptionService,
    private readonly notificationService: NotificationService,
    private readonly auditService: AuditService,
    private readonly storageService: StorageService,
  ) {}

  /**
   * Client submits proof of payment for a plan. Flow, in order (see
   * requirement #9 -- integrity):
   *   1. Upload the file to Storage. If this fails, nothing else happens
   *      (no orphaned DB row).
   *   2. Insert the `payments` row referencing the uploaded file's path.
   *      If THIS fails, the just-uploaded file is deleted (no orphaned
   *      file in Storage).
   *   3. Record the "comprobante cargado" and "pago enviado" audit events.
   *   4. Notify the client and the SuperAdmin by email.
   */
  async submitPayment(params: {
    companyId: string;
    plan: "Emprendedor" | "Negocio" | "Empresa";
    method: string;
    reference?: string;
    proofFile?: ProofFileInput;
    customerEmail?: string;
    actorUserId?: string | null;
  }): Promise<PaymentRow> {
    const amount = PLAN_PRICES[params.plan];
    if (!amount) throw new Error(`Unknown plan: ${params.plan}`);

    let uploadedPath: string | null = null;
    let fileSize: number | null = null;

    if (params.proofFile) {
      const upload = await this.storageService.uploadProof({
        companyId: params.companyId,
        base64Data: params.proofFile.base64Data,
        mimeType: params.proofFile.mimeType,
      });
      uploadedPath = upload.path;
      fileSize = upload.sizeBytes;

      await this.auditService.log({
        companyId: params.companyId,
        userId: params.actorUserId ?? null,
        userName: "Cliente",
        action: "PROOF_UPLOADED",
        resource: "payments",
        details: `Comprobante cargado (${params.proofFile.mimeType}, ${(fileSize / 1024).toFixed(0)} KB)`,
      });
    }

    let payment: PaymentRow;
    try {
      payment = await this.paymentRepository.create({
        company_id: params.companyId,
        plan: params.plan,
        amount,
        currency: "PEN",
        method: params.method,
        reference: params.reference,
        proof_path: uploadedPath,
        file_name: params.proofFile?.fileName || null,
        file_size: fileSize,
        mime_type: params.proofFile?.mimeType || null,
        status: "Pendiente",
      });
    } catch (err) {
      // Requirement #9: if the DB record fails, remove the file we just
      // uploaded so Storage never accumulates orphans.
      if (uploadedPath) await this.storageService.remove(uploadedPath);
      throw err;
    }

    // Mark the company as awaiting payment validation.
    await this.companyRepository.updateSubscription(params.companyId, {
      subscription_status: "Pendiente",
    });

    await this.auditService.log({
      companyId: params.companyId,
      userId: params.actorUserId ?? null,
      userName: "Cliente",
      action: "PAYMENT_SUBMITTED",
      resource: "payments",
      details: `Comprobante enviado para el plan ${params.plan} (S/ ${amount}) via ${params.method}`,
    });

    if (params.customerEmail) {
      await this.notificationService.notifyPaymentSubmitted(params.customerEmail, params.plan);
    }

    if (env.superAdminNotificationEmail) {
      const company = await this.companyRepository.findById(params.companyId);
      await this.notificationService.notifyAdminNewPaymentSubmitted(
        env.superAdminNotificationEmail,
        company?.name || params.companyId,
        params.plan,
        amount,
      );
    }

    return payment;
  }

  async listPending(): Promise<PaymentRow[]> {
    return this.paymentRepository.listPending();
  }

  /** Pendiente -> En revisión. Optional manual step before deciding. */
  async startReview(paymentId: string, reviewedBy: string): Promise<PaymentRow> {
    const payment = await this.getMutableOrThrow(paymentId);

    const updated = await this.paymentRepository.updateStatus(paymentId, "En revisión", reviewedBy);

    await this.auditService.log({
      companyId: payment.company_id,
      userId: null,
      userName: reviewedBy,
      action: "PAYMENT_REVIEW_STARTED",
      resource: "payments",
      details: "El SuperAdmin comenzó a revisar el comprobante",
    });

    return updated;
  }

  async approve(paymentId: string, reviewedBy: string, customerEmail: string, dashboardUrl: string): Promise<PaymentRow> {
    const payment = await this.getMutableOrThrow(paymentId);

    const updated = await this.paymentRepository.updateStatus(paymentId, "Aprobado", reviewedBy);

    await this.subscriptionService.activatePlan(payment.company_id, payment.plan);

    await this.notificationService.notifySubscriptionApproved(
      customerEmail,
      payment.company_id,
      payment.plan,
      payment.amount,
      dashboardUrl,
    );

    await this.auditService.log({
      companyId: payment.company_id,
      userId: null,
      userName: reviewedBy,
      action: "PAYMENT_APPROVED",
      resource: "payments",
      details: `Pago aprobado: plan ${payment.plan}, S/ ${payment.amount}`,
    });

    return updated;
  }

  async reject(paymentId: string, reviewedBy: string, reason: string, customerEmail: string): Promise<PaymentRow> {
    const payment = await this.getMutableOrThrow(paymentId);

    const updated = await this.paymentRepository.updateStatus(paymentId, "Rechazado", reviewedBy, reason);

    await this.notificationService.notifySubscriptionRejected(customerEmail, payment.company_id, reason);

    await this.auditService.log({
      companyId: payment.company_id,
      userId: null,
      userName: reviewedBy,
      action: "PAYMENT_REJECTED",
      resource: "payments",
      details: `Pago rechazado: ${reason}`,
    });

    return updated;
  }

  /**
   * Requirement #6: "No permitir modificar un pago aprobado." Enforced
   * here at the application layer for a clear error message, AND at the
   * database layer via a trigger (see migration
   * 20260717004000_payment_proofs.sql) so it holds even if some future
   * code path bypasses this service.
   */
  private async getMutableOrThrow(paymentId: string): Promise<PaymentRow> {
    const payment = await this.paymentRepository.findById(paymentId);
    if (!payment) throw new Error("Payment not found");
    if (payment.status === "Aprobado") {
      throw new PaymentImmutableError("Este pago ya fue aprobado y no puede modificarse");
    }
    return payment;
  }
}
