import React from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { ExternalLink, PlusCircle, Trash2, ChevronDown, Palette, Share2, Wallet, Clock, BarChart3, Building2 } from 'lucide-react';
import { ImageUpload } from '../ImageUpload';
import { Company } from '../../types';

interface SettingsTabProps {
  company: Company | null;
  setCompany: React.Dispatch<React.SetStateAction<Company | null>>;
}

function SectionSummary({
  icon: Icon,
  title,
  subtitle,
  accent = 'indigo',
}: {
  icon: React.ElementType;
  title: string;
  subtitle: string;
  accent?: 'indigo' | 'amber';
}) {
  const accentClasses = accent === 'amber'
    ? 'bg-amber-50 text-amber-600'
    : 'bg-indigo-50 text-indigo-600';

  return (
    <summary className="flex items-center justify-between gap-4 cursor-pointer list-none p-6">
      <div className="flex items-center gap-4">
        <div className={`w-11 h-11 rounded-xl flex items-center justify-center shrink-0 ${accentClasses}`}>
          <Icon className="w-5 h-5" />
        </div>
        <div>
          <h3 className="font-bold text-slate-900">{title}</h3>
          <p className="text-sm text-slate-500">{subtitle}</p>
        </div>
      </div>
      <ChevronDown className="w-5 h-5 text-slate-400 shrink-0 transition-transform group-open:rotate-180" />
    </summary>
  );
}

