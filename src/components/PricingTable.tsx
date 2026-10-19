import { useState } from 'react';
import { Link } from 'react-router-dom';
import { CheckCircle, MessageCircle } from 'lucide-react';

// Debe coincidir con SUBSCRIPTION_PLAN_PRICES / ANNUAL_DISCOUNT_PCT de server.ts
// y con GrowthPanel (renovación anual = 12 meses × precio × 0.8, + IGV).
export const ANNUAL_DISCOUNT_PCT = 20;
export const annualMonthly = (monthly: number) => Math.round(monthly * (1 - ANNUAL_DISCOUNT_PCT / 100) * 100) / 100;
const fmt = (n: number) => (Number.isInteger(n) ? String(n) : n.toFixed(2));

type Plan = { id: string; name: string; emoji: string; short: string; tagline: string; price: number; ideal: string; perDay?: string; featured?: boolean; features: { t: string; bold?: boolean; isNew?: boolean }[] };

const PLANS: Plan[] = [
  { id: 'emprendedor', name: 'Emprendedor', emoji: '🚀', short: 'Emprendedor', tagline: 'Empieza a vender por Internet sin complicaciones.', price: 15, ideal: 'Ideal para: Emprendedores y pequeños negocios.',
    features: [{ t: 'Tienda online lista en 5 minutos', bold: true }, { t: 'Sin comisiones por venta', bold: true }, { t: 'Hasta 50 productos' }, { t: 'Catálogo Digital' }, { t: 'Pedidos por WhatsApp' }, { t: 'Código QR para compartir' }, { t: 'Gestión básica de clientes' }, { t: 'Personalización básica' }, { t: '1 Usuario' }] },
  { id: 'negocio', name: 'Negocio Pequeño', emoji: '⭐', short: 'Negocio', tagline: 'Controla las ventas de tu negocio desde un solo lugar.', price: 39, perDay: 'Menos de S/ 1.30 al día', featured: true, ideal: 'Ideal para: tiendas, bodegas, restaurantes y negocios con ventas diarias.',
    features: [{ t: 'Programa de fidelización (puntos y premios)', bold: true, isNew: true }, { t: 'Tarjeta en Google Wallet', bold: true, isNew: true }, { t: 'Hasta 300 productos' }, { t: 'Punto de Venta (POS)' }, { t: 'Control de Inventario' }, { t: 'Gestión de Clientes (CRM)' }, { t: 'Caja diaria' }, { t: 'Reportes de ventas' }, { t: 'Pagos con Yape y Plin' }, { t: 'Personaliza tu marca' }, { t: 'Hasta 3 usuarios' }] },
  { id: 'empresa', name: 'Empresa', emoji: '🏢', short: 'Empresa', tagline: 'Automatiza tu empresa y aumenta tus ventas.', price: 79, ideal: 'Ideal para: Empresas que buscan crecer y automatizar sus procesos.',
    features: [{ t: 'Todo lo de Negocio Pequeño, más:', bold: true }, { t: 'Alertas de ofertas al pasar cerca de tu tienda', bold: true, isNew: true }, { t: 'Varias sucursales en el mapa', bold: true, isNew: true }, { t: 'Hasta 700 productos' }, { t: 'Cupones y promociones' }, { t: 'Dominio personalizado' }, { t: 'Multiusuarios' }, { t: 'Reportes avanzados' }, { t: 'Roles y permisos' }, { t: 'Soporte prioritario' }] },
];

