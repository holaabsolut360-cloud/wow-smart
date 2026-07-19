import { motion } from "motion/react";
import { Link } from "react-router-dom";
import { CheckCircle, LayoutDashboard, ShoppingBag, Zap, ShoppingCart, ChevronDown, Phone, Mail, MapPin } from "lucide-react";
import Logo from '../components/Logo';

export default function Landing() {
  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 font-sans flex flex-col selection:bg-indigo-200">
      {/* Navbar */}
      <nav className="h-20 bg-white border-b border-slate-200 flex items-center justify-between px-6 md:px-10 flex-shrink-0">
        <div className="flex items-center gap-2">
          <Logo size="md" />
        </div>
        <div className="flex items-center gap-8 text-sm font-medium text-slate-600">
          <Link to="/auth" className="hidden md:block hover:text-indigo-600 transition-colors">Iniciar Sesión</Link>
          <Link to="/auth?mode=register&trial=true" className="bg-indigo-600 text-white px-5 py-2.5 rounded-full hover:bg-indigo-700 transition-colors shadow-sm">
            Prueba Gratuita
          </Link>
        </div>
      </nav>

      {/* Hero */}
      <main className="flex-grow flex flex-col items-center justify-center p-6 md:p-10">
        <section className="text-center max-w-3xl mb-16 mt-10">
          <motion.h1 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-4xl md:text-5xl lg:text-6xl font-extrabold text-slate-900 mb-6 tracking-tight leading-tight"
          >
            Escala tu negocio con catálogos digitales inteligentes
          </motion.h1>
          <motion.p 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="text-lg md:text-xl text-slate-500 max-w-2xl mx-auto mb-10"
          >
            Crea tu propia tienda, agrega productos, recibe pedidos directo a tu WhatsApp y escala tus ventas. Todo en un solo lugar.
          </motion.p>
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="flex justify-center gap-4"
          >
            <Link to="/checkout/emprendedor" className="px-8 py-3.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-semibold shadow-sm transition-colors">
              Empezar ahora
            </Link>
          </motion.div>
        </section>

        {/* Pricing Header */}
        <section className="text-center mb-12 max-w-3xl mx-auto px-4">
          <h2 className="text-3xl font-extrabold text-slate-900 mb-4 tracking-tight">Elige cómo quieres comenzar</h2>
          <p className="text-lg text-slate-500">Puedes probar WOW SMART completamente gratis durante 15 días o contratar el plan que mejor se adapte a tu negocio desde hoy.</p>
        </section>

        {/* Trial First Path */}
        <section className="text-center mb-12 max-w-3xl mx-auto px-4">
          <div className="bg-white rounded-2xl border border-slate-200 p-8 shadow-sm">
            <p className="text-2xl font-extrabold text-slate-900 mb-4 tracking-tight">¿Quieres probar primero?</p>
            <Link to="/auth?mode=register&trial=true" className="inline-block px-8 py-3.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-semibold shadow-sm transition-colors">
              🚀 Comenzar Prueba Gratuita
            </Link>
            <p className="text-sm text-slate-500 mt-4">Sin tarjeta de crédito • Configuración en menos de 2 minutos</p>
          </div>
        </section>

        {/* Pricing Grid */}
        <section className="grid grid-cols-1 md:grid-cols-3 gap-8 w-full max-w-6xl mb-20 px-4">
          {/* Plan Emprendedor */}
          <div className="bg-white rounded-2xl border border-slate-200 p-8 flex flex-col shadow-sm">
            <div className="mb-6">
              <h3 className="text-xl font-bold text-slate-800">🚀 Emprendedor</h3>
              <p className="text-sm text-slate-500 mt-2 min-h-[40px]">Empieza a vender por Internet sin complicaciones.</p>
              <div className="flex items-baseline gap-1 mt-4">
                <span className="text-4xl font-black text-slate-900">S/ 15</span>
                <span className="text-slate-500 font-medium">/mes</span>
              </div>
            </div>
            <ul className="flex-grow space-y-4 mb-8">
              <li className="flex items-start gap-3 text-sm text-slate-600 font-medium">
                <CheckCircle className="w-5 h-5 text-emerald-500 shrink-0" />
                <span>Hasta 50 productos</span>
              </li>
              <li className="flex items-start gap-3 text-sm text-slate-600 font-medium">
                <CheckCircle className="w-5 h-5 text-emerald-500 shrink-0" />
                <span>Catálogo Digital</span>
              </li>
              <li className="flex items-start gap-3 text-sm text-slate-600 font-medium">
                <CheckCircle className="w-5 h-5 text-emerald-500 shrink-0" />
                <span>Pedidos por WhatsApp</span>
              </li>
              <li className="flex items-start gap-3 text-sm text-slate-600 font-medium">
                <CheckCircle className="w-5 h-5 text-emerald-500 shrink-0" />
                <span>Código QR para compartir</span>
              </li>
              <li className="flex items-start gap-3 text-sm text-slate-600 font-medium">
                <CheckCircle className="w-5 h-5 text-emerald-500 shrink-0" />
                <span>Gestión básica de clientes</span>
              </li>
              <li className="flex items-start gap-3 text-sm text-slate-600 font-medium">
                <CheckCircle className="w-5 h-5 text-emerald-500 shrink-0" />
                <span>Personalización básica</span>
              </li>
              <li className="flex items-start gap-3 text-sm text-slate-600 font-medium">
                <CheckCircle className="w-5 h-5 text-emerald-500 shrink-0" />
                <span>1 Usuario</span>
              </li>
            </ul>
            <div className="mt-auto pt-6 border-t border-slate-100">
              <p className="text-xs text-slate-500 mb-4 font-medium italic">Ideal para: Emprendedores y pequeños negocios.</p>
              <Link to="/checkout/emprendedor" className="block text-center w-full py-3.5 rounded-xl border-2 border-slate-200 text-slate-700 font-bold hover:bg-slate-50 hover:border-slate-300 transition-all">
                Contratar Emprendedor
              </Link>
            </div>
          </div>

          {/* Plan Negocio Pequeño (Más Popular) */}
          <div className="bg-indigo-600 rounded-2xl border border-indigo-500 p-8 flex flex-col shadow-xl ring-4 ring-indigo-500/20 relative">
            <div className="absolute -top-4 left-1/2 -translate-x-1/2 bg-amber-400 text-amber-950 text-[10px] font-black px-4 py-1.5 rounded-full uppercase tracking-widest whitespace-nowrap shadow-sm">
              Más popular
            </div>
            <div className="mb-6">
              <h3 className="text-xl font-bold text-white">⭐ Negocio Pequeño</h3>
              <p className="text-sm text-indigo-100 mt-2 min-h-[40px]">Controla las ventas de tu negocio desde un solo lugar.</p>
              <div className="flex items-baseline gap-1 mt-4">
                <span className="text-4xl font-black text-white">S/ 39</span>
                <span className="text-indigo-200 font-medium">/mes</span>
              </div>
            </div>
            <ul className="flex-grow space-y-4 mb-8">
              <li className="flex items-start gap-3 text-sm text-white font-medium">
                <CheckCircle className="w-5 h-5 text-indigo-300 shrink-0" />
                <span>Hasta 300 productos</span>
              </li>
              <li className="flex items-start gap-3 text-sm text-white font-medium">
                <CheckCircle className="w-5 h-5 text-indigo-300 shrink-0" />
                <span>Punto de Venta (POS)</span>
              </li>
              <li className="flex items-start gap-3 text-sm text-white font-medium">
                <CheckCircle className="w-5 h-5 text-indigo-300 shrink-0" />
                <span>Control de Inventario</span>
              </li>
              <li className="flex items-start gap-3 text-sm text-white font-medium">
                <CheckCircle className="w-5 h-5 text-indigo-300 shrink-0" />
                <span>Gestión de Clientes (CRM)</span>
              </li>
              <li className="flex items-start gap-3 text-sm text-white font-medium">
                <CheckCircle className="w-5 h-5 text-indigo-300 shrink-0" />
                <span>Caja diaria</span>
              </li>
              <li className="flex items-start gap-3 text-sm text-white font-medium">
                <CheckCircle className="w-5 h-5 text-indigo-300 shrink-0" />
                <span>Reportes de ventas</span>
              </li>
              <li className="flex items-start gap-3 text-sm text-white font-medium">
                <CheckCircle className="w-5 h-5 text-indigo-300 shrink-0" />
                <span>Pagos con Yape y Plin</span>
              </li>
              <li className="flex items-start gap-3 text-sm text-white font-medium">
                <CheckCircle className="w-5 h-5 text-indigo-300 shrink-0" />
                <span>Personaliza tu marca</span>
              </li>
              <li className="flex items-start gap-3 text-sm text-white font-medium">
                <CheckCircle className="w-5 h-5 text-indigo-300 shrink-0" />
                <span>Hasta 3 usuarios</span>
              </li>
            </ul>
            <div className="mt-auto pt-6 border-t border-indigo-500/50">
              <p className="text-xs text-indigo-200 mb-4 font-medium italic">Ideal para: tiendas, bodegas, restaurantes y negocios con ventas diarias.</p>
              <Link to="/checkout/negocio" className="block text-center w-full py-3.5 rounded-xl bg-white text-indigo-600 font-bold shadow-md hover:bg-slate-50 transition-colors">
                Contratar Negocio
              </Link>
            </div>
          </div>

          {/* Plan Empresa */}
          <div className="bg-white rounded-2xl border border-slate-200 p-8 flex flex-col shadow-sm">
            <div className="mb-6">
              <h3 className="text-xl font-bold text-slate-800">🏢 Empresa</h3>
              <p className="text-sm text-slate-500 mt-2 min-h-[40px]">Automatiza tu empresa y aumenta tus ventas.</p>
              <div className="flex items-baseline gap-1 mt-4">
                <span className="text-4xl font-black text-slate-900">S/ 79</span>
                <span className="text-slate-500 font-medium">/mes</span>
              </div>
            </div>
            <ul className="flex-grow space-y-4 mb-8">
              <li className="flex items-start gap-3 text-sm text-slate-600 font-bold">
                <CheckCircle className="w-5 h-5 text-emerald-500 shrink-0" />
                <span>Todo lo de Negocio Pequeño, más:</span>
              </li>
              <li className="flex items-start gap-3 text-sm text-slate-600 font-medium">
                <CheckCircle className="w-5 h-5 text-emerald-500 shrink-0" />
                <span>Hasta 700 productos</span>
              </li>
              <li className="flex items-start gap-3 text-sm text-slate-600 font-medium">
                <CheckCircle className="w-5 h-5 text-emerald-500 shrink-0" />
                <span>Programa de Fidelización</span>
              </li>
              <li className="flex items-start gap-3 text-sm text-slate-600 font-medium">
                <CheckCircle className="w-5 h-5 text-emerald-500 shrink-0" />
                <span>Cupones y promociones</span>
              </li>
              <li className="flex items-start gap-3 text-sm text-slate-600 font-medium">
                <CheckCircle className="w-5 h-5 text-emerald-500 shrink-0" />
                <span>Dominio personalizado</span>
              </li>
              <li className="flex items-start gap-3 text-sm text-slate-600 font-medium">
                <CheckCircle className="w-5 h-5 text-emerald-500 shrink-0" />
                <span>Multiusuarios</span>
              </li>
              <li className="flex items-start gap-3 text-sm text-slate-600 font-medium">
                <CheckCircle className="w-5 h-5 text-emerald-500 shrink-0" />
                <span>Múltiples sucursales</span>
              </li>
              <li className="flex items-start gap-3 text-sm text-slate-600 font-medium">
                <CheckCircle className="w-5 h-5 text-emerald-500 shrink-0" />
                <span>Reportes avanzados</span>
              </li>
              <li className="flex items-start gap-3 text-sm text-slate-600 font-medium">
                <CheckCircle className="w-5 h-5 text-emerald-500 shrink-0" />
                <span>Roles y permisos</span>
              </li>
              <li className="flex items-start gap-3 text-sm text-slate-600 font-medium">
                <CheckCircle className="w-5 h-5 text-emerald-500 shrink-0" />
                <span>Soporte prioritario</span>
              </li>
            </ul>
            <div className="mt-auto pt-6 border-t border-slate-100">
              <p className="text-xs text-slate-500 mb-4 font-medium italic">Ideal para: Empresas que buscan crecer y automatizar sus procesos.</p>
              <Link to="/checkout/empresa" className="block text-center w-full py-3.5 rounded-xl border-2 border-slate-200 text-slate-700 font-bold hover:bg-slate-50 hover:border-slate-300 transition-all">
                Contratar Empresa
              </Link>
            </div>
          </div>
        </section>

        <section className="text-center mb-20 max-w-3xl mx-auto px-4">
          <p className="text-lg text-slate-500">¿Necesitas comenzar hoy mismo? Elige un plan y actívalo al instante.</p>
        </section>

        {/* Preguntas Frecuentes */}
        <section className="w-full max-w-3xl mb-20 px-4">
          <div className="text-center mb-10">
            <h2 className="text-3xl font-extrabold text-slate-900 mb-4 tracking-tight">Preguntas Frecuentes</h2>
            <p className="text-lg text-slate-500">Todo lo que necesitas saber sobre nuestra plataforma.</p>
          </div>
          
          <div className="space-y-4">
            {[
              {
                q: "¿Cómo sé cuál es mi próxima fecha de pago?",
                a: "Puedes revisar tu próxima fecha de facturación en cualquier momento ingresando a la sección 'Suscripción' dentro de la configuración de tu cuenta."
              },
              {
                q: "¿Cómo sé si ya tengo activa mi suscripción?",
                a: "Una vez que el pago se procese correctamente, verás un indicador de 'Plan Activo' en tu panel principal y tendrás acceso inmediato a todas las funcionalidades."
              },
              {
                q: "¿Qué métodos de pago reciben?",
                a: "Aceptamos todas las tarjetas de crédito y débito (Visa, Mastercard, American Express), así como pagos mediante Yape, Plin y transferencias bancarias."
              },
              {
                q: "¿Puedo cambiar mi método de pago?",
                a: "Sí, puedes actualizar tu método de pago preferido en cualquier momento desde los ajustes de facturación de tu cuenta."
              },
              {
                q: "Si compré el plan Emprendedor y ahora quiero el Empresa, ¿Cómo hago el cambio?",
                a: "Puedes hacer un 'upgrade' desde tu panel. El sistema calculará la diferencia y solo pagarás la parte proporcional por los días restantes de tu ciclo actual."
              },
              {
                q: "Ya realicé el pago, pero no se ven activas mis funcionalidades. ¿Qué hago?",
                a: "En algunos casos (como transferencias bancarias), el pago puede demorar unas horas en verificarse. Si pagaste con tarjeta y no se activa, por favor contacta a soporte con tu comprobante."
              },
              {
                q: "Si pagué en el negocio equivocado, ¿puedo transferir ese pago a otro negocio?",
                a: "Las suscripciones están ligadas a una cuenta específica. Si cometiste un error, comunícate con nuestro equipo de soporte en las primeras 24 horas para ayudarte con el traslado."
              },
              {
                q: "¿Qué pasa si no pago a tiempo mi suscripción?",
                a: "Te daremos un período de gracia de 3 días. Después de eso, tu cuenta pasará automáticamente al plan gratuito y algunas funcionalidades premium quedarán deshabilitadas, pero no perderás tus datos."
              },
              {
                q: "¿Puedo pagar varios meses por adelantado?",
                a: "Sí, ofrecemos planes de pago anuales que además incluyen un descuento significativo comparado con el pago mes a mes."
              },
              {
                q: "¿Puedo cancelar mi suscripción en cualquier momento?",
                a: "Absolutamente. No hay contratos forzosos. Puedes cancelar la renovación automática en cualquier momento y seguirás disfrutando de tu plan hasta que termine el período ya pagado."
              },
              {
                q: "¿Si cancelo el plan, pierdo mi información?",
                a: "No pierdes tus datos. Tu catálogo e historial de ventas seguirán guardados, solo perderás acceso a las funciones exclusivas de los planes de pago."
              },
              {
                q: "¿Puedo usar una misma suscripción en varios negocios?",
                a: "No, cada suscripción es válida para un (1) solo negocio o sucursal principal. Si tienes varias marcas, necesitarás una cuenta para cada una, o un plan corporativo que permita multisucursal."
              },
              {
                q: "¿Los precios de los planes cambian según el país?",
                a: "Los precios mostrados están adaptados a la moneda local (Soles). Si te encuentras en otro país, el cobro se realizará en dólares estadounidenses según el tipo de cambio de tu banco."
              }
            ].map((faq, i) => (
              <details key={i} className="group bg-white rounded-2xl border border-slate-200 p-6 shadow-sm open:border-indigo-300 transition-colors">
                <summary className="flex items-center justify-between font-bold cursor-pointer list-none text-slate-800 text-lg hover:text-indigo-600 transition-colors gap-4">
                  {faq.q}
                  <span className="transition group-open:rotate-180">
                    <ChevronDown className="w-5 h-5 shrink-0" />
                  </span>
                </summary>
                <p className="text-slate-600 mt-4 leading-relaxed">
                  {faq.a}
                </p>
              </details>
            ))}
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="bg-[#0b0014] text-slate-300 py-12 px-6 md:px-10 flex-shrink-0">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-center md:justify-around gap-10">
          <div>
            <h3 className="text-fuchsia-500 font-bold text-lg mb-4">Enlaces Legales</h3>
            <ul className="space-y-3 text-sm">
              <li><Link to="/privacidad" className="hover:text-fuchsia-400 transition-colors">Política de Privacidad</Link></li>
              <li><Link to="/legal" className="hover:text-fuchsia-400 transition-colors">Aviso Legal</Link></li>
              <li><Link to="/cookies" className="hover:text-fuchsia-400 transition-colors">Política de Cookies</Link></li>
              <li><Link to="/reclamaciones" className="hover:text-fuchsia-400 transition-colors">Libro de Reclamaciones</Link></li>
            </ul>
          </div>
          <div>
            <h3 className="text-fuchsia-500 font-bold text-lg mb-4">Contacto</h3>
            <ul className="space-y-3 text-sm">
              <li className="flex items-center gap-2">
                <Phone className="w-4 h-4 text-slate-400" /> 901 345 791
              </li>
              <li className="flex items-center gap-2">
                <Mail className="w-4 h-4 text-slate-400" /> ventas@wow-smart.com
              </li>
              <li className="flex items-center gap-2">
                <MapPin className="w-4 h-4 text-slate-400" /> Perú, Lima
              </li>
            </ul>
          </div>
        </div>
        <div className="max-w-7xl mx-auto mt-12 pt-8 border-t border-white/10 text-center text-xs text-slate-500">
          Copyright © 2026 ABSOLUT360 WOW SACS | RUC: 20613616978
        </div>
      </footer>
    </div>
  );
}
