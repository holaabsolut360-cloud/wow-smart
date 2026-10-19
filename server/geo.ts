// WowSmart v6 — Tiendas físicas, "Oferta cerca de tienda", Google Wallet y Web Push.
// Límite honesto: la web NO puede detectar la ubicación con la página cerrada (no hay geofencing
// en segundo plano). Rutas de entrega: (a) Google Wallet (merchantLocations + mensajes con aviso),
// (b) web abierta con permiso de ubicación, (c) Web Push enviado por el dueño a quienes aceptaron avisos.
import type express from 'express';
import { randomBytes } from 'crypto';
import webpush from 'web-push';
import type { Store } from './loyalty';
import type { Wallet } from './wallet';
import { nearbyOffers, validLatLng, walletQuotaLeft, offerLive } from './geoCore';
import { normPhone, validPhone } from './loyaltyCore';

type Co = { id: string; name: string; slug?: string; plan: string; status: string; logo?: string | null; color?: string | null };
export interface GeoDeps {
  store: () => Store | null;
  wallet: Wallet;
  getOwner: (req: express.Request) => Promise<Co | null>;
  companyBySlug: (slug: string) => Promise<Co | null>;
  companyById: (id: string) => Promise<Co | null>;
  loyalty: { access: (c: any) => boolean; settingsOf: (id: string) => Promise<any>; verifyCustomer: (c: any, phone: string, code: string) => Promise<any> };
  tierName: (companyId: string, lifetime: number) => Promise<string>;
  track: (companyId: string, type: string) => Promise<void>;
  vapid?: { publicKey?: string; privateKey?: string; subject?: string };
  pushMock?: boolean;
}
const clean = (s: any, n = 120) => String(s ?? '').replace(/[<>]/g, '').trim().slice(0, n);
const dateOk = (d: any) => /^\d{4}-\d{2}-\d{2}$/.test(String(d || '')) ? String(d) : null;

