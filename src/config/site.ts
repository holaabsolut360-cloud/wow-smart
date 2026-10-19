// Configuración pública del sitio. El número de WhatsApp se puede cambiar
// al compilar con VITE_WHATSAPP_NUMBER (formato internacional, sin "+").
// Por defecto: el número de contacto que ya figura en el pie de página (901 345 791).
export const WHATSAPP_NUMBER = (import.meta.env.VITE_WHATSAPP_NUMBER ?? '51901345791').replace(/\D/g, '');
export const WHATSAPP_ENABLED = WHATSAPP_NUMBER.length >= 9;
export const whatsappLink = (text = 'Hola, quiero información sobre WowSmart') =>
  `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(text)}`;
export const DEMO_CATALOG_SLUG = 'lux-1784674673216';
export const COMPANY_LEGAL = {
  name: 'Absolut360',
  ruc: '20613616978',
  email: 'hola.absolut360@gmail.com',
};
