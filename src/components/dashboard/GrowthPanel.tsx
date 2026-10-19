import { track as gaTrack } from '../../lib/analytics';
import React, { useEffect, useRef, useState } from 'react';
import { QRCodeCanvas } from 'qrcode.react';
import { CheckCircle2, Circle, Copy, Download, Share2, MessageCircle, Eye, MousePointerClick, ShoppingBag, Trophy, Upload, AlertTriangle, Sparkles } from 'lucide-react';
import { Company } from '../../types';
import { apiClient } from '../../services/api';
import { LoyaltyPanel } from './LoyaltyPanel';
import { ImageUpload, resizeAndCompress } from '../ImageUpload';
import { isValidWhatsapp, normalizeWhatsapp } from '../../config/templates';

interface Props {
  company: Company;
  setCompany: (c: Company) => void;
  goToTab: (tab: any) => void;
}

const PLANS = [
  { name: 'Emprendedor', base: 15 },
  { name: 'Negocio Pequeño', base: 39 },
  { name: 'Empresa', base: 79 },
];
const withIgv = (n: number) => Math.round(n * 1.18 * 100) / 100;
const ANNUAL_PCT = 20;
const priceFor = (base: number, billing: string) => withIgv(billing === 'anual' ? Math.round(base * 12 * (1 - ANNUAL_PCT / 100) * 100) / 100 : base);

// Envía cada paso del onboarding y la compra (plan pagado aprobado) una sola vez por navegador.
const reportProgress = (d: any) => {
  try {
    const key = `ws_ev_${d?.company?.id}`;
    const seen: string[] = JSON.parse(localStorage.getItem(key) || '[]');
    const fire = (id: string, ev: string, p: any) => { if (!seen.includes(id)) { gaTrack(ev, p); seen.push(id); } };
    if (d?.setup?.whatsapp) fire('whatsapp', 'onboarding_step', { step: 'whatsapp' });
    if (d?.setup?.logo) fire('logo', 'onboarding_step', { step: 'logo' });
    if (d?.setup?.products) fire('products', 'onboarding_step', { step: 'primer_producto' });
    const lp = d?.lastPayment;
    if (lp?.reviewed_at) fire(`purchase_${lp.reviewed_at}`, 'purchase', { currency: 'PEN', plan: lp.plan, value: Number(lp.amount || 0), transaction_id: `${d.company.id}_${lp.reviewed_at}` });
    localStorage.setItem(key, JSON.stringify(seen));
  } catch {}
};

