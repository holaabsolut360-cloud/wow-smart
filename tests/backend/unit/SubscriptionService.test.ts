import { describe, it, expect, vi, beforeEach } from 'vitest';
import { SubscriptionService } from '../../../server/services/SubscriptionService';

describe('SubscriptionService', () => {
  const companyRepository = {
    updateSubscription: vi.fn(),
    findExpiredTrials: vi.fn(),
  };
  const notificationService = {
    notifyTrialStarted: vi.fn(),
    notifyTrialExpired: vi.fn(),
  };
  const auditService = {
    log: vi.fn(),
  };

  let service: SubscriptionService;

  beforeEach(() => {
    vi.clearAllMocks();
    service = new SubscriptionService(
      companyRepository as any,
      notificationService as any,
      auditService as any,
    );
  });

  it('calcula el trial en 15 dias habiles', () => {
    const start = new Date('2026-07-17T10:00:00.000Z'); // viernes
    const end = service.computeTrialEndDate(start);
    expect(end.toISOString().slice(0, 10)).toBe('2026-08-07');
  });

  it('maneja fechas invalidas sin romper el flujo', () => {
    const end = service.computeTrialEndDate(new Date('invalid'));
    expect(Number.isNaN(end.getTime())).toBe(true);
  });

  it('inicia trial y registra auditoria/notificacion', async () => {
    companyRepository.updateSubscription.mockResolvedValue({
      id: 'c1',
      user_id: 'u1',
      name: 'ACME',
      subscription_status: 'Prueba Gratuita',
      subscription_ends_at: '2026-08-10T00:00:00.000Z',
    });

    const company = await service.startTrial('c1', 'owner@acme.com');

    expect(company.id).toBe('c1');
    expect(companyRepository.updateSubscription).toHaveBeenCalledWith('c1', expect.objectContaining({
      subscription_status: 'Prueba Gratuita',
    }));
    expect(notificationService.notifyTrialStarted).toHaveBeenCalledTimes(1);
    expect(auditService.log).toHaveBeenCalledWith(expect.objectContaining({
      action: 'TRIAL_STARTED',
      companyId: 'c1',
    }));
  });

  it('activa plan y deja la suscripcion activa', async () => {
    companyRepository.updateSubscription.mockResolvedValue({
      id: 'c1',
      user_id: 'u1',
      name: 'ACME',
      plan: 'Empresa',
      subscription_status: 'Activa',
      subscription_ends_at: '2026-08-17T00:00:00.000Z',
    });

    const company = await service.activatePlan('c1', 'Empresa');

    expect(company.plan).toBe('Empresa');
    expect(companyRepository.updateSubscription).toHaveBeenCalledWith('c1', expect.objectContaining({
      plan: 'Empresa',
      subscription_status: 'Activa',
    }));
    expect(auditService.log).toHaveBeenCalledWith(expect.objectContaining({
      action: 'PLAN_ACTIVATED',
    }));
  });

  it('suspende la suscripcion', async () => {
    companyRepository.updateSubscription.mockResolvedValue({
      id: 'c1',
      user_id: 'u1',
      name: 'ACME',
      subscription_status: 'Suspendida',
    });

    const company = await service.suspend('c1', 'mora');

    expect(company.subscription_status).toBe('Suspendida');
    expect(auditService.log).toHaveBeenCalledWith(expect.objectContaining({
      action: 'SUBSCRIPTION_SUSPENDED',
      details: 'mora',
    }));
  });

  it('expira trials vencidos y notifica solo cuando hay email', async () => {
    companyRepository.findExpiredTrials.mockResolvedValue([
      { id: 'c1', user_id: 'u1', name: 'A', email: 'a@a.com' },
      { id: 'c2', user_id: 'u2', name: 'B', email: null },
    ]);
    companyRepository.updateSubscription.mockResolvedValue({});

    const result = await service.expireOverdueTrials();

    expect(result).toEqual({ expired: 2 });
    expect(companyRepository.updateSubscription).toHaveBeenCalledTimes(2);
    expect(notificationService.notifyTrialExpired).toHaveBeenCalledTimes(1);
    expect(auditService.log).toHaveBeenCalledTimes(2);
  });
});
