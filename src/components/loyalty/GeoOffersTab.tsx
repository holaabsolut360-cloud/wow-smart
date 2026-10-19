import React, { useEffect, useState } from 'react';
import { MapPin, Send, Trash2, Plus, Smartphone, Bell, Info } from 'lucide-react';
import { apiClient } from '../../services/api';

// v6 — Tiendas físicas + "Oferta cerca de tienda" (panel del dueño).
const card = 'bg-white rounded-2xl border border-slate-200 p-5 shadow-sm';
const input = 'w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-sm outline-none focus:border-indigo-500';
const btn = 'inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-indigo-600 text-white font-bold text-sm hover:bg-indigo-700 disabled:opacity-50';
const msg = (e: any) => String(e?.message || 'Error').replace(/^API error \d+: /, '').replace(/^\{"error":"(.*)"\}$/, '$1');

// Acepta "-12.12, -77.03" o un enlace de Google Maps con @lat,lng
export const parseLatLng = (t: string) => { const m = String(t).match(/(-?\d{1,2}\.\d+)\s*,\s*(-?\d{1,3}\.\d+)/); return m ? { lat: +m[1], lng: +m[2] } : null; };

export function GeoOffersTab() {
  const [d, setD] = useState<any>(null);
  const [err, setErr] = useState('');
  const [s, setS] = useState<any>({ name: '', address: '', coords: '', radiusM: 300 });
  const [o, setO] = useState<any>({ title: '', body: '', couponCode: '', startsAt: '', endsAt: '' });
  const [note, setNote] = useState('');
  const load = () => apiClient.get('/api/fidelizacion/cerca').then(setD).catch(e => setErr(msg(e)));
  useEffect(() => { load(); }, []);
  if (err) return <div className="p-4 rounded-2xl bg-amber-50 text-amber-800 border border-amber-200">{err}</div>;
  if (!d) return <div className="p-6 text-slate-500">Cargando…</div>;
  const here = () => navigator.geolocation?.getCurrentPosition(p => setS({ ...s, coords: `${p.coords.latitude.toFixed(6)}, ${p.coords.longitude.toFixed(6)}` }), () => alert('No se pudo obtener tu ubicación'), { enableHighAccuracy: true });
  const addStore = async (e: React.FormEvent) => {
    e.preventDefault(); const ll = parseLatLng(s.coords); if (!ll) return alert('Pega las coordenadas (ej. -12.1211, -77.0297) o usa "Mi ubicación actual".');
    try { await apiClient.post('/api/fidelizacion/tiendas', { ...s, ...ll }); setS({ name: '', address: '', coords: '', radiusM: 300 }); load(); } catch (er) { alert(msg(er)); }
  };
  const addOffer = async (e: React.FormEvent) => { e.preventDefault(); try { await apiClient.post('/api/fidelizacion/ofertas-cerca', o); setO({ title: '', body: '', couponCode: '', startsAt: '', endsAt: '' }); load(); } catch (er) { alert(msg(er)); } };
  const send = async (x: any) => {
    if (!confirm(`¿Enviar "${x.title}" ahora a tus clientes con la tarjeta en Google Wallet y con avisos activados?`)) return;
    try { const r = await apiClient.post(`/api/fidelizacion/ofertas-cerca/${x.id}/enviar`, {}); setNote(`Google Wallet: ${r.wallet}. Avisos web: ${r.push ? `${r.push.ok} de ${r.push.total}` : 'no configurado'}.`); load(); } catch (er) { alert(msg(er)); }
  };
  return (
    <div className="space-y-6" data-testid="geo-tab">
      <div className="p-4 rounded-2xl bg-sky-50 border border-sky-200 text-sky-900 text-sm flex gap-3"><Info className="w-5 h-5 shrink-0" aria-hidden="true" />
        <div><b>¿Cómo llega la oferta cuando el cliente pasa por tu tienda?</b>
          <ul className="list-disc ml-5 mt-1 space-y-0.5">
            <li><b>Android (Google Wallet):</b> si el cliente guardó su tarjeta, Google le muestra un aviso al estar cerca de tu tienda. Google decide la distancia y el texto. Además puedes <b>enviar</b> la oferta como mensaje a la tarjeta (máx. 3 avisos al día).</li>
            <li><b>Web:</b> cuando el cliente abre tu catálogo o “Mis puntos” cerca de la tienda y dio permiso de ubicación, ve la oferta al instante.</li>
            <li><b>Avisos web:</b> llegan a quienes aceptaron “Recibir avisos”. Ojo: una página web no puede saber dónde está el cliente con el navegador cerrado.</li>
          </ul></div></div>
      <div className="grid grid-cols-3 gap-4">
        <div className={card}><Smartphone className="w-5 h-5 text-indigo-600" aria-hidden="true" /><div className="text-xs text-slate-600">Tarjetas en Google Wallet</div><div className="text-2xl font-extrabold">{d.walletEnabled ? d.walletPasses : '—'}</div>{!d.walletEnabled && <div className="text-xs text-slate-500">Pendiente de activar</div>}</div>
        <div className={card}><Bell className="w-5 h-5 text-indigo-600" aria-hidden="true" /><div className="text-xs text-slate-600">Clientes con avisos</div><div className="text-2xl font-extrabold">{d.pushEnabled ? d.pushSubscribers : '—'}</div></div>
        <div className={card}><Send className="w-5 h-5 text-indigo-600" aria-hidden="true" /><div className="text-xs text-slate-600">Avisos Wallet disponibles hoy</div><div className="text-2xl font-extrabold">{d.walletEnabled ? d.walletQuotaLeft : '—'}</div></div>
      </div>
      {note && <div role="status" className="p-3 rounded-xl bg-emerald-50 text-emerald-800 border border-emerald-200 text-sm">{note}</div>}
      <div className="grid lg:grid-cols-2 gap-6">
        <section className={card}>
          <h2 className="font-bold text-lg mb-3 flex items-center gap-2"><MapPin className="w-5 h-5 text-indigo-600" aria-hidden="true" /> Mis tiendas físicas ({d.stores.length}/10)</h2>
          {!d.stores.length ? <p className="text-sm text-slate-500 mb-3">Agrega la ubicación de tu tienda para activar las ofertas por cercanía.</p> :
            <ul className="divide-y mb-4">{d.stores.map((x: any) => <li key={x.id} className="py-2 flex justify-between gap-2"><div><b>{x.name}</b><div className="text-xs text-slate-500">{x.address || ''} · radio {x.radius_m} m · <a className="text-indigo-700" target="_blank" rel="noopener noreferrer" href={`https://www.google.com/maps?q=${x.lat},${x.lng}`}>ver en mapa</a></div></div>
              <button aria-label="Eliminar tienda" onClick={async () => { if (confirm('¿Eliminar tienda?')) { await apiClient.delete(`/api/fidelizacion/tiendas/${x.id}`); load(); } }} className="text-rose-600"><Trash2 className="w-4 h-4" /></button></li>)}</ul>}
          <form onSubmit={addStore} className="space-y-2">
            <label className="block text-xs text-slate-600">Nombre<input className={input} value={s.name} onChange={e => setS({ ...s, name: e.target.value })} placeholder="Tienda Miraflores" /></label>
            <label className="block text-xs text-slate-600">Dirección<input className={input} value={s.address} onChange={e => setS({ ...s, address: e.target.value })} placeholder="Av. Larco 123, Miraflores" /></label>
            <label className="block text-xs text-slate-600">Coordenadas o enlace de Google Maps<input className={input} value={s.coords} onChange={e => setS({ ...s, coords: e.target.value })} placeholder="-12.1211, -77.0297" /></label>
            <div className="flex flex-wrap gap-2 items-end">
              <button type="button" onClick={here} className="px-3 py-2 rounded-lg border border-indigo-600 text-indigo-700 text-sm font-bold">📍 Mi ubicación actual</button>
              {s.address && <a className="text-xs text-indigo-700 underline" target="_blank" rel="noopener noreferrer" href={`https://www.google.com/maps/search/${encodeURIComponent(s.address)}`}>Buscar dirección en Google Maps</a>}
              <label className="text-xs text-slate-600 w-28">Radio web (m)<input type="number" min={50} max={2000} className={input} value={s.radiusM} onChange={e => setS({ ...s, radiusM: Number(e.target.value) })} /></label>
            </div>
            <button className={btn}><Plus className="w-4 h-4" aria-hidden="true" /> Agregar tienda</button>
          </form>
        </section>
        <section className={card}>
          <h2 className="font-bold text-lg mb-3">Oferta cerca de tienda</h2>
          {d.offers.length > 0 && <ul className="divide-y mb-4">{d.offers.map((x: any) => <li key={x.id} className="py-2 flex justify-between gap-2 items-center"><div><b className={x.active === false ? 'line-through text-slate-400' : ''}>{x.title}</b><div className="text-xs text-slate-500">{x.coupon_code ? `Cupón ${x.coupon_code} · ` : ''}{x.starts_at || 'hoy'} → {x.ends_at || 'sin fin'}{x.sent_at ? ` · enviada ${new Date(x.sent_at).toLocaleString('es-PE')}` : ''}</div></div>
            <div className="flex gap-3 text-xs font-bold whitespace-nowrap"><button onClick={() => send(x)} className="text-emerald-700">Enviar ahora</button>
              <button onClick={async () => { await apiClient.put(`/api/fidelizacion/ofertas-cerca/${x.id}`, { active: x.active === false }); load(); }} className="text-indigo-700">{x.active === false ? 'Activar' : 'Pausar'}</button>
              <button onClick={async () => { if (confirm('¿Eliminar?')) { await apiClient.delete(`/api/fidelizacion/ofertas-cerca/${x.id}`); load(); } }} className="text-rose-600">Eliminar</button></div></li>)}</ul>}
          <form onSubmit={addOffer} className="space-y-2">
            <label className="block text-xs text-slate-600">Título<input className={input} value={o.title} onChange={e => setO({ ...o, title: e.target.value })} placeholder="¡Pasa hoy y llévate 15% de descuento!" /></label>
            <label className="block text-xs text-slate-600">Texto<textarea className={input} value={o.body} onChange={e => setO({ ...o, body: e.target.value })} placeholder="Válido en tienda mostrando tu tarjeta de puntos." /></label>
            <div className="grid grid-cols-3 gap-2">
              <label className="text-xs text-slate-600">Cupón<input className={input} value={o.couponCode} onChange={e => setO({ ...o, couponCode: e.target.value.toUpperCase() })} placeholder="CERCA15" /></label>
              <label className="text-xs text-slate-600">Desde<input type="date" className={input} value={o.startsAt} onChange={e => setO({ ...o, startsAt: e.target.value })} /></label>
              <label className="text-xs text-slate-600">Hasta<input type="date" className={input} value={o.endsAt} onChange={e => setO({ ...o, endsAt: e.target.value })} /></label>
            </div>
            <p className="text-xs text-slate-500">Tip: crea el mismo código en la pestaña Cupones para que funcione en el carrito.</p>
            <button className={btn}><Plus className="w-4 h-4" aria-hidden="true" /> Programar oferta</button>
          </form>
        </section>
      </div>
    </div>
  );
}
