import React, { useEffect, useState } from 'react';
import { ResponsiveContainer, LineChart, Line, XAxis, YAxis, Tooltip, Legend, CartesianGrid } from 'recharts';

const Card = ({ label, value, hint }: { label: string; value: React.ReactNode; hint?: string }) => (
  <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-sm">
    <div className="text-xs font-semibold text-slate-600">{label}</div>
    <div className="text-2xl font-extrabold text-slate-900 mt-1">{value}</div>
    {hint && <div className="text-[11px] text-slate-500 mt-1">{hint}</div>}
  </div>
);

export function PlatformMetrics() {
  const [dias, setDias] = useState(30);
  const [m, setM] = useState<any>(null);
  const [err, setErr] = useState('');
  useEffect(() => {
    setM(null);
    fetch(`/api/superadmin/metricas?dias=${dias}`, { credentials: 'include' })
      .then(r => r.ok ? r.json() : Promise.reject(new Error('No autorizado')))
      .then(setM).catch(e => setErr(e.message));
  }, [dias]);
  if (err) return <div className="p-4 rounded-xl bg-rose-50 text-rose-700">{err}</div>;
  if (!m) return <div className="p-6 text-slate-500">Cargando métricas…</div>;
  const money = (n: number) => `S/ ${Number(n || 0).toFixed(2)}`;
  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Métricas de la plataforma</h1>
          <p className="text-slate-600 text-sm">Registros, activación, conversión, ingresos y uso de los catálogos.</p>
        </div>
        <select aria-label="Periodo" value={dias} onChange={e => setDias(Number(e.target.value))} className="border border-slate-300 rounded-xl px-3 py-2 text-sm">
          <option value={7}>Últimos 7 días</option><option value={30}>Últimos 30 días</option><option value={90}>Últimos 90 días</option><option value={365}>Último año</option>
        </select>
      </div>
      {!m.metricasDisponibles && <div className="p-3 rounded-xl bg-amber-50 text-amber-800 text-sm">Las métricas de catálogos aún no están disponibles en la base.</div>}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Card label={`Registros (${m.dias} días)`} value={m.registros} hint={`${m.totalEmpresas} empresas en total`} />
        <Card label="Tasa de activación" value={`${m.tasaActivacion}%`} hint={`${m.activadas} con WhatsApp y productos`} />
        <Card label="Conversión prueba → pago" value={`${m.conversionPruebaPago}%`} hint={`${m.enPrueba} en prueba ahora`} />
        <Card label="MRR" value={money(m.mrr)} hint={`ARR ${money(m.arr)} · ${m.pagadoras} pagadoras`} />
        <Card label="Churn" value={`${m.churn}%`} hint={`${m.bajas} dejaron de pagar`} />
        <Card label="Visitas a catálogos" value={m.visitas} hint={`${m.compartidos} veces compartidos`} />
        <Card label="Clics a WhatsApp" value={m.clicsWhatsapp} hint={m.visitas ? `${Math.round(m.clicsWhatsapp / m.visitas * 100)}% de las visitas` : undefined} />
        <Card label="Pedidos" value={m.pedidos} hint={`Ventas de los negocios ${money(m.ventasCatalogos)}`} />
      </div>
      <div className="grid grid-cols-2 gap-4">
        <Card label="Ingresos aprobados del periodo" value={money(m.ingresosAprobados)} />
        <Card label="Pagos por revisar" value={m.pagosPendientes} />
      </div>
      <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-sm" data-testid="sa-loyalty">
        <h2 className="font-bold text-slate-900 mb-1">🏆 Fidelización (adopción)</h2>
        {!m.fidelizacion?.disponible ? <p className="text-sm text-slate-500">Aún no disponible: falta ejecutar v5.sql en Supabase.</p> : (
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mt-2">
            <Card label="Empresas con programa activo" value={m.fidelizacion.empresasActivas} hint={`${m.fidelizacion.adopcion}% de las empresas`} />
            <Card label="Clientes en programas" value={m.fidelizacion.miembros} hint={`${m.fidelizacion.uniones} se unieron en el periodo`} />
            <Card label="Compras con puntos" value={m.fidelizacion.puntosOtorgados} hint={`${m.fidelizacion.canjes} canjes de premios`} />
            <Card label="Cupones usados" value={m.fidelizacion.cupones} hint={`${m.fidelizacion.retos} retos completados`} />
          </div>)}
      </div>
      <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-sm">
        <h2 className="font-bold text-slate-900 mb-3">Actividad diaria</h2>
        <div style={{ width: '100%', height: 280 }}>
          <ResponsiveContainer>
            <LineChart data={m.serie}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
              <XAxis dataKey="fecha" tick={{ fontSize: 11 }} tickFormatter={(v: string) => v.slice(5)} />
              <YAxis allowDecimals={false} tick={{ fontSize: 11 }} />
              <Tooltip /><Legend />
              <Line type="monotone" dataKey="visitas" name="Visitas" stroke="#6d28d9" dot={false} />
              <Line type="monotone" dataKey="whatsapp" name="WhatsApp" stroke="#10b981" dot={false} />
              <Line type="monotone" dataKey="pedidos" name="Pedidos" stroke="#f59e0b" dot={false} />
              <Line type="monotone" dataKey="registros" name="Registros" stroke="#0ea5e9" dot={false} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>
      <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-sm overflow-x-auto">
        <h2 className="font-bold text-slate-900 mb-3">Catálogos con más movimiento</h2>
        <table className="w-full text-sm">
          <thead><tr className="text-left text-slate-600"><th className="py-2">Negocio</th><th className="text-right">Visitas</th><th className="text-right">WhatsApp</th><th className="text-right">Pedidos</th></tr></thead>
          <tbody>{m.topCatalogos.map((c: any) => <tr key={c.id} className="border-t border-slate-100"><td className="py-2">{c.nombre}</td><td className="text-right">{c.visitas}</td><td className="text-right">{c.whatsapp}</td><td className="text-right">{c.pedidos}</td></tr>)}</tbody>
        </table>
      </div>
      <p className="text-xs text-slate-500">Activación = empresa con WhatsApp válido y al menos 1 producto. Conversión = empresas con al menos un pago aprobado / total. Churn = pagadoras que hoy no están activas.</p>
    </div>
  );
}

