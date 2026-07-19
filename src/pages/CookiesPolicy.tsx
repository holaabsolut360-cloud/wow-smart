import React from 'react';
import { Link } from 'react-router-dom';
import Logo from '../components/Logo';

export default function CookiesPolicy() {
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

      <main className="flex-grow max-w-4xl mx-auto px-6 py-12 w-full">
        <h1 className="text-4xl font-extrabold text-slate-900 mb-8">Política de Cookies</h1>
        
        <div className="prose prose-slate max-w-none prose-h2:text-2xl prose-h2:font-bold prose-h2:mt-8 prose-h2:mb-4 prose-p:text-slate-600 prose-p:leading-relaxed">
          <p>Última actualización: {new Date().toLocaleDateString('es-PE')}</p>
          
          <h2>1. ¿Qué son las cookies?</h2>
          <p>
            Una cookie es un fichero que se descarga en su ordenador al acceder a determinadas páginas web. Las cookies permiten a una página web, entre otras cosas, almacenar y recuperar información sobre los hábitos de navegación de un usuario o de su equipo.
          </p>

          <h2>2. Tipos de cookies que utilizamos</h2>
          <ul className="list-disc pl-6 text-slate-600 mb-6">
            <li><strong>Cookies técnicas:</strong> Son aquellas que permiten al usuario la navegación a través de una página web, plataforma o aplicación y la utilización de las diferentes opciones o servicios que en ella existan.</li>
            <li><strong>Cookies de personalización:</strong> Permiten al usuario acceder al servicio con algunas características de carácter general predefinidas.</li>
            <li><strong>Cookies de análisis:</strong> Son aquellas que bien tratadas por nosotros o por terceros, nos permiten cuantificar el número de usuarios y así realizar la medición y análisis estadístico.</li>
          </ul>

          <h2>3. Desactivación o eliminación de cookies</h2>
          <p>
            Puede usted permitir, bloquear o eliminar las cookies instaladas en su equipo mediante la configuración de las opciones del navegador instalado en su ordenador.
          </p>

          <h2>4. Contacto</h2>
          <p>
            Si tiene dudas sobre esta política de cookies, puede contactar con WowSmart en ventas@wow-smart.com.
          </p>
        </div>
      </main>

      <footer className="bg-[#0b0014] text-slate-300 py-8 text-center text-sm">
        Copyright © 2026 ABSOLUT360 WOW SACS | RUC: 20613616978
      </footer>
    </div>
  );
}
