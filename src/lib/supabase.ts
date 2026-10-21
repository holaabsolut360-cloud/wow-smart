import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || '';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || '';

if (import.meta.env.PROD && (!supabaseUrl || !supabaseAnonKey)) {
  throw new Error('Missing VITE_SUPABASE_URL or VITE_SUPABASE_ANON_KEY.');
}

export const supabase = createClient(
  supabaseUrl || 'https://placeholder.supabase.co',
  supabaseAnonKey || 'placeholder-key'
);

// Avisa al servidor (con JWT) para adjuntar IP/navegador al correo de aviso. Nunca bloquea.
export function pingAuth(token?: string | null) {
  if (!token) return;
  fetch('/api/auth/ping', { method: 'POST', headers: { Authorization: `Bearer ${token}` }, keepalive: true }).catch(() => {});
}
