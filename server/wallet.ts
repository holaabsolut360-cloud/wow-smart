// WowSmart v6 — Google Wallet (tarjeta de fidelización).
// LoyaltyClass por empresa, LoyaltyObject por cliente. Firma JWT RS256 con la cuenta de servicio.
// Si faltan GOOGLE_WALLET_ISSUER_ID o GOOGLE_WALLET_SA_JSON (base64), todo queda deshabilitado (botón oculto).
// WALLET_MOCK=1 (solo desarrollo): no llama a Google; registra las llamadas en memoria.
import crypto from 'crypto';

const API = 'https://walletobjects.googleapis.com/walletobjects/v1';
const b64url = (b: Buffer | string) => Buffer.from(b).toString('base64').replace(/=+$/, '').replace(/\+/g, '-').replace(/\//g, '_');
export const safeId = (s: string) => String(s).replace(/[^A-Za-z0-9._-]/g, '_');

export type WalletCompany = { id: string; name: string; slug?: string; logo?: string | null; color?: string | null };
export type WalletCustomer = { id: string; name?: string | null; phone: string; points: number; lifetime_points?: number };
export type WalletStore = { lat: number; lng: number };

export function createWallet(opts: { issuerId?: string; saJsonB64?: string; baseUrl: string; mock?: boolean; fetchFn?: typeof fetch }) {
  let sa: any = null;
  try { if (opts.saJsonB64) sa = JSON.parse(Buffer.from(opts.saJsonB64, 'base64').toString('utf8')); } catch { sa = null; }
  const mock = Boolean(opts.mock);
  const issuer = opts.issuerId || '';
  const enabled = Boolean(issuer && (mock || (sa?.client_email && sa?.private_key)));
  const calls: any[] = [];
  const doFetch = opts.fetchFn || fetch;
  let token: { v: string; exp: number } | null = null;

  const signJwt = (payload: any) => {
    const head = b64url(JSON.stringify({ alg: 'RS256', typ: 'JWT' }));
    const body = b64url(JSON.stringify(payload));
    if (mock && !sa) return `${head}.${body}.mock`;
    const sig = crypto.createSign('RSA-SHA256').update(`${head}.${body}`).sign(sa.private_key);
    return `${head}.${body}.${b64url(sig)}`;
  };
  const accessToken = async () => {
    if (token && token.exp > Date.now() + 60000) return token.v;
    const now = Math.floor(Date.now() / 1000);
    const assertion = signJwt({ iss: sa.client_email, scope: 'https://www.googleapis.com/auth/wallet_object.issuer', aud: 'https://oauth2.googleapis.com/token', iat: now, exp: now + 3600 });
    const r = await doFetch('https://oauth2.googleapis.com/token', { method: 'POST', headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({ grant_type: 'urn:ietf:params:oauth:grant-type:jwt-bearer', assertion }).toString() });
    const j: any = await r.json(); if (!r.ok) throw new Error(`wallet auth ${r.status}`);
    token = { v: j.access_token, exp: Date.now() + (j.expires_in || 3600) * 1000 }; return token.v;
  };
  const call = async (method: string, path: string, body?: any): Promise<{ status: number; json: any }> => {
    if (mock) { calls.push({ method, path, body }); return { status: method === 'GET' ? 404 : 200, json: body || {} }; }
    const r = await doFetch(`${API}${path}`, { method, headers: { Authorization: `Bearer ${await accessToken()}`, 'Content-Type': 'application/json' }, body: body ? JSON.stringify(body) : undefined });
    const json = await r.json().catch(() => ({}));
    return { status: r.status, json };
  };

  const ls = (v: string) => ({ defaultValue: { language: 'es-419', value: v } });
  const absUrl = (u?: string | null) => (u && /^https:\/\//.test(u) ? u : `${opts.baseUrl}/icon.png`);
  const hex = (c?: string | null) => (/^#[0-9a-f]{6}$/i.test(String(c || '')) ? String(c) : '#6d28d9');
  const classId = (companyId: string) => `${issuer}.ws_${safeId(companyId)}`;
  const objectId = (customerId: string) => `${issuer}.wsm_${safeId(customerId)}`;

  const buildClass = (c: WalletCompany, stores: WalletStore[] = []) => ({
    id: classId(c.id),
    issuerName: 'WowSmart',
    programName: `${c.name}`.slice(0, 40),
    programLogo: { sourceUri: { uri: absUrl(c.logo) }, contentDescription: ls(`Logo ${c.name}`) },
    hexBackgroundColor: hex(c.color),
    reviewStatus: 'UNDER_REVIEW',
    countryCode: 'PE',
    localizedRewardsTier: ls('Nivel'),
    multipleDevicesAndHoldersAllowedStatus: 'ONE_USER_ALL_DEVICES',
    homepageUri: c.slug ? { uri: `${opts.baseUrl}/c/${c.slug}`, description: 'Ver catálogo' } : undefined,
    // Notificaciones "cerca de la tienda": Google decide radio, permanencia y texto. Máx. 10.
    merchantLocations: stores.slice(0, 10).map(s => ({ latitude: Number(s.lat), longitude: Number(s.lng) })),
  });
  const buildObject = (c: WalletCompany, cu: WalletCustomer, tierName: string, memberCode: string) => ({
    id: objectId(cu.id),
    classId: classId(c.id),
    state: 'ACTIVE',
    accountId: memberCode,
    accountName: String(cu.name || 'Cliente').slice(0, 20),
    loyaltyPoints: { label: 'Puntos', balance: { int: Math.max(0, Math.floor(cu.points || 0)) } },
    secondaryLoyaltyPoints: { label: 'Nivel', balance: { string: tierName } },
    barcode: { type: 'QR_CODE', value: memberCode, alternateText: memberCode },
    linksModuleData: c.slug ? { uris: [{ uri: `${opts.baseUrl}/c/${c.slug}/mis-puntos`, description: 'Mis puntos y premios', id: 'mis-puntos' }] } : undefined,
  });

  const upsert = async (kind: 'loyaltyClass' | 'loyaltyObject', obj: any) => {
    const g = await call('GET', `/${kind}/${encodeURIComponent(obj.id)}`);
    if (g.status === 404) { const r = await call('POST', `/${kind}`, obj); if (r.status >= 300) throw new Error(`${kind} insert ${r.status}`); return 'insert'; }
    const { reviewStatus, ...patch } = obj; // Google no permite volver a UNDER_REVIEW en patch de clases aprobadas
    const r = await call('PATCH', `/${kind}/${encodeURIComponent(obj.id)}`, kind === 'loyaltyClass' ? patch : obj);
    if (r.status >= 300) throw new Error(`${kind} patch ${r.status}`); return 'patch';
  };

  return {
    enabled, issuer, calls, classId, objectId, buildClass, buildObject,
    ensureClass: (c: WalletCompany, stores: WalletStore[]) => upsert('loyaltyClass', buildClass(c, stores)),
    upsertObject: (c: WalletCompany, cu: WalletCustomer, tier: string, code: string) => upsert('loyaltyObject', buildObject(c, cu, tier, code)),
    // Enlace "Agregar a Google Wallet": JWT firmado con clase + objeto completos (no exige que existan antes).
    saveUrl: (c: WalletCompany, stores: WalletStore[], cu: WalletCustomer, tier: string, code: string) => {
      const jwt = signJwt({ iss: sa?.client_email || 'mock@wowsmart', aud: 'google', typ: 'savetowallet', origins: [opts.baseUrl],
        payload: { loyaltyClasses: [buildClass(c, stores)], loyaltyObjects: [buildObject(c, cu, tier, code)] } });
      return `https://pay.google.com/gp/v/save/${jwt}`;
    },
    // Mensaje con notificación push a TODOS los que guardaron la tarjeta (máx. 3 notificaciones/24 h por pase).
    messageClass: async (companyId: string, header: string, body: string, notify = true) => {
      const r = await call('POST', `/loyaltyClass/${encodeURIComponent(classId(companyId))}/addMessage`, {
        message: { id: `m${Date.now()}`, header: header.slice(0, 60), body: body.slice(0, 500), messageType: notify ? 'TEXT_AND_NOTIFY' : 'TEXT' } });
      if (r.status >= 300) throw Object.assign(new Error(r.status === 429 || /quota/i.test(JSON.stringify(r.json)) ? 'Límite de Google: máx. 3 avisos por día' : `Wallet ${r.status}`), { status: r.status });
      return true;
    },
  };
}
export type Wallet = ReturnType<typeof createWallet>;
