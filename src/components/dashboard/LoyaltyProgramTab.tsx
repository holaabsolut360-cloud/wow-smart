import React, { useEffect, useState } from 'react';
import { Award, Gift, Ticket, Trophy, Users, Lock, Plus, Trash2, ExternalLink, Save, Cake, HeartHandshake } from 'lucide-react';
import { apiClient } from '../../services/api';
import { track as gaTrack } from '../../lib/analytics';

// v5 — Fidelización tipo "Open Loyalty" para negocios pequeños.
type Tier = { name: string; min: number; benefitPct: number };
const card = 'bg-white rounded-2xl border border-slate-200 p-5 shadow-sm';
const input = 'w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-sm outline-none focus:border-indigo-500';
const btn = 'inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-indigo-600 text-white font-bold text-sm hover:bg-indigo-700 disabled:opacity-50';
const tierColor = (n: string) => /oro/i.test(n) ? 'bg-amber-100 text-amber-800' : /plata/i.test(n) ? 'bg-slate-200 text-slate-800' : 'bg-orange-100 text-orange-800';
const fmtDate = (d?: string | null) => d ? new Date(d).toLocaleDateString('es-PE', { day: '2-digit', month: 'short', year: 'numeric' }) : '—';

export function LoyaltyProgramTab({ slug }: { slug?: string }) {
  const [d, setD] = useState<any>(null);
  const [err, setErr] = useState('');
  const [st, setSt] = useState<any>(null);
  const [saving, setSaving] = useState(false);
  const [sub, setSub] = useState<'clientes' | 'premios' | 'cupones' | 'retos' | 'ajustes'>(() => (['premios', 'cupones', 'retos', 'ajustes'].includes(new URLSearchParams(window.location.search).get('sub') || '') ? new URLSearchParams(window.location.search).get('sub') as any : 'clientes'));
  const load = () => apiClient.get('/api/fidelizacion').then(r => { setD(r); setSt(r.settings); }).catch(e => setErr(e.message || 'No se pudo cargar'));
  useEffect(() => { load(); }, []);
  if (err) return <div className="p-6 rounded-2xl bg-amber-50 text-amber-800 border border-amber-200">{err.replace(/^API error \d+: /, '')}</div>;
  if (!d || !st) return <div className="p-6 text-slate-500">Cargando fidelización…</div>;

  if (!d.allowed) return (
    <div className="space-y-6" data-testid="loyalty-upsell">
      <div className="rounded-3xl p-8 text-white bg-gradient-to-br from-indigo-600 to-violet-700 shadow-lg">
        <Lock className="w-8 h-8 mb-3" aria-hidden="true" />
        <h2 className="text-2xl font-extrabold mb-2">Fidelización: haz que tus clientes vuelvan</h2>
        <p className="text-indigo-100 max-w-xl">Puntos por cada compra, niveles Bronce, Plata y Oro, premios, cupones de cumpleaños y retos. Disponible en los planes {d.plans.join(' y ')}.</p>
        <a href="/checkout/negocio" className="mt-5 inline-block bg-white text-indigo-700 font-bold px-5 py-3 rounded-xl" onClick={() => gaTrack('loyalty_upsell_click')}>Mejorar mi plan</a>
      </div>
      <div className="grid md:grid-cols-3 gap-4 opacity-70 pointer-events-none select-none" aria-hidden="true">
        {[['Puntos', '1 punto por cada S/ 1'], ['Niveles', 'Bronce · Plata · Oro'], ['Premios', 'Canjes por descuentos o productos']].map(([t, x]) => (
          <div key={t} className={card}><b className="text-slate-900">{t}</b><p className="text-sm text-slate-600">{x}</p></div>))}
      </div>
    </div>
  );

  const save = async (next = st) => {
    setSaving(true);
    try { const r = await apiClient.put('/api/fidelizacion/ajustes', next); setSt({ ...st, ...r.settings }); if (next.enabled && !d.settings.enabled) gaTrack('loyalty_enabled'); await load(); }
    catch (e: any) { alert((e.message || 'No se pudo guardar').replace(/^API error \d+: /, '')); } finally { setSaving(false); }
  };
  const setTier = (i: number, k: keyof Tier, v: any) => setSt({ ...st, tiers: st.tiers.map((t: Tier, j: number) => j === i ? { ...t, [k]: k === 'name' ? v : Number(v) } : t) });
  const s = d.stats;
  const publicUrl = d.publicPath || (slug ? `/c/${slug}/mis-puntos` : '');

  return (
    <div className="space-y-6" data-testid="loyalty-program">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-extrabold text-slate-900 flex items-center gap-2"><Award className="w-7 h-7 text-indigo-600" aria-hidden="true" /> Fidelización</h1>
          <p className="text-slate-600">Premia a tus clientes por volver a comprar. Los puntos se dan solo cuando marcas el pedido como <b>Pagado</b> o <b>Entregado</b>.</p>
        </div>
        <label className="flex items-center gap-3 bg-white border border-slate-200 rounded-2xl px-4 py-3 shadow-sm cursor-pointer">
          <input type="checkbox" className="w-5 h-5 accent-indigo-600" checked={!!st.enabled} disabled={saving} onChange={e => save({ ...st, enabled: e.target.checked })} />
          <span className="font-bold text-slate-800">{st.enabled ? 'Programa activo' : 'Activar programa'}</span>
        </label>
      </div>

      {!st.enabled && <div className="p-4 rounded-2xl bg-indigo-50 border border-indigo-200 text-indigo-800">El programa está apagado. Configúralo y actívalo cuando quieras: tus clientes empezarán a juntar puntos desde su siguiente pedido.</div>}

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[['Miembros', s.members, Users], ['Puntos dados este mes', s.pointsIssuedMonth, Award], ['Canjes este mes', s.redemptionsMonth, Gift], ['Puntos por canjear', s.pointsOutstanding, Trophy]].map(([k, v, I]: any) => (
          <div key={k} className={card}><I className="w-5 h-5 text-indigo-600 mb-1" aria-hidden="true" /><div className="text-xs text-slate-600">{k}</div><div className="text-2xl font-extrabold text-slate-900">{Number(v).toLocaleString('es-PE')}</div></div>
        ))}
      </div>

      {publicUrl && st.enabled && (
        <div className={`${card} flex flex-wrap items-center justify-between gap-3`}>
          <div><b className="text-slate-900">Tarjeta de puntos de tus clientes</b><p className="text-sm text-slate-600">Compártela: el cliente ingresa su WhatsApp y el código de su último pedido.</p></div>
          <a href={publicUrl} target="_blank" rel="noopener noreferrer" className={btn}><ExternalLink className="w-4 h-4" aria-hidden="true" /> Abrir “Mi tarjeta”</a>
        </div>
      )}

      <div className="flex gap-2 overflow-x-auto" role="tablist">
        {[['clientes', 'Clientes'], ['premios', 'Premios'], ['cupones', 'Cupones'], ['retos', 'Retos'], ['ajustes', 'Puntos y niveles']].map(([k, l]) => (
          <button key={k} role="tab" aria-selected={sub === k} onClick={() => setSub(k as any)} className={`px-4 py-2 rounded-full text-sm font-bold whitespace-nowrap ${sub === k ? 'bg-indigo-600 text-white' : 'bg-white border border-slate-200 text-slate-700'}`}>{l}</button>
        ))}
      </div>

      {sub === 'ajustes' && (
        <div className="grid lg:grid-cols-2 gap-6">
          <section className={card}>
            <h2 className="font-bold text-lg mb-3">Regla de puntos</h2>
            <label className="text-sm text-slate-700">Puntos por cada S/ 1 de compra
              <input type="number" min={0} step="0.5" className={input} value={st.points_per_sol} onChange={e => setSt({ ...st, points_per_sol: Number(e.target.value) })} /></label>
            <p className="text-xs text-slate-500 mt-2">Ejemplo: un pedido de S/ 80 da {Math.floor(80 * (st.points_per_sol || 0))} puntos (más el bono de su nivel).</p>
            <h2 className="font-bold text-lg mt-6 mb-3">Niveles</h2>
            <div className="space-y-2">
              {st.tiers.map((t: Tier, i: number) => (
                <div key={i} className="grid grid-cols-[1fr_110px_110px_auto] gap-2 items-end">
                  <label className="text-xs text-slate-600">Nombre<input className={input} value={t.name} onChange={e => setTier(i, 'name', e.target.value)} /></label>
                  <label className="text-xs text-slate-600">Desde (pts)<input type="number" className={input} value={t.min} disabled={i === 0} onChange={e => setTier(i, 'min', e.target.value)} /></label>
                  <label className="text-xs text-slate-600">Bono %<input type="number" className={input} value={t.benefitPct} onChange={e => setTier(i, 'benefitPct', e.target.value)} /></label>
                  <button aria-label="Quitar nivel" disabled={st.tiers.length <= 1} onClick={() => setSt({ ...st, tiers: st.tiers.filter((_: any, j: number) => j !== i) })} className="p-2 text-rose-600 disabled:opacity-30"><Trash2 className="w-4 h-4" /></button>
                </div>))}
              <button className="text-sm font-bold text-indigo-700" onClick={() => setSt({ ...st, tiers: [...st.tiers, { name: 'Nuevo nivel', min: (st.tiers.at(-1)?.min || 0) + 500, benefitPct: 0 }] })}>+ Agregar nivel</button>
            </div>
          </section>
          <section className={card}>
            <h2 className="font-bold text-lg mb-3 flex items-center gap-2"><Cake className="w-5 h-5 text-indigo-600" aria-hidden="true" /> Cupón de cumpleaños automático</h2>
            <AutoCoupon value={st.birthday_coupon} onChange={v => setSt({ ...st, birthday_coupon: v })} />
            <h2 className="font-bold text-lg mt-6 mb-3 flex items-center gap-2"><HeartHandshake className="w-5 h-5 text-indigo-600" aria-hidden="true" /> Cupón “Te extrañamos”</h2>
            <AutoCoupon value={st.winback} onChange={v => setSt({ ...st, winback: v })} withDays />
            <p className="text-xs text-slate-500 mt-3">Los cupones automáticos aparecen en la tarjeta “Mi tarjeta” del cliente. Puedes avisarle por WhatsApp desde la lista de clientes.</p>
          </section>
          <div className="lg:col-span-2"><button className={btn} disabled={saving} onClick={() => save()}><Save className="w-4 h-4" aria-hidden="true" /> Guardar cambios</button></div>
        </div>
      )}

      {sub === 'clientes' && <Customers d={d} reload={load} />}
      {sub === 'premios' && <Crud kind="premios" items={d.rewards} reload={load} />}
      {sub === 'cupones' && <Crud kind="cupones" items={d.coupons} reload={load} />}
      {sub === 'retos' && <Crud kind="retos" items={d.challenges} reload={load} />}
    </div>
  );
}

