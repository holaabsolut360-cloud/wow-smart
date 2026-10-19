import { useLocation } from 'react-router-dom';
import { WHATSAPP_ENABLED, whatsappLink } from '../config/site';

// Botón flotante de WhatsApp para las páginas públicas.
// No se muestra en el panel, el SuperAdmin ni en los catálogos (que tienen su propio WhatsApp).
export default function WhatsAppButton() {
  const { pathname } = useLocation();
  if (!WHATSAPP_ENABLED) return null;
  if (/^\/(dashboard|superadmin|c\/)/.test(pathname)) return null;
  return (
    <a
      href={whatsappLink()}
      target="_blank"
      rel="noopener noreferrer"
      aria-label="Escríbenos por WhatsApp"
      className="fixed bottom-5 right-5 z-50 flex items-center gap-2 rounded-full bg-[#25D366] px-4 py-3 text-white font-bold shadow-lg shadow-emerald-900/20 hover:bg-[#1ebe5b] transition-colors"
    >
      <svg viewBox="0 0 32 32" className="w-6 h-6" fill="currentColor" aria-hidden="true">
        <path d="M16.04 3C9.01 3 3.3 8.7 3.3 15.72c0 2.24.59 4.43 1.7 6.36L3.2 28.8l6.9-1.8a12.7 12.7 0 0 0 5.93 1.5h.01c7.02 0 12.74-5.7 12.74-12.72C28.78 8.7 23.06 3 16.04 3Zm0 23.35h-.01a10.6 10.6 0 0 1-5.4-1.48l-.39-.23-4.1 1.07 1.1-3.99-.26-.41a10.55 10.55 0 0 1-1.62-5.6c0-5.84 4.76-10.59 10.6-10.59 5.84 0 10.59 4.75 10.59 10.6 0 5.84-4.76 10.63-10.51 10.63Zm5.81-7.94c-.32-.16-1.88-.93-2.17-1.03-.29-.11-.5-.16-.71.16-.21.32-.82 1.03-1 1.24-.19.21-.37.24-.69.08-.32-.16-1.34-.5-2.56-1.58-.95-.84-1.59-1.88-1.77-2.2-.19-.32-.02-.49.14-.65.14-.14.32-.37.48-.56.16-.19.21-.32.32-.53.1-.21.05-.4-.03-.56-.08-.16-.71-1.71-.98-2.34-.26-.62-.52-.53-.71-.54h-.61c-.21 0-.56.08-.85.4-.29.32-1.11 1.09-1.11 2.65 0 1.56 1.14 3.07 1.3 3.28.16.21 2.24 3.42 5.43 4.8.76.33 1.35.52 1.81.67.76.24 1.45.21 2 .13.61-.09 1.88-.77 2.14-1.51.27-.74.27-1.38.19-1.51-.08-.13-.29-.21-.61-.37Z"/>
      </svg>
      <span className="hidden sm:inline">¿Hablamos?</span>
    </a>
  );
}
