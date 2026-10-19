import React from 'react';
import { Link } from 'react-router-dom';
import Logo from './Logo';

export default function LegalLayout({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 font-sans flex flex-col">
      <nav className="h-20 bg-white border-b border-slate-200 flex items-center justify-between px-5 md:px-10 flex-shrink-0">
        <Link to="/" className="flex items-center gap-2"><Logo size="md" /></Link>
        <Link to="/" className="text-sm font-medium text-slate-600 hover:text-indigo-600 transition-colors">Volver al inicio</Link>
      </nav>
      <main className="flex-grow max-w-4xl mx-auto px-6 py-12 w-full">
        <h1 className="text-3xl md:text-4xl font-extrabold text-slate-900 mb-8">{title}</h1>
        <div className="space-y-4 text-slate-600 leading-relaxed [&_h2]:text-xl [&_h2]:font-bold [&_h2]:text-slate-900 [&_h2]:mt-8 [&_h2]:mb-2 [&_ul]:list-disc [&_ul]:pl-6 [&_ul]:space-y-1">
          {children}
        </div>
        <div className="mt-12 flex flex-wrap gap-4 text-sm">
          <Link to="/terminos" className="text-indigo-600 font-semibold hover:underline">Términos y Condiciones</Link>
          <Link to="/privacidad" className="text-indigo-600 font-semibold hover:underline">Política de Privacidad</Link>
          <Link to="/reclamaciones" className="text-indigo-600 font-semibold hover:underline">Libro de Reclamaciones</Link>
        </div>
      </main>
      <footer className="bg-[#0b0014] text-center text-xs text-slate-400 py-6">Copyright © 2026 ABSOLUT360 WOW SACS | RUC: 20613616978</footer>
    </div>
  );
}
