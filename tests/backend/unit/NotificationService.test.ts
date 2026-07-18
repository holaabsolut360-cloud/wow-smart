import { describe, it, expect, vi } from 'vitest';
import { NotificationService, type EmailProvider } from '../../../server/services/NotificationService';

describe('NotificationService', () => {
  it('envia cuando proveedor responde correctamente', async () => {
    const provider: EmailProvider = { send: vi.fn().mockResolvedValue(undefined) };
    const service = new NotificationService(provider, { maxAttempts: 2, timeoutMs: 100, retryDelayMs: 1 });

    await expect(service.notifyPaymentSubmitted('a@a.com', 'Negocio')).resolves.toBeUndefined();
    expect(provider.send).toHaveBeenCalledTimes(1);
  });

  it('reintenta cuando el proveedor falla temporalmente', async () => {
    const send = vi.fn()
      .mockRejectedValueOnce(new Error('smtp down'))
      .mockResolvedValueOnce(undefined);
    const service = new NotificationService({ send }, { maxAttempts: 3, timeoutMs: 100, retryDelayMs: 1 });

    await expect(service.notifyTrialExpired('a@a.com', 'ACME')).resolves.toBeUndefined();
    expect(send).toHaveBeenCalledTimes(2);
  });

  it('falla al agotar reintentos', async () => {
    const send = vi.fn().mockRejectedValue(new Error('resend unavailable'));
    const service = new NotificationService({ send }, { maxAttempts: 2, timeoutMs: 100, retryDelayMs: 1 });

    await expect(service.notifySubscriptionRejected('a@a.com', 'ACME', 'x')).rejects.toThrow('resend unavailable');
    expect(send).toHaveBeenCalledTimes(2);
  });

  it('falla por timeout del proveedor', async () => {
    const send = vi.fn().mockImplementation(() => new Promise<void>(() => {}));
    const service = new NotificationService({ send }, { maxAttempts: 1, timeoutMs: 10, retryDelayMs: 1 });

    await expect(service.notifyTrialStarted('a@a.com', 'ACME', '2026-07-20')).rejects.toThrow('timeout');
    expect(send).toHaveBeenCalledTimes(1);
  });
});
