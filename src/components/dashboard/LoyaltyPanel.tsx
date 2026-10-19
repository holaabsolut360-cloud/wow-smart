import React, { useEffect, useState } from 'react';
import { Gift, Users, Mail, Copy, MessageCircle, Repeat, AlertTriangle } from 'lucide-react';
import { apiClient } from '../../services/api';
import { track as gaTrack } from '../../lib/analytics';

// Fidelización para el dueño del negocio: referidos, resumen semanal y clientes frecuentes.
export function LoyaltyPanel() {
  const [d, setD] = useState<any>(null);
  const [copied, setCopied] = useState(false);
  const load = () => apiClient.get('/api/loyalty/me').then(setD).catch(() => setD(false));
  useEffect(() => { load(); }, []);
  if (d === null) return null;
  if (d === false) return null;

  const s = d.summary;
  const ref = d.referral;
  const shareText = ref?.link ? `Estoy usando WowSmart para recibir pedidos por WhatsApp con mi catálogo digital. Regístrate con mi enlace y los dos ganamos 1 mes gratis: ${ref.link}` : '';
  const toggleWeekly = async () => {
    try { await apiClient.post('/api/loyalty/weekly-summary', { enabled: d.weeklyOptOut }); load(); } catch (e: any) { alert(e.message || 'No se pudo guardar'); }
  };

  return (
    <div className="space-y-6" data-testid="loyalty">
      {s.inactive && (
        <div className="p-4 rounded-2xl border bg-amber-50 border-amber-200 text-amber-800 flex gap-3" role="alert">
          <AlertTriangle className="w-5 h-5 shrink-0 mt-0.5" aria-hidden="true" />
          <div><b>Tu catálogo necesita novedades.</b> {s.lastProductAt ? 'Hace más de 7 días que no agregas productos.' : 'Todavía no tienes productos.'} Los catálogos que se actualizan cada semana reciben más visitas y pedidos.</div>
        </div>
      )}
      <div className="grid lg:grid-cols-2 gap-6">
        <section className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm">
          <h2 className="font-bold text-lg text-slate-900 flex items-center gap-2"><Mail className="w-5 h-5 text-indigo-600" aria-hidden="true" /> Tu semana</h2>
          <p className="text-sm text-slate-600 mb-3">Últimos 7 días de tu catálogo.</p>
          <dl className="grid grid-cols-2 gap-3 text-center">
            {[['Visitas', s.visits], ['Clics a WhatsApp', s.whatsappClicks], ['Pedidos', s.orders], ['Ventas', `S/ ${Number(s.sales).toFixed(2)}`]].map(([k, v]) => (
              <div key={k as string} className="p-3 rounded-xl bg-slate-50"><dt className="text-xs text-slate-600">{k}</dt><dd className="text-xl font-extrabold text-slate-900">{v}</dd></div>
            ))}
          </dl>
          <label className="mt-4 flex items-center gap-2 text-sm text-slate-700">
            <input type="checkbox" checked={!d.weeklyOptOut} onChange={toggleWeekly} className="w-4 h-4 accent-indigo-600" />
            {d.emailEnabled ? 'Recibir este resumen por correo cada lunes' : 'Mostrar el resumen semanal (por ahora solo en tu panel)'}
          </label>
        </section>

        <section className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm">
          <h2 className="font-bold text-lg text-slate-900 flex items-center gap-2"><Gift className="w-5 h-5 text-violet-600" aria-hidden="true" /> Invita y gana 1 mes gratis</h2>
          {ref?.available ? (
            <>
              <p className="text-sm text-slate-600 mb-3">Cuando un negocio se registra con tu enlace y paga su primer plan, los dos reciben <b>1 mes gratis</b> (lo validamos en 24–48 h).</p>
              <div className="flex gap-2">
                <input readOnly aria-label="Tu enlace de referido" value={ref.link} className="flex-1 min-w-0 bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-sm" />
                <button onClick={() => { navigator.clipboard?.writeText(ref.link); setCopied(true); setTimeout(() => setCopied(false), 2000); gaTrack('share_catalog', { channel: 'referral_link' }); }} className="px-3 py-2 rounded-xl bg-slate-900 text-white text-sm font-bold flex items-center gap-1"><Copy className="w-4 h-4" aria-hidden="true" />{copied ? '¡Copiado!' : 'Copiar'}</button>
              </div>
              <p className="text-xs text-slate-600 mt-2">Tu código: <b className="tracking-wider">{ref.code}</b></p>
              <a onClick={() => gaTrack('share_catalog', { channel: 'referral_whatsapp' })} href={`https://wa.me/?text=${encodeURIComponent(shareText)}`} target="_blank" rel="noopener noreferrer" className="mt-3 inline-flex px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-sm items-center gap-2"><MessageCircle className="w-4 h-4" aria-hidden="true" /> Invitar por WhatsApp</a>
              <div className="mt-4 grid grid-cols-3 gap-2 text-center text-sm">
                <div className="p-2 rounded-xl bg-slate-50"><div className="text-xs text-slate-600">Invitados</div><b>{ref.total}</b></div>
                <div className="p-2 rounded-xl bg-slate-50"><div className="text-xs text-slate-600">En revisión</div><b>{ref.pending}</b></div>
                <div className="p-2 rounded-xl bg-emerald-50"><div className="text-xs text-emerald-700">Meses ganados</div><b>{ref.rewarded}</b></div>
              </div>
            </>
          ) : <p className="text-sm text-slate-600">El programa de referidos se activará muy pronto.</p>}
          <p className="text-xs text-slate-600 mt-4">💚 Paga el plan anual y ahorra {d.annualDiscountPct}% como cliente fiel (arriba, en “Renovar”).</p>
        </section>
      </div>

      <section className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm">
        <h2 className="font-bold text-lg text-slate-900 flex items-center gap-2"><Repeat className="w-5 h-5 text-emerald-600" aria-hidden="true" /> Clientes frecuentes</h2>
        <p className="text-sm text-slate-600 mb-3">
          {d.customers.total} clientes con WhatsApp · <b>{d.customers.repeatCount}</b> volvieron a comprar ({d.customers.repeatRate}%).
        </p>
        {d.customers.top.length === 0 ? (
          <p className="text-sm text-slate-600 flex items-center gap-2"><Users className="w-4 h-4" aria-hidden="true" /> Aún no hay clientes que repitan. Comparte tu catálogo y ofrece un cupón para la segunda compra.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead><tr className="text-left text-slate-600"><th className="py-2">Cliente</th><th>WhatsApp</th><th className="text-right">Pedidos</th><th className="text-right">Total</th><th></th></tr></thead>
              <tbody>
                {d.customers.top.map((c: any) => (
                  <tr key={c.phone} className="border-t border-slate-100">
                    <td className="py-2 font-medium">{c.name || '—'} {c.optIn && <span className="ml-1 text-[10px] px-1.5 py-0.5 rounded-full bg-violet-100 text-violet-700">Cliente frecuente</span>}</td>
                    <td>{c.phone}</td><td className="text-right">{c.orders}</td><td className="text-right">S/ {Number(c.total).toFixed(2)}</td>
                    <td className="text-right">{c.optIn && <a className="text-emerald-700 font-bold" target="_blank" rel="noopener noreferrer" href={`https://wa.me/51${c.phone}?text=${encodeURIComponent(`¡Hola ${c.name || ''}! Gracias por ser cliente frecuente 💜`)}`}>Escribir</a>}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        <p className="text-xs text-slate-600 mt-3">Solo puedes escribir a los clientes que marcaron “Quiero ser cliente frecuente” al pedir.</p>
      </section>
    </div>
  );
}
