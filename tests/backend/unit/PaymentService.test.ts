import { beforeEach, describe, expect, it, vi } from 'vitest';
import { PaymentImmutableError, PaymentService } from '../../../server/services/PaymentService';

describe('PaymentService', () => {
  const paymentRepository = {
    create: vi.fn(),
    findById: vi.fn(),
    updateStatus: vi.fn(),
    listPending: vi.fn(),
  };
  const companyRepository = {
    updateSubscription: vi.fn(),
    findById: vi.fn(),
  };
  const subscriptionService = {
    activatePlan: vi.fn(),
  };
  const notificationService = {
    notifyPaymentSubmitted: vi.fn(),
    notifyAdminNewPaymentSubmitted: vi.fn(),
    notifySubscriptionApproved: vi.fn(),
    notifySubscriptionRejected: vi.fn(),
  };
  const auditService = {
    log: vi.fn(),
  };
  const storageService = {
    uploadProof: vi.fn(),
    remove: vi.fn(),
  };

  let service: PaymentService;

  beforeEach(() => {
    vi.clearAllMocks();
    service = new PaymentService(
      paymentRepository as any,
      companyRepository as any,
      subscriptionService as any,
      notificationService as any,
      auditService as any,
      storageService as any,
    );
  });

  it('envia un pago con comprobante y deja la empresa en pendiente', async () => {
    storageService.uploadProof.mockResolvedValue({ path: 'proof/a.jpg', sizeBytes: 1024 });
    paymentRepository.create.mockResolvedValue({ id: 'p1', company_id: 'c1', plan: 'Negocio', amount: 39, status: 'Pendiente' });
    companyRepository.updateSubscription.mockResolvedValue({});

    const result = await service.submitPayment({
      companyId: 'c1',
      plan: 'Negocio',
      method: 'Yape',
      proofFile: { base64Data: 'YWJj', mimeType: 'image/jpeg', fileName: 'a.jpg' },
      customerEmail: 'owner@acme.com',
      actorUserId: 'u1',
    });

    expect(result.id).toBe('p1');
    expect(storageService.uploadProof).toHaveBeenCalledTimes(1);
    expect(paymentRepository.create).toHaveBeenCalledWith(expect.objectContaining({
      proof_path: 'proof/a.jpg',
      status: 'Pendiente',
      amount: 39,
    }));
    expect(companyRepository.updateSubscription).toHaveBeenCalledWith('c1', { subscription_status: 'Pendiente' });
  });

  it('hace rollback del archivo si falla la insercion en BD', async () => {
    storageService.uploadProof.mockResolvedValue({ path: 'proof/a.jpg', sizeBytes: 20 });
    paymentRepository.create.mockRejectedValue(new Error('db error'));

    await expect(service.submitPayment({
      companyId: 'c1',
      plan: 'Negocio',
      method: 'Yape',
      proofFile: { base64Data: 'YWJj', mimeType: 'image/jpeg' },
    })).rejects.toThrow('db error');

    expect(storageService.remove).toHaveBeenCalledWith('proof/a.jpg');
  });

  it('propaga error de storage y no crea pago', async () => {
    storageService.uploadProof.mockRejectedValue(new Error('storage down'));

    await expect(service.submitPayment({
      companyId: 'c1',
      plan: 'Negocio',
      method: 'Yape',
      proofFile: { base64Data: 'YWJj', mimeType: 'image/jpeg' },
    })).rejects.toThrow('storage down');

    expect(paymentRepository.create).not.toHaveBeenCalled();
  });

  it('rechaza plan desconocido', async () => {
    await expect(service.submitPayment({
      companyId: 'c1',
      plan: 'Premium' as any,
      method: 'Yape',
    })).rejects.toThrow('Unknown plan');
  });

  it('aprueba pago y activa plan', async () => {
    paymentRepository.findById.mockResolvedValue({ id: 'p1', company_id: 'c1', plan: 'Empresa', amount: 79, status: 'Pendiente' });
    paymentRepository.updateStatus.mockResolvedValue({ id: 'p1', status: 'Aprobado' });

    const result = await service.approve('p1', 'SuperAdmin', 'owner@acme.com', 'https://app/dashboard');

    expect(result.status).toBe('Aprobado');
    expect(subscriptionService.activatePlan).toHaveBeenCalledWith('c1', 'Empresa');
    expect(notificationService.notifySubscriptionApproved).toHaveBeenCalledTimes(1);
  });

  it('rechaza pago y notifica', async () => {
    paymentRepository.findById.mockResolvedValue({ id: 'p2', company_id: 'c1', plan: 'Negocio', amount: 39, status: 'Pendiente' });
    paymentRepository.updateStatus.mockResolvedValue({ id: 'p2', status: 'Rechazado' });

    const result = await service.reject('p2', 'SuperAdmin', 'comprobante ilegible', 'owner@acme.com');

    expect(result.status).toBe('Rechazado');
    expect(notificationService.notifySubscriptionRejected).toHaveBeenCalledTimes(1);
  });

  it('falla si el pago no existe', async () => {
    paymentRepository.findById.mockResolvedValue(null);
    await expect(service.approve('missing', 'SuperAdmin', 'a@a.com', 'https://d')).rejects.toThrow('Payment not found');
  });

  it('no permite modificar pagos aprobados', async () => {
    paymentRepository.findById.mockResolvedValue({ id: 'p1', status: 'Aprobado' });
    await expect(service.reject('p1', 'SuperAdmin', 'x', 'a@a.com')).rejects.toBeInstanceOf(PaymentImmutableError);
  });
});
