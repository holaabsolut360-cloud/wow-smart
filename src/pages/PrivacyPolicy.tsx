import React from 'react';
import { Link } from 'react-router-dom';
import Logo from '../components/Logo';

export default function PrivacyPolicy() {
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
        <h1 className="text-4xl font-extrabold text-slate-900 mb-8">Política de Privacidad</h1>
        
        <div className="prose prose-slate max-w-none prose-h2:text-2xl prose-h2:font-bold prose-h2:mt-8 prose-h2:mb-4 prose-p:text-slate-600 prose-p:leading-relaxed">
          <p>Última actualización: {new Date().toLocaleDateString('es-PE')}</p>
          
          <h2>1. Información que recopilamos</h2>
          <p>
            En WowSmart, recopilamos información que usted nos proporciona directamente cuando utiliza nuestros servicios, 
            crea una cuenta, realiza una compra o se comunica con nosotros. Esta información puede incluir su nombre, 
            dirección de correo electrónico, número de teléfono, información de facturación y detalles de su negocio.
          </p>

          <h2>2. Uso de la información</h2>
          <p>
            Utilizamos la información que recopilamos para:
          </p>
          <ul className="list-disc pl-6 text-slate-600 mb-6">
            <li>Proporcionar, mantener y mejorar nuestros servicios.</li>
            <li>Procesar transacciones y enviarle avisos relacionados.</li>
            <li>Enviarle comunicaciones técnicas, actualizaciones y alertas de seguridad.</li>
            <li>Responder a sus comentarios, preguntas y solicitudes de servicio al cliente.</li>
          </ul>

          <h2>3. Compartir información</h2>
          <p>
            No vendemos, comercializamos ni alquilamos su información personal a terceros. Podemos compartir información 
            genérica agregada demográfica no vinculada a ninguna información de identificación personal con nuestros 
            socios comerciales y anunciantes de confianza para los fines descritos anteriormente.
          </p>

          <h2>4. Seguridad de los datos</h2>
          <p>
            Implementamos medidas de seguridad diseñadas para proteger su información personal contra acceso no autorizado, 
            alteración, divulgación o destrucción. Sin embargo, ningún método de transmisión por Internet o método de 
            almacenamiento electrónico es 100% seguro.
          </p>

          <h2>5. Sus derechos</h2>
          <p>
            Usted tiene derecho a acceder, corregir o eliminar su información personal en cualquier momento. 
            Puede hacerlo iniciando sesión en su cuenta o contactándonos directamente.
          </p>

          <h2>6. Contacto</h2>
          <p>
            Si tiene alguna pregunta sobre esta Política de Privacidad, puede contactarnos en:
            <br />
            <strong>Correo electrónico:</strong> ventas@wow-smart.com
          </p>
        </div>
      </main>

      <footer className="bg-[#0b0014] text-slate-300 py-8 text-center text-sm">
        Copyright © 2026 ABSOLUT360 WOW SACS | RUC: 20613616978
      </footer>
    </div>
  );
}