export function SettingsTab({ company, setCompany }: SettingsTabProps) {
  return (
    <div id="settings" className="max-w-3xl">
      <h2 className="text-3xl font-extrabold text-slate-900 tracking-tight mb-2">Mi Empresa</h2>
      <p className="text-slate-500 mb-8">Personaliza la información y apariencia de tu catálogo</p>

      <div className="mb-6 p-6 bg-white border border-slate-200 rounded-2xl shadow-sm flex flex-col md:flex-row items-center gap-6">
        <div className="qr-container flex-shrink-0 p-4 bg-white border border-slate-100 rounded-xl shadow-sm">
          <QRCodeSVG
            value={`${window.location.origin}/c/${company?.slug}`}
            size={120}
            level={"H"}
            includeMargin={true}
            fgColor={company?.color || "#4f46e5"}
          />
        </div>
        <div>
          <h3 className="text-lg font-bold text-slate-900 mb-1">Código QR de tu Catálogo</h3>
          <p className="text-sm text-slate-500 mb-4">
            Escanea este código o descárgalo para imprimirlo y colocarlo en tu tienda física. Tus clientes podrán acceder rápidamente a tu catálogo digital.
          </p>
          <div className="flex flex-wrap gap-3">
            <a
              href={`/c/${company?.slug}`}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 px-4 py-2 bg-indigo-50 text-indigo-700 font-bold rounded-lg hover:bg-indigo-100 transition-colors text-sm"
            >
              <ExternalLink className="w-4 h-4" />
              Abrir Catálogo
            </a>
            <button
              onClick={() => {
                const svg = document.querySelector('.qr-container svg') as SVGElement;
                if (!svg) return;
                const svgData = new XMLSerializer().serializeToString(svg);
                const canvas = document.createElement('canvas');
                const ctx = canvas.getContext('2d');
                const img = new Image();
                img.onload = () => {
                  canvas.width = img.width;
                  canvas.height = img.height;
                  if (ctx) {
                    ctx.fillStyle = 'white';
                    ctx.fillRect(0, 0, canvas.width, canvas.height);
                    ctx.drawImage(img, 0, 0);
                  }
                  const pngFile = canvas.toDataURL('image/png');
                  const downloadLink = document.createElement('a');
                  downloadLink.download = `QR-${company?.slug || 'catalogo'}.png`;
                  downloadLink.href = `${pngFile}`;
                  downloadLink.click();
                };
                img.src = 'data:image/svg+xml;base64,' + btoa(unescape(encodeURIComponent(svgData)));
              }}
              className="inline-flex items-center gap-2 px-4 py-2 bg-slate-900 text-white font-bold rounded-lg hover:bg-slate-800 transition-colors text-sm"
            >
              Descargar QR
            </button>
          </div>
        </div>
      </div>

      <form onSubmit={() => {}} className="space-y-4">

        <details open className="group bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden open:pb-6">
          <SectionSummary icon={Palette} title="Marca" subtitle="Logo, banner, nombre y colores de tu catálogo" />
          <div className="px-6 grid grid-cols-2 gap-6">
            <div className="col-span-2">
              <ImageUpload
                label="Logo de la empresa"
                value={company?.logo || ''}
                onChange={base64 => setCompany(c => c ? {...c, logo: base64} : null)}
                aspectRatio="square"
              />
            </div>

            <div className="col-span-2">
              <ImageUpload
                label="Fondo / Banner de tu catálogo (Opcional)"
                value={company?.banner || ''}
                onChange={base64 => setCompany(c => c ? {...c, banner: base64} : null)}
                aspectRatio="video"
              />
            </div>

            <div className="col-span-2 md:col-span-1">
              <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Nombre de la empresa</label>
              <input
                type="text"
                value={company?.name || ''}
                onChange={e => setCompany(c => c ? {...c, name: e.target.value} : null)}
                className="w-full bg-white border border-slate-200 rounded-xl px-4 py-2.5 text-slate-900 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 outline-none transition-all"
              />
            </div>

            <div className="col-span-2 md:col-span-1">
              <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Tipo de Negocio</label>
              <select
                value={company?.businessType || ''}
                onChange={e => setCompany(c => c ? {...c, businessType: e.target.value} : null)}
                className="w-full bg-white border border-slate-200 rounded-xl px-4 py-2.5 text-slate-900 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 outline-none transition-all"
              >
                <option value="">Selecciona un tipo</option>
                <option value="Comercio">Comercio General</option>
                <option value="Tienda">Tienda / Retail</option>
                <option value="Moda">Moda y Ropa</option>
                <option value="Ferretería">Ferretería</option>
                <option value="Regalos">Regalos</option>
                <option value="Hogar">Hogar y Decoración</option>
                <option value="Imprenta">Imprenta</option>
                <option value="Agencia de Publicidad">Agencia de Publicidad</option>
                <option value="Estudio de Abogados">Estudio de Abogados</option>
                <option value="Restaurante">Restaurante / Comida</option>
                <option value="Servicios Profesionales">Servicios Profesionales</option>
                <option value="Otro">Otro</option>
              </select>
            </div>

            <div className="col-span-2">
              <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Descripción corta (Aparece en el pie de página)</label>
              <textarea
                value={company?.description || ''}
                onChange={e => setCompany(c => c ? {...c, description: e.target.value} : null)}
                placeholder="Ej: Vendemos productos de repostería artesanal en Lima."
                rows={2}
                className="w-full bg-white border border-slate-200 rounded-xl px-4 py-2.5 text-slate-900 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 outline-none transition-all"
              />
            </div>

            <div className="col-span-2 md:col-span-1">
              <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Color Principal</label>
              <div className="flex gap-3">
                <input
                  type="color"
                  value={company?.color || '#4f46e5'}
                  onChange={e => setCompany(c => c ? {...c, color: e.target.value} : null)}
                  className="w-12 h-11 bg-white border border-slate-200 rounded-xl p-1 cursor-pointer"
                />
                <input
                  type="text"
                  value={company?.color || '#4f46e5'}
                  onChange={e => setCompany(c => c ? {...c, color: e.target.value} : null)}
                  className="flex-1 bg-white border border-slate-200 rounded-xl px-4 py-2.5 text-slate-900 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 outline-none transition-all"
                />
              </div>
            </div>

            <div className="col-span-2 md:col-span-1">
              <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Moneda</label>
              <select
                value={company?.currency || 'S/'}
                onChange={e => setCompany(c => c ? {...c, currency: e.target.value} : null)}
                className="w-full bg-white border border-slate-200 rounded-xl px-4 py-2.5 text-slate-900 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 outline-none transition-all"
              >
                <option value="S/">Soles (S/)</option>
                <option value="$">Dólares ($)</option>
                <option value="€">Euros (€)</option>
                <option value="MXN$">Pesos Mexicanos (MXN$)</option>
                <option value="COP$">Pesos Colombianos (COP$)</option>
                <option value="ARS$">Pesos Argentinos (ARS$)</option>
                <option value="CLP$">Pesos Chilenos (CLP$)</option>
                <option value="Bs.">Bolívares (Bs.)</option>
                <option value="£">Libras (£)</option>
              </select>
            </div>
          </div>
        </details>

        <details className="group bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden open:pb-6">
          <SectionSummary icon={Building2} title="Contacto y ubicación" subtitle="Cómo y dónde te encuentran tus clientes" />
          <div className="px-6 grid grid-cols-2 gap-6">
            <div className="col-span-2 md:col-span-1">
              <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">WhatsApp</label>
              <input
                type="text"
                value={company?.whatsapp || ''}
                onChange={e => setCompany(c => c ? {...c, whatsapp: e.target.value} : null)}
                placeholder="51999999999"
                className="w-full bg-white border border-slate-200 rounded-xl px-4 py-2.5 text-slate-900 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 outline-none transition-all"
              />
            </div>

            <div className="col-span-2 md:col-span-1">
              <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Email de contacto</label>
              <input
                type="email"
                value={company?.email || ''}
                onChange={e => setCompany(c => c ? {...c, email: e.target.value} : null)}
                placeholder="ventas@tunegocio.com"
                className="w-full bg-white border border-slate-200 rounded-xl px-4 py-2.5 text-slate-900 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 outline-none transition-all"
              />
            </div>

            <div className="col-span-2 md:col-span-1">
              <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Sitio web (Opcional)</label>
              <input
                type="text"
                value={company?.website || ''}
                onChange={e => setCompany(c => c ? {...c, website: e.target.value} : null)}
                placeholder="tunegocio.com"
                className="w-full bg-white border border-slate-200 rounded-xl px-4 py-2.5 text-slate-900 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 outline-none transition-all"
              />
            </div>

            <div className="col-span-2 md:col-span-1">
              <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Dirección</label>
              <input
                type="text"
                value={company?.address || ''}
                onChange={e => setCompany(c => c ? {...c, address: e.target.value} : null)}
                placeholder="Av. Argentina 144 - Lima"
                className="w-full bg-white border border-slate-200 rounded-xl px-4 py-2.5 text-slate-900 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 outline-none transition-all"
              />
            </div>

            <div className="col-span-2">
              <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Horario de atención (texto libre, aparece en el pie de página)</label>
              <textarea
                value={company?.hours || ''}
                onChange={e => setCompany(c => c ? {...c, hours: e.target.value} : null)}
                placeholder="Lunes a Viernes 10:00 - 20:00"
                rows={2}
                className="w-full bg-white border border-slate-200 rounded-xl px-4 py-2.5 text-slate-900 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 outline-none transition-all"
              />
            </div>
          </div>
        </details>

        <details className="group bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden open:pb-6">
          <SectionSummary icon={Share2} title="Redes sociales" subtitle="Enlaces a tus perfiles de Instagram, Facebook, TikTok y más" />
          <div className="px-6">
            <div className="grid grid-cols-2 gap-6 mb-4">
              <div className="col-span-2 md:col-span-1">
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Instagram (URL Opcional)</label>
                <input
                  type="url"
                  value={company?.instagram || ''}
                  onChange={e => setCompany(c => c ? {...c, instagram: e.target.value} : null)}
                  placeholder="https://instagram.com/tu_cuenta"
                  className="w-full bg-white border border-slate-200 rounded-xl px-4 py-2.5 text-slate-900 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 outline-none transition-all"
                />
              </div>

              <div className="col-span-2 md:col-span-1">
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Facebook (URL Opcional)</label>
                <input
                  type="url"
                  value={company?.facebook || ''}
                  onChange={e => setCompany(c => c ? {...c, facebook: e.target.value} : null)}
                  placeholder="https://facebook.com/tu_cuenta"
                  className="w-full bg-white border border-slate-200 rounded-xl px-4 py-2.5 text-slate-900 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 outline-none transition-all"
                />
              </div>

              <div className="col-span-2 md:col-span-1">
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">TikTok (URL Opcional)</label>
                <input
                  type="url"
                  value={company?.tiktok || ''}
                  onChange={e => setCompany(c => c ? {...c, tiktok: e.target.value} : null)}
                  placeholder="https://tiktok.com/@tu_cuenta"
                  className="w-full bg-white border border-slate-200 rounded-xl px-4 py-2.5 text-slate-900 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 outline-none transition-all"
                />
              </div>
            </div>

            <div className="flex items-center justify-between mb-4">
              <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider">Otras redes sociales</label>
              <button
                type="button"
                onClick={() => setCompany(c => c ? {...c, socialLinks: [...(c.socialLinks || []), {platform: 'Instagram', url: ''}]} : null)}
                className="flex items-center gap-1.5 text-xs font-bold text-indigo-600 hover:text-indigo-700 bg-indigo-50 hover:bg-indigo-100 px-3 py-1.5 rounded-lg transition-colors"
              >
                <PlusCircle className="w-4 h-4" /> Agregar red
              </button>
            </div>

            <div className="space-y-3">
              {company?.socialLinks?.map((link, i) => (
                <div key={i} className="flex gap-3">
                  <select
                    value={link.platform}
                    onChange={(e) => {
                      const newLinks = [...(company.socialLinks || [])];
                      newLinks[i].platform = e.target.value;
                      setCompany({...company, socialLinks: newLinks});
                    }}
                    className="w-1/3 bg-white border border-slate-200 rounded-xl px-4 py-2.5 text-slate-900 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 outline-none transition-all"
                  >
                    <option value="Instagram">Instagram</option>
                    <option value="Facebook">Facebook</option>
                    <option value="TikTok">TikTok</option>
                    <option value="YouTube">YouTube</option>
                    <option value="X/Twitter">X/Twitter</option>
                    <option value="LinkedIn">LinkedIn</option>
                    <option value="Pinterest">Pinterest</option>
                    <option value="Otro">Otro</option>
                  </select>
                  <input
                    type="text"
                    value={link.url}
                    onChange={(e) => {
                      const newLinks = [...(company.socialLinks || [])];
                      newLinks[i].url = e.target.value;
                      setCompany({...company, socialLinks: newLinks});
                    }}
                    placeholder="URL del perfil (Ej: https://...)"
                    className="flex-1 bg-white border border-slate-200 rounded-xl px-4 py-2.5 text-slate-900 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 outline-none transition-all"
                  />
                  <button
                    type="button"
                    onClick={() => {
                      const newLinks = [...(company.socialLinks || [])];
                      newLinks.splice(i, 1);
                      setCompany({...company, socialLinks: newLinks});
                    }}
                    className="w-12 flex items-center justify-center rounded-xl bg-red-50 text-red-600 hover:bg-red-100 transition-colors"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))}
              {(!company?.socialLinks || company.socialLinks.length === 0) && (
                <div className="text-sm text-slate-500 text-center py-4 border border-dashed border-slate-200 rounded-xl bg-slate-50">
                  No has agregado ninguna red social adicional.
                </div>
              )}
            </div>
          </div>
        </details>

        <details className="group bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden open:pb-6">
          <SectionSummary icon={Wallet} title="Pagos anticipados" subtitle="Muestra tus datos de Yape, Plin o banco al momento de la venta" />
          <div className="px-6 grid grid-cols-2 gap-6">
            <div className="col-span-2 md:col-span-1">
              <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Número Yape</label>
              <input
                type="text"
                value={company?.yapeNumber || ''}
                onChange={e => setCompany(c => c ? {...c, yapeNumber: e.target.value} : null)}
                placeholder="999 999 999"
                className="w-full bg-white border border-slate-200 rounded-xl px-4 py-2.5 text-slate-900 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 outline-none transition-all"
              />
            </div>
            <div className="col-span-2 md:col-span-1">
              <ImageUpload
                label="QR de Yape"
                value={company?.yapeQr || ''}
                onChange={base64 => setCompany(c => c ? {...c, yapeQr: base64} : null)}
                aspectRatio="square"
              />
            </div>

            <div className="col-span-2 md:col-span-1">
              <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Número Plin</label>
              <input
                type="text"
                value={company?.plinNumber || ''}
                onChange={e => setCompany(c => c ? {...c, plinNumber: e.target.value} : null)}
                placeholder="999 999 999"
                className="w-full bg-white border border-slate-200 rounded-xl px-4 py-2.5 text-slate-900 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 outline-none transition-all"
              />
            </div>
            <div className="col-span-2 md:col-span-1">
              <ImageUpload
                label="QR de Plin"
                value={company?.plinQr || ''}
                onChange={base64 => setCompany(c => c ? {...c, plinQr: base64} : null)}
                aspectRatio="square"
              />
            </div>

            <div className="col-span-2 md:col-span-1">
              <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Banco</label>
              <input
                type="text"
                value={company?.bankName || ''}
                onChange={e => setCompany(c => c ? {...c, bankName: e.target.value} : null)}
                placeholder="BCP, Interbank, BBVA..."
                className="w-full bg-white border border-slate-200 rounded-xl px-4 py-2.5 text-slate-900 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 outline-none transition-all"
              />
            </div>
            <div className="col-span-2 md:col-span-1">
              <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Número de cuenta / CCI</label>
              <input
                type="text"
                value={company?.bankAccount || ''}
                onChange={e => setCompany(c => c ? {...c, bankAccount: e.target.value} : null)}
                placeholder="Cuenta o CCI"
                className="w-full bg-white border border-slate-200 rounded-xl px-4 py-2.5 text-slate-900 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 outline-none transition-all"
              />
            </div>
          </div>
        </details>

        <details className="group bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden open:pb-6">
          <SectionSummary icon={Clock} title="Horarios de atención" subtitle="Define cuándo tu catálogo acepta pedidos automáticamente" />
          <div className="px-6">
            <div className="mb-6">
              <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Tipo de Atención</label>
              <select
                value={company?.storeHoursType || '24h'}
                onChange={e => setCompany(c => c ? {...c, storeHoursType: e.target.value as any} : null)}
                className="w-full bg-white border border-slate-200 rounded-xl px-4 py-2.5 text-slate-900 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 outline-none transition-all"
              >
                <option value="24h">Abierto 24 horas (Siempre permite pedidos)</option>
                <option value="specific">Horario Específico (Bloquea pedidos fuera de horario)</option>
              </select>
            </div>

            {company?.storeHoursType === 'specific' && company.storeSchedule && (
              <div className="space-y-3">
                {['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'].map((day, i) => (
                  <div key={i} className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4 p-3 bg-slate-50 rounded-xl border border-slate-200">
                    <label className="flex items-center gap-2 cursor-pointer w-32">
                      <input
                        type="checkbox"
                        checked={company.storeSchedule?.[i]?.isOpen || false}
                        onChange={e => {
                          const newSched = {...company.storeSchedule};
                          if (newSched[i]) newSched[i].isOpen = e.target.checked;
                          setCompany(c => c ? {...c, storeSchedule: newSched} : null);
                        }}
                        className="w-4 h-4 text-indigo-600 focus:ring-indigo-500 rounded border-slate-300"
                      />
                      <span className="text-sm font-bold text-slate-700">{day}</span>
                    </label>
                    {company.storeSchedule?.[i]?.isOpen ? (
                      <div className="flex items-center gap-2 flex-1">
                        <input
                          type="time"
                          value={company.storeSchedule[i].openTime}
                          onChange={e => {
                            const newSched = {...company.storeSchedule};
                            if (newSched[i]) newSched[i].openTime = e.target.value;
                            setCompany(c => c ? {...c, storeSchedule: newSched} : null);
                          }}
                          className="bg-white border border-slate-300 rounded-lg px-3 py-1.5 text-sm outline-none focus:border-indigo-500 font-medium"
                        />
                        <span className="text-slate-400 text-sm font-bold">a</span>
                        <input
                          type="time"
                          value={company.storeSchedule[i].closeTime}
                          onChange={e => {
                            const newSched = {...company.storeSchedule};
                            if (newSched[i]) newSched[i].closeTime = e.target.value;
                            setCompany(c => c ? {...c, storeSchedule: newSched} : null);
                          }}
                          className="bg-white border border-slate-300 rounded-lg px-3 py-1.5 text-sm outline-none focus:border-indigo-500 font-medium"
                        />
                      </div>
                    ) : (
                      <div className="text-sm text-slate-400 font-bold italic py-1.5">Cerrado</div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </details>

        <details className="group bg-amber-50/40 rounded-2xl border-2 border-dashed border-amber-200 shadow-sm overflow-hidden open:pb-6">
          <SectionSummary
            icon={BarChart3}
            title="Marketing & SEO avanzado"
            subtitle="Opcional — solo si ya sabes qué es Google Analytics o Meta Pixel"
            accent="amber"
          />
          <div className="px-6 grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="md:col-span-2">
              <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Meta Título (SEO)</label>
              <input
                type="text"
                value={company?.metaTitle || ''}
                onChange={e => setCompany(c => c ? {...c, metaTitle: e.target.value} : null)}
                placeholder="Ej: Zapatos elegantes - Tienda Oficial"
                className="w-full px-4 py-3 bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all text-slate-900"
              />
              <p className="text-xs text-slate-400 mt-1">Título que aparecerá en Google y al compartir en redes.</p>
            </div>

            <div className="md:col-span-2">
              <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Meta Descripción (SEO)</label>
              <textarea
                value={company?.metaDescription || ''}
                onChange={e => setCompany(c => c ? {...c, metaDescription: e.target.value} : null)}
                placeholder="Breve descripción de tu negocio para Google..."
                className="w-full px-4 py-3 bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all text-slate-900 h-24 resize-none"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Google Analytics ID</label>
              <input
                type="text"
                value={company?.googleAnalyticsId || ''}
                onChange={e => setCompany(c => c ? {...c, googleAnalyticsId: e.target.value} : null)}
                placeholder="Ej: G-XXXXXXXXXX"
                className="w-full px-4 py-3 bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all text-slate-900"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Meta Pixel ID</label>
              <input
                type="text"
                value={company?.metaPixelId || ''}
                onChange={e => setCompany(c => c ? {...c, metaPixelId: e.target.value} : null)}
                placeholder="Ej: 1234567890"
                className="w-full px-4 py-3 bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all text-slate-900"
              />
            </div>
          </div>
        </details>

        <div className="pt-2">
          <button type="submit" className="w-full py-3.5 rounded-xl bg-indigo-600 text-white font-semibold hover:bg-indigo-700 transition-colors shadow-sm shadow-indigo-600/20">
            Guardar cambios
          </button>
        </div>
      </form>
    </div>
  );
}