export function ReferralsAdmin() {
  const [d, setD] = useState<any>(null);
  const load = () => fetch('/api/superadmin/referidos', { credentials: 'include' }).then(r => r.json()).then(setD).catch(() => setD({ available: false, items: [] }));
  useEffect(() => { load(); }, []);
  const act = async (id: string, accion: string) => {
    if (accion === 'aprobar' && !confirm('¿Aprobar? Se agregará 1 mes gratis a ambos negocios.')) return;
    const r = await fetch(`/api/superadmin/referidos/${id}/${accion}`, { method: 'POST', credentials: 'include' });
    if (!r.ok) alert((await r.json().catch(() => ({}))).error || 'Error'); load();
  };
  if (!d) return <div className="p-6 text-slate-500">Cargando…</div>;
  const label: Record<string, string> = { pendiente: 'Esperando primer pago', calificado: 'Listo para aprobar', aprobado: 'Premiado', rechazado: 'Rechazado' };
  return (
    <div className="space-y-4">
      <div><h1 className="text-2xl font-bold text-slate-900">Programa de referidos</h1><p className="text-slate-600 text-sm">Cuando el referido paga su primer plan pasa a “Listo para aprobar”. Al aprobar, ambos reciben 1 mes gratis.</p></div>
      {!d.available && <div className="p-3 rounded-xl bg-amber-50 text-amber-800 text-sm">Falta ejecutar v4.sql en Supabase para activar los referidos.</div>}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-x-auto">
        <table className="w-full text-sm">
          <thead><tr className="text-left text-slate-600 bg-slate-50"><th className="p-3">Fecha</th><th>Invitó</th><th>Invitado</th><th>Código</th><th>Estado</th><th></th></tr></thead>
          <tbody>
            {d.items.length === 0 && <tr><td colSpan={6} className="p-6 text-center text-slate-500">Aún no hay referidos.</td></tr>}
            {d.items.map((r: any) => (
              <tr key={r.id} className="border-t border-slate-100">
                <td className="p-3">{new Date(r.created_at).toLocaleDateString('es-PE')}</td><td>{r.referrerName}</td><td>{r.referredName}</td><td className="font-mono">{r.code}</td>
                <td>{label[r.status] || r.status}</td>
                <td className="text-right pr-3 space-x-2 whitespace-nowrap">
                  {(r.status === 'calificado' || r.status === 'pendiente') && <>
                    <button onClick={() => act(r.id, 'aprobar')} disabled={r.status !== 'calificado'} title={r.status !== 'calificado' ? 'Se habilita cuando el invitado pague su primer plan' : ''} className="px-3 py-1.5 rounded-lg bg-emerald-600 text-white font-bold disabled:opacity-40">Aprobar</button>
                    <button onClick={() => act(r.id, 'rechazar')} className="px-3 py-1.5 rounded-lg bg-slate-200 text-slate-700 font-bold">Rechazar</button>
                  </>}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
