import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Award, Gift, Ticket, Trophy, ArrowLeft } from 'lucide-react';
import { track as gaTrack } from '../lib/analytics';
import { NearbyOffer, PushOptIn } from '../components/loyalty/NearbyOffer';

// v5 — "Mi tarjeta": el cliente ve sus puntos con su WhatsApp + el código de su último pedido.
export default function MisPuntos() {
  const { slug = '' } = useParams();
  const [phone, setPhone] = useState('');
  const [code, setCode] = useState('');
  const [d, setD] = useState<any>(null);
  const [err, setErr] = useState('');
  const [loading, setLoading] = useState(false);
  const [extras, setExtras] = useState<any>({});
  const [walletBusy, setWalletBusy] = useState(false);
  useEffect(() => { fetch(`/api/catalog/${encodeURIComponent(slug)}/extras`).then(r => r.json()).then(setExtras).catch(() => {}); }, [slug]);
  const addToWallet = async () => {
    setWalletBusy(true);
    try {
      const r = await fetch(`/api/catalog/${encodeURIComponent(slug)}/wallet`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ phone, code }) });
      const j = await r.json(); if (!r.ok) throw new Error(j.error);
      gaTrack('wallet_save_click', { catalog: slug }); window.location.href = j.url;
    } catch (e: any) { setErr(e.message || 'No se pudo generar la tarjeta'); } finally { setWalletBusy(false); }
  };
  useEffect(() => {
    document.title = 'Mis puntos — WowSmart';
    const q = new URLSearchParams(window.location.search);
    if (q.get('tel') && q.get('codigo')) { setPhone(q.get('tel')!); setCode(q.get('codigo')!.toUpperCase()); lookup(q.get('tel')!, q.get('codigo')!.toUpperCase()); return; }
    try { const s = JSON.parse(localStorage.getItem(`ws_pedido_${slug}`) || 'null'); if (s) { setPhone(s.phone || ''); setCode(s.code || ''); } } catch {}
  }, [slug]);
  const lookup = async (p: string, c: string) => {
    setErr(''); setLoading(true);
    try {
      const r = await fetch(`/api/catalog/${encodeURIComponent(slug)}/mis-puntos`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ phone: p, code: c }) });
      const j = await r.json();
      if (!r.ok) { setErr(j.error || 'No pudimos encontrar tu tarjeta'); setD(null); } else { setD(j); gaTrack('loyalty_card_view', { catalog: slug }); }
    } catch { setErr('Revisa tu conexión e inténtalo de nuevo'); } finally { setLoading(false); }
  };
  const submit = (e: React.FormEvent) => { e.preventDefault(); lookup(phone, code); };
  const tierBg = (n = '') => /oro/i.test(n) ? 'from-amber-400 to-yellow-600' : /plata/i.test(n) ? 'from-slate-400 to-slate-600' : 'from-indigo-600 to-violet-700';

  return (
    <main className="min-h-screen bg-slate-50 px-4 py-8">
      <div className="max-w-md mx-auto space-y-5">
        <Link to={`/c/${slug}`} className="inline-flex items-center gap-1 text-sm font-bold text-indigo-700"><ArrowLeft className="w-4 h-4" aria-hidden="true" /> Volver al catálogo</Link>
        {!d ? (
          <form onSubmit={submit} className="bg-white rounded-3xl shadow-sm border border-slate-200 p-6 space-y-4">
            <Award className="w-10 h-10 text-indigo-600" aria-hidden="true" />
            <h1 className="text-2xl font-extrabold text-slate-900">Mi tarjeta de puntos</h1>
            <p className="text-sm text-slate-600">Ingresa tu número de WhatsApp y el código de tu último pedido (está en el mensaje de WhatsApp de tu pedido).</p>
            <label className="block text-sm font-medium text-slate-700">WhatsApp
              <input required type="tel" inputMode="tel" autoComplete="tel" value={phone} onChange={e => setPhone(e.target.value)} placeholder="987 654 321" className="mt-1 w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 outline-none focus:border-indigo-500" /></label>
            <label className="block text-sm font-medium text-slate-700">Código del último pedido
              <input required value={code} onChange={e => setCode(e.target.value.toUpperCase())} placeholder="Ej. WS7K2Q" maxLength={12} className="mt-1 w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 font-mono uppercase outline-none focus:border-indigo-500" /></label>
            {err && <p role="alert" className="text-sm text-rose-600">{err}</p>}
            <button disabled={loading} className="w-full py-3 rounded-xl bg-indigo-600 text-white font-bold hover:bg-indigo-700 disabled:opacity-50">{loading ? 'Buscando…' : 'Ver mis puntos'}</button>
          </form>
        ) : (
          <>
            <section className={`rounded-3xl p-6 text-white bg-gradient-to-br ${tierBg(d.tier?.name)} shadow-lg`} data-testid="loyalty-card">
              <div className="text-sm opacity-90">{d.company.name}</div>
              <div className="text-lg font-bold">Hola, {d.customer.name || 'cliente'} 👋</div>
              <div className="mt-4 text-5xl font-extrabold">{Number(d.customer.points).toLocaleString('es-PE')}<span className="text-lg font-bold ml-2">puntos</span></div>
              <div className="mt-3 inline-block bg-white/20 px-3 py-1 rounded-full text-sm font-bold">Nivel {d.tier.name}{d.tier.benefitPct ? ` · +${d.tier.benefitPct}% puntos` : ''}</div>
              {d.nextTier ? (
                <div className="mt-4">
                  <div className="h-3 rounded-full bg-white/30 overflow-hidden" role="progressbar" aria-valuenow={d.progress} aria-valuemin={0} aria-valuemax={100}><div className="h-full bg-white" style={{ width: `${d.progress}%` }} /></div>
                  <div className="text-xs mt-1 opacity-90">Te faltan {d.toNext} puntos para {d.nextTier.name}</div>
                </div>
              ) : <div className="text-xs mt-3 opacity-90">¡Estás en el nivel más alto!</div>}
              <div className="text-xs mt-3 opacity-80">Ganas {d.pointsPerSol} punto{d.pointsPerSol === 1 ? '' : 's'} por cada S/ 1</div>
            </section>

            {extras.wallet && <button onClick={addToWallet} disabled={walletBusy} data-testid="gwallet-btn" aria-label="Agregar a Google Wallet"
              className="w-full flex items-center justify-center gap-3 py-3 rounded-full bg-black text-white font-bold disabled:opacity-60">
              <svg viewBox="0 0 24 24" className="w-6 h-6" aria-hidden="true"><path fill="#4285F4" d="M3 7h18v4H3z"/><path fill="#34A853" d="M3 11h18v4H3z"/><path fill="#FBBC04" d="M3 15h18v3H3z"/><path fill="#EA4335" d="M3 5h18v2H3z"/></svg>
              {walletBusy ? 'Generando…' : 'Agregar a Google Wallet'}</button>}
            {err && <p role="alert" className="text-sm text-rose-600">{err}</p>}

            <section className="bg-white rounded-3xl border border-slate-200 p-5">
              <h2 className="font-bold text-slate-900 flex items-center gap-2 mb-3"><Gift className="w-5 h-5 text-indigo-600" aria-hidden="true" /> Premios</h2>
              {!d.rewards.length ? <p className="text-sm text-slate-500">Pronto habrá premios.</p> : <ul className="space-y-2">{d.rewards.map((r: any) => (
                <li key={r.id} className="flex items-center justify-between p-3 rounded-xl bg-slate-50">
                  <div><div className="font-bold text-slate-900">{r.name}</div><div className="text-xs text-slate-500">{r.pointsCost} puntos</div></div>
                  {r.canRedeem ? <Link to={`/c/${slug}`} className="text-xs font-bold bg-indigo-600 text-white px-3 py-1.5 rounded-full">Canjear en mi pedido</Link>
                    : <span className="text-xs text-slate-500">Faltan {r.pointsCost - d.customer.points}</span>}
                </li>))}</ul>}
            </section>

            {d.coupons.length > 0 && <section className="bg-white rounded-3xl border border-slate-200 p-5">
              <h2 className="font-bold text-slate-900 flex items-center gap-2 mb-3"><Ticket className="w-5 h-5 text-indigo-600" aria-hidden="true" /> Mis cupones</h2>
              <ul className="space-y-2">{d.coupons.map((c: any) => (
                <li key={c.code} className="p-3 rounded-xl border-2 border-dashed border-indigo-200 flex justify-between items-center">
                  <div><div className="font-mono font-extrabold text-indigo-700">{c.code}</div><div className="text-xs text-slate-500">{c.expiresAt ? `Vence ${new Date(c.expiresAt + 'T12:00:00').toLocaleDateString('es-PE')}` : 'Sin vencimiento'}{c.personal ? ' · Solo para ti' : ''}</div></div>
                  <div className="font-extrabold text-slate-900">{c.discountType === 'fixed' ? `S/ ${c.value}` : `${c.value}%`}</div>
                </li>))}</ul>
              <p className="text-xs text-slate-500 mt-2">Escribe el código en el carrito al hacer tu pedido.</p>
            </section>}

            {d.challenges.length > 0 && <section className="bg-white rounded-3xl border border-slate-200 p-5">
              <h2 className="font-bold text-slate-900 flex items-center gap-2 mb-3"><Trophy className="w-5 h-5 text-indigo-600" aria-hidden="true" /> Retos</h2>
              <ul className="space-y-3">{d.challenges.map((c: any) => (
                <li key={c.id}>
                  <div className="flex justify-between text-sm"><b className="text-slate-900">{c.name}</b><span className="text-slate-600">{c.current}/{c.target}{c.done ? ' ✅' : ''}</span></div>
                  <div className="h-2 rounded-full bg-slate-100 overflow-hidden mt-1"><div className="h-full bg-indigo-600" style={{ width: `${Math.round((c.current / c.target) * 100)}%` }} /></div>
                  <div className="text-xs text-slate-500 mt-1">Premio: {c.rewardPoints} puntos</div>
                </li>))}</ul>
            </section>}
            {extras.hasStores && <NearbyOffer slug={slug} />}
            {extras.push && extras.vapidPublicKey && <section className="bg-white rounded-3xl border border-slate-200 p-5 space-y-2"><h2 className="font-bold text-slate-900">Avisos de ofertas</h2><p className="text-sm text-slate-600">Recibe en tu celular las ofertas que la tienda publique.</p><PushOptIn slug={slug} vapidKey={extras.vapidPublicKey} phone={phone} code={code} /></section>}
            <button onClick={() => setD(null)} className="w-full text-sm text-slate-600 underline">Salir</button>
          </>
        )}
      </div>
    </main>
  );
}
