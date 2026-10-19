// Medición de WowSmart: GA4, Google Tag Manager, Meta Pixel y Microsoft Clarity.
// Cada herramienta se carga SOLO si su ID está definido en el build (VITE_*).
// Todos los eventos se empujan también al dataLayer para que GTM los use.
type Params = Record<string, unknown>;
declare global { interface Window { dataLayer: any[]; gtag?: (...a: any[]) => void; fbq?: any; clarity?: any } }

// Los IDs se toman del build (VITE_*) o, si no, de la etiqueta <meta name="ws-analytics">
// que el servidor llena con las variables de entorno de cPanel (sin recompilar).
const env = (import.meta as any).env || {};
const runtime: Record<string, string> = (() => {
  try { return JSON.parse(document.querySelector('meta[name="ws-analytics"]')?.getAttribute('content') || '{}'); } catch { return {}; }
})();
const pick = (k: string) => String(env[k] || runtime[k] || '').trim();
const GA4 = pick('VITE_GA4_ID');
const GTM = pick('VITE_GTM_ID');
const PIXEL = pick('VITE_META_PIXEL_ID');
const CLARITY = pick('VITE_CLARITY_ID');
const ok = (v: string, re: RegExp) => v && re.test(v);
let started = false;

const addScript = (src: string) => { const s = document.createElement('script'); s.async = true; s.src = src; document.head.appendChild(s); };

export function initAnalytics() {
  if (started || typeof window === 'undefined') return;
  started = true;
  window.dataLayer = window.dataLayer || [];
  const load = () => {
    if (ok(GTM, /^GTM-[A-Z0-9]+$/)) {
      window.dataLayer.push({ 'gtm.start': Date.now(), event: 'gtm.js' });
      addScript(`https://www.googletagmanager.com/gtm.js?id=${GTM}`);
    }
    if (ok(GA4, /^G-[A-Z0-9]+$/)) {
      window.gtag = function () { window.dataLayer.push(arguments); };
      window.gtag('js', new Date());
      window.gtag('config', GA4, { send_page_view: false });
      addScript(`https://www.googletagmanager.com/gtag/js?id=${GA4}`);
    }
    if (ok(PIXEL, /^\d{6,20}$/)) {
      const n: any = (window.fbq = function () { n.callMethod ? n.callMethod.apply(n, arguments) : n.queue.push(arguments); });
      n.push = n; n.loaded = true; n.version = '2.0'; n.queue = [];
      addScript('https://connect.facebook.net/en_US/fbevents.js');
      window.fbq('init', PIXEL);
    }
    if (ok(CLARITY, /^[a-z0-9]{6,20}$/i)) {
      window.clarity = window.clarity || function () { (window.clarity.q = window.clarity.q || []).push(arguments); };
      addScript(`https://www.clarity.ms/tag/${CLARITY}`);
    }
  };
  // Se carga después de que la página es interactiva para no afectar el rendimiento.
  if (document.readyState === 'complete') setTimeout(load, 1500);
  else window.addEventListener('load', () => setTimeout(load, 1500), { once: true });
}

const PIXEL_MAP: Record<string, string> = { sign_up: 'CompleteRegistration', start_trial: 'StartTrial', order_created: 'Lead', purchase: 'Purchase', whatsapp_click: 'Contact', renewal_started: 'InitiateCheckout' };

export function track(event: string, params: Params = {}) {
  try {
    window.dataLayer = window.dataLayer || [];
    window.dataLayer.push({ event, ...params });
    if (window.gtag && GA4) window.gtag('event', event, params);
    if (window.fbq && PIXEL && PIXEL_MAP[event]) window.fbq('track', PIXEL_MAP[event], params);
    if (window.clarity && CLARITY) window.clarity('event', event);
  } catch { /* la medición nunca debe romper la app */ }
}

export function trackPageView(path: string) {
  try {
    window.dataLayer = window.dataLayer || [];
    window.dataLayer.push({ event: 'page_view', page_path: path });
    if (window.gtag && GA4) window.gtag('event', 'page_view', { page_path: path, page_location: location.href, page_title: document.title });
    if (window.fbq && PIXEL) window.fbq('track', 'PageView');
  } catch {}
}
