/**
 * Provider-agnostic notification layer. Callers only know about
 * `NotificationService`; swapping Resend for another email provider (or
 * adding SMS/WhatsApp via the messaging system already connected) means
 * writing a new EmailProvider and changing one line at wiring time --
 * nothing in the services/controllers above has to change.
 */
export interface EmailMessage {
  to: string;
  subject: string;
  html: string;
}

export interface EmailProvider {
  send(message: EmailMessage): Promise<void>;
}

export interface NotificationOptions {
  maxAttempts: number;
  timeoutMs: number;
  retryDelayMs: number;
}

import { Resend } from "resend";

export class ResendEmailProvider implements EmailProvider {
  private client: Resend;

  constructor(apiKey: string, private readonly fromAddress: string) {
    this.client = new Resend(apiKey);
  }

  async send(message: EmailMessage): Promise<void> {
    await this.client.emails.send({
      from: this.fromAddress,
      to: [message.to],
      subject: message.subject,
      html: message.html,
    });
  }
}

/** No-op provider used when no email provider is configured (e.g. local dev). */
export class NullEmailProvider implements EmailProvider {
  async send(message: EmailMessage): Promise<void> {
    console.log(`[NullEmailProvider] Would send email to ${message.to}: ${message.subject}`);
  }
}

export class NotificationService {
  private readonly options: NotificationOptions;

  constructor(private readonly emailProvider: EmailProvider, options?: Partial<NotificationOptions>) {
    this.options = {
      maxAttempts: options?.maxAttempts ?? 3,
      timeoutMs: options?.timeoutMs ?? 5000,
      retryDelayMs: options?.retryDelayMs ?? 150,
    };
  }

  private async send(message: EmailMessage): Promise<void> {
    let lastError: Error | null = null;

    for (let attempt = 1; attempt <= this.options.maxAttempts; attempt += 1) {
      try {
        await Promise.race([
          this.emailProvider.send(message),
          new Promise<never>((_, reject) => {
            setTimeout(() => reject(new Error("Email provider timeout")), this.options.timeoutMs);
          }),
        ]);
        return;
      } catch (err) {
        lastError = err as Error;
        if (attempt < this.options.maxAttempts) {
          await new Promise(resolve => setTimeout(resolve, this.options.retryDelayMs));
        }
      }
    }

    throw lastError || new Error("Failed to send notification");
  }

  async notifyTrialStarted(to: string, companyName: string, endsAt: string): Promise<void> {
    await this.send({
      to,
      subject: "¡Tu prueba gratuita de WowSmart ha comenzado!",
      html: `
        <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
          <h1 style="color: #4f46e5;">¡Bienvenido a WowSmart, ${companyName}!</h1>
          <p>Tu prueba gratuita de 15 días hábiles está activa y vence el <strong>${endsAt}</strong>.</p>
          <p>Aprovecha para configurar tu catálogo, tu punto de venta y explorar todas las funciones antes de elegir tu plan.</p>
        </div>
      `,
    });
  }

  async notifyTrialExpiringSoon(to: string, companyName: string, endsAt: string): Promise<void> {
    await this.send({
      to,
      subject: "Tu prueba gratuita de WowSmart está por vencer",
      html: `
        <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
          <h1 style="color: #d97706;">Tu prueba gratuita vence pronto</h1>
          <p>Hola ${companyName}, tu período de prueba vence el <strong>${endsAt}</strong>.</p>
          <p>Elige un plan de pago para no perder acceso a tu catálogo y tus pedidos.</p>
        </div>
      `,
    });
  }

  async notifyTrialExpired(to: string, companyName: string): Promise<void> {
    await this.send({
      to,
      subject: "Tu prueba gratuita de WowSmart ha finalizado",
      html: `
        <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
          <h1 style="color: #dc2626;">Tu prueba gratuita ha finalizado</h1>
          <p>Hola ${companyName}, tu período de prueba de 15 días hábiles terminó.</p>
          <p>Suscríbete a un plan de pago para seguir usando WowSmart sin interrupciones.</p>
        </div>
      `,
    });
  }

  async notifyPaymentSubmitted(to: string, plan: string): Promise<void> {
    await this.send({
      to,
      subject: "Hemos recibido tu comprobante de pago",
      html: `
        <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
          <h1 style="color: #4f46e5;">Comprobante recibido</h1>
          <p>Estamos validando tu pago por el plan <strong>${plan}</strong>. Te avisaremos en cuanto se active tu cuenta.</p>
        </div>
      `,
    });
  }

  async notifyAdminNewPaymentSubmitted(to: string, companyName: string, plan: string, amount: number): Promise<void> {
    await this.send({
      to,
      subject: `Nuevo comprobante de pago: ${companyName}`,
      html: `
        <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
          <h1 style="color: #4f46e5;">Nuevo comprobante recibido</h1>
          <p><strong>${companyName}</strong> envió un comprobante de pago por el plan <strong>${plan}</strong> (S/ ${amount}).</p>
          <p>Revísalo en el panel de SuperAdmin.</p>
        </div>
      `,
    });
  }

  async notifySubscriptionApproved(to: string, businessName: string, plan: string, amount: number, dashboardUrl: string): Promise<void> {
    await this.send({
      to,
      subject: "¡Tu suscripción a WowSmart ha sido aprobada!",
      html: `
        <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
          <h1 style="color: #4f46e5;">¡Bienvenido a WowSmart!</h1>
          <p>Tu pago por el plan <strong>${plan}</strong> para <strong>${businessName}</strong> ha sido validado exitosamente.</p>
          <p>Monto pagado: S/ ${amount}</p>
          <div style="background-color: #f8fafc; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <a href="${dashboardUrl}" style="display: inline-block; background-color: #4f46e5; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: bold;">
              Ir al Dashboard
            </a>
          </div>
        </div>
      `,
    });
  }

  async notifySubscriptionRejected(to: string, businessName: string, reason: string): Promise<void> {
    await this.send({
      to,
      subject: "No pudimos validar tu comprobante de pago",
      html: `
        <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
          <h1 style="color: #dc2626;">Comprobante rechazado</h1>
          <p>Hola ${businessName}, no pudimos validar tu comprobante de pago.</p>
          <p><strong>Motivo:</strong> ${reason}</p>
          <p>Por favor, sube un nuevo comprobante para activar tu cuenta.</p>
        </div>
      `,
    });
  }
}
