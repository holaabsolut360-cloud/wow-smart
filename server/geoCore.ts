// WowSmart v6 — utilidades puras de ofertas por cercanía (testeables).
export const haversineM = (a: { lat: number; lng: number }, b: { lat: number; lng: number }) => {
  const R = 6371000, r = (x: number) => (x * Math.PI) / 180;
  const dLat = r(b.lat - a.lat), dLng = r(b.lng - a.lng);
  const h = Math.sin(dLat / 2) ** 2 + Math.cos(r(a.lat)) * Math.cos(r(b.lat)) * Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(h));
};
export const validLatLng = (lat: any, lng: any) => Number.isFinite(+lat) && Number.isFinite(+lng) && Math.abs(+lat) <= 90 && Math.abs(+lng) <= 180 && !(+lat === 0 && +lng === 0);
const limaToday = (now = new Date()) => new Date(now.getTime() - 5 * 3600000).toISOString().slice(0, 10);
export const offerLive = (o: any, now = new Date()) => {
  if (!o || o.active === false) return false;
  const d = limaToday(now);
  if (o.starts_at && String(o.starts_at).slice(0, 10) > d) return false;
  if (o.ends_at && String(o.ends_at).slice(0, 10) < d) return false;
  return true;
};
// Devuelve la tienda más cercana dentro del radio y las ofertas vigentes que aplican.
export const nearbyOffers = (pos: { lat: number; lng: number }, stores: any[], offers: any[], now = new Date()) => {
  let best: any = null;
  for (const s of stores.filter(x => x.active !== false)) {
    const d = haversineM(pos, { lat: +s.lat, lng: +s.lng });
    if (!best || d < best.d) best = { s, d };
  }
  if (!best) return { store: null, distance: null, offers: [] };
  const live = offers.filter(o => offerLive(o, now) && (!o.store_id || o.store_id === best.s.id) && best.d <= (Number(o.radius_m) || Number(best.s.radius_m) || 300));
  return { store: live.length ? best.s : null, distance: Math.round(best.d), offers: live };
};
// Google Wallet: máx. 3 notificaciones por pase cada 24 h.
export const walletQuotaLeft = (sendsIso: string[], now = Date.now(), max = 3) => max - sendsIso.filter(t => now - new Date(t).getTime() < 86400000).length;
