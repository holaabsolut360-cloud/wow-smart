import LegalLayout from '../components/LegalLayout';
import { COMPANY_LEGAL } from '../config/site';

export default function PrivacyPolicy() {
  return (
    <LegalLayout title="Política de Privacidad">
      <p>Última actualización: 19 de octubre de 2026</p>
      <p>
        En WowSmart cuidamos tus datos personales. Esta política explica qué datos recogemos, para qué los usamos y
        cuáles son tus derechos, según la Ley N.º 29733, Ley de Protección de Datos Personales, y su Reglamento.
      </p>

      <h2>1. Responsable</h2>
      <p>
        {COMPANY_LEGAL.name}, RUC {COMPANY_LEGAL.ruc}, Lima, Perú. Correo de contacto:{' '}
        <a href={`mailto:${COMPANY_LEGAL.email}`} className="text-indigo-600 font-semibold hover:underline">{COMPANY_LEGAL.email}</a>.
      </p>

      <h2>2. Datos que recogemos</h2>
      <ul>
        <li><strong>De tu cuenta:</strong> nombre, correo, teléfono, nombre y datos de tu negocio.</li>
        <li><strong>De pagos:</strong> plan elegido, monto, medio de pago y comprobante que nos envías. No guardamos datos completos de tarjetas.</li>
        <li><strong>De tu negocio:</strong> productos, precios, pedidos, clientes y demás información que registras en la plataforma.</li>
        <li><strong>De uso:</strong> datos técnicos como navegador, dirección IP y páginas visitadas, para seguridad y mejora del servicio.</li>
      </ul>

      <h2>3. Para qué usamos tus datos</h2>
      <ul>
        <li>Crear y mantener tu cuenta y prestarte el servicio.</li>
        <li>Procesar y verificar tus pagos y suscripciones.</li>
        <li>Darte soporte y enviarte avisos importantes sobre tu cuenta.</li>
        <li>Enviarte novedades y promociones, solo si lo aceptas. Puedes darte de baja cuando quieras.</li>
        <li>Prevenir fraudes y cumplir obligaciones legales y tributarias.</li>
      </ul>

      <h2>4. Datos de los clientes de tu negocio</h2>
      <p>
        Cuando registras datos de tus propios clientes (por ejemplo, en pedidos o en el CRM), tu negocio es el
        responsable de esos datos y WowSmart solo los trata por encargo tuyo, para prestarte el servicio.
      </p>

      <h2>5. Con quién compartimos datos</h2>
      <p>
        No vendemos tus datos. Solo los compartimos con proveedores que necesitamos para operar (alojamiento, base de
        datos y envío de correos), que pueden estar fuera del Perú y deben protegerlos, o cuando una autoridad lo exija por ley.
      </p>

      <h2>6. Cuánto tiempo los guardamos</h2>
      <p>
        Mientras tu cuenta esté activa y, después, el tiempo necesario para cumplir obligaciones legales o atender reclamos.
        Luego los eliminamos o anonimizamos.
      </p>

      <h2>7. Tus derechos</h2>
      <p>
        Puedes pedir acceder, corregir, cancelar u oponerte al uso de tus datos (derechos ARCO) escribiendo a{' '}
        <a href={`mailto:${COMPANY_LEGAL.email}`} className="text-indigo-600 font-semibold hover:underline">{COMPANY_LEGAL.email}</a>.
        Te responderemos en los plazos de ley. Si no estás conforme, puedes acudir a la Autoridad Nacional de Protección de Datos Personales.
      </p>

      <h2>8. Seguridad</h2>
      <p>Usamos conexiones cifradas (HTTPS), control de accesos y copias de seguridad para proteger tu información.</p>

      <h2>9. Cookies</h2>
      <p>
        Usamos cookies necesarias para mantener tu sesión y, si las aceptas, cookies de medición. Más detalles en nuestra{' '}
        <a href="/cookies" className="text-indigo-600 font-semibold hover:underline">Política de Cookies</a>.
      </p>

      <h2>10. Cambios</h2>
      <p>Si actualizamos esta política, publicaremos la nueva versión aquí con su fecha.</p>
    </LegalLayout>
  );
}