export function createGeo(deps: GeoDeps) {
  const S = () => { const s = deps.store(); if (!s) throw Object.assign(new Error('No disponible'), { status: 503 }); return s; };
  const pushOn = Boolean(deps.pushMock || (deps.vapid?.publicKey && deps.vapid?.privateKey));
  if (!deps.pushMock && pushOn) webpush.setVapidDetails(deps.vapid!.subject || 'mailto:hola.absolut360@gmail.com', deps.vapid!.publicKey!, deps.vapid!.privateKey!);
  const pushSent: any[] = [];

  const storesOf = async (cid: string) => (await S().sel('store_locations', { company_id: cid })).filter((s: any) => s.active !== false);
  const memberCode = async (cust: any) => {
    if (cust.member_code) return cust.member_code;
    const code = 'WS' + randomBytes(5).toString('hex').toUpperCase().slice(0, 8);
    await S().upd('loyalty_customers', cust.id, { member_code: code }); cust.member_code = code; return code;
  };
  const syncClass = async (c: Co) => { if (!deps.wallet.enabled) return; try { await deps.wallet.ensureClass(c, await storesOf(c.id)); } catch (e) { console.warn('[wallet] clase', (e as any)?.message); } };

  // Llamado por loyalty.addPoints: actualiza el pase si el cliente lo pidió.
  const onPointsChange = (companyId: string, cust: any) => {
    if (!deps.wallet.enabled) return;
    (async () => {
      const passes = await S().sel('wallet_passes', { customer_id: cust.id }); if (!passes.length) return;
      const c = await deps.companyById(companyId); if (!c) return;
      await deps.wallet.upsertObject(c, cust, await deps.tierName(companyId, cust.lifetime_points || 0), await memberCode(cust));
    })().catch(e => console.warn('[wallet] objeto', e?.message));
  };

  const sendPush = async (cid: string, payload: any) => {
    const subs = await S().sel('push_subscriptions', { company_id: cid });
    let ok = 0;
    for (const s of subs) {
      if (deps.pushMock) { pushSent.push({ endpoint: s.endpoint, payload }); ok++; continue; }
      try { await webpush.sendNotification({ endpoint: s.endpoint, keys: { p256dh: s.p256dh, auth: s.auth } }, JSON.stringify(payload), { TTL: 86400 }); ok++; }
      catch (e: any) { if (e?.statusCode === 404 || e?.statusCode === 410) await S().del('push_subscriptions', s.id, cid); }
    }
    return { total: subs.length, ok };
  };

  const register = (app: express.Express, rateLimit: any) => {
    const wrap = (fn: (req: express.Request, res: express.Response) => Promise<any>) => async (req: express.Request, res: express.Response) => {
      try { await fn(req, res); } catch (e: any) {
        const m = String(e?.message || '');
        if (/relation|does not exist|schema cache|column/i.test(m)) return res.status(503).json({ error: 'Falta actualizar la base (v6.sql)' });
        res.status(e?.status && e.status < 500 ? e.status : 500).json({ error: e?.status ? m : 'No se pudo completar la operación' });
      }
    };
    const ownerWrite = async (req: express.Request, res: express.Response) => {
      const c = await deps.getOwner(req); if (!c) { res.status(401).json({ error: 'Unauthorized' }); return null; }
      if (!deps.loyalty.access(c)) { res.status(402).json({ error: 'Disponible en los planes Negocio Pequeño y Empresa.', upsell: true }); return null; }
      return c;
    };
    const lim = rateLimit({ windowMs: 10 * 60 * 1000, limit: 30, standardHeaders: true, legacyHeaders: false });

    // ---- Panel del dueño ----
    app.get('/api/fidelizacion/cerca', wrap(async (req, res) => {
      const c = await ownerWrite(req, res); if (!c) return;
      const [stores, offers, subs, sends] = await Promise.all([
        S().sel('store_locations', { company_id: c.id }), S().sel('geo_offers', { company_id: c.id }, { order: 'created_at', desc: true }),
        S().sel('push_subscriptions', { company_id: c.id }), S().sel('loyalty_campaign_sends', { company_id: c.id, channel: 'wallet' }, { order: 'created_at', desc: true, limit: 20 }),
      ]);
      const passes = await S().sel('wallet_passes', { company_id: c.id });
      res.json({ stores, offers, pushSubscribers: subs.length, walletPasses: passes.length, walletEnabled: deps.wallet.enabled, pushEnabled: pushOn,
        walletQuotaLeft: walletQuotaLeft(sends.map((x: any) => x.created_at)) });
    }));
    app.post('/api/fidelizacion/tiendas', wrap(async (req, res) => {
      const c = await ownerWrite(req, res); if (!c) return;
      const b = req.body || {};
      if (!validLatLng(b.lat, b.lng)) return res.status(400).json({ error: 'Ubicación no válida. Usa "Mi ubicación actual" o pega las coordenadas de Google Maps.' });
      if ((await storesOf(c.id)).length >= 10) return res.status(400).json({ error: 'Máximo 10 tiendas (límite de Google y Apple Wallet).' });
      const row = await S().ins('store_locations', { company_id: c.id, name: clean(b.name, 60) || 'Tienda', address: clean(b.address, 160) || null,
        lat: +b.lat, lng: +b.lng, radius_m: Math.min(2000, Math.max(50, Math.round(+b.radiusM || 300))), active: true });
      syncClass(c); res.json(row);
    }));
    app.delete('/api/fidelizacion/tiendas/:id', wrap(async (req, res) => {
      const c = await ownerWrite(req, res); if (!c) return;
      await S().del('store_locations', req.params.id, c.id); syncClass(c); res.json({ ok: true });
    }));
    app.post('/api/fidelizacion/ofertas-cerca', wrap(async (req, res) => {
      const c = await ownerWrite(req, res); if (!c) return;
      const b = req.body || {}; const title = clean(b.title, 60); const body = clean(b.body, 300);
      if (!title) return res.status(400).json({ error: 'Escribe el título de la oferta' });
      res.json(await S().ins('geo_offers', { company_id: c.id, title, body: body || null, coupon_code: clean(b.couponCode, 20).toUpperCase().replace(/[^A-Z0-9_-]/g, '') || null,
        store_id: b.storeId || null, starts_at: dateOk(b.startsAt), ends_at: dateOk(b.endsAt), radius_m: b.radiusM ? Math.min(2000, Math.max(50, Math.round(+b.radiusM))) : null, active: true }));
    }));
    app.put('/api/fidelizacion/ofertas-cerca/:id', wrap(async (req, res) => {
      const c = await ownerWrite(req, res); if (!c) return;
      const [o] = await S().sel('geo_offers', { id: req.params.id, company_id: c.id }); if (!o) return res.status(404).json({ error: 'No encontrada' });
      await S().upd('geo_offers', o.id, { active: req.body?.active !== false }); res.json({ ok: true });
    }));
    app.delete('/api/fidelizacion/ofertas-cerca/:id', wrap(async (req, res) => {
      const c = await ownerWrite(req, res); if (!c) return;
      await S().del('geo_offers', req.params.id, c.id); res.json({ ok: true });
    }));
    // Enviar la oferta ahora: mensaje en Google Wallet (con aviso) + Web Push.
    app.post('/api/fidelizacion/ofertas-cerca/:id/enviar', wrap(async (req, res) => {
      const c = await ownerWrite(req, res); if (!c) return;
      const [o] = await S().sel('geo_offers', { id: req.params.id, company_id: c.id }); if (!o) return res.status(404).json({ error: 'No encontrada' });
      if (!offerLive(o)) return res.status(400).json({ error: 'La oferta no está vigente' });
      const text = `${o.body || ''}${o.coupon_code ? ` Usa el cupón ${o.coupon_code}.` : ''}`.trim() || o.title;
      const out: any = { wallet: 'no configurado', push: null };
      if (deps.wallet.enabled) {
        const sends = await S().sel('loyalty_campaign_sends', { company_id: c.id, channel: 'wallet' }, { order: 'created_at', desc: true, limit: 20 });
        if (walletQuotaLeft(sends.map((x: any) => x.created_at)) <= 0) out.wallet = 'límite diario alcanzado (3 avisos cada 24 h)';
        else {
          try { await syncClass(c); await deps.wallet.messageClass(c.id, o.title, text, true); out.wallet = 'enviado';
            await S().ins('loyalty_campaign_sends', { company_id: c.id, offer_id: o.id, channel: 'wallet' }); }
          catch (e: any) { out.wallet = e?.message || 'error'; }
        }
      }
      if (pushOn) {
        out.push = await sendPush(c.id, { title: `${c.name}: ${o.title}`, body: text, url: c.slug ? `/c/${c.slug}` : '/' });
        await S().ins('loyalty_campaign_sends', { company_id: c.id, offer_id: o.id, channel: 'push' });
      }
      await S().upd('geo_offers', o.id, { sent_at: new Date().toISOString() });
      await deps.track(c.id, 'geo_offer_sent');
      res.json({ ok: true, ...out });
    }));

    // ---- Público (cliente) ----
    // La ubicación del cliente se usa solo para este cálculo; no se guarda.
    app.get('/api/catalog/:slug/cerca', lim, wrap(async (req, res) => {
      const c = await deps.companyBySlug(String(req.params.slug)); if (!c) return res.json({ offers: [] });
      const st = await deps.loyalty.settingsOf(c.id); if (!st.enabled || !deps.loyalty.access(c)) return res.json({ offers: [] });
      const lat = Number(req.query.lat), lng = Number(req.query.lng);
      if (!validLatLng(lat, lng)) return res.status(400).json({ error: 'Ubicación no válida' });
      const r = nearbyOffers({ lat, lng }, await storesOf(c.id), await S().sel('geo_offers', { company_id: c.id }));
      if (r.offers.length) await deps.track(c.id, 'geo_offer_shown');
      res.json({ store: r.store && { name: r.store.name, address: r.store.address }, distance: r.store ? r.distance : null,
        offers: r.offers.map((o: any) => ({ id: o.id, title: o.title, body: o.body, couponCode: o.coupon_code, endsAt: o.ends_at })) });
    }));
    app.get('/api/catalog/:slug/extras', wrap(async (req, res) => {
      const c = await deps.companyBySlug(String(req.params.slug)); if (!c) return res.json({});
      const st = await deps.loyalty.settingsOf(c.id).catch(() => ({ enabled: false }));
      const on = st.enabled && deps.loyalty.access(c);
      const stores = on ? await storesOf(c.id).catch(() => []) : [];
      res.json({ wallet: on && deps.wallet.enabled, push: on && pushOn, vapidPublicKey: on && pushOn ? deps.vapid?.publicKey || 'mock' : null, hasStores: stores.length > 0 });
    }));
    app.post('/api/catalog/:slug/push', lim, wrap(async (req, res) => {
      if (!pushOn) return res.status(404).json({ error: 'Avisos no disponibles' });
      const c = await deps.companyBySlug(String(req.params.slug)); if (!c) return res.status(404).json({ error: 'Tienda no encontrada' });
      const sub = req.body?.subscription || {};
      const endpoint = String(sub.endpoint || ''); const p256dh = String(sub.keys?.p256dh || ''); const auth = String(sub.keys?.auth || '');
      if (!/^https:\/\//.test(endpoint) || endpoint.length > 1000 || !p256dh || !auth) return res.status(400).json({ error: 'Suscripción no válida' });
      const phone = normPhone(req.body?.phone);
      const v = validPhone(phone) && req.body?.code ? await deps.loyalty.verifyCustomer(c, phone, clean(req.body.code, 12).toUpperCase()) : null;
      const prev = (await S().sel('push_subscriptions', { company_id: c.id, endpoint }))[0];
      if (prev) await S().upd('push_subscriptions', prev.id, { p256dh, auth, customer_id: v?.cust?.id || prev.customer_id || null });
      else await S().ins('push_subscriptions', { company_id: c.id, endpoint, p256dh, auth, customer_id: v?.cust?.id || null });
      await deps.track(c.id, 'push_optin'); res.json({ ok: true });
    }));
    app.post('/api/catalog/:slug/wallet', lim, wrap(async (req, res) => {
      if (!deps.wallet.enabled) return res.status(404).json({ error: 'Google Wallet no disponible' });
      const c = await deps.companyBySlug(String(req.params.slug)); if (!c) return res.status(404).json({ error: 'Tienda no encontrada' });
      const phone = normPhone(req.body?.phone); const code = clean(req.body?.code, 12).toUpperCase();
      const v = validPhone(phone) ? await deps.loyalty.verifyCustomer(c, phone, code) : null;
      if (!v) return res.status(403).json({ error: 'Número o código de pedido incorrecto' });
      const full = (await deps.companyById(c.id)) || c;
      const mc = await memberCode(v.cust);
      const url = deps.wallet.saveUrl(full, await storesOf(c.id), v.cust, v.tier.name, mc);
      if (!(await S().sel('wallet_passes', { customer_id: v.cust.id })).length)
        await S().ins('wallet_passes', { company_id: c.id, customer_id: v.cust.id, object_id: deps.wallet.objectId(v.cust.id) });
      await deps.track(c.id, 'wallet_save_click');
      res.json({ url, memberCode: mc });
    }));
  };
  return { register, onPointsChange, pushSent, syncClass };
}