function AutoCoupon({ value, onChange, withDays }: { value: any; onChange: (v: any) => void; withDays?: boolean }) {
  const v = value || {};
  return (
    <div className="space-y-2">
      <label className="flex items-center gap-2 text-sm"><input type="checkbox" className="w-4 h-4 accent-indigo-600" checked={!!v.enabled} onChange={e => onChange({ ...v, enabled: e.target.checked })} /> Activado</label>
      <div className="grid grid-cols-3 gap-2">
        {withDays && <label className="text-xs text-slate-600">Sin comprar (días)<input type="number" className={input} value={v.days ?? 30} onChange={e => onChange({ ...v, days: Number(e.target.value) })} /></label>}
        <label className="text-xs text-slate-600">Tipo<select className={input} value={v.discountType || 'percentage'} onChange={e => onChange({ ...v, discountType: e.target.value })}><option value="percentage">%</option><option value="fixed">S/</option></select></label>
        <label className="text-xs text-slate-600">Valor<input type="number" className={input} value={v.value ?? 10} onChange={e => onChange({ ...v, value: Number(e.target.value) })} /></label>
        <label className="text-xs text-slate-600">Vigencia (días)<input type="number" className={input} value={v.validDays ?? 15} onChange={e => onChange({ ...v, validDays: Number(e.target.value) })} /></label>
      </div>
    </div>
  );
}

