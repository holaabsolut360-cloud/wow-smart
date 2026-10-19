import {StrictMode} from 'react';
import {createRoot} from 'react-dom/client';
import App from './App.tsx';
import './index.css';

// Fuentes de Google sin bloquear el primer pintado (la CSP no permite onload en línea).
const fontLink = document.createElement('link');
fontLink.rel = 'stylesheet';
fontLink.href = 'https://fonts.googleapis.com/css2?family=Bebas+Neue&family=DM+Sans:wght@400;500;600;700;800&display=swap';
document.head.appendChild(fontLink);

// Solo en desarrollo: sesión simulada para pruebas locales (?mocksession=1). No existe en el build de producción.
if (import.meta.env.DEV && new URLSearchParams(location.search).has('mocksession')) {
  const exp = Math.floor(Date.now() / 1000) + 3600;
  localStorage.setItem('sb-placeholder-auth-token', JSON.stringify({ access_token: 'mock', refresh_token: 'mock', token_type: 'bearer', expires_in: 3600, expires_at: exp, user: { id: '1', aud: 'authenticated', role: 'authenticated', email: 'demo@wowsmart.pe', app_metadata: {}, user_metadata: {}, created_at: new Date().toISOString() } }));
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
