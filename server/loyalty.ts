// WowSmart v5 — Fidelización tipo "Open Loyalty" para negocios pequeños.
// Puntos, niveles, premios, cupones (cumpleaños / "te extrañamos"), retos y racha.
// Activación opcional por empresa (apagado por defecto). Los puntos se otorgan SOLO
// cuando el dueño marca el pedido como Pagado o Entregado (anti-fraude).
import type express from 'express';
import { randomUUID } from 'crypto';
import {
  DEFAULT_SETTINGS, DEFAULT_PLANS, sanitizeTiers, tierInfo, pointsFor, planAllowsLoyalty, couponCheck,
  challengeProgress, orderCode, normPhone, validPhone, DELIVERED_STATUSES, monthKey,
} from './loyaltyCore';

export interface Store {
  sel(table: string, eq: Record<string, any>, opts?: { order?: string; desc?: boolean; limit?: number }): Promise<any[]>;
  ins(table: string, row: any): Promise<any>;
  upd(table: string, id: string, patch: any, key?: string): Promise<void>;
  del(table: string, id: string, companyId: string): Promise<void>;
}

export const memoryStore = (): Store & { data: Record<string, any[]> } => {
  const data: Record<string, any[]> = {};
  const T = (t: string) => (data[t] ||= []);
  const match = (r: any, eq: Record<string, any>) => Object.entries(eq).every(([k, v]) => r[k] === v);
  return {
    data,
    async sel(t, eq, o = {}) {
      let rows = T(t).filter(r => match(r, eq));
      if (o.order) rows = rows.slice().sort((a, b) => (a[o.order!] > b[o.order!] ? 1 : -1) * (o.desc ? -1 : 1));
      return o.limit ? rows.slice(0, o.limit) : rows;
    },
    async ins(t, row) {
      if (t === 'loyalty_transactions' && row.order_id && T(t).some(r => r.order_id === row.order_id && r.reason === row.reason)) throw new Error('duplicate');
      const r = { id: randomUUID(), created_at: new Date().toISOString(), ...row }; T(t).push(r); return r;
    },
    async upd(t, id, patch, key = 'id') { T(t).filter(r => r[key] === id).forEach(r => Object.assign(r, patch)); },
    async del(t, id, companyId) { data[t] = T(t).filter(r => !(r.id === id && r.company_id === companyId)); },
  };
};

export const supabaseStore = (w: any): Store => ({
  async sel(t, eq, o = {}) {
    let q = w.from(t).select('*');
    for (const [k, v] of Object.entries(eq)) q = q.eq(k, v);
    if (o.order) q = q.order(o.order, { ascending: !o.desc });
    q = q.limit(o.limit || 5000);
    const { data, error } = await q; if (error) throw new Error(error.message); return data || [];
  },
  async ins(t, row) { const { data, error } = await w.from(t).insert(row).select('*').single(); if (error) throw new Error(error.message); return data; },
  async upd(t, id, patch, key = 'id') { const { error } = await w.from(t).update(patch).eq(key, id); if (error) throw new Error(error.message); },
  async del(t, id, companyId) { const { error } = await w.from(t).delete().eq('id', id).eq('company_id', companyId); if (error) throw new Error(error.message); },
});

type CompanyInfo = { id: string; name: string; slug?: string; plan: string; status: string; currency?: string };
export interface Deps {
  store: () => Store | null;
  getOwner: (req: express.Request) => Promise<CompanyInfo | null>;
  companyBySlug: (slug: string) => Promise<CompanyInfo | null>;
  companyById: (id: string) => Promise<CompanyInfo | null>;
  getOrder: (id: string) => Promise<any | null>; // snake_case: id, company_id, total, subtotal, status, order_code, loyalty_phone, reward_id
  setOrder: (id: string, patch: any) => Promise<void>;
  track: (companyId: string, type: string) => Promise<void>;
  allowedPlans: () => string[];
  lastOrderFor: (companyId: string, phone: string) => Promise<any | null>;
  onPointsChange?: (companyId: string, customer: any) => void; // v6: actualiza el pase de Google Wallet
}