function Customers({ d, reload }: { d: any; reload: () => void }) {
  const [q, setQ] = useState('');
  const list = d.customers.filter((c: any) => !q || `${c.name} ${c.phone}`.toLowerCase().includes(q.toLowerCase()));
  const adjust = async (c: any) => {
    const v = prompt(`Ajustar puntos de ${c.name || c.phone} (usa negativo para restar):`, '50'); if (!v) return;
    const reason = prompt('Motivo del ajuste:', 'Compra en tienda') || 'manual';
    try { await apiClient.post(`/api/fidelizacion/clientes/${c.id}/ajuste`, { delta: Number(v), reason }); reload(); } catch (e: any) { alert((e.message || '').replace(/^API error \d+: /, '')); }
  };
  return (
    <section className={card}>
      <div className="flex flex-wrap justify-between gap-3 mb-3"><h2 className="font-bold text-lg flex items-center gap-2"><Users className="w-5 h-5 text-indigo-600" aria-hidden="true" /> Clientes del programa</h2>
        <input className={`${input} max-w-xs`} placeholder="Buscar por nombre o WhatsApp" value={q} onChange={e => setQ(e.target.value)} aria-label="Buscar cliente" /></div>
      {!list.length ? <p className="text-sm text-slate-500">Aún no hay clientes. Se unen solos cuando hacen un pedido con su WhatsApp en tu catálogo.</p> : (
        <div className="overflow-x-auto"><table className="w-full text-sm">
          <thead><tr className="text-left text-slate-500 border-b"><th className="py-2">Cliente</th><th>Nivel</th><th className="text-right">Puntos</th><th className="text-right px-3">Pedidos</th><th className="px-3">Última compra</th><th></th></tr></thead>
          <tbody>{list.map((c: any) => (
            <tr key={c.id} className="border-b last:border-0">
              <td className="py-2"><div className="font-bold text-slate-900">{c.name || 'Cliente'}</div><div className="text-xs text-slate-500">{c.phone}</div></td>
              <td><span className={`px-2 py-0.5 rounded-full text-xs font-bold ${tierColor(c.tier)}`}>{c.tier}</span></td>
              <td className="text-right font-extrabold">{Number(c.points).toLocaleString('es-PE')}</td>
              <td className="text-right px-3">{c.orders_count || 0}</td>
              <td className="px-3">{fmtDate(c.last_purchase_at)}</td>
              <td className="text-right whitespace-nowrap">
                <button onClick={() => adjust(c)} className="text-indigo-700 font-bold text-xs mr-3">Ajustar puntos</button>
                <a className="text-emerald-700 font-bold text-xs" target="_blank" rel="noopener noreferrer" href={`https://wa.me/${c.phone.length === 9 ? '51' + c.phone : c.phone}?text=${encodeURIComponent(`Hola ${c.name || ''}, tienes ${c.points} puntos en nuestra tienda. ¡Úsalos en tu próximo pedido!`)}`}>WhatsApp</a>
              </td>
            </tr>))}</tbody>
        </table></div>)}
    </section>
  );
}