export default function PricingTable() {
  const [billing, setBilling] = useState<'mensual' | 'anual'>('mensual');
  const anual = billing === 'anual';
  return (
    <section aria-label="Precios" className="w-full max-w-6xl mb-20 px-4">
      <div className="flex flex-col items-center gap-4 mb-10">
        <div className="inline-flex items-center gap-2 bg-emerald-50 border border-emerald-200 text-emerald-800 font-bold text-sm md:text-base px-5 py-2.5 rounded-full shadow-sm text-center">
          🎁 Prueba 15 días gratis, sin tarjeta
        </div>
        <div role="radiogroup" aria-label="Frecuencia de pago" className="inline-flex bg-white border border-slate-200 rounded-full p-1 shadow-sm">
          {(['mensual', 'anual'] as const).map(b => (
            <button key={b} type="button" role="radio" aria-checked={billing === b} onClick={() => setBilling(b)}
              className={`px-5 py-2 rounded-full text-sm font-bold transition-colors ${billing === b ? 'bg-indigo-600 text-white shadow' : 'text-slate-600 hover:text-indigo-600'}`}>
              {b === 'mensual' ? 'Mensual' : <>Anual <span className={`ml-1 text-[11px] px-2 py-0.5 rounded-full ${billing === b ? 'bg-amber-400 text-amber-950' : 'bg-emerald-100 text-emerald-700'}`}>-{ANNUAL_DISCOUNT_PCT}%</span></>}
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        {PLANS.map(p => {
          const f = !!p.featured;
          const price = anual ? annualMonthly(p.price) : p.price;
          return (
            <div key={p.id} className={f ? 'bg-indigo-600 rounded-2xl border border-indigo-500 p-8 flex flex-col shadow-xl ring-4 ring-indigo-500/20 relative' : 'bg-white rounded-2xl border border-slate-200 p-8 flex flex-col shadow-sm'}>
              {f && <div className="absolute -top-4 left-1/2 -translate-x-1/2 bg-amber-400 text-amber-950 text-[10px] font-black px-4 py-1.5 rounded-full uppercase tracking-widest whitespace-nowrap shadow-sm">Más popular</div>}
              <div className="mb-6">
                <h3 className={`text-xl font-bold ${f ? 'text-white' : 'text-slate-800'}`}>{p.emoji} {p.name}</h3>
                <p className={`text-sm mt-2 min-h-[40px] ${f ? 'text-indigo-100' : 'text-slate-500'}`}>{p.tagline}</p>
                <div className="flex items-baseline gap-2 mt-4">
                  {anual && <span className={`text-lg font-bold line-through ${f ? 'text-indigo-300' : 'text-slate-400'}`}>S/ {p.price}</span>}
                  <span className={`text-4xl font-black ${f ? 'text-white' : 'text-slate-900'}`} data-testid={`precio-${p.id}`}>S/ {fmt(price)}</span>
                  <span className={`font-medium ${f ? 'text-indigo-100' : 'text-slate-500'}`}>/mes</span>
                </div>
                <p className={`text-xs mt-1 min-h-[16px] font-semibold ${f ? 'text-amber-300' : 'text-emerald-600'}`}>
                  {anual ? `S/ ${fmt(Math.round(price * 12 * 100) / 100)} al año · ahorras S/ ${fmt(Math.round((p.price - price) * 12 * 100) / 100)}` : (p.perDay || '')}
                </p>
              </div>
              <ul className="flex-grow space-y-4 mb-8">
                {p.features.map(x => (
                  <li key={x.t} className={`flex items-start gap-3 text-sm ${f ? 'text-white' : 'text-slate-600'} ${x.bold ? 'font-bold' : 'font-medium'}`}>
                    <CheckCircle className={`w-5 h-5 shrink-0 ${f ? 'text-indigo-300' : 'text-emerald-500'}`} />
                    <span>{x.t}{x.isNew && <span className="ml-2 align-middle text-[10px] font-black uppercase bg-amber-400 text-amber-950 px-1.5 py-0.5 rounded">Nuevo</span>}</span>
                  </li>
                ))}
              </ul>
              <div className={`mt-auto pt-6 border-t ${f ? 'border-indigo-500/50' : 'border-slate-100'}`}>
                <p className={`text-xs mb-4 font-medium italic ${f ? 'text-indigo-100' : 'text-slate-500'}`}>{p.ideal}</p>
                <Link to={`/auth?mode=register&trial=true&plan=${p.id}`} aria-label={`Empieza gratis con ${p.name}`}
                  className={f ? 'block text-center w-full py-3.5 rounded-xl bg-white text-indigo-600 font-bold shadow-md hover:bg-slate-50 transition-colors' : 'block text-center w-full py-3.5 rounded-xl bg-indigo-600 text-white font-bold hover:bg-indigo-700 transition-colors'}>
                  Empieza gratis
                </Link>
                <Link to={`/checkout/${p.id}`} className={`block text-center mt-3 text-sm font-semibold underline-offset-2 hover:underline ${f ? 'text-indigo-100' : 'text-slate-500'}`}>
                  o contratar {p.short} ahora
                </Link>
              </div>
            </div>
          );
        })}
      </div>

      <div className="mt-10 flex flex-col items-center gap-4 text-center">
        <p className="text-sm md:text-base font-semibold text-slate-600">Sin contratos, cancela cuando quieras · Paga con Yape o Plin</p>
        {anual && <p className="text-xs text-slate-500">Precios sin IGV. El plan anual se paga una sola vez por 12 meses.</p>}
        <a href={`https://wa.me/51901345791?text=${encodeURIComponent('Hola, tengo dudas sobre los planes de WowSmart')}`} target="_blank" rel="noopener noreferrer"
          className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-white font-bold shadow-sm transition-colors">
          <MessageCircle className="w-5 h-5" /> ¿Dudas? Escríbenos por WhatsApp
        </a>
      </div>
    </section>
  );
}
