import React, { useEffect, useState } from 'react';
import { MapPin, X } from 'lucide-react';
import { track as gaTrack } from '../../lib/analytics';

// v6 — "Oferta cerca de tienda" en la web. Solo funciona con la página ABIERTA y con permiso de ubicación.
// auto=true: solo consulta si el permiso YA fue concedido antes (no molesta con el aviso del navegador).
export function NearbyOffer({ slug, auto = false }: { slug: string; auto?: boolean }) {
  const [r, setR] = useState<any>(null);
  const [state, setState] = useState<'idle' | 'loading' | 'none' | 'denied'>('idle');
  const [hidden, setHidden] = useState(false);
  const check = () => {
    if (!('geolocation' in navigator)) return setState('denied');
    setState('loading');
    navigator.geolocation.getCurrentPosition(async (p) => {
      try {
        const q = await fetch(`/api/catalog/${encodeURIComponent(slug)}/cerca?lat=${p.coords.latitude}&lng=${p.coords.longitude}`);
        const j = await q.json();
        if (j.offers?.length) { setR(j); setState('idle'); gaTrack('geo_offer_shown', { catalog: slug }); } else setState('none');
      } catch { setState('none'); }
    }, () => setState('denied'), { enableHighAccuracy: true, timeout: 10000, maximumAge: 120000 });
  };
  useEffect(() => {
    if (!auto) return;
    (navigator as any).permissions?.query({ name: 'geolocation' }).then((p: any) => { if (p.state === 'granted') check(); }).catch(() => {});
  }, [slug, auto]);
  if (hidden) return null;
  if (r) return (
    <div role="status" className="fixed bottom-24 left-4 right-4 md:left-auto md:w-96 z-50 rounded-2xl bg-white shadow-2xl border-2 border-amber-300 p-4" data-testid="nearby-offer">
      <button aria-label="Cerrar" onClick={() => setHidden(true)} className="absolute top-2 right-2 p-1 text-slate-500"><X className="w-4 h-4" /></button>
      <div className="flex items-center gap-2 text-amber-700 text-xs font-bold"><MapPin className="w-4 h-4" aria-hidden="true" /> Estás cerca de {r.store?.name || 'nuestra tienda'}{r.distance != null ? ` (${r.distance} m)` : ''}</div>
      {r.offers.map((o: any) => (
        <div key={o.id} className="mt-2">
          <div className="font-extrabold text-slate-900 text-lg">{o.title}</div>
          {o.body && <p className="text-sm text-slate-600">{o.body}</p>}
          {o.couponCode && <div className="mt-2 inline-block font-mono font-extrabold text-indigo-700 border-2 border-dashed border-indigo-300 rounded-lg px-3 py-1">{o.couponCode}</div>}
          {o.endsAt && <div className="text-xs text-slate-500 mt-1">Válido hasta {new Date(o.endsAt + 'T12:00:00').toLocaleDateString('es-PE')}</div>}
        </div>))}
    </div>
  );
  if (auto) return null;
  return (
    <div className="bg-white rounded-3xl border border-slate-200 p-5">
      <h2 className="font-bold text-slate-900 flex items-center gap-2"><MapPin className="w-5 h-5 text-indigo-600" aria-hidden="true" /> Ofertas cerca de la tienda</h2>
      <p className="text-sm text-slate-600 mt-1">Si estás cerca de la tienda, te mostramos la oferta del momento. Tu ubicación solo se usa para esto y no se guarda.</p>
      <button onClick={check} disabled={state === 'loading'} className="mt-3 w-full py-2.5 rounded-xl border-2 border-indigo-600 text-indigo-700 font-bold disabled:opacity-50">{state === 'loading' ? 'Buscando…' : 'Ver ofertas cerca de mí'}</button>
      {state === 'none' && <p className="text-xs text-slate-500 mt-2">No hay ofertas cerca de ti en este momento.</p>}
      {state === 'denied' && <p className="text-xs text-rose-600 mt-2">No pudimos usar tu ubicación. Actívala en tu navegador para ver ofertas cercanas.</p>}
    </div>
  );
}

const urlB64 = (s: string) => { const p = '='.repeat((4 - (s.length % 4)) % 4); const b = atob((s + p).replace(/-/g, '+').replace(/_/g, '/')); return Uint8Array.from([...b].map(c => c.charCodeAt(0))); };
// Botón "Recibir ofertas" (Web Push). En iPhone solo funciona si la web se agregó a la pantalla de inicio (iOS 16.4+).
export function PushOptIn({ slug, vapidKey, phone, code }: { slug: string; vapidKey: string; phone?: string; code?: string }) {
  const [st, setSt] = useState<'idle' | 'ok' | 'err' | 'unsupported'>(() => (typeof window !== 'undefined' && 'serviceWorker' in navigator && 'PushManager' in window ? 'idle' : 'unsupported'));
  const go = async () => {
    try {
      if ((await Notification.requestPermission()) !== 'granted') return setSt('err');
      const reg = await navigator.serviceWorker.register('/sw-push.js');
      const sub = await reg.pushManager.subscribe({ userVisibleOnly: true, applicationServerKey: urlB64(vapidKey) });
      const r = await fetch(`/api/catalog/${encodeURIComponent(slug)}/push`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ subscription: sub.toJSON(), phone, code }) });
      setSt(r.ok ? 'ok' : 'err'); if (r.ok) gaTrack('push_optin', { catalog: slug });
    } catch { setSt('err'); }
  };
  if (st === 'unsupported') return <p className="text-xs text-slate-500">Para recibir avisos en iPhone, agrega esta página a tu pantalla de inicio (Compartir → “Agregar a inicio”).</p>;
  if (st === 'ok') return <p className="text-sm font-bold text-emerald-700">✅ Listo, te avisaremos de nuevas ofertas.</p>;
  return <><button onClick={go} className="w-full py-2.5 rounded-xl bg-slate-900 text-white font-bold">🔔 Recibir avisos de ofertas</button>{st === 'err' && <p className="text-xs text-rose-600 mt-1">No se pudieron activar los avisos. Revisa los permisos de notificación.</p>}</>;
}
