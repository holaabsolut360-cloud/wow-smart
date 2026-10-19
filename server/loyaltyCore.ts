// WowSmart v5 — Fidelización: lógica pura (sin base de datos), probada con vitest.
export type Tier = { name: string; min: number; benefitPct: number };
export const DEFAULT_TIERS: Tier[] = [
  { name: 'Bronce', min: 0, benefitPct: 0 },
  { name: 'Plata', min: 300, benefitPct: 5 },
  { name: 'Oro', min: 1000, benefitPct: 10 },
];
export const DEFAULT_SETTINGS = {
  enabled: false,
  points_per_sol: 1,
  tiers: DEFAULT_TIERS,
  birthday_coupon: { enabled: false, discountType: 'percentage', value: 10, validDays: 15 },
  winback: { enabled: false, days: 30, discountType: 'percentage', value: 10, validDays: 10 },
};
export const DEFAULT_PLANS = ['Negocio Pequeño', 'Empresa'];

export const normPhone = (p: any) => String(p || '').replace(/\D/g, '').replace(/^51(?=9\d{8}$)/, '');
export const validPhone = (p: string) => /^\d{9,15}$/.test(p);

export const sanitizeTiers = (t: any): Tier[] => {
  const arr = (Array.isArray(t) ? t : DEFAULT_TIERS).slice(0, 6).map((x: any) => ({
    name: String(x?.name || '').trim().slice(0, 30) || 'Nivel',
    min: Math.max(0, Math.floor(Number(x?.min) || 0)),
    benefitPct: Math.min(50, Math.max(0, Number(x?.benefitPct) || 0)),
  })).sort((a, b) => a.min - b.min);
  if (!arr.length) return DEFAULT_TIERS;
  arr[0].min = 0;
  return arr;
};

export const tierInfo = (lifetime: number, tiers: Tier[]) => {
  const ts = sanitizeTiers(tiers);
  let idx = 0;
  ts.forEach((t, i) => { if (lifetime >= t.min) idx = i; });
  const next = ts[idx + 1] || null;
  const cur = ts[idx];
  const progress = next ? Math.round(((lifetime - cur.min) / Math.max(1, next.min - cur.min)) * 100) : 100;
  return { tier: cur, next, progress: Math.min(100, Math.max(0, progress)), toNext: next ? Math.max(0, next.min - lifetime) : 0 };
};

export const pointsFor = (amount: number, pointsPerSol: number, tierBonusPct = 0) => {
  const base = Math.floor(Math.max(0, Number(amount) || 0) * Math.max(0, Number(pointsPerSol) || 0));
  return Math.floor(base * (1 + Math.max(0, tierBonusPct) / 100));
};

export const planAllowsLoyalty = (plan: string, status: string, allowed: string[]) =>
  status === 'Prueba Gratuita' || allowed.map(s => s.toLowerCase()).includes(String(plan || '').toLowerCase());

export type Coupon = { code: string; discount_type: 'percentage' | 'fixed'; value: number; expires_at?: string | null;
  usage_limit?: number | null; used_count?: number; active?: boolean; customer_id?: string | null };

export const couponCheck = (c: Coupon | null | undefined, opts: { now?: Date; subtotal: number; customerId?: string | null }) => {
  if (!c || c.active === false) return { ok: false, reason: 'Cupón no válido' };
  const now = opts.now || new Date();
  if (c.expires_at && new Date(String(c.expires_at).slice(0, 10) + 'T23:59:59-05:00') < now) return { ok: false, reason: 'Cupón vencido' };
  if (c.usage_limit && (c.used_count || 0) >= c.usage_limit) return { ok: false, reason: 'Cupón agotado' };
  if (c.customer_id && c.customer_id !== opts.customerId) return { ok: false, reason: 'Este cupón es personal' };
  const sub = Math.max(0, opts.subtotal);
  const discount = c.discount_type === 'percentage' ? sub * Math.min(100, c.value) / 100 : Math.min(sub, c.value);
  return { ok: true, discount: Math.round(discount * 100) / 100 };
};

// Retos: "orders_month" = N pedidos entregados en el mes; "streak_weeks" = compras en N semanas seguidas.
export type Challenge = { id: string; name: string; kind: 'orders_month' | 'streak_weeks'; target: number; reward_points: number; active?: boolean };
const limaDate = (iso: string) => new Date(new Date(iso).getTime() - 5 * 3600000);
export const monthKey = (iso: string) => limaDate(iso).toISOString().slice(0, 7);
export const weekIndex = (iso: string) => Math.floor((limaDate(iso).getTime() / 86400000 + 3) / 7); // semanas lun-dom

export const challengeProgress = (ch: Challenge, deliveredAt: string[], nowIso = new Date().toISOString()) => {
  const target = Math.max(1, ch.target);
  if (ch.kind === 'orders_month') {
    const m = monthKey(nowIso);
    const n = deliveredAt.filter(d => monthKey(d) === m).length;
    return { current: Math.min(n, target), target, done: n >= target, period: m };
  }
  const weeks = new Set(deliveredAt.map(weekIndex));
  let w = weekIndex(nowIso); let streak = 0;
  if (!weeks.has(w)) w -= 1; // la semana actual aún puede completarse
  while (weeks.has(w)) { streak++; w--; }
  return { current: Math.min(streak, target), target, done: streak >= target, period: `racha-${weekIndex(nowIso) - streak + 1}` };
};

export const orderCode = () => {
  const a = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let s = ''; for (let i = 0; i < 6; i++) s += a[Math.floor(Math.random() * a.length)];
  return s;
};
export const DELIVERED_STATUSES = ['Entregado', 'Pagado'];
