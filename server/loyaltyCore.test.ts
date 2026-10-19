import { describe, it, expect } from 'vitest';
import { tierInfo, pointsFor, couponCheck, challengeProgress, planAllowsLoyalty, sanitizeTiers, DEFAULT_TIERS } from './loyaltyCore';
describe('fidelización', () => {
  it('niveles y progreso', () => {
    expect(tierInfo(0, DEFAULT_TIERS).tier.name).toBe('Bronce');
    const t = tierInfo(450, DEFAULT_TIERS); expect(t.tier.name).toBe('Plata'); expect(t.next?.name).toBe('Oro'); expect(t.toNext).toBe(550);
    expect(tierInfo(5000, DEFAULT_TIERS).progress).toBe(100);
    expect(sanitizeTiers([{ name: 'X', min: 50, benefitPct: 99 }])[0]).toEqual({ name: 'X', min: 0, benefitPct: 50 });
  });
  it('puntos con bono de nivel', () => { expect(pointsFor(80.9, 1)).toBe(80); expect(pointsFor(100, 1, 10)).toBe(110); expect(pointsFor(-5, 1)).toBe(0); });
  it('cupones', () => {
    const now = new Date('2026-10-19T12:00:00Z');
    expect(couponCheck({ code: 'A', discount_type: 'percentage', value: 10 }, { now, subtotal: 200 })).toEqual({ ok: true, discount: 20 });
    expect(couponCheck({ code: 'A', discount_type: 'fixed', value: 50 }, { now, subtotal: 30 }).discount).toBe(30);
    expect(couponCheck({ code: 'A', discount_type: 'fixed', value: 5, expires_at: '2026-10-18' }, { now, subtotal: 30 }).ok).toBe(false);
    expect(couponCheck({ code: 'A', discount_type: 'fixed', value: 5, usage_limit: 2, used_count: 2 }, { now, subtotal: 30 }).ok).toBe(false);
    expect(couponCheck({ code: 'A', discount_type: 'fixed', value: 5, customer_id: 'x' }, { now, subtotal: 30, customerId: 'y' }).ok).toBe(false);
  });
  it('retos', () => {
    const now = '2026-10-19T17:00:00Z';
    const m = challengeProgress({ id: '1', name: '3', kind: 'orders_month', target: 3, reward_points: 100 }, ['2026-10-02T15:00:00Z', '2026-10-10T15:00:00Z', '2026-09-30T15:00:00Z'], now);
    expect(m.current).toBe(2); expect(m.done).toBe(false);
    const w = challengeProgress({ id: '2', name: 'r', kind: 'streak_weeks', target: 3, reward_points: 50 }, ['2026-10-19T15:00:00Z', '2026-10-13T15:00:00Z', '2026-10-06T15:00:00Z'], now);
    expect(w.done).toBe(true);
  });
  it('planes', () => {
    expect(planAllowsLoyalty('Emprendedor', 'Activa', ['Negocio Pequeño', 'Empresa'])).toBe(false);
    expect(planAllowsLoyalty('Empresa', 'Activa', ['Negocio Pequeño', 'Empresa'])).toBe(true);
    expect(planAllowsLoyalty('Emprendedor', 'Prueba Gratuita', ['Empresa'])).toBe(true);
  });
});