const FORMS: Record<string, { title: string; icon: any; empty: string; fields: [string, string, string, any?][] }> = {
  premios: { title: 'Catálogo de premios', icon: Gift, empty: 'Agrega tu primer premio, por ejemplo “10% de descuento” por 200 puntos.',
    fields: [['name', 'Nombre del premio', 'text'], ['pointsCost', 'Puntos', 'number'], ['type', 'Tipo', 'select', [['discount', 'Descuento'], ['product', 'Producto gratis']]], ['value', 'Valor (S/ o %)', 'number']] },
  cupones: { title: 'Cupones', icon: Ticket, empty: 'Crea un cupón con código, por ejemplo BIENVENIDO10.',
    fields: [['code', 'Código', 'text'], ['discountType', 'Tipo', 'select', [['percentage', '%'], ['fixed', 'S/']]], ['value', 'Valor', 'number'], ['expiresAt', 'Vence', 'date'], ['usageLimit', 'Límite de usos', 'number']] },
  retos: { title: 'Retos', icon: Trophy, empty: 'Crea un reto, por ejemplo “3 compras en el mes” = 100 puntos.',
    fields: [['name', 'Nombre del reto', 'text'], ['kind', 'Tipo', 'select', [['orders_month', 'Compras en el mes'], ['streak_weeks', 'Racha de semanas seguidas']]], ['target', 'Meta', 'number'], ['rewardPoints', 'Puntos de premio', 'number'], ['rewardCouponValue', 'Cupón de premio % (opcional)', 'number']] },
};
const describe = (kind: string, x: any) => kind === 'premios' ? `${x.points_cost} pts · ${x.type === 'product' ? 'Producto gratis' : x.value ? `${x.value}${x.value <= 100 ? '%' : ''} de descuento` : 'Descuento'}`
  : kind === 'cupones' ? `${x.discount_type === 'fixed' ? 'S/ ' + x.value : x.value + '%'} · ${x.expires_at ? 'vence ' + fmtDate(x.expires_at) : 'sin vencimiento'} · ${x.used_count || 0}${x.usage_limit ? '/' + x.usage_limit : ''} usos${x.auto ? ' · automático (' + x.auto.replace('_', ' ') + ')' : ''}`
  : `${x.kind === 'streak_weeks' ? `${x.target} semanas seguidas` : `${x.target} compras en el mes`} → ${x.reward_points} pts${x.reward_coupon_value ? ` + cupón ${x.reward_coupon_value}%` : ''}`;