const clean = (s: any, n = 80) => String(s ?? '').replace(/[<>]/g, '').trim().slice(0, n);
const num = (v: any, d = 0, min = 0, max = 1e7) => { const n = Number(v); return Number.isFinite(n) ? Math.min(max, Math.max(min, n)) : d; };
const today = () => new Date(Date.now() - 5 * 3600000).toISOString().slice(0, 10);
const addDays = (d: number) => new Date(Date.now() - 5 * 3600000 + d * 86400000).toISOString().slice(0, 10);
const genCode = (prefix: string) => `${prefix}${orderCode().slice(0, 5)}`;

export function createLoyalty(deps: Deps) {
  const S = () => { const s = deps.store(); if (!s) throw Object.assign(new Error('Fidelización no disponible'), { status: 503 }); return s; };

  const settingsOf = async (companyId: string) => {
    const [row] = await S().sel('loyalty_settings', { company_id: companyId });
    return row ? { ...DEFAULT_SETTINGS, ...row, tiers: sanitizeTiers(row.tiers) } : { ...DEFAULT_SETTINGS, company_id: companyId, _new: true };
  };
  const access = (c: CompanyInfo) => planAllowsLoyalty(c.plan, c.status, deps.allowedPlans());

  const findCustomer = async (companyId: string, phone: string) =>
    (await S().sel('loyalty_customers', { company_id: companyId, phone }))[0] || null;

  const addPoints = async (companyId: string, cust: any, delta: number, reason: string, orderId: string | null = null) => {
    if (!delta) return cust;
    await S().ins('loyalty_transactions', { company_id: companyId, customer_id: cust.id, delta, reason, order_id: orderId });
    const points = Math.max(0, (cust.points || 0) + delta);
    const lifetime = (cust.lifetime_points || 0) + Math.max(0, delta);
    await S().upd('loyalty_customers', cust.id, { points, lifetime_points: lifetime });
    const next = { ...cust, points, lifetime_points: lifetime };
    try { deps.onPointsChange?.(companyId, next); } catch {}
    return next;
  };

  const issueCoupon = async (companyId: string, customerId: string | null, auto: string, kind: string, value: number, validDays: number, prefix: string) =>
    S().ins('loyalty_coupons', { company_id: companyId, code: genCode(prefix), discount_type: kind === 'fixed' ? 'fixed' : 'percentage', value,
      expires_at: addDays(validDays), usage_limit: 1, used_count: 0, auto, customer_id: customerId, active: true });

  const deliveredDates = async (companyId: string, customerId: string) =>
    (await S().sel('loyalty_transactions', { company_id: companyId, customer_id: customerId, reason: 'compra' })).map((t: any) => t.created_at);

  // --- Llamado desde POST /api/orders (pedido público del catálogo) ---
  const onPublicOrder = async (body: any) => {
    const out: any = { columns: {}, info: null };
    try {
      const companyId = String(body.companyId || '');
      const c = await deps.companyById(companyId); if (!c) return out;
      const st = await settingsOf(companyId);
      const code = orderCode();
      out.columns.order_code = code;
      if (!st.enabled || !access(c)) return out;
      const phone = normPhone(body.customerPhone);
      if (!validPhone(phone)) return out;
      out.columns.loyalty_phone = phone;
      let cust = await findCustomer(companyId, phone);
      let joined = false;
      if (!cust) {
        cust = await S().ins('loyalty_customers', { company_id: companyId, phone, name: clean(body.customerName, 60),
          birthday: /^\d{4}-\d{2}-\d{2}$/.test(String(body.loyalty?.birthday || '')) ? body.loyalty.birthday : null,
          points: 0, lifetime_points: 0, orders_count: 0, last_purchase_at: null });
        joined = true; await deps.track(companyId, 'loyalty_join');
      } else if (body.loyalty?.birthday && !cust.birthday && /^\d{4}-\d{2}-\d{2}$/.test(body.loyalty.birthday)) {
        await S().upd('loyalty_customers', cust.id, { birthday: body.loyalty.birthday });
      }
      // Cupón de fidelización (se cuenta su uso al hacer el pedido)
      const cc = clean(body.couponCode, 30).toUpperCase();
      if (cc) {
        const cp = (await S().sel('loyalty_coupons', { company_id: companyId, code: cc }))[0];
        const chk = couponCheck(cp, { subtotal: num(body.subtotal), customerId: cust.id });
        if (cp && chk.ok) { await S().upd('loyalty_coupons', cp.id, { used_count: (cp.used_count || 0) + 1 }); await deps.track(companyId, 'coupon_applied'); }
      }
      // Premio: se reserva en el pedido; los puntos se descuentan al aprobar el pedido.
      if (body.loyalty?.rewardId) {
        const rw = (await S().sel('loyalty_rewards', { company_id: companyId, id: String(body.loyalty.rewardId) }))[0];
        if (rw && rw.active !== false && cust.points >= rw.points_cost) {
          out.columns.reward_id = rw.id; out.columns.reward_points = rw.points_cost;
          await deps.track(companyId, 'reward_redeemed');
        }
      }
      out.info = { orderCode: code, joined, points: cust.points };
    } catch (e) { /* tablas aún no creadas: el pedido sigue normal */ }
    return out;
  };

  // --- Llamado cuando el dueño cambia el estado del pedido ---
  const onOrderStatus = async (orderId: string, status: string) => {
    if (!DELIVERED_STATUSES.includes(status)) return null;
    try {
      const o = await deps.getOrder(orderId);
      if (!o || !o.loyalty_phone || o.loyalty_status === 'otorgado') return null;
      const st = await settingsOf(o.company_id);
      const c = await deps.companyById(o.company_id);
      if (!st.enabled || !c || !access(c)) return null;
      let cust = await findCustomer(o.company_id, o.loyalty_phone); if (!cust) return null;
      await deps.setOrder(orderId, { loyalty_status: 'otorgado' }); // marca primero: evita doble premio
      const ti = tierInfo(cust.lifetime_points || 0, st.tiers);
      const base = num(o.subtotal) - num(o.discount) > 0 ? num(o.subtotal) - num(o.discount) : num(o.total);
      const pts = pointsFor(base, st.points_per_sol, ti.tier.benefitPct);
      try { cust = await addPoints(o.company_id, cust, pts, 'compra', orderId); } catch { return null; } // duplicado
      await S().upd('loyalty_customers', cust.id, { orders_count: (cust.orders_count || 0) + 1, last_purchase_at: new Date().toISOString(), winback_sent_at: null });
      await deps.track(o.company_id, 'points_earned');
      if (o.reward_id && o.reward_points) {
        if (cust.points >= o.reward_points) { try { cust = await addPoints(o.company_id, cust, -o.reward_points, 'canje', orderId); } catch {} }
      }
      // Retos
      const dates = await deliveredDates(o.company_id, cust.id);
      const chs = (await S().sel('loyalty_challenges', { company_id: o.company_id })).filter((x: any) => x.active !== false);
      const done: string[] = [];
      for (const ch of chs) {
        const p = challengeProgress(ch, dates);
        if (!p.done) continue;
        const prev = await S().sel('loyalty_challenge_completions', { challenge_id: ch.id, customer_id: cust.id, period: p.period });
        if (prev.length) continue;
        try { await S().ins('loyalty_challenge_completions', { company_id: o.company_id, challenge_id: ch.id, customer_id: cust.id, period: p.period }); } catch { continue; }
        if (ch.reward_points) cust = await addPoints(o.company_id, cust, ch.reward_points, `reto:${ch.name}`.slice(0, 60));
        if (ch.reward_coupon_value) await issueCoupon(o.company_id, cust.id, 'reto', ch.reward_coupon_type, num(ch.reward_coupon_value), 30, 'RETO');
        await deps.track(o.company_id, 'challenge_completed'); done.push(ch.name);
      }
      return { points: pts, challenges: done };
    } catch { return null; }
  };

  // --- Tarea periódica: cupones de cumpleaños y "te extrañamos" ---
  const runAutoCoupons = async () => {
    const s = deps.store(); if (!s) return;
    try {
      const all = (await s.sel('loyalty_settings', { enabled: true }));
      const mmdd = today().slice(5);
      for (const st0 of all) {
        const st = { ...DEFAULT_SETTINGS, ...st0 };
        const c = await deps.companyById(st.company_id); if (!c || !access(c)) continue;
        const custs = await s.sel('loyalty_customers', { company_id: st.company_id });
        for (const cu of custs) {
          const bc = st.birthday_coupon || {};
          if (bc.enabled && cu.birthday && String(cu.birthday).slice(5, 10) === mmdd && cu.birthday_coupon_year !== today().slice(0, 4)) {
            await s.upd('loyalty_customers', cu.id, { birthday_coupon_year: today().slice(0, 4) });
            await issueCoupon(st.company_id, cu.id, 'cumpleanos', bc.discountType, num(bc.value, 10), num(bc.validDays, 15, 1, 90), 'CUMPLE');
          }
          const wb = st.winback || {};
          if (wb.enabled && cu.last_purchase_at && !cu.winback_sent_at &&
              Date.now() - new Date(cu.last_purchase_at).getTime() > num(wb.days, 30, 7, 365) * 86400000) {
            await s.upd('loyalty_customers', cu.id, { winback_sent_at: new Date().toISOString() });
            await issueCoupon(st.company_id, cu.id, 'te_extranamos', wb.discountType, num(wb.value, 10), num(wb.validDays, 10, 1, 90), 'VUELVE');
          }
        }
      }
    } catch { /* tablas aún no creadas */ }
  };

  // v6: valida teléfono + código del último pedido (misma regla que "Mi tarjeta")
  const verifyCustomer = async (c: CompanyInfo, phone: string, code: string) => {
    const st = await settingsOf(c.id);
    if (!st.enabled || !access(c)) return null;
    const cust = await findCustomer(c.id, phone);
    const lastOrder = cust ? await deps.lastOrderFor(c.id, phone) : null;
    if (!cust || !lastOrder || String(lastOrder.order_code || '').toUpperCase() !== code) return null;
    return { cust, st, tier: tierInfo(cust.lifetime_points || 0, st.tiers).tier };
  };

  // Vista pública de la tarjeta del cliente (requiere teléfono + código del último pedido)
  const cardFor = async (c: CompanyInfo, phone: string, code: string) => {
    const st = await settingsOf(c.id);
    if (!st.enabled || !access(c)) return { status: 404, body: { error: 'Esta tienda no tiene programa de puntos' } };
    const cust = await findCustomer(c.id, phone);
    const lastOrder = cust ? await deps.lastOrderFor(c.id, phone) : null;
    if (!cust || !lastOrder || String(lastOrder.order_code || '').toUpperCase() !== code) return { status: 403, body: { error: 'Número o código de pedido incorrecto. Revisa el código de tu último pedido.' } };
    const ti = tierInfo(cust.lifetime_points || 0, st.tiers);
    const [rewards, coupons, chs] = await Promise.all([
      S().sel('loyalty_rewards', { company_id: c.id }), S().sel('loyalty_coupons', { company_id: c.id }), S().sel('loyalty_challenges', { company_id: c.id }),
    ]);
    const dates = await deliveredDates(c.id, cust.id);
    const myCoupons = coupons.filter((x: any) => x.active !== false && (x.customer_id === cust.id || (!x.customer_id && !x.auto)) && couponCheck(x, { subtotal: 100, customerId: cust.id }).ok);
    return { status: 200, body: {
      company: { name: c.name, slug: c.slug },
      customer: { name: cust.name, points: cust.points, lifetime: cust.lifetime_points, lastPurchaseAt: cust.last_purchase_at },
      tier: ti.tier, nextTier: ti.next, progress: ti.progress, toNext: ti.toNext, tiers: st.tiers, pointsPerSol: st.points_per_sol,
      rewards: rewards.filter((r: any) => r.active !== false).map((r: any) => ({ id: r.id, name: r.name, pointsCost: r.points_cost, type: r.type, value: r.value, canRedeem: cust.points >= r.points_cost })),
      coupons: myCoupons.map((x: any) => ({ code: x.code, discountType: x.discount_type, value: x.value, expiresAt: x.expires_at, personal: Boolean(x.customer_id) })),
      challenges: chs.filter((x: any) => x.active !== false).map((x: any) => ({ id: x.id, name: x.name, kind: x.kind, rewardPoints: x.reward_points, ...challengeProgress(x, dates) })),
    } };
  };

  const register = (app: express.Express, rateLimit: any) => {
    const wrap = (fn: (req: express.Request, res: express.Response) => Promise<any>) => async (req: express.Request, res: express.Response) => {
      try { await fn(req, res); } catch (e: any) {
        const m = String(e?.message || '');
        if (/relation|does not exist|schema cache/i.test(m)) return res.status(503).json({ error: 'Falta actualizar la base (v5.sql)' });
        res.status(e?.status || 500).json({ error: e?.status ? m : 'No se pudo completar la operación' });
      }
    };
    const owner = async (req: express.Request, res: express.Response) => {
      const c = await deps.getOwner(req); if (!c) { res.status(401).json({ error: 'Unauthorized' }); return null; } return c;
    };
    const ownerWrite = async (req: express.Request, res: express.Response) => {
      const c = await owner(req, res); if (!c) return null;
      if (!access(c)) { res.status(402).json({ error: 'La fidelización está disponible en los planes Negocio Pequeño y Empresa.', upsell: true }); return null; }
      return c;
    };

    app.get('/api/fidelizacion', wrap(async (req, res) => {
      const c = await owner(req, res); if (!c) return;
      const st = await settingsOf(c.id);
      const allowed = access(c);
      if (!allowed) return res.json({ allowed: false, plans: deps.allowedPlans(), settings: st, preview: true });
      const [customers, rewards, coupons, challenges, txs] = await Promise.all([
        S().sel('loyalty_customers', { company_id: c.id }, { order: 'points', desc: true }),
        S().sel('loyalty_rewards', { company_id: c.id }, { order: 'points_cost' }),
        S().sel('loyalty_coupons', { company_id: c.id }, { order: 'created_at', desc: true, limit: 300 }),
        S().sel('loyalty_challenges', { company_id: c.id }),
        S().sel('loyalty_transactions', { company_id: c.id }, { order: 'created_at', desc: true, limit: 2000 }),
      ]);
      const month = monthKey(new Date().toISOString());
      res.json({ allowed: true, plans: deps.allowedPlans(), settings: st, rewards, coupons, challenges,
        customers: customers.map((cu: any) => ({ ...cu, tier: tierInfo(cu.lifetime_points || 0, st.tiers).tier.name })),
        stats: {
          members: customers.length,
          pointsIssuedMonth: txs.filter((t: any) => t.delta > 0 && monthKey(t.created_at) === month).reduce((s: number, t: any) => s + t.delta, 0),
          redemptionsMonth: txs.filter((t: any) => t.reason === 'canje' && monthKey(t.created_at) === month).length,
          pointsOutstanding: customers.reduce((s: number, cu: any) => s + (cu.points || 0), 0),
        },
        publicPath: c.slug ? `/c/${c.slug}/mis-puntos` : null,
      });
    }));

    app.put('/api/fidelizacion/ajustes', wrap(async (req, res) => {
      const c = await ownerWrite(req, res); if (!c) return;
      const b = req.body || {};
      const row = {
        company_id: c.id, enabled: b.enabled === true, points_per_sol: num(b.pointsPerSol ?? b.points_per_sol, 1, 0, 100),
        tiers: sanitizeTiers(b.tiers),
        birthday_coupon: { enabled: Boolean(b.birthdayCoupon?.enabled), discountType: b.birthdayCoupon?.discountType === 'fixed' ? 'fixed' : 'percentage', value: num(b.birthdayCoupon?.value, 10, 0, 1000), validDays: num(b.birthdayCoupon?.validDays, 15, 1, 90) },
        winback: { enabled: Boolean(b.winback?.enabled), days: num(b.winback?.days, 30, 7, 365), discountType: b.winback?.discountType === 'fixed' ? 'fixed' : 'percentage', value: num(b.winback?.value, 10, 0, 1000), validDays: num(b.winback?.validDays, 10, 1, 90) },
        updated_at: new Date().toISOString(),
      };
      const cur = await S().sel('loyalty_settings', { company_id: c.id });
      if (cur.length) await S().upd('loyalty_settings', c.id, row, 'company_id'); else await S().ins('loyalty_settings', row);
      res.json({ ok: true, settings: row });
    }));

    const crud = (path: string, table: string, build: (b: any) => any) => {
      app.post(`/api/fidelizacion/${path}`, wrap(async (req, res) => {
        const c = await ownerWrite(req, res); if (!c) return;
        const row = build(req.body || {}); if (row.error) return res.status(400).json(row);
        res.json(await S().ins(table, { ...row, company_id: c.id }));
      }));
      app.put(`/api/fidelizacion/${path}/:id`, wrap(async (req, res) => {
        const c = await ownerWrite(req, res); if (!c) return;
        const [cur] = await S().sel(table, { id: req.params.id, company_id: c.id }); if (!cur) return res.status(404).json({ error: 'No encontrado' });
        await S().upd(table, cur.id, { active: req.body?.active !== false }); res.json({ ok: true });
      }));
      app.delete(`/api/fidelizacion/${path}/:id`, wrap(async (req, res) => {
        const c = await ownerWrite(req, res); if (!c) return;
        await S().del(table, req.params.id, c.id); res.json({ ok: true });
      }));
    };
    crud('premios', 'loyalty_rewards', b => {
      const name = clean(b.name, 60); const cost = Math.floor(num(b.pointsCost, 0, 1, 1e6));
      if (!name || !cost) return { error: 'Completa el nombre y los puntos' };
      return { name, points_cost: cost, type: b.type === 'product' ? 'product' : 'discount', value: num(b.value, 0, 0, 1e5), active: true };
    });
    crud('cupones', 'loyalty_coupons', b => {
      const code = clean(b.code, 20).toUpperCase().replace(/[^A-Z0-9_-]/g, '');
      if (!code || !num(b.value)) return { error: 'Completa el código y el valor' };
      return { code, discount_type: b.discountType === 'fixed' ? 'fixed' : 'percentage', value: num(b.value, 0, 0, b.discountType === 'fixed' ? 1e5 : 100),
        expires_at: /^\d{4}-\d{2}-\d{2}$/.test(String(b.expiresAt || '')) ? b.expiresAt : null,
        usage_limit: b.usageLimit ? Math.floor(num(b.usageLimit, 0, 1, 1e6)) : null, used_count: 0, auto: null, customer_id: null, active: true };
    });
    crud('retos', 'loyalty_challenges', b => {
      const name = clean(b.name, 60); if (!name) return { error: 'Ponle un nombre al reto' };
      return { name, kind: b.kind === 'streak_weeks' ? 'streak_weeks' : 'orders_month', target: Math.floor(num(b.target, 3, 1, 52)),
        reward_points: Math.floor(num(b.rewardPoints, 0, 0, 1e5)), reward_coupon_value: b.rewardCouponValue ? num(b.rewardCouponValue, 0, 0, 1000) : null,
        reward_coupon_type: b.rewardCouponType === 'fixed' ? 'fixed' : 'percentage', active: true };
    });

    app.post('/api/fidelizacion/clientes/:id/ajuste', wrap(async (req, res) => {
      const c = await ownerWrite(req, res); if (!c) return;
      const [cu] = await S().sel('loyalty_customers', { id: req.params.id, company_id: c.id }); if (!cu) return res.status(404).json({ error: 'Cliente no encontrado' });
      const delta = Math.trunc(num(req.body?.delta, 0, -1e6, 1e6)); if (!delta) return res.status(400).json({ error: 'Indica los puntos' });
      const after = await addPoints(c.id, cu, delta, `ajuste:${clean(req.body?.reason, 50) || 'manual'}`);
      if (delta > 0) await deps.track(c.id, 'points_earned');
      res.json({ ok: true, points: after.points });
    }));

    const cardLimiter = rateLimit({ windowMs: 10 * 60 * 1000, limit: 20, standardHeaders: true, legacyHeaders: false });
    // Público: info mínima del programa para el carrito
    app.get('/api/catalog/:slug/fidelizacion', wrap(async (req, res) => {
      const c = await deps.companyBySlug(String(req.params.slug)); if (!c) return res.status(404).json({ enabled: false });
      const st = await settingsOf(c.id);
      if (!st.enabled || !access(c)) return res.json({ enabled: false });
      const rewards = (await S().sel('loyalty_rewards', { company_id: c.id })).filter((r: any) => r.active !== false);
      res.json({ enabled: true, pointsPerSol: st.points_per_sol, tiers: st.tiers, rewards: rewards.map((r: any) => ({ id: r.id, name: r.name, pointsCost: r.points_cost, type: r.type, value: r.value })) });
    }));
    app.post('/api/catalog/:slug/mis-puntos', cardLimiter, wrap(async (req, res) => {
      const c = await deps.companyBySlug(String(req.params.slug)); if (!c) return res.status(404).json({ error: 'Tienda no encontrada' });
      const phone = normPhone(req.body?.phone); const code = clean(req.body?.code, 12).toUpperCase();
      if (!validPhone(phone) || code.length < 4) return res.status(400).json({ error: 'Ingresa tu WhatsApp y el código de tu último pedido' });
      const r = await cardFor(c, phone, code); res.status(r.status).json(r.body);
    }));
    // Público: valida un cupón de fidelización en el carrito
    app.post('/api/catalog/:slug/cupon', cardLimiter, wrap(async (req, res) => {
      const c = await deps.companyBySlug(String(req.params.slug)); if (!c) return res.status(404).json({ ok: false });
      const st = await settingsOf(c.id); if (!st.enabled || !access(c)) return res.json({ ok: false, reason: 'Cupón no válido' });
      const code = clean(req.body?.code, 30).toUpperCase();
      const cp = (await S().sel('loyalty_coupons', { company_id: c.id, code }))[0];
      const phone = normPhone(req.body?.phone);
      const cust = cp?.customer_id && validPhone(phone) ? await findCustomer(c.id, phone) : null;
      const chk = couponCheck(cp, { subtotal: num(req.body?.subtotal), customerId: cust?.id || null });
      if (!chk.ok) return res.json(chk);
      res.json({ ok: true, coupon: { code: cp.code, discountType: cp.discount_type, discountValue: cp.value, loyalty: true } });
    }));
  };

  return { register, onPublicOrder, onOrderStatus, runAutoCoupons, settingsOf, access, verifyCustomer, findCustomer };
}
export { DEFAULT_PLANS };
