import { Link } from "react-router-dom";
import { CheckCircle, LayoutDashboard, ShoppingBag, Zap, ShoppingCart, ChevronDown, Phone, Mail, MapPin } from "lucide-react";
import Logo from '../components/Logo';
import { DEMO_CATALOG_SLUG } from '../config/site';

export default function Landing() {
  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 font-sans flex flex-col selection:bg-indigo-200">
      {/* Navbar */}
      <nav className="h-20 bg-white border-b border-slate-200 flex items-center justify-between px-4 md:px-10 flex-shrink-0 sticky top-0 z-40">
        <div className="flex items-center gap-2">
          <Logo size="md" />
        </div>
        <div className="flex items-center gap-4 md:gap-8 text-sm font-medium text-slate-600">
          <a href="#planes" className="hidden md:block hover:text-indigo-600 transition-colors">Planes</a>
          <a href="#demo" className="hidden md:block hover:text-indigo-600 transition-colors">Demo</a>
          <Link to="/auth" className="font-semibold text-slate-700 hover:text-indigo-600 transition-colors">Ingresar</Link>
          <Link to="/auth?mode=register&trial=true" className="bg-indigo-600 text-white px-4 md:px-5 py-2.5 rounded-full hover:bg-indigo-700 transition-colors shadow-sm">
            Prueba Gratuita
          </Link>
        </div>
      </nav>

      {/* Hero */}
      <main className="flex-grow flex flex-col items-center justify-center p-6 md:p-10">
        <section className="text-center max-w-3xl mb-16 mt-10">
          <h1 className="text-[2.1rem] leading-[1.15] md:text-5xl lg:text-6xl font-black text-slate-900 mb-6 tracking-tight md:leading-tight">
            Escala tu negocio con{' '}
            <span className="bg-gradient-to-r from-indigo-600 to-fuchsia-500 bg-clip-text text-transparent">catálogos digitales inteligentes</span>
          </h1>
          <p
            className="text-lg md:text-xl text-slate-600 max-w-2xl mx-auto mb-10"
          >
            Crea tu propia tienda, agrega productos, recibe pedidos directo a tu WhatsApp y escala tus ventas. Todo en un solo lugar.
          </p>
          <div
            className="flex flex-col sm:flex-row justify-center gap-3 sm:gap-4"
          >
            <Link to="/auth?mode=register&trial=true" className="px-8 py-3.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-semibold shadow-sm transition-colors">
              Empezar gratis
            </Link>
            <a href="#demo" className="px-8 py-3.5 rounded-xl border-2 border-indigo-200 bg-white text-indigo-700 hover:bg-indigo-50 font-semibold transition-colors">
              Ver demo
            </a>
          </div>
        </section>

        {/* Clientes (texto real, sin cifras infladas) */}
        <section className="text-center mb-16 px-4">
          <p className="text-xs font-bold uppercase tracking-widest text-slate-500 mb-4">Negocios que ya confían en nosotros</p>
          <div className="flex flex-wrap justify-center gap-3">
            {['Lux', 'Varyk Watches', 'Absolut360'].map(n => (
              <span key={n} className="px-5 py-2 rounded-full bg-white border border-slate-200 text-slate-700 font-bold shadow-sm">{n}</span>
            ))}
          </div>
        </section>

        {/* Demo */}
        <section id="demo" className="w-full max-w-5xl mb-20 px-4 scroll-mt-24">
          <div className="rounded-3xl bg-gradient-to-br from-indigo-600 to-fuchsia-600 p-8 md:p-12 text-white shadow-xl flex flex-col md:flex-row items-center gap-8">
            <div className="flex-1 text-center md:text-left">
              <p className="text-xs font-bold uppercase tracking-widest text-indigo-100 mb-3">Demo en vivo</p>
              <h2 className="text-3xl font-extrabold tracking-tight mb-3">Mira un catálogo real funcionando</h2>
              <p className="text-indigo-100 text-lg">Así ven tus clientes tu tienda: productos con foto y precio, carrito y pedido directo a tu WhatsApp. Sin registrarte.</p>
            </div>
            <div className="flex flex-col gap-3 w-full md:w-auto">
              <Link to={`/c/${DEMO_CATALOG_SLUG}`} className="text-center px-8 py-3.5 rounded-xl bg-white text-indigo-700 font-bold hover:bg-indigo-50 shadow-sm transition-colors">
                Ver catálogo de ejemplo
              </Link>
              <Link to="/auth?mode=register&trial=true" className="text-center px-8 py-3.5 rounded-xl border-2 border-white/60 text-white font-bold hover:bg-white/10 transition-colors">
                Crear el mío gratis
              </Link>
            </div>
          </div>
        </section>

        {/* Pricing Header */}
        <section id="planes" className="scroll-mt-24 text-center mb-12 max-w-3xl mx-auto px-4">
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

        {/* Comparativa de planes */}
        <section className="w-full max-w-4xl mb-10 px-4">
          <h3 className="text-2xl font-extrabold text-slate-900 text-center mb-6">Compara los planes</h3>
          <div className="overflow-x-auto rounded-2xl border border-slate-200 bg-white shadow-sm">
            <table className="w-full text-sm text-left">
              <thead>
                <tr className="bg-slate-50 text-slate-600">
                  <th className="p-4 font-bold">Incluye</th>
                  <th className="p-4 font-bold text-center">Emprendedor</th>
                  <th className="p-4 font-bold text-center bg-indigo-50 text-indigo-700">Negocio Pequeño ⭐</th>
                  <th className="p-4 font-bold text-center">Empresa</th>
                </tr>
              </thead>
              <tbody className="text-slate-700">
                {[
                  ['Precio', 'S/ 15', 'S/ 39', 'S/ 79'],
                  ['Productos', 'Hasta 50', 'Hasta 300', 'Hasta 700'],
                  ['Usuarios', '1', 'Hasta 3', 'Multiusuario'],
                  ['Catálogo digital y pedidos por WhatsApp', '✓', '✓', '✓'],
                  ['Punto de venta, inventario y caja', '—', '✓', '✓'],
                  ['CRM y reportes de ventas', '—', '✓', '✓ (avanzados)'],
                  ['Cupones, fidelización y sucursales', '—', '—', '✓'],
                  ['Dominio personalizado', '—', '—', '✓'],
                ].map(([label, a, b, c]) => (
                  <tr key={label} className="border-t border-slate-100">
                    <td className="p-4 font-medium">{label}</td>
                    <td className="p-4 text-center">{a}</td>
                    <td className="p-4 text-center bg-indigo-50/60 font-semibold text-indigo-800">{b}</td>
                    <td className="p-4 text-center">{c}</td>
                  </tr>
                ))}
                <tr className="border-t border-slate-100">
                  <td className="p-4"></td>
                  <td className="p-3 text-center"><Link to="/checkout/emprendedor" className="inline-block px-4 py-2 rounded-lg border-2 border-slate-200 font-bold text-slate-700 hover:bg-slate-50">Elegir</Link></td>
                  <td className="p-3 text-center bg-indigo-50/60"><Link to="/checkout/negocio" className="inline-block px-4 py-2 rounded-lg bg-indigo-600 font-bold text-white hover:bg-indigo-700">Elegir</Link></td>
                  <td className="p-3 text-center"><Link to="/checkout/empresa" className="inline-block px-4 py-2 rounded-lg border-2 border-slate-200 font-bold text-slate-700 hover:bg-slate-50">Elegir</Link></td>
                </tr>
              </tbody>
            </table>
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
              <li><Link to="/terminos" className="hover:text-fuchsia-400 transition-colors">Términos y Condiciones</Link></li>
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