function Crud({ kind, items, reload }: { kind: string; items: any[]; reload: () => void }) {
  const f = FORMS[kind]; const I = f.icon;
  const [form, setForm] = useState<any>({});
  const add = async (e: React.FormEvent) => {
    e.preventDefault();
    try { await apiClient.post(`/api/fidelizacion/${kind}`, form); setForm({}); reload(); } catch (er: any) { alert((er.message || '').replace(/^API error \d+: /, '')); }
  };
  const toggle = async (x: any) => { await apiClient.put(`/api/fidelizacion/${kind}/${x.id}`, { active: x.active === false }); reload(); };
  const remove = async (x: any) => { if (confirm('¿Eliminar?')) { await apiClient.delete(`/api/fidelizacion/${kind}/${x.id}`); reload(); } };
  const shown = kind === 'cupones' ? items.filter((x: any) => !x.customer_id) : items;
  const personal = kind === 'cupones' ? items.filter((x: any) => x.customer_id).length : 0;
  return (
    <div className="grid lg:grid-cols-[1fr_360px] gap-6">
      <section className={card}>
        <h2 className="font-bold text-lg mb-3 flex items-center gap-2"><I className="w-5 h-5 text-indigo-600" aria-hidden="true" /> {f.title}</h2>
        {!shown.length ? <p className="text-sm text-slate-500">{f.empty}</p> : <ul className="divide-y">{shown.map((x: any) => (
          <li key={x.id} className="py-3 flex items-center justify-between gap-3">
            <div><div className={`font-bold ${x.active === false ? 'text-slate-400 line-through' : 'text-slate-900'}`}>{x.name || x.code}</div><div className="text-xs text-slate-500">{describe(kind, x)}</div></div>
            <div className="flex gap-3 text-xs font-bold"><button onClick={() => toggle(x)} className="text-indigo-700">{x.active === false ? 'Activar' : 'Pausar'}</button><button onClick={() => remove(x)} className="text-rose-600">Eliminar</button></div>
          </li>))}</ul>}
        {personal > 0 && <p className="text-xs text-slate-500 mt-3">Además hay {personal} cupones personales automáticos (cumpleaños, “te extrañamos” o retos).</p>}
      </section>
      <form onSubmit={add} className={`${card} space-y-2`}>
        <h3 className="font-bold flex items-center gap-2"><Plus className="w-4 h-4" aria-hidden="true" /> Nuevo</h3>
        {f.fields.map(([k, l, t, opts]) => (
          <label key={k} className="block text-xs text-slate-600">{l}
            {t === 'select' ? <select className={input} value={form[k] ?? opts[0][0]} onChange={e => setForm({ ...form, [k]: e.target.value })}>{opts.map(([v, n]: any) => <option key={v} value={v}>{n}</option>)}</select>
              : <input type={t} className={input} value={form[k] ?? ''} onChange={e => setForm({ ...form, [k]: t === 'number' ? Number(e.target.value) : e.target.value })} />}
          </label>))}
        <button className={btn} type="submit"><Plus className="w-4 h-4" aria-hidden="true" /> Agregar</button>
      </form>
    </div>
  );
}
