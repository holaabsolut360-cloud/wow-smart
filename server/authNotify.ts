// Aviso por correo al dueño cuando alguien se registra o inicia sesión.
// Fuente de verdad: Supabase Auth (auth.users) leída con service role desde el servidor,
// así no se puede falsificar desde el navegador ni depende de él. El navegador solo
// aporta IP/navegador mediante /api/auth/ping (con JWT verificado).
import nodemailer from 'nodemailer';
import type { SupabaseClient } from '@supabase/supabase-js';

const LOGIN_THROTTLE_MS = 30 * 60 * 1000;
const POLL_MS = Number(process.env.AUTH_NOTIFY_POLL_MS || 60_000);

type Ctx = { ip?: string; ua?: string; at: number };

export function fmtLima(d: Date) {
  return new Intl.DateTimeFormat('es-PE', { timeZone: 'America/Lima', dateStyle: 'full', timeStyle: 'short' }).format(d) + ' (hora de Lima)';
}

export function shouldSendLogin(last: number | undefined, now: number) {
  return last === undefined || now - last >= LOGIN_THROTTLE_MS;
}

const esc = (s: string) => s.replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]!));

export function createAuthNotifier(admin: SupabaseClient | null) {
  const to = process.env.AUTH_NOTIFY_TO || 'hola.absolut360@gmail.com';
  const host = process.env.SMTP_HOST;
  const enabled = Boolean(admin && host && process.env.SMTP_USER && process.env.SMTP_PASS && process.env.AUTH_NOTIFY_DISABLED !== 'true');
  const transport = enabled ? nodemailer.createTransport({
    host, port: Number(process.env.SMTP_PORT || 465),
    secure: (process.env.SMTP_SECURE || (process.env.SMTP_PORT === '587' ? 'false' : 'true')) === 'true',
    auth: { user: process.env.SMTP_USER!, pass: process.env.SMTP_PASS! },
  }) : null;
  const from = process.env.SMTP_FROM || `WowSmart Avisos <${process.env.SMTP_USER}>`;

  const ctx = new Map<string, Ctx>();
  const lastSignIn = new Map<string, string>();
  const lastLoginMail = new Map<string, number>();
  let cursor = Date.now(); // solo eventos posteriores al arranque
  let baselineDone = false;
  let running = false;

  async function businessOf(userId: string) {
    try {
      const { data } = await admin!.from('companies').select('name').eq('user_id', userId).limit(1);
      return data?.[0]?.name || '';
    } catch { return ''; }
  }

  async function send(kind: 'registro' | 'ingreso', u: any, when: Date) {
    const name = u.user_metadata?.full_name || u.user_metadata?.name || '(sin nombre)';
    const business = await businessOf(u.id);
    const c = ctx.get(u.id);
    const rows: [string, string][] = [
      ['Evento', kind === 'registro' ? 'Nuevo registro' : 'Inicio de sesión'],
      ['Nombre', name], ['Correo', u.email || '(sin correo)'],
      ['Negocio', business || '(aún no crea su negocio)'],
      ['Fecha y hora', fmtLima(when)],
      ['Método', u.app_metadata?.provider || 'email'],
      ['Correo confirmado', u.email_confirmed_at ? 'Sí' : 'No'],
    ];
    if (c?.ip) rows.push(['IP', c.ip]);
    if (c?.ua) rows.push(['Navegador', c.ua]);
    const subject = kind === 'registro' ? `🆕 Nuevo registro en WowSmart: ${u.email}` : `🔑 Ingreso a WowSmart: ${u.email}`;
    const text = rows.map(([k, v]) => `${k}: ${v}`).join('\n') + '\n\nAviso automático de wow-smart.com';
    const html = `<h2 style="font-family:sans-serif">${esc(subject)}</h2><table style="font-family:sans-serif;border-collapse:collapse">${rows.map(([k, v]) => `<tr><td style="padding:4px 12px 4px 0;color:#555"><b>${esc(k)}</b></td><td>${esc(String(v))}</td></tr>`).join('')}</table><p style="color:#888;font-size:12px">Aviso automático de wow-smart.com</p>`;
    await transport!.sendMail({ from, to, subject, text, html });
  }

  async function scan() {
    if (!enabled || running) return;
    running = true;
    try {
      const users: any[] = [];
      for (let page = 1; page <= 50; page++) {
        const { data, error } = await admin!.auth.admin.listUsers({ page, perPage: 200 });
        if (error) throw error;
        users.push(...data.users);
        if (data.users.length < 200) break;
      }
      const now = Date.now();
      for (const u of users) {
        const created = Date.parse(u.created_at);
        const signIn = u.last_sign_in_at || '';
        const prev = lastSignIn.get(u.id);
        lastSignIn.set(u.id, signIn);
        if (!baselineDone) continue;
        if (created > cursor) {
          await send('registro', u, new Date(created)).catch(e => console.error('authNotify registro', e?.message));
          if (signIn) lastLoginMail.set(u.id, now); // no duplicar con el ingreso inicial
          continue;
        }
        if (signIn && signIn !== prev && Date.parse(signIn) > cursor - POLL_MS) {
          if (!shouldSendLogin(lastLoginMail.get(u.id), now)) continue;
          lastLoginMail.set(u.id, now);
          await send('ingreso', u, new Date(signIn)).catch(e => console.error('authNotify ingreso', e?.message));
        }
      }
      baselineDone = true;
      cursor = Math.max(cursor, now - POLL_MS);
      for (const [k, v] of ctx) if (now - v.at > 3600_000) ctx.delete(k);
    } catch (e: any) { console.error('authNotify scan', e?.message); }
    finally { running = false; }
  }

  function start() {
    if (!enabled) { console.log('authNotify: desactivado (faltan SMTP_* o service role)'); return; }
    scan();
    setInterval(scan, POLL_MS).unref?.();
  }

  // Llamado por /api/auth/ping (usuario ya verificado por JWT): guarda IP/navegador y revisa pronto.
  function noteClient(userId: string, ip?: string, ua?: string) {
    ctx.set(userId, { ip, ua: ua?.slice(0, 200), at: Date.now() });
    setTimeout(scan, 3000);
  }

  return { start, noteClient, scan, enabled };
}
