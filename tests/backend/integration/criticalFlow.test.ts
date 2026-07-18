import express from 'express';
import request from 'supertest';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { SubscriptionService } from '../../../server/services/SubscriptionService';
import { PaymentService } from '../../../server/services/PaymentService';
import { NotificationService } from '../../../server/services/NotificationService';
import { AuditService } from '../../../server/services/AuditService';

let runtimeContainer: any;

vi.mock('../../../server/db/supabaseClient', () => ({
  getPreferredClient: () => ({}),
}));

vi.mock('../../../server/container', () => ({
  buildContainer: () => runtimeContainer,
  buildAdminContainer: () => runtimeContainer,
}));

import { OnboardingController } from '../../../server/controllers/OnboardingController';
import { CheckoutController } from '../../../server/controllers/CheckoutController';
import { SubscriptionAdminController } from '../../../server/controllers/SubscriptionAdminController';

type Company = {
  id: string;
  user_id: string;
  name: string;
  slug: string;
  plan: 'Emprendedor' | 'Negocio' | 'Empresa';
  subscription_status: string;
  subscription_ends_at: string | null;
  email: string | null;
};

type Payment = {
  id: string;
  company_id: string;
  plan: 'Emprendedor' | 'Negocio' | 'Empresa';
  amount: number;
  status: 'Pendiente' | 'En revisión' | 'Aprobado' | 'Rechazado';
  method: string;
};

function createRuntime() {
  const companies = new Map<string, Company>();
  const payments = new Map<string, Payment>();

  const companyRepository = {
    insert: vi.fn(async (company: Record<string, any>) => {
      const id = `c_${companies.size + 1}`;
      const row: Company = {
        id,
        user_id: company.user_id,
        name: company.name,
        slug: company.slug,
        plan: company.plan,
        subscription_status: company.subscription_status,
        subscription_ends_at: company.subscription_ends_at ?? null,
        email: company.email ?? null,
      };
      companies.set(id, row);
      return row;
    }),
    updateSubscription: vi.fn(async (companyId: string, fields: Record<string, any>) => {
      const row = companies.get(companyId);
      if (!row) throw new Error('Company not found');
      const updated = { ...row, ...fields } as Company;
      companies.set(companyId, updated);
      return updated;
    }),
    findById: vi.fn(async (companyId: string) => companies.get(companyId) ?? null),
    findExpiredTrials: vi.fn(async (nowIso: string) => {
      return Array.from(companies.values()).filter(c => (
        c.subscription_status === 'Prueba Gratuita' &&
        !!c.subscription_ends_at &&
        c.subscription_ends_at < nowIso
      ));
    }),
  };

  const paymentRepository = {
    create: vi.fn(async (payment: Record<string, any>) => {
      const id = `p_${payments.size + 1}`;
      const row: Payment = {
        id,
        company_id: payment.company_id,
        plan: payment.plan,
        amount: payment.amount,
        status: payment.status,
        method: payment.method,
      };
      payments.set(id, row);
      return row;
    }),
    findById: vi.fn(async (paymentId: string) => payments.get(paymentId) ?? null),
    updateStatus: vi.fn(async (paymentId: string, status: Payment['status']) => {
      const row = payments.get(paymentId);
      if (!row) throw new Error('Payment not found');
      const updated = { ...row, status };
      payments.set(paymentId, updated);
      return updated;
    }),
    listPending: vi.fn(async () => Array.from(payments.values()).filter(p => p.status !== 'Aprobado' && p.status !== 'Rechazado')),
  };

  const featureFlagService = { getFeaturesForPlan: vi.fn() };
  const emailProvider = { send: vi.fn().mockResolvedValue(undefined) };
  const notificationService = new NotificationService(emailProvider, { maxAttempts: 1, timeoutMs: 100, retryDelayMs: 1 });
  const auditService = new AuditService({ record: vi.fn() } as any);

  const subscriptionService = new SubscriptionService(
    companyRepository as any,
    notificationService,
    auditService,
  );

  const storageService = {
    uploadProof: vi.fn(async ({ companyId }: { companyId: string }) => ({
      path: `${companyId}/proof.jpg`,
      sizeBytes: 1024,
    })),
    remove: vi.fn(async () => {}),
  };

  const paymentService = new PaymentService(
    paymentRepository as any,
    companyRepository as any,
    subscriptionService,
    notificationService,
    auditService,
    storageService as any,
  );

  return {
    companies,
    payments,
    companyRepository,
    paymentRepository,
    paymentService,
    subscriptionService,
    auditService,
    notificationService,
    featureFlagService,
    storageService,
  };
}

describe('Flujo de integracion critico', () => {
  beforeEach(() => {
    runtimeContainer = createRuntime();
  });

  it('Registro -> Empresa -> Trial -> Pago -> Aprobacion -> Activacion', async () => {
    const app = express();
    app.use(express.json());

    app.post('/api/onboarding', (req, _res, next) => {
      (req as any).user = { id: 'u_1', email: 'owner@demo.com' };
      next();
    }, OnboardingController.createCompany);

    app.post('/api/checkout/submit-payment', (req, _res, next) => {
      (req as any).user = { id: 'u_1', email: 'owner@demo.com' };
      next();
    }, CheckoutController.submitPayment);

    app.post('/api/superadmin/payments/:id/approve', SubscriptionAdminController.approve);

    const onboarding = await request(app)
      .post('/api/onboarding')
      .send({ name: 'Demo Corp', isTrial: true })
      .expect(200);

    expect(onboarding.body.subscriptionStatus).toBe('Prueba Gratuita');
    const companyId = onboarding.body.id as string;

    const payment = await request(app)
      .post('/api/checkout/submit-payment')
      .send({
        companyId,
        plan: 'Negocio',
        method: 'Yape',
        proofFile: {
          base64Data: Buffer.from('proof').toString('base64'),
          mimeType: 'image/jpeg',
          fileName: 'proof.jpg',
        },
      })
      .expect(200);

    expect(payment.body.status).toBe('Pendiente');

    await request(app)
      .post(`/api/superadmin/payments/${payment.body.id}/approve`)
      .send({ customerEmail: 'owner@demo.com' })
      .set('origin', 'https://wow-smart.test')
      .expect(200);

    const finalCompany = runtimeContainer.companies.get(companyId);
    expect(finalCompany.plan).toBe('Negocio');
    expect(finalCompany.subscription_status).toBe('Activa');
  });
});
