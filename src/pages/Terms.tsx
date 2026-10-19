import LegalLayout from '../components/LegalLayout';
import { COMPANY_LEGAL } from '../config/site';

export default function Terms() {
  return (
    <LegalLayout title="Términos y Condiciones">
      <p>Última actualización: 19 de octubre de 2026</p>
      <p>
        Estos Términos y Condiciones regulan el uso de la plataforma WowSmart (wow-smart.com), un servicio de software
        en la nube (SaaS) operado por {COMPANY_LEGAL.name}, con RUC {COMPANY_LEGAL.ruc}, con domicilio en Lima, Perú.
        Al crear una cuenta o usar la plataforma, aceptas estos términos.
      </p>

      <h2>1. El servicio</h2>
      <p>
        WowSmart permite a negocios crear catálogos digitales, recibir pedidos por WhatsApp y gestionar productos,
        clientes, ventas e inventario. Las funciones disponibles dependen del plan contratado.
      </p>

      <h2>2. Cuenta de usuario</h2>
      <ul>
        <li>Debes ser mayor de edad y brindar datos verdaderos y actualizados.</li>
        <li>Eres responsable de cuidar tu contraseña y de todo lo que se haga con tu cuenta.</li>
        <li>Cada suscripción es válida para un (1) negocio.</li>
      </ul>

      <h2>3. Planes, precios y pagos</h2>
      <ul>
        <li>Los precios se muestran en soles (S/) por mes en la página de planes. Pueden incluir o sumar el IGV según se indique al pagar.</li>
        <li>La suscripción se activa cuando confirmamos tu pago (Yape, Plin, transferencia u otro medio que te indiquemos).</li>
        <li>La prueba gratuita dura el plazo indicado al registrarte. Al terminar, debes elegir un plan para seguir usando las funciones de pago.</li>
        <li>Si la suscripción vence y no se renueva, podemos limitar el acceso a la cuenta. Tus datos se conservan según la sección 7.</li>
        <li>Podemos cambiar los precios con aviso previo de al menos 30 días. El cambio aplica desde la siguiente renovación.</li>
      </ul>

      <h2>4. Cancelación y reembolsos</h2>
      <p>
        Puedes cancelar la renovación cuando quieras. Seguirás usando tu plan hasta el final del periodo pagado. Los pagos
        de periodos ya iniciados no son reembolsables, salvo lo que disponga el Código de Protección y Defensa del
        Consumidor (Ley N.º 29571) u otra norma aplicable.
      </p>

      <h2>5. Uso permitido</h2>
      <p>No está permitido usar WowSmart para:</p>
      <ul>
        <li>Vender productos o servicios ilegales, falsificados o que infrinjan derechos de terceros.</li>
        <li>Enviar spam, publicar contenido engañoso u ofensivo, o suplantar a otra persona.</li>
        <li>Intentar acceder sin permiso a otras cuentas o afectar el funcionamiento de la plataforma.</li>
      </ul>
      <p>Si se incumplen estas reglas, podemos suspender o cerrar la cuenta.</p>

      <h2>6. Tu contenido</h2>
      <p>
        Los productos, imágenes, precios y datos que subes son tuyos y eres responsable de ellos. Nos das permiso para
        guardarlos y mostrarlos solo para prestar el servicio (por ejemplo, en tu catálogo público).
      </p>

      <h2>7. Datos y conservación</h2>
      <p>
        Tratamos los datos personales según nuestra <a href="/privacidad" className="text-indigo-600 font-semibold hover:underline">Política de Privacidad</a> y
        la Ley N.º 29733, Ley de Protección de Datos Personales. Si cierras tu cuenta, puedes pedirnos una copia de tus datos.
      </p>

      <h2>8. Disponibilidad y responsabilidad</h2>
      <p>
        Trabajamos para que la plataforma esté disponible siempre, pero puede haber interrupciones por mantenimiento o
        causas ajenas a nosotros. WowSmart es una herramienta de gestión: las ventas, entregas y cobros a tus clientes
        son responsabilidad de tu negocio. En la medida permitida por la ley, nuestra responsabilidad se limita al monto
        pagado por el servicio en los últimos tres meses.
      </p>

      <h2>9. Cambios en estos términos</h2>
      <p>Podemos actualizar estos términos. Te avisaremos por correo o dentro de la plataforma cuando el cambio sea importante.</p>

      <h2>10. Ley aplicable y reclamos</h2>
      <p>
        Estos términos se rigen por las leyes del Perú. Puedes registrar un reclamo en nuestro{' '}
        <a href="/reclamaciones" className="text-indigo-600 font-semibold hover:underline">Libro de Reclamaciones</a>.
      </p>

      <h2>11. Contacto</h2>
      <p>
        {COMPANY_LEGAL.name} — RUC {COMPANY_LEGAL.ruc}<br />
        Correo: <a href={`mailto:${COMPANY_LEGAL.email}`} className="text-indigo-600 font-semibold hover:underline">{COMPANY_LEGAL.email}</a>
      </p>
    </LegalLayout>
  );
}
