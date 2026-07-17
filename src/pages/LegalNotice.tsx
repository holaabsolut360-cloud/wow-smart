import React from 'react';
import { Link } from 'react-router-dom';

export default function LegalNotice() {
  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 font-sans flex flex-col">
      <nav className="h-20 bg-white border-b border-slate-200 flex items-center justify-between px-6 md:px-10 flex-shrink-0">
        <Link to="/" className="flex items-center gap-2">
          <img src="/logo.png" alt="WowSmart" className="h-10 object-contain" />
        </Link>
        <div className="flex items-center gap-8 text-sm font-medium text-slate-600">
          <Link to="/" className="hover:text-indigo-600 transition-colors">Volver al inicio</Link>
        </div>
      </nav>

      <main className="flex-grow max-w-4xl mx-auto px-6 py-12 w-full">
        <h1 className="text-4xl font-extrabold text-slate-900 mb-8">Aviso Legal</h1>
        
        <div className="prose prose-slate max-w-none prose-h2:text-2xl prose-h2:font-bold prose-h2:mt-8 prose-h2:mb-4 prose-p:text-slate-600 prose-p:leading-relaxed">
          <p>Última actualización: {new Date().toLocaleDateString('es-PE')}</p>
          
          <h2>1. Datos Identificativos</h2>
          <p>
            En cumplimiento con el deber de información recogido en la normativa vigente, se reflejan a continuación los siguientes datos: la empresa titular de dominio web es ABSOLUT360 WOW SACS (en adelante WowSmart), con RUC: 20613616978, domiciliada en Perú, Lima.
          </p>

          <h2>2. Usuarios</h2>
          <p>
            El acceso y/o uso de este portal de WowSmart atribuye la condición de USUARIO, que acepta, desde dicho acceso y/o uso, las Condiciones Generales de Uso aquí reflejadas.
          </p>

          <h2>3. Uso del Portal</h2>
          <p>
            WowSmart proporciona el acceso a multitud de informaciones, servicios, programas o datos (en adelante, "los contenidos") en Internet pertenecientes a WowSmart o a sus licenciantes a los que el USUARIO pueda tener acceso.
          </p>

          <h2>4. Propiedad Intelectual e Industrial</h2>
          <p>
            WowSmart por sí o como cesionaria, es titular de todos los derechos de propiedad intelectual e industrial de su página web, así como de los elementos contenidos en la misma.
          </p>

          <h2>5. Contacto</h2>
          <p>
            Para cualquier consulta o comentario sobre este aviso legal, puede comunicarse con nosotros al correo electrónico: ventas@wow-smart.com.
          </p>
        </div>
      </main>

      <footer className="bg-[#0b0014] text-slate-300 py-8 text-center text-sm">
        Copyright © 2026 ABSOLUT360 WOW SACS | RUC: 20613616978
      </footer>
    </div>
  );
}
