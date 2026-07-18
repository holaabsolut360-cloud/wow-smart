import { describe, it, expect, vi } from 'vitest';
import { FeatureFlagService } from '../../../server/services/FeatureFlagService';

describe('FeatureFlagService', () => {
  it('retorna flags desde repositorio', async () => {
    const repository = {
      listByPlan: vi.fn().mockResolvedValue([
        { plan: 'Negocio', feature: 'pos', enabled: true },
        { plan: 'Negocio', feature: 'inventory', enabled: true },
      ]),
    };
    const service = new FeatureFlagService(repository as any);

    await expect(service.getFeaturesForPlan('Negocio')).resolves.toEqual(['pos', 'inventory']);
    await expect(service.hasFeature('Negocio', 'pos')).resolves.toBe(true);
  });

  it('aplica fallback cuando falla el repositorio', async () => {
    const repository = {
      listByPlan: vi.fn().mockRejectedValue(new Error('db down')),
    };
    const service = new FeatureFlagService(repository as any);

    const features = await service.getFeaturesForPlan('Emprendedor');
    expect(features).toContain('catalog');
    expect(features).toContain('qr_code');
  });

  it('retorna arreglo vacio para planes desconocidos', async () => {
    const repository = {
      listByPlan: vi.fn().mockResolvedValue([]),
    };
    const service = new FeatureFlagService(repository as any);

    await expect(service.getFeaturesForPlan('PlanX')).resolves.toEqual([]);
  });
});
