import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import Logo from '../components/Logo';

interface ComplaintFormData {
  nombres: string;
  apellidos: string;
  tipoDocumento: string;
  numeroDocumento: string;
  email: string;
  telefono: string;
  tipo: 'Reclamo' | 'Queja';
  detalle: string;
  pedido: string;
}

const INITIAL_FORM_DATA: ComplaintFormData = {
  nombres: '',
  apellidos: '',
  tipoDocumento: 'DNI',
  numeroDocumento: '',
  email: '',
  telefono: '',
  tipo: 'Reclamo',
  detalle: '',
  pedido: '',
};

export default function ComplaintsBook() {
  const [submitted, setSubmitted] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState<ComplaintFormData>(INITIAL_FORM_DATA);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isLoading) return; // evita doble clic mientras se procesa

    setIsLoading(true);
    try {
      const res = await fetch('/api/complaints', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          nombres: formData.nombres,
          apellidos: formData.apellidos,
          tipoDocumento: formData.tipoDocumento,
          numeroDocumento: formData.numeroDocumento,
          email: formData.email,
          telefono: formData.telefono,
          tipo: formData.tipo,
          detalle: formData.detalle,
          pedido: formData.pedido,
        }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => null);
        throw new Error(data?.error || 'No se pudo registrar el reclamo');
      }

      setSubmitted(true);
      setFormData(INITIAL_FORM_DATA);
    } catch (err: any) {
      alert(err.message || 'Hubo un problema al enviar tu reclamo. Por favor, verifica tu conexión e inténtalo nuevamente.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 font-sans flex flex-col">
      <nav className="h-20 bg-white border-b border-slate-200 flex items-center justify-between px-6 md:px-10 flex-shrink-0">
        <Link to="/" className="flex items-center gap-2">
          <Logo size="md" />
        </Link>
        <div className="flex items-center gap-8 text-sm font-medium text-slate-600">
          <Link to="/" className="hover:text-indigo-600 transition-colors">Volver al inicio</Link>
        </div>
      </nav>

      <main className="flex-grow max-w-3xl mx-auto px-6 py-12 w-full">
        <h1 className="text-3xl font-extrabold text-slate-900 mb-2">Libro de Reclamaciones</h1>
        <p className="text-slate-600 mb-8">Conforme al Código de Protección y Defensa del Consumidor.</p>
        
        {submitted ? (
          <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-8 text-center">
            <h2 className="text-2xl font-bold text-emerald-800 mb-4">¡Reclamo enviado con éxito!</h2>
            <p className="text-emerald-600 mb-6">
              Hemos registrado su reclamo/queja. Nos pondremos en contacto con usted a la brevedad posible.
            </p>
            <button 
              onClick={() => setSubmitted(false)}
              className="bg-emerald-600 text-white px-6 py-2 rounded-lg font-medium hover:bg-emerald-700 transition-colors"
            >
              Registrar otro reclamo
            </button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="bg-white border border-slate-200 rounded-2xl p-6 md:p-8 space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Nombres</label>
                <input required type="text" name="nombres" value={formData.nombres} onChange={handleInputChange} className="w-full border border-slate-300 rounded-xl px-4 py-2.5 outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all" />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Apellidos</label>
                <input required type="text" name="apellidos" value={formData.apellidos} onChange={handleInputChange} className="w-full border border-slate-300 rounded-xl px-4 py-2.5 outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all" />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Tipo de Documento</label>
                <select name="tipoDocumento" value={formData.tipoDocumento} onChange={handleInputChange} className="w-full border border-slate-300 rounded-xl px-4 py-2.5 outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all">
                  <option value="DNI">DNI</option>
                  <option value="CE">CE</option>
                  <option value="Pasaporte">Pasaporte</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Número de Documento</label>
                <input required type="text" name="numeroDocumento" value={formData.numeroDocumento} onChange={handleInputChange} className="w-full border border-slate-300 rounded-xl px-4 py-2.5 outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all" />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Correo Electrónico</label>
                <input required type="email" name="email" value={formData.email} onChange={handleInputChange} className="w-full border border-slate-300 rounded-xl px-4 py-2.5 outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all" />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Teléfono</label>
                <input required type="tel" name="telefono" value={formData.telefono} onChange={handleInputChange} className="w-full border border-slate-300 rounded-xl px-4 py-2.5 outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all" />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">Tipo</label>
              <div className="flex gap-4">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input type="radio" name="tipo" value="Reclamo" checked={formData.tipo === 'Reclamo'} onChange={handleInputChange} className="text-indigo-600 focus:ring-indigo-500" />
                  <span className="text-sm text-slate-600">Reclamo</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input type="radio" name="tipo" value="Queja" checked={formData.tipo === 'Queja'} onChange={handleInputChange} className="text-indigo-600 focus:ring-indigo-500" />
                  <span className="text-sm text-slate-600">Queja</span>
                </label>
              </div>
              <p className="text-xs text-slate-500 mt-2">
                * <strong>Reclamo:</strong> Disconformidad relacionada a los productos o servicios. <br/>
                * <strong>Queja:</strong> Disconformidad no relacionada a los productos o servicios; o, malestar o descontento respecto a la atención al público.
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">Detalle del Reclamo / Queja</label>
              <textarea required rows={5} name="detalle" value={formData.detalle} onChange={handleInputChange} className="w-full border border-slate-300 rounded-xl px-4 py-3 outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all resize-none"></textarea>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">Pedido (Lo que solicita)</label>
              <textarea required rows={3} name="pedido" value={formData.pedido} onChange={handleInputChange} className="w-full border border-slate-300 rounded-xl px-4 py-3 outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all resize-none"></textarea>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full bg-indigo-600 text-white font-bold py-3 rounded-xl hover:bg-indigo-700 transition-colors disabled:opacity-70 flex items-center justify-center gap-2"
            >
              {isLoading ? (
                <>
                  <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                  Enviando...
                </>
              ) : (
                'Enviar Reclamo'
              )}
            </button>
          </form>
        )}
      </main>

      <footer className="bg-[#0b0014] text-slate-300 py-8 text-center text-sm">
        Copyright © 2026 ABSOLUT360 WOW SACS | RUC: 20613616978
      </footer>
    </div>
  );
}