export function GrowthPanel({ company, setCompany, goToTab }: Props) {
  const [g, setG] = useState<any>(null);
  const [err, setErr] = useState('');
  const [wa, setWa] = useState(company.whatsapp || '');
  const [saving, setSaving] = useState(false);
  const [copied, setCopied] = useState(false);
  const [plan, setPlan] = useState('Emprendedor');
  const [billing, setBilling] = useState<'mensual' | 'anual'>('mensual');
  const [proof, setProof] = useState('');
  const [renewMsg, setRenewMsg] = useState('');
  const [pay, setPay] = useState<any>(null);
  const qrRef = useRef<HTMLDivElement>(null);

  const load = () => apiClient.get('/api/growth/me').then((d: any) => { reportProgress(d); setG(d); return d; }).catch((e: any) => setErr(e.message));
  useEffect(() => { load(); apiClient.get('/api/payment-settings').then(setPay).catch(() => {}); }, []);

  const saveCompany = async (patch: Partial<Company>) => {
    setSaving(true);
    try {
      const updated = await apiClient.post(`/api/companies/${company.id}`, { ...company, ...patch });
      setCompany(updated);
      await load();
    } catch (e: any) {
      alert(e.message?.includes('READ_ONLY') || e.status === 402 ? 'Tu panel está en modo solo lectura. Renueva tu plan para editar.' : (e.message || 'No se pudo guardar'));
    } finally { setSaving(false); }
  };

  const applyTemplate = async (rubro: string) => {
    setSaving(true);
    try { await apiClient.post('/api/templates/apply', { rubro }); await load(); alert('Listo: agregamos productos de ejemplo. Edítalos en "Productos" con tus fotos y precios.'); }
    catch (e: any) { alert(e.message || 'No se pudo aplicar la plantilla'); }
    finally { setSaving(false); }
  };

  if (err) return <div className="p-4 rounded-xl bg-rose-50 text-rose-700 text-sm">No se pudo cargar tu resumen: {err}</div>;
  if (!g) return <div className="p-6 text-slate-400">Cargando tu resumen...</div>;

  const shareUrl: string = g.shareUrl;
  const steps = [
    { done: g.setup.whatsapp, title: 'Tu WhatsApp', text: 'Aquí te llegan los pedidos.' },
    { done: g.setup.logo, title: 'Tu logo', text: 'Da confianza a tus clientes.' },
    { done: g.setup.products, title: 'Tu primer producto', text: 'Sin productos no hay ventas.' },
  ];
  const doneCount = steps.filter(s => s.done).length;
  const current = steps.findIndex(s => !s.done);
  const shareText = `¡Mira mi catálogo y haz tu pedido por WhatsApp! ${shareUrl}`;
  const track = (channel = 'link') => { gaTrack('share_catalog', { channel }); try { navigator.sendBeacon?.('/api/track', new Blob([JSON.stringify({ slug: g.company.slug, type: 'share' })], { type: 'application/json' })); } catch {} };

  const downloadQr = () => {
    const canvas = qrRef.current?.querySelector('canvas');
    if (!canvas) return;
    const a = document.createElement('a');
    a.href = canvas.toDataURL('image/png');
    a.download = `qr-catalogo-${g.company.slug}.png`;
    a.click();
    track('qr');
  };

  const onProofFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (!f) return;
    try { setProof(await resizeAndCompress(f)); } catch { alert('No se pudo leer la imagen'); }
  };
  const sendRenewal = async () => {
    if (!proof) return alert('Adjunta la captura de tu Yape.');
    setSaving(true);
    try {
      gaTrack('renewal_started', { plan, billing });
      const r = await apiClient.post('/api/renewal', { plan, billing, proofDataUrl: proof });
      setRenewMsg(`¡Recibido! Validaremos tu pago de S/ ${r.amount.toFixed(2)} y activaremos tu plan ${plan}${billing === 'anual' ? ' por 12 meses' : ''}. Te avisaremos por correo.`);
      setProof('');
    } catch (e: any) { alert(e.message || 'No se pudo enviar'); }
    finally { setSaving(false); }
  };

  const n = g.notice;
  const noticeStyle = n?.level === 'danger' ? 'bg-rose-50 border-rose-200 text-rose-800' : n?.level === 'warning' ? 'bg-amber-50 border-amber-200 text-amber-800' : 'bg-indigo-50 border-indigo-200 text-indigo-800';

  return (
    <div className="space-y-6 max-w-6xl">
      <div>
        <h1 className="text-2xl md:text-3xl font-extrabold text-slate-900">Hola, {g.company.name} 👋</h1>
        <p className="text-slate-500">Tu resumen de la semana y lo que te falta para vender más.</p>
      </div>

      {g.subscription.readOnly && (
        <div className="p-4 rounded-2xl border bg-rose-50 border-rose-200 text-rose-800 flex gap-3 items-start">
          <AlertTriangle className="w-5 h-5 mt-0.5 flex-shrink-0" />
          <div><b>Modo solo lectura.</b> Puedes ver tus datos y tu catálogo sigue visible, pero para editar o agregar productos debes renovar tu plan (abajo, en un clic con Yape).</div>
        </div>
      )}
      {n && n.kind && (
        <div className={`p-4 rounded-2xl border ${noticeStyle}`} data-testid="trial-notice">
          <div className="font-bold">{n.title}</div>
          <div className="text-sm opacity-90">{n.text}</div>
        </div>
      )}

      {/* Configuración guiada */}
      {doneCount < 3 && (
        <section className="bg-white rounded-2xl border border-slate-200 p-5 md:p-6 shadow-sm" data-testid="onboarding">
          <div className="flex items-center justify-between mb-2">
            <h2 className="font-bold text-lg text-slate-900 flex items-center gap-2"><Sparkles className="w-5 h-5 text-violet-600" /> Deja tu catálogo listo en 3 pasos</h2>
            <span className="text-sm font-bold text-indigo-600">{doneCount}/3</span>
          </div>
          <div className="h-2 rounded-full bg-slate-100 overflow-hidden mb-5">
            <div className="h-full bg-gradient-to-r from-indigo-600 to-violet-600 transition-all" style={{ width: `${(doneCount / 3) * 100}%` }} />
          </div>
          <div className="grid md:grid-cols-3 gap-3 mb-5">
            {steps.map((s, i) => (
              <div key={i} className={`p-3 rounded-xl border ${i === current ? 'border-indigo-300 bg-indigo-50' : 'border-slate-200'}`}>
                <div className="flex items-center gap-2 font-bold text-slate-800">
                  {s.done ? <CheckCircle2 className="w-5 h-5 text-emerald-500" /> : <Circle className="w-5 h-5 text-slate-300" />} {i + 1}. {s.title}
                </div>
                <div className="text-xs text-slate-500 mt-1">{s.text}</div>
              </div>
            ))}
          </div>
          {current === 0 && (
            <div className="flex flex-col sm:flex-row gap-2">
              <input value={wa} onChange={e => setWa(e.target.value)} type="tel" placeholder="987 654 321" className="flex-1 border border-slate-200 rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-indigo-500" />
              <button disabled={saving || !isValidWhatsapp(wa)} onClick={() => saveCompany({ whatsapp: normalizeWhatsapp(wa) })} className="px-5 py-3 rounded-xl bg-indigo-600 text-white font-bold disabled:opacity-50">Guardar WhatsApp</button>
            </div>
          )}
          {current === 1 && (
            <div className="max-w-sm">
              <ImageUpload label="Sube tu logo" value={company.logo || ''} aspectRatio="square" onChange={(url) => url && saveCompany({ logo: url })} />
            </div>
          )}
          {current === 2 && (
            <div>
              <p className="text-sm text-slate-600 mb-3">Empieza rápido con una plantilla (productos de ejemplo que luego editas) o crea el tuyo:</p>
              <div className="flex flex-wrap gap-2">
                {g.templates.map((t: any) => (
                  <button key={t.key} disabled={saving} onClick={() => applyTemplate(t.key)} className="px-4 py-2.5 rounded-xl border border-slate-200 hover:border-indigo-300 hover:bg-indigo-50 font-semibold text-sm">{t.emoji} {t.label}</button>
                ))}
                <button onClick={() => goToTab('products')} className="px-4 py-2.5 rounded-xl bg-indigo-600 text-white font-bold text-sm">+ Crear mi producto</button>
              </div>
            </div>
          )}
        </section>
      )}

      {/* Métricas */}
      <section className="grid grid-cols-2 lg:grid-cols-4 gap-3" data-testid="metrics">
        {[
          { icon: Eye, label: 'Visitas (7 días)', value: g.metrics.available ? g.metrics.visits : '—' },
          { icon: MousePointerClick, label: 'Clics a WhatsApp', value: g.metrics.available ? g.metrics.whatsappClicks : '—' },
          { icon: ShoppingBag, label: 'Pedidos esta semana', value: g.metrics.ordersThisWeek },
          { icon: Trophy, label: 'Producto estrella', value: g.metrics.topProduct?.name || 'Aún sin pedidos' },
        ].map((m, i) => (
          <div key={i} className="bg-white rounded-2xl border border-slate-200 p-4 shadow-sm">
            <m.icon className="w-5 h-5 text-violet-600 mb-2" />
            <div className="text-xl md:text-2xl font-extrabold text-slate-900 truncate">{m.value}</div>
            <div className="text-xs text-slate-500">{m.label}</div>
          </div>
        ))}
      </section>
      {!g.metrics.available && <p className="text-xs text-slate-400 -mt-3">Las visitas y clics se empiezan a contar en cuanto se active el registro de métricas.</p>}

      <div className="grid lg:grid-cols-2 gap-6">
        {/* Compartir */}
        <section className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm" data-testid="share">
          <h2 className="font-bold text-lg text-slate-900 flex items-center gap-2 mb-3"><Share2 className="w-5 h-5 text-violet-600" /> Compartir mi catálogo</h2>
          <div className="flex gap-2 mb-4">
            <input readOnly value={shareUrl} className="flex-1 min-w-0 bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-sm" />
            <button onClick={() => { navigator.clipboard?.writeText(shareUrl); setCopied(true); setTimeout(() => setCopied(false), 2000); track(); }} className="px-3 py-2 rounded-xl bg-slate-900 text-white text-sm font-bold flex items-center gap-1"><Copy className="w-4 h-4" />{copied ? '¡Copiado!' : 'Copiar'}</button>
          </div>
          <div className="flex flex-col sm:flex-row gap-4 items-center">
            <div ref={qrRef} className="p-3 bg-white border border-slate-200 rounded-xl">
              <QRCodeCanvas value={shareUrl} size={140} fgColor="#1e1b4b" includeMargin />
            </div>
            <div className="flex flex-col gap-2 w-full">
              <button onClick={downloadQr} className="px-4 py-2.5 rounded-xl border border-slate-200 hover:bg-slate-50 font-semibold text-sm flex items-center gap-2"><Download className="w-4 h-4" /> Descargar QR para imprimir</button>
              <a onClick={() => track('whatsapp')} href={`https://wa.me/?text=${encodeURIComponent(shareText)}`} target="_blank" rel="noopener noreferrer" className="px-4 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-white font-bold text-sm flex items-center gap-2"><MessageCircle className="w-4 h-4" /> Compartir por WhatsApp</a>
              <a onClick={() => track('facebook')} href={`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(shareUrl)}`} target="_blank" rel="noopener noreferrer" className="px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-sm flex items-center gap-2"><Share2 className="w-4 h-4" /> Compartir en Facebook</a>
            </div>
          </div>
          <p className="text-xs text-slate-400 mt-3">Al compartir el enlace se muestra una vista previa con tu logo y nombre.</p>
        </section>

        {/* Renovar */}
        <section className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm" data-testid="renewal">
          <h2 className="font-bold text-lg text-slate-900 mb-1">Renovar en un clic</h2>
          <p className="text-sm text-slate-500 mb-3">
            {g.subscription.status === 'Prueba Gratuita' ? 'Prueba gratis' : `Plan ${g.subscription.plan || ''}`} · vence el {g.subscription.endsAt ? new Date(g.subscription.endsAt + 'T12:00:00').toLocaleDateString('es-PE') : '—'}
          </p>
          {renewMsg ? (
            <div className="p-3 rounded-xl bg-emerald-50 text-emerald-700 text-sm font-medium">{renewMsg}</div>
          ) : (
            <>
              <div role="radiogroup" aria-label="Periodo de pago" className="flex gap-2 mb-3 text-sm">
                {(['mensual', 'anual'] as const).map(b => (
                  <button key={b} role="radio" aria-checked={billing === b} onClick={() => setBilling(b)} className={`flex-1 py-2 rounded-xl border font-bold ${billing === b ? 'border-indigo-500 bg-indigo-50 text-indigo-700' : 'border-slate-200 text-slate-600'}`}>
                    {b === 'mensual' ? 'Mensual' : <>Anual <span className="ml-1 text-[11px] px-1.5 py-0.5 rounded-full bg-emerald-100 text-emerald-700">-{ANNUAL_PCT}% fidelidad</span></>}
                  </button>
                ))}
              </div>
              <div className="grid grid-cols-3 gap-2 mb-3">
                {PLANS.map(p => (
                  <button key={p.name} onClick={() => setPlan(p.name)} className={`p-2 rounded-xl border text-left ${plan === p.name ? 'border-indigo-500 bg-indigo-50' : 'border-slate-200'}`}>
                    <div className="text-xs font-bold text-slate-700">{p.name}</div>
                    <div className="text-sm font-extrabold text-indigo-700">S/ {priceFor(p.base, billing).toFixed(2)}</div>
                    <div className="text-[10px] text-slate-500">{billing === 'anual' ? '12 meses · IGV incl.' : 'IGV incluido'}</div>
                  </button>
                ))}
              </div>
              <div className="text-sm text-slate-600 mb-3">
                1) Yapea <b>S/ {priceFor(PLANS.find(p => p.name === plan)!.base, billing).toFixed(2)}</b>{pay?.configured ? <> a <b>{pay.accountNumber}</b> ({pay.companyName})</> : <> — te enviamos el número por <a className="text-indigo-600 font-bold" target="_blank" rel="noopener noreferrer" href={`https://wa.me/${pay?.whatsapp || '51901345791'}?text=${encodeURIComponent('Hola, quiero renovar mi plan ' + plan + ' de WowSmart (' + g.company.name + ')')}`}>WhatsApp</a></>}. 2) Sube la captura. 3) Nosotros lo aprobamos.
              </div>
              <label className="flex items-center justify-center gap-2 w-full p-3 border-2 border-dashed border-slate-300 rounded-xl cursor-pointer hover:bg-slate-50 text-sm font-semibold text-slate-600">
                <Upload className="w-4 h-4" /> {proof ? 'Captura lista ✔ (cambiar)' : 'Subir captura del Yape'}
                <input type="file" accept="image/*" className="hidden" onChange={onProofFile} />
              </label>
              {proof && <img src={proof} alt="Captura" className="mt-2 max-h-32 rounded-lg border mx-auto" />}
              <button disabled={saving || !proof} onClick={sendRenewal} className="mt-3 w-full py-3 rounded-xl bg-gradient-to-r from-indigo-600 to-violet-600 text-white font-bold disabled:opacity-50">Enviar para aprobación</button>
            </>
          )}
        </section>
      </div>
      <LoyaltyPanel />
    </div>
  );
}
