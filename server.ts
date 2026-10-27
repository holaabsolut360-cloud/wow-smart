import { createClient } from "@supabase/supabase-js";
import "dotenv/config";
import compression from "compression";
import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import nodemailer from 'nodemailer';
import { createAuthNotifier } from './server/authNotify';
import crypto from "crypto";
import fs from "fs";
import { readSheet as readExcelSheet } from "read-excel-file/node";
import rateLimit from "express-rate-limit";
import helmet from "helmet";
import { RUBRO_TEMPLATES, normalizeWhatsapp, isValidWhatsapp } from "./src/config/templates";
import { DEMO_CATALOG_SLUG } from "./src/config/site";
import { createLoyalty, memoryStore, supabaseStore, DEFAULT_PLANS } from "./server/loyalty";
import { createWallet } from "./server/wallet";
import { createGeo } from "./server/geo";
import { tierInfo, sanitizeTiers } from "./server/loyaltyCore";

const isProduction = process.env.NODE_ENV === "production";
const requiredServerEnv = ["SUPABASE_URL", "SUPABASE_ANON_KEY"];
const missingServerEnv = requiredServerEnv.filter(key => !process.env[key]);

if (isProduction && missingServerEnv.length > 0) {
  throw new Error(`Missing required production environment variables: ${missingServerEnv.join(", ")}`);
}

// Correo saliente por SMTP (Banahosting). MAIL_SMTP_* es opcional; si falta usa SMTP_*.
const mailHost = process.env.MAIL_SMTP_HOST || process.env.SMTP_HOST;
const mailUser = process.env.MAIL_SMTP_USER || process.env.SMTP_USER;
const mailPass = process.env.MAIL_SMTP_PASS || process.env.SMTP_PASS;
const mailPort = Number(process.env.MAIL_SMTP_PORT || process.env.SMTP_PORT || 465);
const mailTransport = (mailHost && mailUser && mailPass)
  ? nodemailer.createTransport({ host: mailHost, port: mailPort, secure: mailPort !== 587, auth: { user: mailUser, pass: mailPass } })
  : null;
const resend = mailTransport ? {
  emails: {
    send: async (m: { from: string; to: string[]; subject: string; html: string }) => {
      try {
        const info = await mailTransport.sendMail({ from: m.from, to: m.to, subject: m.subject, html: m.html });
        return { data: { id: info.messageId }, error: null as null | { message: string } };
      } catch (e: any) {
        return { data: null, error: { message: String(e?.message || e) } };
      }
    },
  },
} : null;
const MAIL_FROM = process.env.MAIL_FROM || process.env.RESEND_FROM || `WowSmart <${mailUser || 'no-reply@wow-smart.com'}>`;


// Mock Database for the SaaS
const db = {
  users: [
    { id: "1", email: "admin@absolut360.com", name: "Admin" }
  ],
  companies: [
    {
      id: "1",
      userId: "1",
      name: "Absolut 360",
      slug: "absolut360",
      plan: "pro", // free, pro, enterprise
      subscriptionStatus: "Activa",
      subscriptionEndsAt: "2026-08-15",
      businessType: "Agencia de publicidad",
      color: "#8b5cf6",
      whatsapp: "51999999999",
      logo: "",
      banner: "https://images.unsplash.com/photo-1555041469-a586c61ea9bc?auto=format&fit=crop&q=80&w=2000&h=400",
      instagram: "https://instagram.com/absolut360",
      facebook: "https://facebook.com/absolut360",
      tiktok: "https://tiktok.com/@absolut360",
      categories: [
        { id: "c1", name: "Lapiceros" },
        { id: "c2", name: "Productos Publicitarios" }
      ],
      coupons: [
        { id: "cp1", code: "VERANO20", discountType: "percentage", discountValue: 20, active: true }
      ],
      storeHoursType: "24h",
      storeSchedule: {
        0: { isOpen: false, openTime: "09:00", closeTime: "18:00" }, // Sunday
        1: { isOpen: true, openTime: "09:00", closeTime: "18:00" },  // Monday
        2: { isOpen: true, openTime: "09:00", closeTime: "18:00" },
        3: { isOpen: true, openTime: "09:00", closeTime: "18:00" },
        4: { isOpen: true, openTime: "09:00", closeTime: "18:00" },
        5: { isOpen: true, openTime: "09:00", closeTime: "18:00" },
        6: { isOpen: true, openTime: "09:00", closeTime: "13:00" }   // Saturday
      }
    }
  ],
  products: [
    {
      id: "1",
      companyId: "1",
      name: "Lapiceros Metálicos Premium",
      desc: "Lapiceros elegantes con grabado láser.",
      price: 950,
      salePrice: 750,
      category: "Lapiceros",
      image: "https://images.unsplash.com/photo-1585336261022-680e295ce3fe?auto=format&fit=crop&q=80&w=400&h=300"
    },
    {
      id: "2",
      companyId: "1",
      name: "Mochila Delivery Térmica",
      desc: "Mochila para delivery con interior térmico y reforzado.",
      price: 250,
      salePrice: 190,
      category: "Productos Publicitarios",
      image: "https://images.unsplash.com/photo-1622560480605-d83c853bc5c3?auto=format&fit=crop&q=80&w=400&h=300"
    }
  ] as any[],
  orders: [] as any[],
  customers: [] as any[],
  ingredients: [
    {
      id: "ing1",
      companyId: "1",
      name: "Tinta de Sublimación",
      unit: "ml",
      stock: 1000,
      cost: 50
    }
  ] as any[],
  debts: [] as any[],
  debtPayments: [] as any[],
  inventoryMovements: [] as any[],
  crmDeals: [] as any[],
  expenses: [
    {
      id: "e1",
      companyId: "1",
      concept: "Publicidad Facebook",
      amount: 150,
      date: new Date().toISOString().split('T')[0]
    },
    {
      id: "e2",
      companyId: "1",
      concept: "Empaques y bolsas",
      amount: 80,
      date: new Date(Date.now() - 86400000).toISOString().split('T')[0]
    }
  ] as any[],
  auditLogs: [
    {
      id: "a1",
      companyId: "1",
      userId: "u1",
      userName: "Admin",
      action: "LOGIN",
      resource: "Sistema",
      details: "Inicio de sesión exitoso",
      timestamp: new Date().toISOString()
    }
  ] as any[],
  systemUsers: [
    {
      id: "u1",
      companyId: "1",
      name: "Administrador Principal",
      email: "admin@empresa.com",
      role: "Administrador",
      status: "Activo",
      lastLogin: new Date().toISOString()
    },
    {
      id: "u2",
      companyId: "1",
      name: "Juan Cajero",
      email: "juan@empresa.com",
      role: "Cajero",
      status: "Activo"
    }
  ] as any[],
  backups: [
    {
      id: "b1",
      companyId: "1",
      name: "Backup_Semanal_2023_08_01.zip",
      size: "45.2 MB",
      createdAt: new Date(Date.now() - 86400000 * 7).toISOString()
    }
  ] as any[],
  suppliers: [],
  purchaseOrders: [],
  batches: []
};

const defaultPaymentSettings = {
  companyName: 'WowSmart SAC',
  accountNumber: '999 888 777',
};
let localPaymentSettings = { ...defaultPaymentSettings };

// Datos de pago de ejemplo: no se muestran a clientes (se les pide coordinar por WhatsApp).
const PLACEHOLDER_PAYMENT_NAMES = ['wowsmart sac', ''];
const PLACEHOLDER_PAYMENT_NUMBERS = ['999888777', '000000000', ''];
const isPlaceholderPaymentSettings = (s: { companyName?: string; accountNumber?: string }) => {
  const name = String(s?.companyName || '').trim().toLowerCase();
  const num = String(s?.accountNumber || '').replace(/\D/g, '');
  return PLACEHOLDER_PAYMENT_NAMES.includes(name) || PLACEHOLDER_PAYMENT_NUMBERS.includes(num);
};
const PUBLIC_WHATSAPP_NUMBER = (process.env.PUBLIC_WHATSAPP_NUMBER || '51901345791').replace(/\D/g, '');

// Vencimiento calculado (no se escribe en la base): una suscripción "Activa" o
// en "Prueba Gratuita" cuya fecha de fin ya pasó se considera "Vencida".
const ENFORCE_SUBSCRIPTION_EXPIRY = process.env.ENFORCE_SUBSCRIPTION_EXPIRY === 'true';
const computeSubscriptionStatus = (status: string | null | undefined, endsAt: string | null | undefined) => {
  const st = status || 'Activa';
  if ((st === 'Activa' || st === 'Prueba Gratuita') && endsAt && new Date(endsAt).getTime() < Date.now()) return 'Vencida';
  return st;
};

const normalizePaymentSettings = (value: any) => ({
  companyName: typeof value?.companyName === 'string' && value.companyName.trim()
    ? value.companyName.trim()
    : defaultPaymentSettings.companyName,
  accountNumber: typeof value?.accountNumber === 'string' && value.accountNumber.trim()
    ? value.accountNumber.trim()
    : defaultPaymentSettings.accountNumber,
});

async function startServer() {
  const app = express();
  const PORT = Number(process.env.PORT || 3000);

  app.use(express.json({ limit: '50mb' }));
  // JSON mal formado -> 400 en JSON (no la página HTML de error de Express).
  app.use((err: any, _req: express.Request, res: express.Response, next: express.NextFunction) => {
    if (err && (err.type === 'entity.parse.failed' || err instanceof SyntaxError)) {
      return res.status(400).json({ error: 'El cuerpo de la solicitud no es un JSON válido', code: 'BAD_JSON' });
    }
    if (err && err.type === 'entity.too.large') {
      return res.status(413).json({ error: 'El archivo es demasiado grande', code: 'TOO_LARGE' });
    }
    next(err);
  });

  // Headers de seguridad básicos (anti-clickjacking, anti-MIME-sniffing,
  // HSTS, etc.) más un CSP a medida (no la config por defecto de helmet,
  // que rompería Google Analytics / Meta Pixel e imágenes de Supabase
  // Storage).
  //
  // 'unsafe-inline' en script-src es una concesión necesaria: el catálogo
  // público inyecta el snippet de inicio de GA y Meta Pixel como
  // <script>.innerHTML dinámico (ver Catalog.tsx), no como archivos
  // externos con nonce. Igual se gana protección real del resto de
  // directivas (object-src, frame-ancestors, base-uri, form-action, y que
  // solo se puedan cargar scripts/imágenes/conexiones de los dominios de
  // esta lista, nada más). Una mejora futura sería migrar esos dos
  // snippets a un patrón con nonce para poder quitar 'unsafe-inline'.
  // Compresión gzip/brotli de respuestas (HTML, JS, CSS, JSON).
  app.use(compression({ threshold: 1024 }));
  app.use(helmet({
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        scriptSrc: ["'self'", "'unsafe-inline'", "https://www.googletagmanager.com", "https://connect.facebook.net", "https://static.cloudflareinsights.com", "https://www.clarity.ms", "https://*.clarity.ms"],
        styleSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com"],
        fontSrc: ["'self'", "https://fonts.gstatic.com"],
        imgSrc: ["'self'", "data:", "blob:", "https://*.supabase.co", "https://api.dicebear.com", "https://www.facebook.com", "https://www.google-analytics.com", "https://*.google-analytics.com", "https://www.googletagmanager.com", "https://*.clarity.ms", "https://c.bing.com"],
        connectSrc: ["'self'", "https://*.supabase.co", "wss://*.supabase.co", "https://cloudflareinsights.com", "https://www.google-analytics.com", "https://*.google-analytics.com", "https://*.analytics.google.com", "https://www.googletagmanager.com", "https://www.facebook.com", "https://connect.facebook.net", "https://*.clarity.ms", "https://c.bing.com"],
        objectSrc: ["'none'"],
        baseUri: ["'self'"],
        formAction: ["'self'"],
        frameAncestors: ["'none'"],
        frameSrc: ["'self'", "https://www.googletagmanager.com"],
      },
    },
    crossOriginEmbedderPolicy: false,
  }));

  const publicBaseUrl = (process.env.PUBLIC_BASE_URL || 'https://wow-smart.com').replace(/\/$/, '');
  // Atajos fáciles de recordar
  app.get(["/demo", "/demo/"], (_req, res) => res.redirect(302, `/c/${DEMO_CATALOG_SLUG}`));
  app.get(["/login", "/login/", "/ingresar"], (_req, res) => res.redirect(302, "/auth"));
  app.get(["/registro", "/registro/", "/registrate"], (_req, res) => res.redirect(302, "/auth?mode=register"));

  app.get("/robots.txt", (_req, res) => {
    res.type("text/plain").send(`User-agent: *\nAllow: /\nDisallow: /dashboard\nDisallow: /superadmin\nDisallow: /checkout\nDisallow: /api/\n\nSitemap: ${publicBaseUrl}/sitemap.xml\n`);
  });
  app.get("/sitemap.xml", (_req, res) => {
    const pages = ["/", "/auth", "/terminos", "/privacidad", "/legal", "/cookies", "/reclamaciones"];
    const today = new Date().toISOString().split("T")[0];
    const urls = pages.map(p => `  <url><loc>${publicBaseUrl}${p}</loc><lastmod>${today}</lastmod></url>`).join("\n");
    res.type("application/xml").send(`<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls}\n</urlset>\n`);
  });

  app.get("/health", (_req, res) => {
    res.json({
      ok: true,
      environment: process.env.NODE_ENV || "development",
      supabaseDb: useSupabaseDb,
    });
  });

  function addAuditLog(companyId: string, action: string, resource: string, details: string) {
    db.auditLogs.unshift({
      id: Date.now().toString(),
      companyId,
      userId: "u1",
      userName: "Administrador Principal",
      action,
      resource,
      details,
      timestamp: new Date().toISOString()
    });
  }

  // API Routes
  
  // Get all companies (for testing/demo)
  


const supabaseUrl = process.env.SUPABASE_URL || '';
const supabaseKey = process.env.SUPABASE_ANON_KEY || '';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';
const supabase = supabaseUrl && supabaseKey ? createClient(supabaseUrl, supabaseKey) : null;
const supabaseAdmin = supabaseUrl && supabaseServiceKey
  ? createClient(supabaseUrl, supabaseServiceKey, {
      auth: {
        persistSession: false,
        autoRefreshToken: false,
      },
    })
  : null;
const useSupabaseDb = Boolean(supabase) && (process.env.USE_SUPABASE_DB === "true" || isProduction);
const superAdminEmail = process.env.SUPERADMIN_EMAIL || "";
const superAdminPassword = process.env.SUPERADMIN_PASSWORD || "";
const superAdminSessionSecret = process.env.SUPERADMIN_SESSION_SECRET || "";
const superAdminCookieName = "wowsmart_sa";

// Precios oficiales de los planes de suscripción, espejo de PLAN_DETAILS en
// src/pages/Checkout.tsx. Vive aquí (no solo en el frontend) porque el monto
// del comprobante de pago se recalcula en servidor — nunca confiamos en el
// `amount` que manda el navegador, para que nadie pueda enviar un monto
// menor al aprobar su comprobante.
// ⚠️ Si cambias un precio en Checkout.tsx, cámbialo también aquí.
const IGV_RATE_SERVER = 0.18;
const SUBSCRIPTION_PLAN_PRICES: Record<string, number> = {
  "Emprendedor": 15,
  "Negocio Pequeño": 39,
  "Empresa": 79,
};
// Plan anual: 12 meses con descuento de fidelidad (se cobra una sola vez).
const ANNUAL_DISCOUNT_PCT = Math.min(50, Math.max(0, Number(process.env.ANNUAL_DISCOUNT_PCT || 20)));
const computeSubscriptionAmount = (planName: string, months = 1): number | null => {
  const monthly = SUBSCRIPTION_PLAN_PRICES[planName];
  if (monthly === undefined) return null;
  const basePrice = months === 12 ? Math.round(monthly * 12 * (1 - ANNUAL_DISCOUNT_PCT / 100) * 100) / 100 : monthly;
  const igv = Math.round(basePrice * IGV_RATE_SERVER * 100) / 100;
  return Math.round((basePrice + igv) * 100) / 100;
};

// Protección contra fuerza bruta: máximo 5 intentos de login por IP cada
// 15 minutos. No cuenta los intentos exitosos, solo los fallidos, para no
// bloquear a un admin legítimo que ya inició sesión varias veces seguidas.
const superAdminLoginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 5,
  standardHeaders: true,
  legacyHeaders: false,
  skipSuccessfulRequests: true,
  message: { error: "Demasiados intentos de inicio de sesión. Intenta de nuevo en unos minutos." },
});

if (isProduction && (!superAdminEmail || !superAdminPassword || !superAdminSessionSecret)) {
  throw new Error("Missing SUPERADMIN_EMAIL, SUPERADMIN_PASSWORD, or SUPERADMIN_SESSION_SECRET for production.");
}

const getCookieValue = (req: express.Request, name: string) => {
  const cookieHeader = req.headers.cookie;
  if (!cookieHeader) return "";

  return cookieHeader
    .split(";")
    .map(cookie => cookie.trim())
    .find(cookie => cookie.startsWith(`${name}=`))
    ?.slice(name.length + 1) || "";
};

// ----------------------------------------------------------------------------
// Sesiones de SuperAdmin
// ----------------------------------------------------------------------------
// Antes: la cookie era literalmente SUPERADMIN_SESSION_SECRET — igual para
// todos los logins, sin forma de cerrar una sesión específica.
// Ahora: cada login genera un token aleatorio de 256 bits. Solo se guarda su
// hash (igual que una contraseña) en la tabla `superadmin_sessions` — o en
// un Map en memoria si Supabase no está configurado (solo para desarrollo
// local sin credenciales; en producción supabaseAdmin siempre debe existir).
const SUPERADMIN_SESSION_TTL_MS = 8 * 60 * 60 * 1000; // 8 horas, igual que antes
const inMemorySuperAdminSessions = new Map<string, { email: string; expiresAt: number }>();

const hashSessionToken = (token: string) => crypto.createHash("sha256").update(token).digest("hex");

const getSuperAdminSessionClient = () => supabaseAdmin || supabase || null;

const createSuperAdminSession = async (email: string): Promise<string> => {
  const token = crypto.randomBytes(32).toString("hex");
  const tokenHash = hashSessionToken(token);
  const expiresAt = new Date(Date.now() + SUPERADMIN_SESSION_TTL_MS);

  const client = getSuperAdminSessionClient();
  if (client) {
    await client.from("superadmin_sessions").insert({
      token_hash: tokenHash,
      email,
      expires_at: expiresAt.toISOString(),
    });
    // Limpieza perezosa de sesiones vencidas — no hace falta un cron aparte.
    await client.from("superadmin_sessions").delete().lt("expires_at", new Date().toISOString());
  } else {
    inMemorySuperAdminSessions.set(tokenHash, { email, expiresAt: expiresAt.getTime() });
  }

  return token;
};

const revokeSuperAdminSession = async (token: string) => {
  const tokenHash = hashSessionToken(token);
  const client = getSuperAdminSessionClient();
  if (client) {
    await client.from("superadmin_sessions").delete().eq("token_hash", tokenHash);
  } else {
    inMemorySuperAdminSessions.delete(tokenHash);
  }
};

const isSuperAdminRequest = async (req: express.Request): Promise<boolean> => {
  const rawToken = getCookieValue(req, superAdminCookieName);
  if (!rawToken) return false;

  let token = rawToken;
  try {
    token = decodeURIComponent(rawToken);
  } catch {
    // Si no se puede decodificar, se compara tal cual llegó.
  }

  const tokenHash = hashSessionToken(token);
  const client = getSuperAdminSessionClient();

  if (client) {
    try {
      const { data } = await client
        .from("superadmin_sessions")
        .select("expires_at")
        .eq("token_hash", tokenHash)
        .maybeSingle();
      if (!data) return false;
      return new Date(data.expires_at).getTime() > Date.now();
    } catch {
      // Si Supabase no responde, tratamos la sesión como inválida en vez
      // de tumbar el request sin respuesta — más seguro que fallar abierto.
      return false;
    }
  }

  const entry = inMemorySuperAdminSessions.get(tokenHash);
  if (!entry) return false;
  if (entry.expiresAt <= Date.now()) {
    inMemorySuperAdminSessions.delete(tokenHash);
    return false;
  }
  return true;
};

const setSuperAdminCookie = (res: express.Response, token: string) => {
  const secure = isProduction ? "; Secure" : "";
  res.setHeader(
    "Set-Cookie",
    `${superAdminCookieName}=${encodeURIComponent(token)}; HttpOnly; SameSite=Strict; Path=/; Max-Age=28800${secure}`,
  );
};

const clearSuperAdminCookie = (res: express.Response) => {
  const secure = isProduction ? "; Secure" : "";
  res.setHeader(
    "Set-Cookie",
    `${superAdminCookieName}=; HttpOnly; SameSite=Strict; Path=/; Max-Age=0${secure}`,
  );
};

const requireSuperAdmin = async (req: express.Request, res: express.Response, next: express.NextFunction) => {
  if (!(await isSuperAdminRequest(req))) {
    return res.status(401).json({ error: "Unauthorized" });
  }

  next();
};

const hashPassword = (password: string) => {
  const salt = crypto.randomBytes(16).toString("hex");
  const hash = crypto.scryptSync(password, salt, 64).toString("hex");
  return { hash, salt };
};

const verifyPassword = (password: string, hash: string, salt: string) => {
  try {
    const candidate = crypto.scryptSync(password, salt, 64).toString("hex");
    return crypto.timingSafeEqual(Buffer.from(candidate, "hex"), Buffer.from(hash, "hex"));
  } catch {
    return false;
  }
};

// Compara dos strings en tiempo constante (evita que un atacante infiera
// caracteres correctos midiendo cuánto tarda la respuesta). timingSafeEqual
// exige buffers del mismo largo, así que igualamos el tamaño con un hash
// fijo cuando difieren — así la comparación real sigue siendo constante
// y nunca revela si el largo del candidato coincidía con el esperado.
const timingSafeStringEqual = (a: string, b: string) => {
  const bufA = Buffer.from(crypto.createHash("sha256").update(a).digest());
  const bufB = Buffer.from(crypto.createHash("sha256").update(b).digest());
  return crypto.timingSafeEqual(bufA, bufB);
};

// ----------------------------------------------------------------------------
// Recuperación de contraseña de la cuenta maestra (SUPERADMIN_EMAIL)
// ----------------------------------------------------------------------------
// La contraseña de la cuenta maestra viene del .env y no se puede cambiar
// desde la web. Al recuperarla guardamos un hash scrypt "override" en un
// archivo JSON FUERA de la carpeta de la app (por defecto ../wowsmart-data),
// así el despliegue por zip no lo pisa. Si existe, el login lo usa en lugar
// de SUPERADMIN_PASSWORD. Ruta configurable con SUPERADMIN_DATA_DIR.
const superAdminDataDir = process.env.SUPERADMIN_DATA_DIR || path.resolve(process.cwd(), "..", "wowsmart-data");
const superAdminAuthFile = path.join(superAdminDataDir, "superadmin-auth.json");
type SuperAdminAuthState = {
  passwordOverride?: { hash: string; salt: string; updatedAt: string };
  reset?: { tokenHash: string; expiresAt: number };
};
const readSuperAdminAuthState = (): SuperAdminAuthState => {
  try {
    return JSON.parse(fs.readFileSync(superAdminAuthFile, "utf8")) || {};
  } catch {
    return {};
  }
};
const writeSuperAdminAuthState = (state: SuperAdminAuthState) => {
  fs.mkdirSync(superAdminDataDir, { recursive: true, mode: 0o700 });
  const tmp = `${superAdminAuthFile}.tmp`;
  fs.writeFileSync(tmp, JSON.stringify(state), { mode: 0o600 });
  fs.renameSync(tmp, superAdminAuthFile);
};
const revokeAllSuperAdminSessionsFor = async (email: string) => {
  const client = getSuperAdminSessionClient();
  if (client) {
    try { await client.from("superadmin_sessions").delete().eq("email", email); } catch { /* sin bloqueo */ }
  }
  for (const [k, v] of inMemorySuperAdminSessions) if (v.email === email) inMemorySuperAdminSessions.delete(k);
};
const SUPERADMIN_RESET_TTL_MS = 30 * 60 * 1000;
const PUBLIC_SITE_URL = (process.env.PUBLIC_SITE_URL || "https://wow-smart.com").replace(/\/+$/, "");
const superAdminForgotLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 3,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: "Demasiadas solicitudes. Intenta de nuevo en unos minutos." },
});
const superAdminResetLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 10,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: "Demasiados intentos. Intenta de nuevo en unos minutos." },
});

const logSuperAdminAction = async (
  action: string,
  targetType: string | null,
  targetId: string | null,
  targetName: string | null,
  details: string | null,
) => {
  if (!useSupabaseDb) return;
  const client = supabaseAdmin || supabase;
  if (!client) return;

  try {
    await client.from("superadmin_audit_logs").insert({
      action,
      target_type: targetType,
      target_id: targetId,
      target_name: targetName,
      details,
    });
  } catch (e) {
    console.error("Error registrando auditoría de SuperAdmin", e);
  }
};

const getRequestSupabase = (req: express.Request) => {
  if (!supabaseUrl || !supabaseKey) return null;

  return createClient(supabaseUrl, supabaseKey, {
    global: {
      headers: req.headers.authorization
        ? { Authorization: req.headers.authorization }
        : {},
    },
  });
};

const toCompany = (row: any) => row && ({
  id: row.id,
  userId: row.user_id || row.owner_id,
  name: row.name,
  slug: row.slug,
  plan: row.plan,
  businessType: row.business_type,
  color: row.color,
  whatsapp: row.whatsapp,
  logo: row.logo,
  banner: row.banner,
  description: row.description,
  email: row.email,
  website: row.website,
  address: row.address,
  hours: row.hours,
  socialLinks: row.social_links,
  instagram: row.instagram,
  facebook: row.facebook,
  tiktok: row.tiktok,
  yapeNumber: row.yape_number,
  yapeQr: row.yape_qr,
  plinNumber: row.plin_number,
  plinQr: row.plin_qr,
  bankName: row.bank_name,
  bankAccount: row.bank_account,
  metaTitle: row.meta_title,
  metaDescription: row.meta_description,
  googleAnalyticsId: row.google_analytics_id,
  metaPixelId: row.meta_pixel_id,
  currency: row.currency,
  countryCode: row.country_code,
  taxRate: row.tax_rate,
  categories: row.categories || [],
  coupons: row.coupons || [],
  storeHoursType: row.store_hours_type,
  storeSchedule: row.store_schedule || {},
  subscriptionStatus: row.subscription_status,
  subscriptionEndsAt: row.subscription_ends_at,
});

const fromCompany = (company: any) => ({
  user_id: company.userId,
  owner_id: company.userId,
  name: company.name,
  slug: company.slug,
  plan: company.plan,
  business_type: company.businessType,
  color: company.color,
  whatsapp: company.whatsapp,
  logo: company.logo,
  banner: company.banner,
  description: company.description,
  email: company.email,
  website: company.website,
  address: company.address,
  hours: company.hours,
  social_links: company.socialLinks,
  instagram: company.instagram,
  facebook: company.facebook,
  tiktok: company.tiktok,
  yape_number: company.yapeNumber,
  yape_qr: company.yapeQr,
  plin_number: company.plinNumber,
  plin_qr: company.plinQr,
  bank_name: company.bankName,
  bank_account: company.bankAccount,
  meta_title: company.metaTitle,
  meta_description: company.metaDescription,
  google_analytics_id: company.googleAnalyticsId,
  meta_pixel_id: company.metaPixelId,
  currency: company.currency,
  country_code: company.countryCode,
  tax_rate: company.taxRate,
  categories: company.categories,
  coupons: company.coupons,
  store_hours_type: company.storeHoursType,
  store_schedule: company.storeSchedule,
  subscription_status: company.subscriptionStatus,
  subscription_ends_at: company.subscriptionEndsAt,
});

const toProduct = (row: any) => row && ({
  id: row.id,
  companyId: row.company_id,
  itemType: row.item_type || 'Producto',
  name: row.name,
  desc: row.description,
  sku: row.sku,
  barcode: row.barcode,
  price: Number(row.price || 0),
  salePrice: row.sale_price == null ? undefined : Number(row.sale_price),
  purchaseCost: row.purchase_cost == null ? undefined : Number(row.purchase_cost),
  marginPercent: row.margin_percent == null ? undefined : Number(row.margin_percent),
  taxRate: row.tax_rate == null ? undefined : Number(row.tax_rate),
  category: row.category,
  image: row.image,
  stock: row.stock,
  minStock: row.min_stock,
  variants: row.variants || [],
  recipe: row.recipe || [],
});

const fromProduct = (product: any) => ({
  company_id: product.companyId,
  item_type: product.itemType,
  name: product.name,
  description: product.desc,
  sku: product.sku,
  barcode: product.barcode,
  price: product.price,
  sale_price: product.salePrice,
  purchase_cost: product.purchaseCost,
  margin_percent: product.marginPercent,
  tax_rate: product.taxRate,
  category: product.category,
  image: product.image,
  stock: product.stock,
  min_stock: product.minStock,
  variants: product.variants,
  recipe: product.recipe,
});

const normalizeProductPayload = (payload: any) => {
  const itemType = payload?.itemType === 'Servicio' ? 'Servicio' : 'Producto';
  const normalized = {
    ...payload,
    itemType,
    taxRate: payload?.taxRate == null || payload?.taxRate === '' ? 18 : Number(payload.taxRate),
    marginPercent: payload?.marginPercent == null || payload?.marginPercent === '' ? undefined : Number(payload.marginPercent),
    purchaseCost: payload?.purchaseCost == null || payload?.purchaseCost === '' ? undefined : Number(payload.purchaseCost),
  };

  if (itemType === 'Servicio') {
    normalized.stock = null;
    normalized.minStock = null;
  }

  return normalized;
};

const toCustomer = (row: any) => row && ({
  id: row.id,
  companyId: row.company_id,
  name: row.name,
  phone: row.phone,
  email: row.email,
  address: row.address,
  documentNumber: row.document_number,
  notes: row.notes,
  createdAt: row.created_at,
});

const fromCustomer = (customer: any) => ({
  company_id: customer.companyId,
  name: customer.name,
  phone: customer.phone,
  email: customer.email,
  address: customer.address,
  document_number: customer.documentNumber,
  notes: customer.notes,
});

const toExpense = (row: any) => row && ({
  id: row.id,
  companyId: row.company_id,
  concept: row.concept,
  amount: Number(row.amount || 0),
  date: row.date,
  createdAt: row.created_at,
});

const fromExpense = (expense: any) => ({
  company_id: expense.companyId,
  concept: expense.concept,
  amount: expense.amount,
  date: expense.date,
});

const toCRMDeal = (row: any) => row && ({
  id: row.id,
  companyId: row.company_id,
  customerId: row.customer_id,
  customerName: row.customer_name,
  customerPhone: row.customer_phone,
  customerEmail: row.customer_email,
  title: row.title,
  value: Number(row.value || 0),
  stage: row.stage,
  notes: row.notes,
  createdAt: row.created_at,
  updatedAt: row.updated_at,
});

const fromCRMDeal = (deal: any) => ({
  company_id: deal.companyId,
  customer_id: deal.customerId,
  customer_name: deal.customerName,
  customer_phone: deal.customerPhone,
  customer_email: deal.customerEmail,
  title: deal.title,
  value: deal.value,
  stage: deal.stage,
  notes: deal.notes,
});

const toDebt = (row: any) => row && ({
  id: row.id,
  companyId: row.company_id,
  customerId: row.customer_id,
  amount: Number(row.amount || 0),
  remainingAmount: Number(row.remaining_amount || 0),
  reason: row.reason,
  dueDate: row.due_date,
  status: row.status,
  createdAt: row.created_at,
});

const fromDebt = (debt: any) => ({
  company_id: debt.companyId,
  customer_id: debt.customerId,
  amount: debt.amount,
  remaining_amount: debt.remainingAmount ?? debt.amount,
  reason: debt.reason,
  due_date: debt.dueDate,
  status: debt.status || 'Pendiente',
});

const toDebtPayment = (row: any) => row && ({
  id: row.id,
  debtId: row.debt_id,
  amount: Number(row.amount || 0),
  date: row.date,
});

const fromDebtPayment = (payment: any) => ({
  debt_id: payment.debtId,
  amount: payment.amount,
  date: payment.date,
  method: payment.method || 'Efectivo',
});

const toIngredient = (row: any) => row && ({
  id: row.id,
  companyId: row.company_id,
  name: row.name,
  unit: row.unit,
  stock: Number(row.stock || 0),
  cost: Number(row.cost || 0),
});

const fromIngredient = (ingredient: any) => ({
  company_id: ingredient.companyId,
  name: ingredient.name,
  unit: ingredient.unit,
  stock: ingredient.stock,
  cost: ingredient.cost,
});

const toInventoryMovement = (row: any) => row && ({
  id: row.id,
  companyId: row.company_id,
  productId: row.product_id,
  type: row.type,
  qty: Number(row.qty || 0),
  reason: row.reason,
  date: row.date,
});

const fromInventoryMovement = (movement: any) => ({
  company_id: movement.companyId,
  product_id: movement.productId,
  type: movement.type,
  qty: movement.qty,
  reason: movement.reason,
  date: movement.date || new Date().toISOString().split('T')[0],
});

const toSupplier = (row: any) => row && ({
  id: row.id,
  companyId: row.company_id,
  name: row.name,
  contact: row.contact,
  phone: row.phone,
  email: row.email,
  address: row.address,
});

const fromSupplier = (supplier: any) => ({
  company_id: supplier.companyId,
  name: supplier.name,
  contact: supplier.contact,
  phone: supplier.phone,
  email: supplier.email,
  address: supplier.address,
});

const toPurchaseOrder = (row: any) => row && ({
  id: row.id,
  companyId: row.company_id,
  supplierId: row.supplier_id,
  items: row.items || [],
  total: Number(row.total || 0),
  status: row.status,
  expectedDate: row.expected_date,
  createdAt: row.created_at,
});

const fromPurchaseOrder = (po: any) => ({
  company_id: po.companyId,
  supplier_id: po.supplierId,
  items: po.items || [],
  total: po.total || 0,
  status: po.status || 'Borrador',
  expected_date: po.expectedDate,
});

const toBatch = (row: any) => row && ({
  id: row.id,
  companyId: row.company_id,
  productId: row.product_id,
  ingredientId: row.ingredient_id,
  batchNumber: row.batch_number,
  qty: Number(row.qty || 0),
  expirationDate: row.expiration_date,
  createdAt: row.created_at,
});

const fromBatch = (batch: any) => ({
  company_id: batch.companyId,
  product_id: batch.productId,
  ingredient_id: batch.ingredientId,
  batch_number: batch.batchNumber,
  qty: batch.qty,
  expiration_date: batch.expirationDate,
});

const toOrder = (row: any) => row && ({
  id: row.id,
  orderCode: row.order_code || undefined,
  loyaltyStatus: row.loyalty_status || undefined,
  rewardPoints: row.reward_points || undefined,
  companyId: row.company_id,
  customerName: row.customer_name,
  customerPhone: row.customer_phone,
  deliveryMethod: row.delivery_method,
  address: row.address,
  reference: row.reference,
  items: row.items || [],
  subtotal: Number(row.subtotal || 0),
  discount: Number(row.discount || 0),
  tax: Number(row.tax || 0),
  total: Number(row.total || 0),
  couponCode: row.coupon_code,
  status: row.status,
  type: row.type,
  paymentMethod: row.payment_method,
  paymentProof: row.payment_proof,
  amountPaid: Number(row.amount_paid || 0),
  sellerName: row.seller_name,
  notes: row.notes,
  createdAt: row.created_at,
});

const fromOrder = (order: any) => ({
  company_id: order.companyId,
  customer_name: order.customerName,
  customer_phone: order.customerPhone,
  delivery_method: order.deliveryMethod,
  address: order.address,
  reference: order.reference,
  items: order.items || [],
  subtotal: order.subtotal || 0,
  discount: order.discount || 0,
  tax: order.tax || 0,
  total: order.total || 0,
  coupon_code: order.couponCode,
  status: order.status || (order.paymentProof ? 'Pago por Verificar' : 'Pendiente'),
  type: order.type || 'online',
  payment_method: order.paymentMethod,
  payment_proof: order.paymentProof,
  amount_paid: order.amountPaid || 0,
  seller_name: order.sellerName,
  notes: order.notes,
});

const stripUndefined = (value: Record<string, any>) =>
  Object.fromEntries(Object.entries(value).filter(([, entry]) => entry !== undefined));

const authMiddleware = async (req: express.Request, res: express.Response, next: express.NextFunction) => {
  const publicApiRoute =
    req.path.startsWith('/catalog') ||
    req.path.startsWith('/superadmin') ||
    req.path === '/payment-settings' ||
    req.path === '/approve-subscription' ||
    req.path === '/complaints' ||
    (req.method === 'POST' && req.path === '/track') ||
    (req.method === 'POST' && req.path === '/orders' && !req.headers.authorization);


  if (publicApiRoute) {
    return next();
  }

  if (!supabase) {
    if (isProduction) {
      return res.status(503).json({ error: "Authentication is not configured" });
    }
    console.warn("Supabase credentials not found. Skipping auth for development.");
    if (process.env.LOYALTY_MOCK === '1' && req.headers.authorization) (req as any).user = { id: '1', email: 'demo@wowsmart.pe' };
    return next();
  }

  const authHeader = req.headers.authorization;
  if (!authHeader) {
    return res.status(401).json({ error: "Unauthorized: No token provided" });
  }

  const token = authHeader.split(" ")[1];
  if (!token) {
    return res.status(401).json({ error: "Unauthorized: Invalid token format" });
  }

  const { data: { user }, error } = await supabase.auth.getUser(token);
  
  if (error || !user) {
    return res.status(401).json({ error: "Unauthorized: Invalid token" });
  }

  (req as any).user = user;
  next();
};

const matchesPath = (path: string, base: string) => path === base || path.startsWith(`${base}/`);

const isBillingRoute = (path: string) => (
  matchesPath(path, '/checkout') ||
  matchesPath(path, '/dashboard/me') ||
  matchesPath(path, '/plans') ||
  matchesPath(path, '/payment-proof') ||
  matchesPath(path, '/subscription-payments') ||
  matchesPath(path, '/support-tickets') ||
  matchesPath(path, '/renewal') ||
  matchesPath(path, '/growth') ||
  matchesPath(path, '/loyalty')
);

const subscriptionGuard = async (req: express.Request, res: express.Response, next: express.NextFunction) => {
  const user = (req as any).user;
  if (!user) return next();

  const path = req.path;
  // Never block auth/session endpoints in this guard.
  if (matchesPath(path, '/superadmin')) return next();

  let company: any = null;

  if (useSupabaseDb) {
    const client = getRequestSupabase(req);
    if (!client) return next();

    const { data } = await client
      .from('companies')
      .select('id, plan, subscription_status, subscription_ends_at, user_id')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    company = data || null;
  } else {
    company = db.companies.find((c: any) => c.userId === user.id) || null;
  }

  if (!company) return next();

  const status = useSupabaseDb ? company.subscription_status : company.subscriptionStatus;
  const endsAtRaw = useSupabaseDb ? company.subscription_ends_at : company.subscriptionEndsAt;
  const isTrialExpired = status === 'Prueba Gratuita' && !!endsAtRaw && new Date(endsAtRaw) < new Date();

  // Solo se escribe 'Vencida' en la base cuando el corte está activado.
  if (isTrialExpired && ENFORCE_SUBSCRIPTION_EXPIRY) {
    if (useSupabaseDb) {
      const client = getRequestSupabase(req);
      if (client) {
        await client
          .from('companies')
          .update({ subscription_status: 'Vencida' })
          .eq('id', company.id)
          .eq('user_id', user.id);
      }
      company.subscription_status = 'Vencida';
    } else {
      company.subscriptionStatus = 'Vencida';
    }
  }

  const effectiveStatus = useSupabaseDb ? company.subscription_status : company.subscriptionStatus;
  const computedExpired = ENFORCE_SUBSCRIPTION_EXPIRY && computeSubscriptionStatus(effectiveStatus, endsAtRaw) === 'Vencida';

  // Suspendida: bloqueo total (salvo pagos). Vencida: modo SOLO LECTURA —
  // puede ver su panel y sus datos, pero no crear ni editar hasta renovar.
  if (effectiveStatus === 'Suspendida' && !isBillingRoute(path)) {
    return res.status(402).json({
      error: 'Tu cuenta está suspendida. Renueva tu plan para continuar.',
      code: 'SUBSCRIPTION_REQUIRED',
      subscriptionStatus: effectiveStatus,
    });
  }
  const isExpired = effectiveStatus === 'Vencida' || computedExpired;
  if (isExpired && req.method !== 'GET' && !isBillingRoute(path)) {
    return res.status(402).json({
      error: 'Tu plan venció: tu panel está en modo solo lectura. Renueva para volver a editar.',
      code: 'READ_ONLY',
      subscriptionStatus: 'Vencida',
    });
  }

  next();
};


  // Rutas /api inexistentes -> 404 JSON antes de pedir sesión.
  app.use('/api', (req, res, next) => {
    const fullPath = (req.originalUrl || '').split('?')[0];
    const stack: any[] = (app as any)._router?.stack || [];
    const exists = stack.some((layer: any) =>
      layer.route && layer.route.path !== '*' && layer.match(fullPath) &&
      (layer.route._handles_method(req.method) || (req.method === 'HEAD' && layer.route._handles_method('GET'))));
    if (!exists) return res.status(404).json({ error: 'Ruta no encontrada', code: 'NOT_FOUND' });
    next();
  });
  app.use('/api', authMiddleware);
  app.use('/api', subscriptionGuard);

  const authNotifier = createAuthNotifier(supabaseAdmin);
  authNotifier.start();
  app.post("/api/auth/ping", async (req, res) => {
    const user = (req as any).user;
    if (!user?.id) return res.status(401).json({ error: 'Unauthorized' });
    const fwd = String(req.headers['x-forwarded-for'] || '').split(',')[0].trim();
    authNotifier.noteClient(user.id, fwd || req.socket.remoteAddress || undefined, String(req.headers['user-agent'] || ''));
    res.json({ ok: true });
  });

  app.get("/api/superadmin/session", async (req, res) => {
    res.json({ authenticated: await isSuperAdminRequest(req) });
  });

  app.post("/api/superadmin/login", superAdminLoginLimiter, async (req, res) => {
    if (!superAdminSessionSecret) {
      return res.status(503).json({ error: "SuperAdmin access is not configured" });
    }

    const { email, password } = req.body || {};
    if (!email || !password) {
      return res.status(401).json({ error: "Invalid credentials" });
    }

    // 1) Cuentas de administrador reales (tabla superadmin_users, permite varias personas)
    if (useSupabaseDb) {
      const client = supabaseAdmin || supabase;
      if (client) {
        const { data: adminRow } = await client
          .from("superadmin_users")
          .select("*")
          .eq("email", email)
          .eq("active", true)
          .maybeSingle();

        if (adminRow && verifyPassword(password, adminRow.password_hash, adminRow.password_salt)) {
          const sessionToken = await createSuperAdminSession(email);
          setSuperAdminCookie(res, sessionToken);
          await client.from("superadmin_users").update({ last_login_at: new Date().toISOString() }).eq("id", adminRow.id);
          await logSuperAdminAction("LOGIN", null, null, email, "Inicio de sesión en el panel SuperAdmin");
          return res.json({ authenticated: true });
        }
      }
    }

    // 2) Cuenta maestra por variables de entorno (compatibilidad con la configuración inicial)
    if (
      superAdminEmail &&
      superAdminPassword &&
      timingSafeStringEqual(email, superAdminEmail) &&
      (() => {
        // Si se recuperó la contraseña desde la web, manda el hash guardado.
        const override = readSuperAdminAuthState().passwordOverride;
        return override
          ? verifyPassword(password, override.hash, override.salt)
          : timingSafeStringEqual(password, superAdminPassword);
      })()
    ) {
      const sessionToken = await createSuperAdminSession(email);
      setSuperAdminCookie(res, sessionToken);
      await logSuperAdminAction("LOGIN", null, null, email, "Inicio de sesión (cuenta maestra) en el panel SuperAdmin");
      return res.json({ authenticated: true });
    }

    res.status(401).json({ error: "Invalid credentials" });
  });

  // Recuperación de contraseña de la cuenta maestra. Respuesta siempre genérica.
  app.post("/api/superadmin/forgot-password", superAdminForgotLimiter, async (req, res) => {
    const generic = { ok: true, message: "Si el correo corresponde al superadministrador, recibirás un enlace para crear una nueva contraseña." };
    const email = String(req.body?.email || "").trim().toLowerCase();
    if (!email || !superAdminEmail || !timingSafeStringEqual(email, superAdminEmail.trim().toLowerCase())) {
      return res.json(generic);
    }
    try {
      const token = crypto.randomBytes(32).toString("hex");
      const state = readSuperAdminAuthState();
      state.reset = { tokenHash: hashSessionToken(token), expiresAt: Date.now() + SUPERADMIN_RESET_TTL_MS };
      writeSuperAdminAuthState(state);
      const link = `${PUBLIC_SITE_URL}/superadmin?reset=${token}`;
      if (!resend) {
        console.warn("superadmin forgot-password: SMTP no configurado, no se envió el correo");
      } else {
        const { error } = await resend.emails.send({
          from: MAIL_FROM,
          to: [superAdminEmail],
          subject: "Recupera tu contraseña de SuperAdmin — WowSmart",
          html: `<div style="font-family:Arial,sans-serif;max-width:520px;margin:auto;color:#1e293b">
  <h2 style="color:#4f46e5">Recuperar contraseña de SuperAdmin</h2>
  <p>Recibimos una solicitud para crear una nueva contraseña del panel SuperAdmin de WowSmart.</p>
  <p style="text-align:center;margin:28px 0"><a href="${link}" style="background:#4f46e5;color:#fff;padding:12px 22px;border-radius:10px;text-decoration:none;font-weight:bold">Crear nueva contraseña</a></p>
  <p style="font-size:13px;color:#64748b">El enlace vence en 30 minutos y solo se puede usar una vez. Si no lo pediste, ignora este correo: tu contraseña actual sigue funcionando.</p>
</div>`,
        });
        if (error) console.error("superadmin forgot-password: error al enviar", error.message);
      }
      await logSuperAdminAction("SOLICITAR_RECUPERACION", null, null, superAdminEmail, "Solicitud de recuperación de contraseña (cuenta maestra)");
    } catch (e: any) {
      console.error("superadmin forgot-password:", e?.message || e);
    }
    res.json(generic);
  });

  app.post("/api/superadmin/reset-password", superAdminResetLimiter, async (req, res) => {
    const token = String(req.body?.token || "");
    const password = String(req.body?.password || "");
    if (password.length < 10) {
      return res.status(400).json({ error: "La contraseña debe tener al menos 10 caracteres." });
    }
    const state = readSuperAdminAuthState();
    const invalid = { error: "El enlace no es válido o ya venció. Solicita uno nuevo." };
    if (!token || !state.reset || state.reset.expiresAt <= Date.now()) return res.status(400).json(invalid);
    const a = Buffer.from(hashSessionToken(token), "hex");
    const b = Buffer.from(state.reset.tokenHash, "hex");
    if (a.length !== b.length || !crypto.timingSafeEqual(a, b)) return res.status(400).json(invalid);
    const { hash, salt } = hashPassword(password);
    state.passwordOverride = { hash, salt, updatedAt: new Date().toISOString() };
    delete state.reset; // un solo uso
    try {
      writeSuperAdminAuthState(state);
    } catch (e: any) {
      console.error("superadmin reset-password:", e?.message || e);
      return res.status(500).json({ error: "No se pudo guardar la nueva contraseña." });
    }
    await revokeAllSuperAdminSessionsFor(superAdminEmail);
    await logSuperAdminAction("RESTABLECER_CONTRASENA", null, null, superAdminEmail, "Contraseña de la cuenta maestra restablecida por correo");
    res.json({ ok: true, message: "Contraseña actualizada. Ya puedes iniciar sesión." });
  });

  app.post("/api/superadmin/logout", async (req, res) => {
    const rawToken = getCookieValue(req, superAdminCookieName);
    if (rawToken) {
      let token = rawToken;
      try {
        token = decodeURIComponent(rawToken);
      } catch {
        // token tal cual llegó
      }
      await revokeSuperAdminSession(token);
    }
    clearSuperAdminCookie(res);
    logSuperAdminAction("LOGOUT", null, null, null, "Cierre de sesión del panel SuperAdmin");
    res.json({ authenticated: false });
  });

  const readPaymentSettings = async () => {
    if (!useSupabaseDb) return localPaymentSettings;

    const client = supabaseAdmin || supabase;
    if (!client) throw new Error('Supabase is not configured');

    const { data, error } = await client
      .from('platform_settings')
      .select('value')
      .eq('key', 'payment_settings')
      .maybeSingle();

    if (error) throw new Error(error.message);
    return normalizePaymentSettings(data?.value);
  };

  app.get('/api/payment-settings', async (_req, res) => {
    try {
      const settings = await readPaymentSettings();
      if (isPlaceholderPaymentSettings(settings)) {
        return res.json({ configured: false, whatsapp: PUBLIC_WHATSAPP_NUMBER });
      }
      res.json({ configured: true, ...settings, whatsapp: PUBLIC_WHATSAPP_NUMBER });
    } catch (error: any) {
      res.status(500).json({ error: error.message || 'Unable to load payment settings' });
    }
  });

  app.get('/api/superadmin/settings/pagos', requireSuperAdmin, async (_req, res) => {
    try {
      const settings = await readPaymentSettings();
      res.json({ ...settings, isPlaceholder: isPlaceholderPaymentSettings(settings) });
    } catch (error: any) {
      res.status(500).json({ error: error.message || 'Unable to load payment settings' });
    }
  });

  app.put('/api/superadmin/settings/pagos', requireSuperAdmin, async (req, res) => {
    const settings = normalizePaymentSettings(req.body);

    try {
      if (!useSupabaseDb) {
        localPaymentSettings = settings;
        return res.json(settings);
      }

      if (!supabaseAdmin) {
        return res.status(503).json({ error: 'SuperAdmin storage is not configured' });
      }

      const { error } = await supabaseAdmin
        .from('platform_settings')
        .upsert({ key: 'payment_settings', value: settings, updated_at: new Date().toISOString() }, { onConflict: 'key' });

      if (error) return res.status(500).json({ error: error.message });
      return res.json({ ...settings, isPlaceholder: isPlaceholderPaymentSettings(settings) });
    } catch (error: any) {
      return res.status(500).json({ error: error.message || 'Unable to save payment settings' });
    }
  });

  // Libro de Reclamaciones — endpoint público, no requiere sesión
  app.post("/api/complaints", async (req, res) => {
    const { nombres, apellidos, tipoDocumento, numeroDocumento, email, telefono, tipo, detalle, pedido } = req.body || {};

    if (!nombres || !apellidos || !numeroDocumento || !email || !telefono || !detalle || !pedido) {
      return res.status(400).json({ error: "Faltan campos obligatorios del formulario" });
    }

    if (!useSupabaseDb) {
      return res.json({ id: Date.now().toString() });
    }

    const client = supabaseAdmin || supabase;
    if (!client) return res.status(503).json({ error: "Supabase is not configured" });

    const { data, error } = await client
      .from("complaints_book_entries")
      .insert({
        nombres,
        apellidos,
        tipo_documento: tipoDocumento || "DNI",
        numero_documento: numeroDocumento,
        email,
        telefono,
        tipo: tipo === "Queja" ? "Queja" : "Reclamo",
        detalle,
        pedido,
      })
      .select("id")
      .single();

    if (error) return res.status(500).json({ error: error.message });
    res.json({ id: data.id });
  });

  // Registrar un comprobante de pago desde el Checkout del cliente
  app.post("/api/subscription-payments", async (req, res) => {
    const user = (req as any).user;
    if (!user) return res.status(401).json({ error: "Unauthorized" });

    const { businessName, plan, amount, paymentMethod, reference } = req.body || {};
    if (!businessName || !plan) {
      return res.status(400).json({ error: "businessName y plan son requeridos" });
    }

    // El monto NUNCA se toma del cliente: se recalcula en servidor a partir
    // del nombre del plan, usando el mismo precio + IGV que ve el usuario en
    // el checkout. Si el plan no coincide con uno conocido, rechazamos —
    // evita que alguien invente un plan con un monto arbitrario.
    const serverAmount = computeSubscriptionAmount(plan);
    if (serverAmount === null) {
      return res.status(400).json({ error: "Plan no reconocido" });
    }
    if (typeof amount === "number" && Math.abs(amount - serverAmount) > 0.01) {
      // No es necesariamente un ataque (podría ser un plan editado desde
      // SuperAdmin sin actualizar este mapa), pero lo dejamos registrado
      // en el log del servidor para poder revisarlo.
      console.warn(
        `[subscription-payments] Monto recibido (${amount}) no coincide con el calculado en servidor (${serverAmount}) para el plan "${plan}". Usando el monto del servidor.`
      );
    }

    const client = supabaseAdmin || getRequestSupabase(req);
    if (!client) return res.status(503).json({ error: "Supabase is not configured" });

    let companyId: string | null = null;
    if (useSupabaseDb) {
      const { data: companyRow } = await client
        .from("companies")
        .select("id")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle();
      companyId = companyRow?.id || null;
    }

    const payload = {
      user_id: user.id,
      company_id: companyId,
      business_name: businessName,
      email: user.email || null,
      plan,
      amount: serverAmount,
      payment_method: paymentMethod || null,
      reference: reference || null,
      status: "Pendiente",
    };

    if (!useSupabaseDb) {
      return res.json({ id: Date.now().toString(), ...payload });
    }

    const { data, error } = await client
      .from("subscription_payments")
      .insert(payload)
      .select("*")
      .single();

    if (error) return res.status(500).json({ error: error.message });
    res.json(data);
  });

  // Listar pagos pendientes de revisión (panel SuperAdmin)
  app.get("/api/superadmin/pagos-pendientes", requireSuperAdmin, async (_req, res) => {
    if (!useSupabaseDb) return res.json({ data: [] });

    const client = supabaseAdmin || supabase;
    if (!client) return res.status(503).json({ error: "Supabase is not configured" });

    const { data, error } = await client
      .from("subscription_payments")
      .select("*")
      .eq("status", "Pendiente")
      .order("created_at", { ascending: true });

    if (error) return res.status(500).json({ error: error.message });

    const pagos = (data || []).map((row: any) => ({
      id: row.id,
      businessName: row.business_name,
      email: row.email,
      plan: row.plan,
      amount: Number(row.amount || 0),
      method: row.payment_method,
      reference: row.reference,
      date: row.created_at,
      userId: row.user_id,
      companyId: row.company_id,
      proofPath: row.proof_path || (typeof row.reference === 'string' && row.reference.startsWith('proof:') ? row.reference.slice(6) : null),
    }));

    // Enlace temporal (1 h) a la captura de Yape, si existe.
    if (supabaseAdmin) {
      await Promise.all(pagos.map(async (p: any) => {
        if (!p.proofPath) return;
        const { data: signed } = await supabaseAdmin.storage.from('payment-proofs').createSignedUrl(p.proofPath, 3600);
        p.proofUrl = signed?.signedUrl || null;
      }));
    }

    res.json({ data: pagos });
  });

  // Aprobar un pago: activa/renueva la suscripción de la empresa y notifica por correo
  app.post("/api/superadmin/pagos-pendientes/:id/aprobar", requireSuperAdmin, async (req, res) => {
    if (!useSupabaseDb) return res.status(503).json({ error: "Supabase is not configured" });

    const client = supabaseAdmin || supabase;
    if (!client) return res.status(503).json({ error: "Supabase is not configured" });

    const { data: payment, error: fetchError } = await client
      .from("subscription_payments")
      .select("*")
      .eq("id", req.params.id)
      .single();

    if (fetchError || !payment) return res.status(404).json({ error: "Pago no encontrado" });

    const periodMonths = Number(payment.period_months) === 12 || /^ANUAL/.test(String(payment.reference || '')) ? 12 : 1;
    const vencimiento = new Date();
    if (periodMonths === 12) vencimiento.setFullYear(vencimiento.getFullYear() + 1);
    else vencimiento.setDate(vencimiento.getDate() + 30);

    let companyId = payment.company_id;

    if (companyId) {
      await client
        .from("companies")
        .update({
          plan: payment.plan,
          subscription_status: "Activa",
          subscription_ends_at: vencimiento.toISOString().split("T")[0],
        })
        .eq("id", companyId);
    } else if (payment.user_id) {
      // Si aún no tenía empresa asociada, se busca la más reciente del usuario
      const { data: companyRow } = await client
        .from("companies")
        .select("id")
        .eq("user_id", payment.user_id)
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle();

      if (companyRow) {
        companyId = companyRow.id;
        await client
          .from("companies")
          .update({
            plan: payment.plan,
            subscription_status: "Activa",
            subscription_ends_at: vencimiento.toISOString().split("T")[0],
          })
          .eq("id", companyId);
      }
    }

    const { error: updateError } = await client
      .from("subscription_payments")
      .update({ status: "Aprobado", reviewed_at: new Date().toISOString(), company_id: companyId })
      .eq("id", req.params.id);

    if (updateError) return res.status(500).json({ error: updateError.message });

    // Referidos: el primer pago del referido deja el referido "calificado" (premio pendiente de aprobación).
    if (companyId) {
      try { await client.from('referrals').update({ status: 'calificado', qualified_at: new Date().toISOString() }).eq('referred_company_id', companyId).eq('status', 'pendiente'); } catch {}
    }

    await logSuperAdminAction(
      "APROBAR_PAGO",
      "subscription_payment",
      req.params.id,
      payment.business_name,
      `Pago de S/ ${payment.amount} (${payment.plan}${periodMonths === 12 ? ', anual' : ''}) aprobado. Suscripción activada hasta ${vencimiento.toISOString().split("T")[0]}.`,
    );

    if (resend && payment.email) {
      try {
        await resend.emails.send({
          from: MAIL_FROM,
          to: [payment.email],
          subject: '¡Tu suscripción a WowSmart ha sido aprobada!',
          html: `
            <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
              <h1 style="color: #4f46e5;">¡Bienvenido a WowSmart!</h1>
              <p>Tu pago por el plan <strong>${payment.plan}</strong> para <strong>${payment.business_name}</strong> ha sido validado exitosamente.</p>
              <p>Monto pagado: S/ ${payment.amount}</p>
            </div>
          `,
        });
      } catch (e) {
        console.error('Error enviando correo de aprobación', e);
      }
    }

    res.json({ success: true, companyId });
  });

  // Rechazar un pago pendiente
  app.post("/api/superadmin/pagos-pendientes/:id/rechazar", requireSuperAdmin, async (req, res) => {
    if (!useSupabaseDb) return res.status(503).json({ error: "Supabase is not configured" });

    const client = supabaseAdmin || supabase;
    if (!client) return res.status(503).json({ error: "Supabase is not configured" });

    const { data, error } = await client
      .from("subscription_payments")
      .update({ status: "Rechazado", reviewed_at: new Date().toISOString() })
      .eq("id", req.params.id)
      .select("business_name, plan, amount")
      .single();

    if (error) return res.status(500).json({ error: error.message });

    await logSuperAdminAction(
      "RECHAZAR_PAGO",
      "subscription_payment",
      req.params.id,
      data?.business_name || null,
      `Pago de S/ ${data?.amount ?? "-"} (${data?.plan || "-"}) rechazado.`,
    );

    res.json({ success: true });
  });

  // Renovar la suscripción de una empresa por 30 días más
  app.put("/api/superadmin/empresas/:id/renovar", requireSuperAdmin, async (req, res) => {
    const vencimiento = new Date();
    vencimiento.setDate(vencimiento.getDate() + 30);
    const nuevaFecha = vencimiento.toISOString().split("T")[0];

    if (!useSupabaseDb) {
      const idx = db.companies.findIndex((c: any) => c.id === req.params.id);
      if (idx === -1) return res.status(404).json({ error: "Empresa no encontrada" });
      db.companies[idx].subscriptionStatus = "Activa";
      db.companies[idx].subscriptionEndsAt = nuevaFecha;
      return res.json({ id: db.companies[idx].id, estado: "Activa", vencimiento: nuevaFecha });
    }

    const client = supabaseAdmin || supabase;
    if (!client) return res.status(503).json({ error: "Supabase is not configured" });

    const { data, error } = await client
      .from("companies")
      .update({ subscription_status: "Activa", subscription_ends_at: nuevaFecha })
      .eq("id", req.params.id)
      .select("id, name, subscription_status, subscription_ends_at")
      .single();

    if (error) return res.status(500).json({ error: error.message });
    if (!data) return res.status(404).json({ error: "Empresa no encontrada" });

    await logSuperAdminAction(
      "RENOVAR_SUSCRIPCION",
      "company",
      data.id,
      data.name,
      `Suscripción renovada hasta ${nuevaFecha}.`,
    );

    res.json({ id: data.id, estado: data.subscription_status, vencimiento: data.subscription_ends_at });
  });


  // Extender la prueba gratuita de una empresa (7, 15 o 30 días) sin cambiar su estado
  app.put("/api/superadmin/empresas/:id/extender-prueba", requireSuperAdmin, async (req, res) => {
    const dias = Number(req.body?.dias);
    if (![7, 15, 30].includes(dias)) {
      return res.status(400).json({ error: "Los días deben ser 7, 15 o 30" });
    }
    const calcularFecha = (actual?: string | null) => {
      const hoy = new Date();
      hoy.setUTCHours(0, 0, 0, 0);
      let base = hoy;
      if (actual) {
        const d = new Date(String(actual).split("T")[0] + "T00:00:00Z");
        if (!isNaN(d.getTime()) && d.getTime() > hoy.getTime()) base = d;
      }
      base.setUTCDate(base.getUTCDate() + dias);
      return base.toISOString().split("T")[0];
    };
    const ACTIVA_MSG = "La empresa ya tiene suscripción activa";

    if (!useSupabaseDb) {
      const idx = db.companies.findIndex((c: any) => c.id === req.params.id);
      if (idx === -1) return res.status(404).json({ error: "Empresa no encontrada" });
      const c = db.companies[idx];
      if ((c.subscriptionStatus || "Activa") !== "Prueba Gratuita") return res.status(400).json({ error: ACTIVA_MSG });
      const nuevaFecha = calcularFecha(c.subscriptionEndsAt);
      c.subscriptionEndsAt = nuevaFecha;
      return res.json({ id: c.id, estado: c.subscriptionStatus, vencimiento: nuevaFecha });
    }

    const client = supabaseAdmin || supabase;
    if (!client) return res.status(503).json({ error: "Supabase is not configured" });

    const { data: actual, error: readError } = await client
      .from("companies")
      .select("id, name, subscription_status, subscription_ends_at")
      .eq("id", req.params.id)
      .maybeSingle();
    if (readError) return res.status(500).json({ error: readError.message });
    if (!actual) return res.status(404).json({ error: "Empresa no encontrada" });
    if (actual.subscription_status !== "Prueba Gratuita") return res.status(400).json({ error: ACTIVA_MSG });

    const nuevaFecha = calcularFecha(actual.subscription_ends_at);
    const { data, error } = await client
      .from("companies")
      .update({ subscription_ends_at: nuevaFecha })
      .eq("id", req.params.id)
      .eq("subscription_status", "Prueba Gratuita")
      .select("id, name, subscription_status, subscription_ends_at")
      .single();

    if (error) return res.status(500).json({ error: error.message });
    if (!data) return res.status(404).json({ error: "Empresa no encontrada" });

    await logSuperAdminAction(
      "EXTENDER_PRUEBA",
      "company",
      data.id,
      data.name,
      `Prueba extendida ${dias} días hasta ${nuevaFecha}.`,
    );

    res.json({ id: data.id, estado: data.subscription_status, vencimiento: data.subscription_ends_at });
  });

  app.get("/api/superadmin/suscripciones", requireSuperAdmin, async (_req, res) => {
    if (!useSupabaseDb) {
      const suscripciones = db.companies.map((c: any) => ({
        id: c.id,
        empresa: c.name,
        plan: c.plan,
        estado: computeSubscriptionStatus(c.subscriptionStatus, c.subscriptionEndsAt),
        estadoGuardado: c.subscriptionStatus || "Activa",
        vencimiento: c.subscriptionEndsAt || "-",
        precio: 0,
        metodoPago: "-",
      }));
      return res.json({ data: suscripciones });
    }

    const client = supabaseAdmin || supabase;
    if (!client) return res.status(503).json({ error: "Supabase is not configured" });

    const [companiesResult, paymentsResult] = await Promise.all([
      client.from("companies").select("id, name, plan, subscription_status, subscription_ends_at"),
      client
        .from("subscription_payments")
        .select("company_id, amount, payment_method, created_at")
        .eq("status", "Aprobado")
        .order("created_at", { ascending: false }),
    ]);

    if (companiesResult.error) return res.status(500).json({ error: companiesResult.error.message });

    const latestPaymentByCompany: Record<string, any> = {};
    (paymentsResult.data || []).forEach((p: any) => {
      if (p.company_id && !latestPaymentByCompany[p.company_id]) {
        latestPaymentByCompany[p.company_id] = p;
      }
    });

    const suscripciones = (companiesResult.data || []).map((c: any) => {
      const latestPayment = latestPaymentByCompany[c.id];
      return {
        id: c.id,
        empresa: c.name,
        plan: c.plan,
        estado: computeSubscriptionStatus(c.subscription_status, c.subscription_ends_at),
        estadoGuardado: c.subscription_status || "Activa",
        vencimiento: c.subscription_ends_at ? String(c.subscription_ends_at).split("T")[0] : "-",
        precio: latestPayment ? Number(latestPayment.amount || 0) : 0,
        precioLista: SUBSCRIPTION_PLAN_PRICES[c.plan] ?? null,
        pagosAprobados: (paymentsResult.data || []).filter((p: any) => p.company_id === c.id).length,
        metodoPago: latestPayment ? latestPayment.payment_method || "-" : "-",
      };
    });

    res.json({ data: suscripciones });
  });


  // Métricas reales del Dashboard SuperAdmin
  // Registro de auditoría de acciones del SuperAdmin
  app.get("/api/superadmin/auditoria", requireSuperAdmin, async (_req, res) => {
    if (!useSupabaseDb) return res.json({ data: [] });

    const client = supabaseAdmin || supabase;
    if (!client) return res.status(503).json({ error: "Supabase is not configured" });

    const { data, error } = await client
      .from("superadmin_audit_logs")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(100);

    if (error) return res.status(500).json({ error: error.message });

    const logs = (data || []).map((row: any) => ({
      id: row.id,
      accion: row.action,
      objetivo: row.target_name || row.target_id || "-",
      detalles: row.details || "",
      fecha: row.created_at,
    }));

    res.json({ data: logs });
  });

  app.get("/api/superadmin/dashboard", requireSuperAdmin, async (_req, res) => {
    if (!useSupabaseDb) {
      return res.json({
        totalEmpresas: db.companies.length,
        totalEmpresasCambioPct: 0,
        ingresosMes: 0,
        ingresosMesCambioPct: 0,
        suscripcionesActivas: db.companies.filter((c: any) => c.subscriptionStatus === "Activa").length,
        retencionPct: 0,
        pagosPendientes: 0,
      });
    }

    const client = supabaseAdmin || supabase;
    if (!client) return res.status(503).json({ error: "Supabase is not configured" });

    const now = new Date();
    const startOfThisMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const startOfLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);

    const [companiesResult, paymentsThisMonthResult, paymentsLastMonthResult, pendingPaymentsResult] = await Promise.all([
      client.from("companies").select("id, plan, subscription_status, subscription_ends_at, created_at"),
      client
        .from("subscription_payments")
        .select("amount")
        .eq("status", "Aprobado")
        .gte("created_at", startOfThisMonth.toISOString()),
      client
        .from("subscription_payments")
        .select("amount")
        .eq("status", "Aprobado")
        .gte("created_at", startOfLastMonth.toISOString())
        .lt("created_at", startOfThisMonth.toISOString()),
      client.from("subscription_payments").select("id", { count: "exact", head: true }).eq("status", "Pendiente"),
    ]);

    if (companiesResult.error) return res.status(500).json({ error: companiesResult.error.message });

    const companies = companiesResult.data || [];
    const totalEmpresas = companies.length;
    const empresasEsteMes = companies.filter((c: any) => c.created_at && new Date(c.created_at) >= startOfThisMonth).length;
    const empresasMesPasado = companies.filter((c: any) => c.created_at && new Date(c.created_at) >= startOfLastMonth && new Date(c.created_at) < startOfThisMonth).length;
    const totalEmpresasCambioPct = empresasMesPasado > 0
      ? Math.round(((empresasEsteMes - empresasMesPasado) / empresasMesPasado) * 100)
      : (empresasEsteMes > 0 ? 100 : 0);

    const ingresosMes = (paymentsThisMonthResult.data || []).reduce((sum: number, p: any) => sum + Number(p.amount || 0), 0);
    const ingresosMesPasado = (paymentsLastMonthResult.data || []).reduce((sum: number, p: any) => sum + Number(p.amount || 0), 0);
    const ingresosMesCambioPct = ingresosMesPasado > 0
      ? Math.round(((ingresosMes - ingresosMesPasado) / ingresosMesPasado) * 100)
      : (ingresosMes > 0 ? 100 : 0);

    const estados = companies.map((c: any) => computeSubscriptionStatus(c.subscription_status, c.subscription_ends_at));
    const suscripcionesActivas = estados.filter((e: string) => e === "Activa").length;
    const suscripcionesVencidas = estados.filter((e: string) => e === "Vencida").length;
    const enPrueba = estados.filter((e: string) => e === "Prueba Gratuita").length;
    const retencionPct = totalEmpresas > 0 ? Math.round((suscripcionesActivas / totalEmpresas) * 100) : 0;
    // Ingreso mensual recurrente real: solo suscripciones vigentes con al menos un pago aprobado.
    const { data: allApproved } = await client.from("subscription_payments").select("company_id, amount").eq("status", "Aprobado");
    const pagadoras = new Set((allApproved || []).map((p: any) => p.company_id));
    const mrr = companies
      .filter((c: any, i: number) => estados[i] === "Activa" && pagadoras.has(c.id))
      .reduce((sum: number, c: any) => sum + (SUBSCRIPTION_PLAN_PRICES[c.plan] || 0), 0);
    const ingresosTotales = (allApproved || []).reduce((sum: number, p: any) => sum + Number(p.amount || 0), 0);

    res.json({
      totalEmpresas,
      totalEmpresasCambioPct,
      ingresosMes,
      ingresosMesCambioPct,
      suscripcionesActivas,
      retencionPct,
      pagosPendientes: pendingPaymentsResult.count || 0,
      suscripcionesVencidas,
      enPrueba,
      empresasPagadoras: pagadoras.size,
      mrr,
      ingresosTotales,
    });
  });

  app.get("/api/superadmin/empresas", requireSuperAdmin, async (_req, res) => {
    if (!useSupabaseDb) {
      const empresas = db.companies.map((c: any) => ({
        id: c.id,
        nombre: c.name,
        plan: c.plan,
        estado: c.subscriptionStatus || "Activa",
        registro: c.subscriptionEndsAt || "",
      }));
      return res.json({ data: empresas });
    }

    const client = supabaseAdmin || supabase;
    if (!client) return res.status(503).json({ error: "Supabase is not configured" });

    const { data, error } = await client
      .from("companies")
      .select("id, name, plan, subscription_status, subscription_ends_at, created_at")
      .order("created_at", { ascending: false });

    if (error) return res.status(500).json({ error: error.message });

    const empresas = (data || []).map((row: any) => ({
      id: row.id,
      nombre: row.name,
      plan: row.plan,
      estado: computeSubscriptionStatus(row.subscription_status, row.subscription_ends_at),
      registro: row.created_at ? row.created_at.split("T")[0] : "",
    }));

    res.json({ data: empresas });
  });

  // Activar / Suspender una empresa real desde el panel SuperAdmin
  app.put("/api/superadmin/empresas/:id/estado", requireSuperAdmin, async (req, res) => {
    const { estado } = req.body || {};
    if (estado !== "Activa" && estado !== "Suspendida") {
      return res.status(400).json({ error: "Estado inválido. Debe ser 'Activa' o 'Suspendida'." });
    }

    if (!useSupabaseDb) {
      const idx = db.companies.findIndex((c: any) => c.id === req.params.id);
      if (idx === -1) return res.status(404).json({ error: "Empresa no encontrada" });
      db.companies[idx].subscriptionStatus = estado;
      return res.json({ id: db.companies[idx].id, estado });
    }

    const client = supabaseAdmin || supabase;
    if (!client) return res.status(503).json({ error: "Supabase is not configured" });

    const { data, error } = await client
      .from("companies")
      .update({ subscription_status: estado })
      .eq("id", req.params.id)
      .select("id, name, subscription_status")
      .single();

    if (error) return res.status(500).json({ error: error.message });
    if (!data) return res.status(404).json({ error: "Empresa no encontrada" });

    await logSuperAdminAction(
      estado === "Activa" ? "ACTIVAR_EMPRESA" : "SUSPENDER_EMPRESA",
      "company",
      data.id,
      data.name,
      `Estado cambiado a "${estado}".`,
    );

    res.json({ id: data.id, estado: data.subscription_status });
  });

  // ==================== VISTAS DE SOLO LECTURA ====================
  app.get("/api/superadmin/productos", requireSuperAdmin, async (_req, res) => {
    if (!useSupabaseDb) return res.json({ data: (db.products || []).map((p: any) => ({
      id: p.id, nombre: p.name, precio: p.price, stock: p.stock, categoria: p.category,
      empresa: db.companies.find((c: any) => c.id === p.companyId)?.name || "-", creado: p.createdAt,
    })) });
    const client = supabaseAdmin || supabase;
    if (!client) return res.status(503).json({ error: "Supabase is not configured" });
    const [prods, comps] = await Promise.all([
      client.from("products").select("id, name, price, stock, category, company_id, created_at").order("created_at", { ascending: false }).limit(1000),
      client.from("companies").select("id, name"),
    ]);
    if (prods.error) return res.status(500).json({ error: prods.error.message });
    const names: Record<string, string> = {};
    (comps.data || []).forEach((c: any) => { names[c.id] = c.name; });
    res.json({ data: (prods.data || []).map((p: any) => ({
      id: p.id, nombre: p.name, precio: p.price, stock: p.stock, categoria: p.category,
      empresa: names[p.company_id] || p.company_id || "-", creado: p.created_at,
    })) });
  });

  app.get("/api/superadmin/auth-users", requireSuperAdmin, async (_req, res) => {
    if (!supabaseAdmin) return res.status(503).json({ error: "Falta SUPABASE_SERVICE_ROLE_KEY en el servidor." });
    const { data, error } = await supabaseAdmin.auth.admin.listUsers({ page: 1, perPage: 200 });
    if (error) return res.status(500).json({ error: error.message });
    const { data: comps } = await supabaseAdmin.from("companies").select("name, user_id");
    const byUser: Record<string, string[]> = {};
    (comps || []).forEach((c: any) => { if (c.user_id) (byUser[c.user_id] ||= []).push(c.name); });
    res.json({ data: (data?.users || []).map((u: any) => ({
      id: u.id, email: u.email, creado: u.created_at, ultimoAcceso: u.last_sign_in_at,
      confirmado: Boolean(u.email_confirmed_at), empresas: byUser[u.id] || [],
    })) });
  });

  // ==================== USUARIOS ADMINISTRADORES ====================
  // Lista de cuentas que pueden acceder al panel SuperAdmin
  app.get("/api/superadmin/usuarios", requireSuperAdmin, async (_req, res) => {
    if (!useSupabaseDb) return res.json({ data: [] });
    const client = supabaseAdmin || supabase;
    if (!client) return res.status(503).json({ error: "Supabase is not configured" });

    const { data, error } = await client
      .from("superadmin_users")
      .select("id, email, active, created_at, last_login_at")
      .order("created_at", { ascending: false });

    if (error) return res.status(500).json({ error: error.message });
    res.json({ data: data || [] });
  });

  app.post("/api/superadmin/usuarios", requireSuperAdmin, async (req, res) => {
    const { email, password } = req.body || {};
    if (!email || !password || password.length < 8) {
      return res.status(400).json({ error: "Email y contraseña (mínimo 8 caracteres) son requeridos" });
    }
    if (!useSupabaseDb) return res.status(503).json({ error: "Supabase is not configured" });

    const client = supabaseAdmin || supabase;
    if (!client) return res.status(503).json({ error: "Supabase is not configured" });

    const { hash, salt } = hashPassword(password);
    const { data, error } = await client
      .from("superadmin_users")
      .insert({ email, password_hash: hash, password_salt: salt })
      .select("id, email, active, created_at")
      .single();

    if (error) {
      const message = error.message.includes("duplicate") ? "Ya existe un administrador con ese correo" : error.message;
      return res.status(400).json({ error: message });
    }

    await logSuperAdminAction("CREAR_ADMIN", "superadmin_user", data.id, email, "Nuevo administrador del panel creado.");
    res.json(data);
  });

  app.put("/api/superadmin/usuarios/:id/estado", requireSuperAdmin, async (req, res) => {
    const { active } = req.body || {};
    if (typeof active !== "boolean") return res.status(400).json({ error: "'active' debe ser booleano" });
    if (!useSupabaseDb) return res.status(503).json({ error: "Supabase is not configured" });

    const client = supabaseAdmin || supabase;
    if (!client) return res.status(503).json({ error: "Supabase is not configured" });

    const { data, error } = await client
      .from("superadmin_users")
      .update({ active })
      .eq("id", req.params.id)
      .select("id, email")
      .single();

    if (error) return res.status(500).json({ error: error.message });

    await logSuperAdminAction(
      active ? "ACTIVAR_ADMIN" : "DESACTIVAR_ADMIN",
      "superadmin_user",
      data.id,
      data.email,
      active ? "Acceso reactivado." : "Acceso revocado.",
    );

    res.json({ success: true });
  });

  app.delete("/api/superadmin/usuarios/:id", requireSuperAdmin, async (req, res) => {
    if (!useSupabaseDb) return res.status(503).json({ error: "Supabase is not configured" });
    const client = supabaseAdmin || supabase;
    if (!client) return res.status(503).json({ error: "Supabase is not configured" });

    const { data } = await client.from("superadmin_users").select("email").eq("id", req.params.id).maybeSingle();
    const { error } = await client.from("superadmin_users").delete().eq("id", req.params.id);
    if (error) return res.status(500).json({ error: error.message });

    await logSuperAdminAction("ELIMINAR_ADMIN", "superadmin_user", req.params.id, data?.email || null, "Administrador eliminado.");
    res.json({ success: true });
  });

  // ==================== PLANES ====================
  app.get("/api/superadmin/planes", requireSuperAdmin, async (_req, res) => {
    if (!useSupabaseDb) return res.json({ data: [] });
    const client = supabaseAdmin || supabase;
    if (!client) return res.status(503).json({ error: "Supabase is not configured" });

    const { data, error } = await client.from("plans").select("*").order("price", { ascending: true });
    if (error) return res.status(500).json({ error: error.message });
    res.json({ data: data || [] });
  });

  app.post("/api/superadmin/planes", requireSuperAdmin, async (req, res) => {
    const { name, price, description, features } = req.body || {};
    if (!name) return res.status(400).json({ error: "El nombre del plan es requerido" });
    if (!useSupabaseDb) return res.status(503).json({ error: "Supabase is not configured" });

    const client = supabaseAdmin || supabase;
    if (!client) return res.status(503).json({ error: "Supabase is not configured" });

    const { data, error } = await client
      .from("plans")
      .insert({ name, price: Number(price) || 0, description: description || null, features: features || [] })
      .select("*")
      .single();

    if (error) {
      const message = error.message.includes("duplicate") ? "Ya existe un plan con ese nombre" : error.message;
      return res.status(400).json({ error: message });
    }

    await logSuperAdminAction("CREAR_PLAN", "plan", data.id, data.name, `Plan creado a S/ ${data.price}.`);
    res.json(data);
  });

  app.put("/api/superadmin/planes/:id", requireSuperAdmin, async (req, res) => {
    const { name, price, description, features, active } = req.body || {};
    if (!useSupabaseDb) return res.status(503).json({ error: "Supabase is not configured" });

    const client = supabaseAdmin || supabase;
    if (!client) return res.status(503).json({ error: "Supabase is not configured" });

    const updatePayload: Record<string, any> = {};
    if (name !== undefined) updatePayload.name = name;
    if (price !== undefined) updatePayload.price = Number(price) || 0;
    if (description !== undefined) updatePayload.description = description;
    if (features !== undefined) updatePayload.features = features;
    if (active !== undefined) updatePayload.active = active;

    const { data, error } = await client
      .from("plans")
      .update(updatePayload)
      .eq("id", req.params.id)
      .select("*")
      .single();

    if (error) return res.status(500).json({ error: error.message });

    await logSuperAdminAction("ACTUALIZAR_PLAN", "plan", data.id, data.name, "Plan actualizado.");
    res.json(data);
  });

  app.delete("/api/superadmin/planes/:id", requireSuperAdmin, async (req, res) => {
    if (!useSupabaseDb) return res.status(503).json({ error: "Supabase is not configured" });
    const client = supabaseAdmin || supabase;
    if (!client) return res.status(503).json({ error: "Supabase is not configured" });

    const { data } = await client.from("plans").select("name").eq("id", req.params.id).maybeSingle();
    const { error } = await client.from("plans").delete().eq("id", req.params.id);
    if (error) return res.status(500).json({ error: error.message });

    await logSuperAdminAction("ELIMINAR_PLAN", "plan", req.params.id, data?.name || null, "Plan eliminado.");
    res.json({ success: true });
  });

  // ==================== PROMOCIONES ====================
  app.get("/api/superadmin/promociones", requireSuperAdmin, async (_req, res) => {
    if (!useSupabaseDb) return res.json({ data: [] });
    const client = supabaseAdmin || supabase;
    if (!client) return res.status(503).json({ error: "Supabase is not configured" });

    const { data, error } = await client.from("promotions").select("*").order("created_at", { ascending: false });
    if (error) return res.status(500).json({ error: error.message });
    res.json({ data: data || [] });
  });

  app.post("/api/superadmin/promociones", requireSuperAdmin, async (req, res) => {
    const { code, discountType, discountValue, expiresAt } = req.body || {};
    if (!code || !discountValue) return res.status(400).json({ error: "Código y valor de descuento son requeridos" });
    if (!useSupabaseDb) return res.status(503).json({ error: "Supabase is not configured" });

    const client = supabaseAdmin || supabase;
    if (!client) return res.status(503).json({ error: "Supabase is not configured" });

    const { data, error } = await client
      .from("promotions")
      .insert({
        code: code.toUpperCase(),
        discount_type: discountType === "fixed" ? "fixed" : "percentage",
        discount_value: Number(discountValue) || 0,
        expires_at: expiresAt || null,
      })
      .select("*")
      .single();

    if (error) {
      const message = error.message.includes("duplicate") ? "Ya existe una promoción con ese código" : error.message;
      return res.status(400).json({ error: message });
    }

    await logSuperAdminAction("CREAR_PROMOCION", "promotion", data.id, data.code, `Descuento de ${data.discount_value}${data.discount_type === "percentage" ? "%" : " soles"} creado.`);
    res.json(data);
  });

  app.put("/api/superadmin/promociones/:id/estado", requireSuperAdmin, async (req, res) => {
    const { active } = req.body || {};
    if (typeof active !== "boolean") return res.status(400).json({ error: "'active' debe ser booleano" });
    if (!useSupabaseDb) return res.status(503).json({ error: "Supabase is not configured" });

    const client = supabaseAdmin || supabase;
    if (!client) return res.status(503).json({ error: "Supabase is not configured" });

    const { data, error } = await client
      .from("promotions")
      .update({ active })
      .eq("id", req.params.id)
      .select("code")
      .single();

    if (error) return res.status(500).json({ error: error.message });

    await logSuperAdminAction(active ? "ACTIVAR_PROMOCION" : "DESACTIVAR_PROMOCION", "promotion", req.params.id, data.code, null);
    res.json({ success: true });
  });

  app.delete("/api/superadmin/promociones/:id", requireSuperAdmin, async (req, res) => {
    if (!useSupabaseDb) return res.status(503).json({ error: "Supabase is not configured" });
    const client = supabaseAdmin || supabase;
    if (!client) return res.status(503).json({ error: "Supabase is not configured" });

    const { data } = await client.from("promotions").select("code").eq("id", req.params.id).maybeSingle();
    const { error } = await client.from("promotions").delete().eq("id", req.params.id);
    if (error) return res.status(500).json({ error: error.message });

    await logSuperAdminAction("ELIMINAR_PROMOCION", "promotion", req.params.id, data?.code || null, null);
    res.json({ success: true });
  });

  // ==================== SOPORTE ====================
  // Endpoint público (requiere sesión de cliente) para crear un ticket desde el dashboard del negocio
  app.post("/api/support-tickets", async (req, res) => {
    const user = (req as any).user;
    if (!user) return res.status(401).json({ error: "Unauthorized" });

    const { subject, message, businessName } = req.body || {};
    if (!subject || !message) return res.status(400).json({ error: "subject y message son requeridos" });
    if (!useSupabaseDb) return res.json({ id: Date.now().toString() });

    const client = supabaseAdmin || getRequestSupabase(req);
    if (!client) return res.status(503).json({ error: "Supabase is not configured" });

    const { data: companyRow } = await client
      .from("companies")
      .select("id")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    const { data, error } = await client
      .from("support_tickets")
      .insert({
        user_id: user.id,
        company_id: companyRow?.id || null,
        business_name: businessName || null,
        email: user.email || null,
        subject,
        message,
      })
      .select("*")
      .single();

    if (error) return res.status(500).json({ error: error.message });
    res.json(data);
  });

  // ==================== LIBRO DE RECLAMACIONES ====================
  app.get("/api/superadmin/reclamos", requireSuperAdmin, async (_req, res) => {
    if (!useSupabaseDb) return res.json({ data: [] });
    const client = supabaseAdmin || supabase;
    if (!client) return res.status(503).json({ error: "Supabase is not configured" });

    const { data, error } = await client
      .from("complaints_book_entries")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) return res.status(500).json({ error: error.message });
    res.json({ data: data || [] });
  });

  app.put("/api/superadmin/reclamos/:id/atender", requireSuperAdmin, async (req, res) => {
    if (!useSupabaseDb) return res.status(503).json({ error: "Supabase is not configured" });
    const client = supabaseAdmin || supabase;
    if (!client) return res.status(503).json({ error: "Supabase is not configured" });

    const { data, error } = await client
      .from("complaints_book_entries")
      .update({ status: "Atendido" })
      .eq("id", req.params.id)
      .select("nombres, apellidos, tipo")
      .single();

    if (error) return res.status(500).json({ error: error.message });

    await logSuperAdminAction(
      "ATENDER_RECLAMO",
      "complaint",
      req.params.id,
      `${data?.nombres || ""} ${data?.apellidos || ""}`.trim(),
      `${data?.tipo || "Reclamo"} marcado como atendido.`,
    );

    res.json({ success: true });
  });

  app.get("/api/superadmin/soporte", requireSuperAdmin, async (_req, res) => {
    if (!useSupabaseDb) return res.json({ data: [] });
    const client = supabaseAdmin || supabase;
    if (!client) return res.status(503).json({ error: "Supabase is not configured" });

    const { data, error } = await client
      .from("support_tickets")
      .select("*")
      .neq("status", "Cerrado")
      .order("created_at", { ascending: false });

    if (error) return res.status(500).json({ error: error.message });
    res.json({ data: data || [] });
  });

  app.post("/api/superadmin/soporte/:id/responder", requireSuperAdmin, async (req, res) => {
    const { reply } = req.body || {};
    if (!reply) return res.status(400).json({ error: "La respuesta no puede estar vacía" });
    if (!useSupabaseDb) return res.status(503).json({ error: "Supabase is not configured" });

    const client = supabaseAdmin || supabase;
    if (!client) return res.status(503).json({ error: "Supabase is not configured" });

    const { data, error } = await client
      .from("support_tickets")
      .update({ reply, status: "Resuelto", resolved_at: new Date().toISOString() })
      .eq("id", req.params.id)
      .select("subject, business_name")
      .single();

    if (error) return res.status(500).json({ error: error.message });

    await logSuperAdminAction("RESPONDER_TICKET", "support_ticket", req.params.id, data?.business_name || data?.subject, "Ticket respondido y marcado como resuelto.");
    res.json({ success: true });
  });

  app.put("/api/superadmin/soporte/:id/cerrar", requireSuperAdmin, async (req, res) => {
    if (!useSupabaseDb) return res.status(503).json({ error: "Supabase is not configured" });
    const client = supabaseAdmin || supabase;
    if (!client) return res.status(503).json({ error: "Supabase is not configured" });

    const { error } = await client.from("support_tickets").update({ status: "Cerrado" }).eq("id", req.params.id);
    if (error) return res.status(500).json({ error: error.message });

    await logSuperAdminAction("CERRAR_TICKET", "support_ticket", req.params.id, null, null);
    res.json({ success: true });
  });

  // ==================== REPORTES ====================
  app.get("/api/superadmin/reportes", requireSuperAdmin, async (_req, res) => {
    if (!useSupabaseDb) return res.json({ data: { ingresosPorDia: [], empresasPorPlan: [], pagosPorEstado: [] } });

    const client = supabaseAdmin || supabase;
    if (!client) return res.status(503).json({ error: "Supabase is not configured" });

    const desde = new Date();
    desde.setDate(desde.getDate() - 30);

    const [companiesResult, paymentsResult] = await Promise.all([
      client.from("companies").select("plan"),
      client.from("subscription_payments").select("amount, status, created_at").gte("created_at", desde.toISOString()),
    ]);

    if (companiesResult.error) return res.status(500).json({ error: companiesResult.error.message });
    if (paymentsResult.error) return res.status(500).json({ error: paymentsResult.error.message });

    const empresasPorPlanMap: Record<string, number> = {};
    (companiesResult.data || []).forEach((c: any) => {
      const plan = c.plan || "Sin plan";
      empresasPorPlanMap[plan] = (empresasPorPlanMap[plan] || 0) + 1;
    });

    const pagosPorEstadoMap: Record<string, number> = { Pendiente: 0, Aprobado: 0, Rechazado: 0 };
    const ingresosPorDiaMap: Record<string, number> = {};
    (paymentsResult.data || []).forEach((p: any) => {
      pagosPorEstadoMap[p.status] = (pagosPorEstadoMap[p.status] || 0) + 1;
      if (p.status === "Aprobado") {
        const day = p.created_at.split("T")[0];
        ingresosPorDiaMap[day] = (ingresosPorDiaMap[day] || 0) + Number(p.amount || 0);
      }
    });

    res.json({
      data: {
        ingresosPorDia: Object.entries(ingresosPorDiaMap).map(([fecha, total]) => ({ fecha, total })).sort((a, b) => a.fecha.localeCompare(b.fecha)),
        empresasPorPlan: Object.entries(empresasPorPlanMap).map(([plan, total]) => ({ plan, total })),
        pagosPorEstado: Object.entries(pagosPorEstadoMap).map(([estado, total]) => ({ estado, total })),
      },
    });
  });

  // ==================== CRM COMERCIAL (leads en prueba gratuita) ====================
  app.get("/api/superadmin/crm-leads", requireSuperAdmin, async (_req, res) => {
    if (!useSupabaseDb) return res.json({ data: [] });
    const client = supabaseAdmin || supabase;
    if (!client) return res.status(503).json({ error: "Supabase is not configured" });

    const { data, error } = await client
      .from("companies")
      .select("id, name, plan, subscription_status, subscription_ends_at, created_at")
      .eq("subscription_status", "Prueba Gratuita")
      .order("subscription_ends_at", { ascending: true });

    if (error) return res.status(500).json({ error: error.message });

    const hoy = new Date();
    const leads = (data || []).map((c: any) => {
      const vencimiento = c.subscription_ends_at ? new Date(c.subscription_ends_at) : null;
      const diasRestantes = vencimiento ? Math.ceil((vencimiento.getTime() - hoy.getTime()) / (1000 * 60 * 60 * 24)) : null;
      return {
        id: c.id,
        empresa: c.name,
        plan: c.plan,
        vencimiento: c.subscription_ends_at,
        diasRestantes,
        registro: c.created_at ? c.created_at.split("T")[0] : "",
      };
    });

    res.json({ data: leads });
  });


  // ==========================================================================
  // v3: crecimiento (métricas, avisos de prueba, compartir, plantillas,
  // imágenes en Storage y renovación con captura de Yape).
  // Todo degrada con elegancia si aún no se corrió v3.sql.
  // ==========================================================================
  const getOwnedCompanyRow = async (req: express.Request) => {
    const user = (req as any).user;
    if (!user) return { user: null, client: null, row: null };
    const client = getRequestSupabase(req);
    if (!client) return { user, client: null, row: null };
    const { data } = await client.from("companies").select("*").eq("user_id", user.id)
      .order("created_at", { ascending: false }).limit(1).maybeSingle();
    return { user, client, row: data || null };
  };

  const trackLimiter = rateLimit({ windowMs: 60 * 1000, limit: 60, standardHeaders: true, legacyHeaders: false });
  const companyIdBySlug = new Map<string, { id: string; at: number }>();
  app.post("/api/track", trackLimiter, async (req, res) => {
    const { slug, type, productId } = req.body || {};
    if (!['visit', 'whatsapp_click', 'share'].includes(type) || typeof slug !== 'string') return res.status(204).end();
    if (!useSupabaseDb || !supabase) return res.status(204).end();
    try {
      let cached = companyIdBySlug.get(slug);
      if (!cached || Date.now() - cached.at > 10 * 60 * 1000) {
        const { data } = await supabase.from("companies_public").select("id").eq("slug", slug).maybeSingle();
        if (!data) return res.status(204).end();
        cached = { id: data.id, at: Date.now() };
        companyIdBySlug.set(slug, cached);
      }
      const row: any = { company_id: cached.id, type };
      if (typeof productId === 'string' && /^[0-9a-f-]{36}$/i.test(productId)) row.product_id = productId;
      await (supabaseAdmin || supabase).from("catalog_events").insert(row);
    } catch { /* tabla aún no creada: se ignora */ }
    res.status(204).end();
  });

  const sentNoticesMemory = new Set<string>();
  const trialNoticeFor = (status: string, endsAt: string | null) => {
    if (!endsAt) return null;
    const msLeft = new Date(endsAt + (endsAt.length <= 10 ? 'T23:59:59-05:00' : '')).getTime() - Date.now();
    const daysLeft = Math.ceil(msLeft / 86400000);
    const isTrial = status === 'Prueba Gratuita';
    const label = isTrial ? 'tu prueba gratis' : 'tu plan';
    if (daysLeft <= 0) return { kind: isTrial ? 'trial_expired' : 'plan_expired', level: 'danger', daysLeft,
      title: `${isTrial ? 'Tu prueba gratis terminó' : 'Tu plan venció'}`,
      text: 'Tu catálogo sigue visible. Renueva con Yape en un clic para seguir editando y recibiendo pedidos sin interrupciones.' };
    if (daysLeft <= 2) return { kind: isTrial ? 'trial_d13' : 'plan_d13', level: 'warning', daysLeft,
      title: `Te ${daysLeft === 1 ? 'queda 1 día' : `quedan ${daysLeft} días`} de ${label}`,
      text: 'Renueva hoy y no pierdas ningún pedido.' };
    if (daysLeft <= 5) return { kind: isTrial ? 'trial_d10' : 'plan_d10', level: 'info', daysLeft,
      title: `Te quedan ${daysLeft} días de ${label}`,
      text: 'Elige tu plan cuando quieras: Emprendedor desde S/ 15 al mes.' };
    return { kind: null, level: 'ok', daysLeft, title: `${isTrial ? 'Prueba gratis' : 'Plan activo'}: ${daysLeft} días restantes`, text: '' };
  };

  const maybeEmailNotice = async (client: any, company: any, email: string | undefined, notice: any) => {
    if (!notice?.kind || !email) return 'panel';
    const key = `${company.id}:${notice.kind}`;
    if (sentNoticesMemory.has(key)) return 'panel';
    sentNoticesMemory.add(key);
    try {
      const { error } = await (supabaseAdmin || client).from("company_notices").insert({ company_id: company.id, kind: notice.kind, channel: resend ? 'email' : 'panel' });
      if (error) return 'panel'; // ya enviado antes, o tabla aún no creada
      if (!resend) return 'panel';
      await resend.emails.send({
        from: MAIL_FROM,
        to: [email],
        subject: `${notice.title} — WowSmart`,
        html: `<div style="font-family:sans-serif;max-width:560px;margin:auto"><h2 style="color:#6d28d9">${notice.title}</h2><p>Hola, te escribimos por <b>${String(company.name).replace(/</g, '&lt;')}</b>.</p><p>${notice.text}</p><p><a href="${publicBaseUrl}/dashboard" style="background:#6d28d9;color:#fff;padding:12px 20px;border-radius:8px;text-decoration:none;font-weight:bold">Ir a mi panel</a></p><p style="color:#64748b">Equipo WowSmart</p></div>`,
      });
      return 'email';
    } catch { return 'panel'; }
  };

  app.get("/api/growth/me", async (req, res) => {
    const { user, client, row } = await getOwnedCompanyRow(req);
    if (!user) return res.status(401).json({ error: "Unauthorized" });
    if (!client || !row) return res.status(404).json({ error: "Company not found" });
    const status = row.subscription_status || 'Activa';
    const computed = computeSubscriptionStatus(status, row.subscription_ends_at);
    const notice = trialNoticeFor(status, row.subscription_ends_at);
    const channel = await maybeEmailNotice(client, row, user.email, notice);

    const weekAgo = new Date(Date.now() - 7 * 86400000).toISOString();
    const [{ count: productsCount }, ordersRes, eventsRes] = await Promise.all([
      client.from("products").select("id", { count: "exact", head: true }).eq("company_id", row.id),
      client.from("orders").select("items,total,created_at,status").eq("company_id", row.id).gte("created_at", weekAgo),
      client.from("catalog_events").select("type,product_id").eq("company_id", row.id).gte("created_at", weekAgo).limit(10000),
    ]);
    const weekOrders = ordersRes.data || [];
    const top: Record<string, { name: string; qty: number }> = {};
    weekOrders.forEach((o: any) => (o.items || []).forEach((it: any) => {
      const k = it.productId || it.name; if (!k) return;
      top[k] = top[k] || { name: it.name, qty: 0 }; top[k].qty += Number(it.qty || 0);
    }));
    const topProduct = Object.values(top).sort((a, b) => b.qty - a.qty)[0] || null;
    const events = eventsRes.error ? null : (eventsRes.data || []);

    res.json({
      company: { id: row.id, name: row.name, slug: row.slug, logo: row.logo, whatsapp: row.whatsapp, color: row.color },
      shareUrl: `${publicBaseUrl}/c/${row.slug}`,
      setup: {
        whatsapp: isValidWhatsapp(row.whatsapp),
        logo: Boolean(row.logo),
        products: (productsCount || 0) > 0,
        productsCount: productsCount || 0,
      },
      subscription: {
        status, computedStatus: computed, endsAt: row.subscription_ends_at, plan: row.plan,
        readOnly: ENFORCE_SUBSCRIPTION_EXPIRY && computed === 'Vencida', enforce: ENFORCE_SUBSCRIPTION_EXPIRY,
      },
      notice: notice ? { ...notice, channel } : null,
      lastPayment: await (async () => { try { const { data } = await (supabaseAdmin || client).from('subscription_payments').select('amount,reviewed_at,plan').eq('company_id', row.id).eq('status', 'Aprobado').order('reviewed_at', { ascending: false }).limit(1).maybeSingle(); return data || null; } catch { return null; } })(),
      metrics: {
        available: events !== null,
        visits: events ? events.filter((e: any) => e.type === 'visit').length : 0,
        whatsappClicks: events ? events.filter((e: any) => e.type === 'whatsapp_click').length : 0,
        ordersThisWeek: weekOrders.length,
        salesThisWeek: weekOrders.reduce((sum: number, o: any) => sum + Number(o.total || 0), 0),
        topProduct,
      },
      templates: Object.entries(RUBRO_TEMPLATES).map(([key, t]) => ({ key, label: t.label, emoji: t.emoji, count: t.products.length })),
    });
  });

  app.post("/api/templates/apply", async (req, res) => {
    const { user, client, row } = await getOwnedCompanyRow(req);
    if (!user) return res.status(401).json({ error: "Unauthorized" });
    if (!client || !row) return res.status(404).json({ error: "Company not found" });
    const t = (RUBRO_TEMPLATES as any)[req.body?.rubro];
    if (!t) return res.status(400).json({ error: "Plantilla no encontrada" });
    const rows = t.products.map((p: any) => stripUndefined(fromProduct(normalizeProductPayload({ ...p, companyId: row.id, itemType: 'Producto', stock: null }))));
    const { error } = await client.from("products").insert(rows);
    if (error) return res.status(500).json({ error: error.message });
    res.json({ ok: true, added: rows.length });
  });

  const parseImageDataUrl = (dataUrl: any) => {
    const m = typeof dataUrl === 'string' && dataUrl.match(/^data:(image\/(webp|jpeg|png));base64,([A-Za-z0-9+/=]+)$/);
    if (!m) return null;
    const buffer = Buffer.from(m[3], 'base64');
    return { mime: m[1], ext: m[2] === 'jpeg' ? 'jpg' : m[2], buffer };
  };

  app.post("/api/uploads/image", async (req, res) => {
    const { user, client, row } = await getOwnedCompanyRow(req);
    if (!user) return res.status(401).json({ error: "Unauthorized" });
    if (!client || !row) return res.status(404).json({ error: "Company not found" });
    const img = parseImageDataUrl(req.body?.dataUrl);
    if (!img) return res.status(400).json({ error: "Imagen no válida" });
    if (img.buffer.length > 2 * 1024 * 1024) return res.status(413).json({ error: "La imagen supera 2 MB" });
    const objectPath = `${row.id}/${Date.now()}-${crypto.randomBytes(4).toString('hex')}.${img.ext}`;
    const storageClient = supabaseAdmin || client;
    const { error } = await storageClient.storage.from('catalog-images').upload(objectPath, img.buffer, { contentType: img.mime, upsert: false, cacheControl: '31536000' });
    if (error) return res.status(503).json({ error: "Storage no disponible", fallback: true });
    const { data } = storageClient.storage.from('catalog-images').getPublicUrl(objectPath);
    res.json({ url: data.publicUrl });
  });

  app.post("/api/renewal", async (req, res) => {
    const { user, client, row } = await getOwnedCompanyRow(req);
    if (!user) return res.status(401).json({ error: "Unauthorized" });
    if (!client || !row) return res.status(404).json({ error: "Company not found" });
    const plan = String(req.body?.plan || '');
    const months = req.body?.billing === 'anual' ? 12 : 1;
    const amount = computeSubscriptionAmount(plan, months);
    if (amount === null) return res.status(400).json({ error: "Plan no reconocido" });
    const img = parseImageDataUrl(req.body?.proofDataUrl);
    if (!img) return res.status(400).json({ error: "Adjunta la captura de tu Yape" });
    if (img.buffer.length > 3 * 1024 * 1024) return res.status(413).json({ error: "La captura supera 3 MB" });

    let proofPath: string | null = `${row.id}/${Date.now()}-${crypto.randomBytes(4).toString('hex')}.${img.ext}`;
    const { error: upErr } = await (supabaseAdmin || client).storage.from('payment-proofs').upload(proofPath, img.buffer, { contentType: img.mime, upsert: false });
    if (upErr) proofPath = null;

    const writer = supabaseAdmin || client;
    const payload: any = {
      user_id: user.id, company_id: row.id, business_name: row.name, email: user.email || null,
      plan, amount, payment_method: 'Yape',
      reference: String(req.body?.reference || '').slice(0, 120) || (proofPath ? null : 'Captura no se pudo subir: pedir por WhatsApp'),
      status: 'Pendiente', proof_path: proofPath, period_months: months,
    };
    let { error } = await writer.from("subscription_payments").insert(payload);
    if (error && /period_months/i.test(error.message || '')) {
      delete payload.period_months;
      if (months === 12) payload.reference = `ANUAL ${payload.reference || ''}`.trim();
      ({ error } = await writer.from("subscription_payments").insert(payload));
    }
    if (error && /proof_path/i.test(error.message || '')) {
      delete payload.proof_path;
      if (proofPath) payload.reference = `proof:${proofPath}`;
      ({ error } = await writer.from("subscription_payments").insert(payload));
    }
    if (error) return res.status(500).json({ error: error.message });
    res.json({ ok: true, amount, months, proofUploaded: Boolean(proofPath) });
  });


  // ==========================================================================
  // v4: fidelización (referidos, plan anual, catálogos inactivos, resumen
  // semanal, clientes frecuentes) y métricas de plataforma para SuperAdmin.
  // Todo degrada con elegancia si aún no se corrió v4.sql.
  // ==========================================================================
  const isoWeek = (d = new Date()) => {
    const t = new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()));
    const day = t.getUTCDay() || 7; t.setUTCDate(t.getUTCDate() + 4 - day);
    const y0 = new Date(Date.UTC(t.getUTCFullYear(), 0, 1));
    return `${t.getUTCFullYear()}w${Math.ceil(((t.getTime() - y0.getTime()) / 86400000 + 1) / 7)}`;
  };
  const makeReferralCode = (name: string) =>
    (String(name || 'WOW').normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^A-Za-z]/g, '').toUpperCase().slice(0, 5) || 'WOW')
    + crypto.randomBytes(2).toString('hex').toUpperCase();
  const normPhone = (p: any) => String(p || '').replace(/\D/g, '').replace(/^51(?=9\d{8}$)/, '');
  const escHtml = (v: any) => String(v ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

  const ensureReferralCode = async (row: any) => {
    if (row.referral_code !== undefined && row.referral_code) return row.referral_code;
    if (row.referral_code === undefined) return null; // columna aún no existe (falta v4.sql)
    const w = supabaseAdmin || supabase; if (!w) return null;
    for (let i = 0; i < 3; i++) {
      const code = makeReferralCode(row.name);
      const { error } = await w.from('companies').update({ referral_code: code }).eq('id', row.id).is('referral_code', null);
      if (!error) return code;
    }
    return null;
  };

  // Resumen de la semana de una empresa (sirve para el panel y para el correo).
  const weeklySummaryFor = async (client: any, companyId: string) => {
    const weekAgo = new Date(Date.now() - 7 * 86400000).toISOString();
    const [ev, ord, lastProd] = await Promise.all([
      client.from('catalog_events').select('type').eq('company_id', companyId).gte('created_at', weekAgo).limit(10000),
      client.from('orders').select('total,customer_phone').eq('company_id', companyId).gte('created_at', weekAgo).limit(5000),
      client.from('products').select('created_at').eq('company_id', companyId).order('created_at', { ascending: false }).limit(1),
    ]);
    const events = ev.data || []; const orders = ord.data || [];
    const lastProductAt = lastProd.data?.[0]?.created_at || null;
    return {
      visits: events.filter((e: any) => e.type === 'visit').length,
      whatsappClicks: events.filter((e: any) => e.type === 'whatsapp_click').length,
      orders: orders.length,
      sales: orders.reduce((s: number, o: any) => s + Number(o.total || 0), 0),
      lastProductAt,
      inactive: !lastProductAt || Date.now() - new Date(lastProductAt).getTime() > 7 * 86400000,
    };
  };

  const summaryHtml = (company: any, s: any, inactive: boolean) => `<div style="font-family:sans-serif;max-width:560px;margin:auto;color:#0f172a">
    <h2 style="color:#6d28d9">Tu semana en WowSmart</h2>
    <p>Hola, este es el resumen de <b>${escHtml(company.name)}</b> de los últimos 7 días:</p>
    <table style="width:100%;border-collapse:collapse;font-size:15px">
      <tr><td style="padding:8px;border-bottom:1px solid #e2e8f0">👀 Visitas a tu catálogo</td><td style="text-align:right"><b>${s.visits}</b></td></tr>
      <tr><td style="padding:8px;border-bottom:1px solid #e2e8f0">💬 Clics a tu WhatsApp</td><td style="text-align:right"><b>${s.whatsappClicks}</b></td></tr>
      <tr><td style="padding:8px;border-bottom:1px solid #e2e8f0">🛍️ Pedidos</td><td style="text-align:right"><b>${s.orders}</b></td></tr>
      <tr><td style="padding:8px">💰 Ventas</td><td style="text-align:right"><b>S/ ${s.sales.toFixed(2)}</b></td></tr>
    </table>
    ${inactive ? `<p style="background:#fef3c7;padding:12px;border-radius:8px">💡 Hace más de 7 días que no agregas productos. Los catálogos con novedades reciben más visitas: sube algo nuevo hoy.</p>` : ''}
    <p><a href="${publicBaseUrl}/dashboard" style="background:#6d28d9;color:#fff;padding:12px 20px;border-radius:8px;text-decoration:none;font-weight:bold">Ir a mi panel</a></p>
    <p style="color:#64748b;font-size:12px">Equipo WowSmart · Recibes este correo porque tienes un catálogo en WowSmart.</p></div>`;

  // Tarea periódica: cada 6 h revisa catálogos inactivos y, los lunes, envía el resumen semanal.
  // Se registra en company_notices (UNIQUE company_id+kind) para no repetir nunca un aviso.
  const runLoyaltyJob = async () => {
    const w = supabaseAdmin; if (!w || !useSupabaseDb) return;
    try {
      const { data: companies } = await w.from('companies').select('id,name,user_id,created_at,weekly_summary_opt_out').limit(2000);
      const week = isoWeek(); const isMonday = new Date().getDay() === 1;
      for (const c of companies || []) {
        if (!c.created_at || Date.now() - new Date(c.created_at).getTime() < 2 * 86400000) continue;
        const s = await weeklySummaryFor(w, c.id);
        const kinds: string[] = [];
        if (s.inactive) kinds.push(`inactive_${week}`);
        if (isMonday && !c.weekly_summary_opt_out) kinds.push(`weekly_${week}`);
        for (const kind of kinds) {
          const { error } = await w.from('company_notices').insert({ company_id: c.id, kind, channel: resend ? 'email' : 'panel' });
          if (error) continue; // ya registrado o tabla inexistente
          if (!resend || !c.user_id) continue;
          try {
            const { data: u } = await w.auth.admin.getUserById(c.user_id);
            const email = u?.user?.email; if (!email) continue;
            const weekly = kind.startsWith('weekly_');
            await resend.emails.send({
              from: MAIL_FROM, to: [email],
              subject: weekly ? `Tu resumen semanal — ${c.name}` : `${c.name}: tu catálogo te extraña 👋`,
              html: summaryHtml(c, s, s.inactive),
            });
          } catch { /* el aviso queda en el panel */ }
        }
      }
    } catch (e) { console.error('loyalty job', e); }
  };
  if (process.env.NODE_ENV === 'production' && process.env.DISABLE_LOYALTY_JOB !== 'true') {
    setTimeout(runLoyaltyJob, 60 * 1000);
    setInterval(runLoyaltyJob, 6 * 60 * 60 * 1000).unref?.();
  }

  // ==========================================================================
  // v5: Fidelización (puntos, niveles, premios, cupones, retos). Ver server/loyalty.ts
  // ==========================================================================
  const loyaltyMock = !isProduction && process.env.LOYALTY_MOCK === '1';
  const memStore = memoryStore();
  const loyaltyAllowedPlans = () => (process.env.LOYALTY_PLANS || DEFAULT_PLANS.join(',')).split(',').map(x => x.trim()).filter(Boolean);
  const memCompany = (c: any) => c && ({ id: String(c.id), name: c.name, slug: c.slug, plan: loyaltyMock ? (process.env.LOYALTY_MOCK_PLAN || 'Negocio Pequeño') : c.plan, status: c.subscriptionStatus || 'Activa', logo: c.logo, color: c.color });
  const sbCompany = (c: any) => c && ({ id: c.id, name: c.name, slug: c.slug, plan: c.plan, status: computeSubscriptionStatus(c.subscription_status, c.subscription_ends_at), logo: c.logo, color: c.color });
  const loyaltyCompanyCols = 'id,name,slug,plan,subscription_status,subscription_ends_at,logo,color';
  const toSnakeOrder = (o: any) => o && ({ id: String(o.id), company_id: String(o.companyId), total: o.total, subtotal: o.subtotal, discount: o.discount, status: o.status,
    order_code: o.order_code, loyalty_phone: o.loyalty_phone, loyalty_status: o.loyalty_status, reward_id: o.reward_id, reward_points: o.reward_points, created_at: o.createdAt });
  let geoPointsHook: ((cid: string, cu: any) => void) | null = null;
  const loyalty = createLoyalty({
    onPointsChange: (cid, cu) => geoPointsHook?.(cid, cu),
    store: () => (useSupabaseDb ? (supabaseAdmin ? supabaseStore(supabaseAdmin) : null) : memStore),
    allowedPlans: loyaltyAllowedPlans,
    getOwner: async (req) => {
      if (!useSupabaseDb) return loyaltyMock ? memCompany(db.companies[0]) : null;
      const { row } = await getOwnedCompanyRow(req); return sbCompany(row);
    },
    companyBySlug: async (slug) => {
      if (!useSupabaseDb) return memCompany(db.companies.find((c: any) => c.slug === slug));
      if (!supabaseAdmin) return null;
      const { data } = await supabaseAdmin.from('companies').select(loyaltyCompanyCols).eq('slug', slug).maybeSingle(); return sbCompany(data);
    },
    companyById: async (id) => {
      if (!useSupabaseDb) return memCompany(db.companies.find((c: any) => String(c.id) === String(id)));
      if (!supabaseAdmin || !/^[0-9a-f-]{36}$/i.test(id)) return null;
      const { data } = await supabaseAdmin.from('companies').select(loyaltyCompanyCols).eq('id', id).maybeSingle(); return sbCompany(data);
    },
    getOrder: async (id) => {
      if (!useSupabaseDb) return toSnakeOrder(db.orders.find((o: any) => String(o.id) === String(id)));
      if (!supabaseAdmin) return null;
      const { data } = await supabaseAdmin.from('orders').select('*').eq('id', id).maybeSingle(); return data;
    },
    setOrder: async (id, patch) => {
      if (!useSupabaseDb) { const o: any = db.orders.find((x: any) => String(x.id) === String(id)); if (o) Object.assign(o, patch); return; }
      await supabaseAdmin?.from('orders').update(patch).eq('id', id);
    },
    lastOrderFor: async (companyId, phone) => {
      if (!useSupabaseDb) return toSnakeOrder(db.orders.find((o: any) => String(o.companyId) === companyId && o.loyalty_phone === phone));
      if (!supabaseAdmin) return null;
      const { data } = await supabaseAdmin.from('orders').select('order_code,created_at').eq('company_id', companyId).eq('loyalty_phone', phone)
        .order('created_at', { ascending: false }).limit(1).maybeSingle(); return data;
    },
    track: async (companyId, type) => {
      if (!useSupabaseDb) { (memStore.data.catalog_events ||= []).push({ company_id: companyId, type, created_at: new Date().toISOString() }); return; }
      try { await supabaseAdmin?.from('catalog_events').insert({ company_id: companyId, type }); } catch {}
    },
  });
  loyalty.register(app, rateLimit);

  // v6: Google Wallet + tiendas físicas + "Oferta cerca de tienda" + Web Push. Ver server/geo.ts
  const walletMock = !isProduction && process.env.WALLET_MOCK === '1';
  const wallet = createWallet({ issuerId: process.env.GOOGLE_WALLET_ISSUER_ID, saJsonB64: process.env.GOOGLE_WALLET_SA_JSON,
    baseUrl: (process.env.PUBLIC_BASE_URL || 'https://wow-smart.com').replace(/\/$/, ''), mock: walletMock });
  const geo = createGeo({
    store: () => (useSupabaseDb ? (supabaseAdmin ? supabaseStore(supabaseAdmin) : null) : memStore),
    wallet,
    getOwner: async (req) => { if (!useSupabaseDb) return loyaltyMock ? memCompany(db.companies[0]) : null; const { row } = await getOwnedCompanyRow(req); return sbCompany(row); },
    companyBySlug: async (slug) => {
      if (!useSupabaseDb) return memCompany(db.companies.find((c: any) => c.slug === slug));
      if (!supabaseAdmin) return null;
      const { data } = await supabaseAdmin.from('companies').select(loyaltyCompanyCols).eq('slug', slug).maybeSingle(); return sbCompany(data);
    },
    companyById: async (id) => {
      if (!useSupabaseDb) return memCompany(db.companies.find((c: any) => String(c.id) === String(id)));
      if (!supabaseAdmin) return null;
      const { data } = await supabaseAdmin.from('companies').select(loyaltyCompanyCols).eq('id', id).maybeSingle(); return sbCompany(data);
    },
    loyalty,
    tierName: async (cid, lifetime) => tierInfo(lifetime, sanitizeTiers((await loyalty.settingsOf(cid)).tiers)).tier.name,
    track: async (companyId, type) => {
      if (!useSupabaseDb) { (memStore.data.catalog_events ||= []).push({ company_id: companyId, type, created_at: new Date().toISOString() }); return; }
      try { await supabaseAdmin?.from('catalog_events').insert({ company_id: companyId, type }); } catch {}
    },
    vapid: { publicKey: process.env.VAPID_PUBLIC_KEY, privateKey: process.env.VAPID_PRIVATE_KEY, subject: process.env.VAPID_SUBJECT },
    pushMock: !isProduction && process.env.PUSH_MOCK === '1',
  });
  geoPointsHook = geo.onPointsChange;
  geo.register(app, rateLimit);
  if (walletMock) app.get('/api/dev/wallet-calls', (_req, res) => res.json({ calls: wallet.calls, push: geo.pushSent }));
  if (process.env.NODE_ENV === 'production' && process.env.DISABLE_LOYALTY_JOB !== 'true') {
    setTimeout(loyalty.runAutoCoupons, 90 * 1000);
    setInterval(loyalty.runAutoCoupons, 6 * 60 * 60 * 1000).unref?.();
  }
  if (loyaltyMock) {
    // Datos simulados SOLO para pruebas locales (nunca en producción ni en Supabase).
    (async () => {
      const cid = String(db.companies[0].id);
      const s = memStore;
      await s.ins('loyalty_settings', { company_id: cid, enabled: true, points_per_sol: 1, tiers: [{ name: 'Bronce', min: 0, benefitPct: 0 }, { name: 'Plata', min: 300, benefitPct: 5 }, { name: 'Oro', min: 1000, benefitPct: 10 }],
        birthday_coupon: { enabled: true, discountType: 'percentage', value: 15, validDays: 15 }, winback: { enabled: true, days: 30, discountType: 'percentage', value: 10, validDays: 10 } });
      const names = [['987654321', 'María Quispe', 1240, 1460, 14], ['912345678', 'José Huamán', 420, 610, 6], ['955111222', 'Rosa Mamani', 180, 180, 2], ['944333555', 'Luis Torres', 40, 90, 1]];
      for (const [phone, name, points, lifetime, n] of names) await s.ins('loyalty_customers', { company_id: cid, phone, name, points, lifetime_points: lifetime, orders_count: n, last_purchase_at: new Date(Date.now() - (n as number) * 3 * 86400000).toISOString(), birthday: null });
      for (const [name, cost, type, value] of [['10% de descuento', 200, 'discount', 10], ['Lapicero premium gratis', 350, 'product', 0], ['S/ 30 de descuento', 800, 'discount', 30]]) await s.ins('loyalty_rewards', { company_id: cid, name, points_cost: cost, type, value, active: true });
      await s.ins('loyalty_coupons', { company_id: cid, code: 'BIENVENIDO10', discount_type: 'percentage', value: 10, expires_at: '2026-12-31', usage_limit: 100, used_count: 7, auto: null, customer_id: null, active: true });
      await s.ins('loyalty_challenges', { company_id: cid, name: '3 compras en el mes', kind: 'orders_month', target: 3, reward_points: 100, active: true });
      await s.ins('loyalty_challenges', { company_id: cid, name: 'Racha de 4 semanas', kind: 'streak_weeks', target: 4, reward_points: 150, reward_coupon_value: 15, reward_coupon_type: 'percentage', active: true });
      const m = s.data.loyalty_customers[0];
      for (let i = 0; i < 2; i++) await s.ins('loyalty_transactions', { company_id: cid, customer_id: m.id, delta: 120, reason: 'compra', order_id: `mock-${i}` });
      db.orders.unshift({ id: 'mock-order-1', companyId: cid, customerName: 'María Quispe', customerPhone: '987654321', total: 118, subtotal: 100, discount: 0, status: 'Entregado', createdAt: new Date().toISOString(), order_code: 'WS7K2Q', loyalty_phone: '987654321', loyalty_status: 'otorgado' } as any);
    })();
  }

  // Panel del dueño: fidelización (código de referido, resumen, inactividad, clientes frecuentes).
  app.get('/api/loyalty/me', async (req, res) => {
    const { user, client, row } = await getOwnedCompanyRow(req);
    if (!user) return res.status(401).json({ error: 'Unauthorized' });
    if (!client || !row) return res.status(404).json({ error: 'Company not found' });
    const code = await ensureReferralCode(row);
    const w = supabaseAdmin || client;
    const [summary, refs, ordersRes] = await Promise.all([
      weeklySummaryFor(client, row.id),
      w.from('referrals').select('id,status,created_at,referred_company_id').eq('referrer_company_id', row.id).order('created_at', { ascending: false }),
      client.from('orders').select('customer_name,customer_phone,total,created_at,frequent_opt_in').eq('company_id', row.id).order('created_at', { ascending: false }).limit(3000),
    ]);
    let orders: any[] = ordersRes.data || [];
    if (ordersRes.error) { // columna frequent_opt_in aún no existe
      const r2 = await client.from('orders').select('customer_name,customer_phone,total,created_at').eq('company_id', row.id).order('created_at', { ascending: false }).limit(3000);
      orders = r2.data || [];
    }
    const byPhone: Record<string, any> = {};
    for (const o of orders) {
      const p = normPhone(o.customer_phone); if (p.length < 7) continue;
      const k = byPhone[p] ||= { phone: p, name: o.customer_name, orders: 0, total: 0, lastAt: o.created_at, optIn: false };
      k.orders++; k.total += Number(o.total || 0); if (o.frequent_opt_in) k.optIn = true;
    }
    const customers = Object.values(byPhone).sort((a: any, b: any) => b.orders - a.orders || b.total - a.total);
    const repeat = customers.filter((c: any) => c.orders >= 2);
    res.json({
      referral: refs.error ? { available: false } : {
        available: Boolean(code), code, link: code ? `${publicBaseUrl}/auth?mode=register&ref=${code}` : null,
        total: (refs.data || []).length,
        pending: (refs.data || []).filter((r: any) => r.status === 'pendiente' || r.status === 'calificado').length,
        rewarded: (refs.data || []).filter((r: any) => r.status === 'aprobado').length,
      },
      summary, weeklyOptOut: Boolean(row.weekly_summary_opt_out), emailEnabled: Boolean(resend),
      annualDiscountPct: ANNUAL_DISCOUNT_PCT,
      customers: {
        total: customers.length, repeatCount: repeat.length,
        repeatRate: customers.length ? Math.round((repeat.length / customers.length) * 100) : 0,
        top: repeat.slice(0, 20),
      },
    });
  });
  app.post('/api/loyalty/weekly-summary', async (req, res) => {
    const { user, row } = await getOwnedCompanyRow(req);
    if (!user || !row) return res.status(401).json({ error: 'Unauthorized' });
    const w = supabaseAdmin; if (!w) return res.status(503).json({ error: 'No disponible' });
    const { error } = await w.from('companies').update({ weekly_summary_opt_out: !req.body?.enabled }).eq('id', row.id);
    if (error) return res.status(500).json({ error: 'Falta actualizar la base (v4.sql)' });
    res.json({ ok: true });
  });

  // ---- SuperAdmin: referidos (el premio se da SOLO cuando el superadmin aprueba) ----
  const extendCompany = async (w: any, companyId: string, days: number) => {
    const { data: c } = await w.from('companies').select('subscription_ends_at').eq('id', companyId).maybeSingle();
    const base = c?.subscription_ends_at && new Date(c.subscription_ends_at) > new Date() ? new Date(c.subscription_ends_at) : new Date();
    base.setDate(base.getDate() + days);
    await w.from('companies').update({ subscription_ends_at: base.toISOString().split('T')[0] }).eq('id', companyId);
    return base.toISOString().split('T')[0];
  };
  app.get('/api/superadmin/referidos', requireSuperAdmin, async (_req, res) => {
    const w = supabaseAdmin || supabase; if (!w) return res.status(503).json({ error: 'Supabase is not configured' });
    const { data, error } = await w.from('referrals').select('*').order('created_at', { ascending: false }).limit(500);
    if (error) return res.json({ available: false, items: [] });
    const ids = Array.from(new Set((data || []).flatMap((r: any) => [r.referrer_company_id, r.referred_company_id])));
    const { data: cs } = ids.length ? await w.from('companies').select('id,name').in('id', ids) : { data: [] as any[] };
    const nm = Object.fromEntries((cs || []).map((c: any) => [c.id, c.name]));
    res.json({ available: true, items: (data || []).map((r: any) => ({ ...r, referrerName: nm[r.referrer_company_id] || '—', referredName: nm[r.referred_company_id] || '—' })) });
  });
  app.post('/api/superadmin/referidos/:id/:accion', requireSuperAdmin, async (req, res) => {
    const w = supabaseAdmin || supabase; if (!w) return res.status(503).json({ error: 'Supabase is not configured' });
    const accion = req.params.accion;
    if (!['aprobar', 'rechazar'].includes(accion)) return res.status(400).json({ error: 'Acción inválida' });
    const { data: r } = await w.from('referrals').select('*').eq('id', req.params.id).maybeSingle();
    if (!r) return res.status(404).json({ error: 'Referido no encontrado' });
    if (r.status === 'aprobado' || r.status === 'rechazado') return res.status(409).json({ error: 'Ya fue revisado' });
    if (accion === 'aprobar') {
      const a = await extendCompany(w, r.referrer_company_id, 30);
      const b = await extendCompany(w, r.referred_company_id, 30);
      await w.from('referrals').update({ status: 'aprobado', reviewed_at: new Date().toISOString() }).eq('id', r.id);
      await logSuperAdminAction('APROBAR_REFERIDO', 'referral', r.id, r.code, `+1 mes gratis para ambos (vencen ${a} y ${b}).`);
    } else {
      await w.from('referrals').update({ status: 'rechazado', reviewed_at: new Date().toISOString() }).eq('id', r.id);
      await logSuperAdminAction('RECHAZAR_REFERIDO', 'referral', r.id, r.code, 'Referido rechazado.');
    }
    res.json({ ok: true });
  });

  // ---- SuperAdmin: métricas de la plataforma ----
  app.get('/api/superadmin/metricas', requireSuperAdmin, async (req, res) => {
    const w = supabaseAdmin || supabase; if (!w) return res.status(503).json({ error: 'Supabase is not configured' });
    const days = Math.min(365, Math.max(7, Number(req.query.dias) || 30));
    const since = new Date(Date.now() - days * 86400000).toISOString();
    const [cRes, pRes, eRes, oRes, prodRes, payRes] = await Promise.all([
      w.from('companies').select('id,name,plan,subscription_status,subscription_ends_at,created_at,whatsapp').limit(5000),
      w.from('subscription_payments').select('company_id,amount,status,created_at,plan').limit(10000),
      w.from('catalog_events').select('company_id,type,created_at').gte('created_at', since).limit(50000),
      w.from('orders').select('company_id,total,created_at,type').gte('created_at', since).limit(50000),
      w.from('products').select('company_id').limit(50000),
      w.from('subscription_payments').select('id', { count: 'exact', head: true }).eq('status', 'Pendiente'),
    ]);
    const companies = cRes.data || []; const pays = pRes.data || []; const events = eRes.data || []; const orders = oRes.data || [];
    const withProducts = new Set((prodRes.data || []).map((p: any) => p.company_id));
    const approved = pays.filter((p: any) => p.status === 'Aprobado');
    const paying = new Set(approved.map((p: any) => p.company_id));
    const states = companies.map((c: any) => computeSubscriptionStatus(c.subscription_status, c.subscription_ends_at));
    const signups = companies.filter((c: any) => c.created_at >= since).length;
    const activated = companies.filter((c: any) => withProducts.has(c.id) && isValidWhatsapp(c.whatsapp));
    const everPaying = companies.filter((c: any) => paying.has(c.id));
    const activePaying = companies.filter((c: any, i: number) => paying.has(c.id) && states[i] === 'Activa');
    const churned = everPaying.filter((c: any) => !activePaying.includes(c));
    const mrr = activePaying.reduce((s: number, c: any) => s + (SUBSCRIPTION_PLAN_PRICES[c.plan] || 0), 0);
    // Serie diaria
    const series: Record<string, any> = {};
    for (let i = days - 1; i >= 0; i--) { const d = new Date(Date.now() - i * 86400000).toISOString().slice(0, 10); series[d] = { fecha: d, registros: 0, visitas: 0, whatsapp: 0, pedidos: 0 }; }
    companies.forEach((c: any) => { const d = String(c.created_at || '').slice(0, 10); if (series[d]) series[d].registros++; });
    events.forEach((e: any) => { const d = String(e.created_at).slice(0, 10); if (!series[d]) return; if (e.type === 'visit') series[d].visitas++; if (e.type === 'whatsapp_click') series[d].whatsapp++; });
    orders.forEach((o: any) => { const d = String(o.created_at).slice(0, 10); if (series[d]) series[d].pedidos++; });
    // Ranking de catálogos
    const rank: Record<string, any> = {};
    companies.forEach((c: any) => { rank[c.id] = { id: c.id, nombre: c.name, visitas: 0, whatsapp: 0, pedidos: 0 }; });
    events.forEach((e: any) => { const r = rank[e.company_id]; if (!r) return; if (e.type === 'visit') r.visitas++; if (e.type === 'whatsapp_click') r.whatsapp++; });
    orders.forEach((o: any) => { const r = rank[o.company_id]; if (r) r.pedidos++; });
    const pct = (a: number, b: number) => b ? Math.round((a / b) * 1000) / 10 : 0;
    // v5: adopción de fidelización
    let fidelizacion: any = { disponible: false };
    try {
      const [ls, lc] = await Promise.all([
        w.from('loyalty_settings').select('company_id,enabled'),
        w.from('loyalty_customers').select('company_id', { count: 'exact', head: true }),
      ]);
      if (!ls.error) {
        const enabledIds = new Set((ls.data || []).filter((x: any) => x.enabled).map((x: any) => x.company_id));
        const lt = (t: string) => events.filter((e: any) => e.type === t).length;
        fidelizacion = { disponible: true, empresasActivas: enabledIds.size, adopcion: pct(enabledIds.size, companies.length), miembros: lc.count || 0,
          uniones: lt('loyalty_join'), puntosOtorgados: lt('points_earned'), canjes: lt('reward_redeemed'), cupones: lt('coupon_applied'), retos: lt('challenge_completed') };
      }
    } catch {}
    res.json({
      fidelizacion,
      dias: days,
      totalEmpresas: companies.length,
      registros: signups,
      activadas: activated.length,
      tasaActivacion: pct(activated.length, companies.length),
      enPrueba: states.filter((s: string) => s === 'Prueba Gratuita').length,
      pagadoras: activePaying.length,
      conversionPruebaPago: pct(everPaying.length, companies.length),
      mrr, arr: mrr * 12,
      churn: pct(churned.length, everPaying.length),
      bajas: churned.length,
      visitas: events.filter((e: any) => e.type === 'visit').length,
      clicsWhatsapp: events.filter((e: any) => e.type === 'whatsapp_click').length,
      compartidos: events.filter((e: any) => e.type === 'share').length,
      pedidos: orders.length,
      ventasCatalogos: orders.reduce((s: number, o: any) => s + Number(o.total || 0), 0),
      ingresosAprobados: approved.filter((p: any) => p.created_at >= since).reduce((s: number, p: any) => s + Number(p.amount || 0), 0),
      pagosPendientes: payRes.count || 0,
      metricasDisponibles: !eRes.error,
      serie: Object.values(series),
      topCatalogos: Object.values(rank).sort((a: any, b: any) => b.visitas - a.visitas || b.pedidos - a.pedidos).slice(0, 10),
    });
  });

  app.get("/api/companies", (req, res) => {
    res.json(db.companies);
  });

  // Get company by slug
  app.get("/api/catalog/:slug", async (req, res) => {
    if (useSupabaseDb) {
      const client = getRequestSupabase(req);
      if (!client) return res.status(503).json({ error: "Supabase is not configured" });

      // Esta ruta es pública (visitantes sin cuenta), así que usamos las
      // vistas *_public que excluyen datos sensibles (cuenta bancaria,
      // estado de suscripción, costo/margen de productos).
      const { data: companyRow, error: companyError } = await client
        .from("companies_public")
        .select("*")
        .eq("slug", req.params.slug)
        .single();

      if (companyError || !companyRow) {
        return res.status(404).json({ error: "Catalog not found" });
      }

      const { data: productRows, error: productsError } = await client
        .from("products_public")
        .select("*")
        .eq("company_id", companyRow.id)
        .order("created_at", { ascending: false });

      if (productsError) {
        return res.status(500).json({ error: productsError.message });
      }

      return res.json({
        company: toCompany(companyRow),
        products: (productRows || []).map(toProduct),
      });
    }

    const company = db.companies.find(c => c.slug === req.params.slug);
    if (!company) {
      return res.status(404).json({ error: "Catalog not found" });
    }
    const products = db.products.filter(p => p.companyId === company.id);
    res.json({ company, products });
  });

  
  app.post("/api/onboarding", async (req, res) => {
    let user = (req as any).user;
    if (!user) return res.status(401).json({ error: "Unauthorized" });

    const { name, whatsapp, rubro, useTemplate } = req.body || {};
    const cleanName = String(name || '').trim().slice(0, 80);
    if (!cleanName) return res.status(400).json({ error: "Escribe el nombre de tu negocio" });
    if (!isValidWhatsapp(whatsapp)) {
      return res.status(400).json({ error: "Ingresa un WhatsApp válido (ej. 987 654 321). Es por donde te llegarán los pedidos.", code: "WHATSAPP_REQUIRED" });
    }
    const template = (RUBRO_TEMPLATES as any)[rubro] || null;

    // Todos los registros reciben 15 días de prueba calculados desde hoy.
    const trialDays = 15;
    const endsAt = new Date();
    endsAt.setDate(endsAt.getDate() + trialDays);
    const baseSlug = cleanName.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, '') || 'mi-negocio';

    const company: any = {
      id: Date.now().toString(),
      userId: user.id,
      name: cleanName,
      slug: baseSlug + "-" + Date.now(),
      // Keep billing plan compatible with DB CHECK constraint (companies_plan_check).
      plan: "Emprendedor",
      subscriptionStatus: "Prueba Gratuita",
      subscriptionEndsAt: endsAt.toISOString().split('T')[0],
      businessType: template?.businessType || "Tienda",
      color: "#6d28d9",
      whatsapp: normalizeWhatsapp(whatsapp),
      description: `Bienvenido a ${cleanName}. Elige tus productos y haz tu pedido por WhatsApp en segundos.`,
      storeHoursType: "24h",
      logo: "",
      banner: "",
      instagram: "",
      facebook: "",
    };

    const templateProducts = template && useTemplate !== false ? template.products : [];

    if (useSupabaseDb) {
      const client = supabaseAdmin || getRequestSupabase(req);
      if (!client) return res.status(503).json({ error: "Supabase is not configured" });

      let { data, error } = await client
        .from("companies")
        .insert(stripUndefined(fromCompany(company)))
        .select("*")
        .single();
      // Si la base rechaza el rubro (CHECK), reintenta con el valor por defecto.
      if (error && /business_type|check/i.test(error.message || '')) {
        ({ data, error } = await client.from("companies").insert(stripUndefined(fromCompany({ ...company, businessType: "Restaurante" }))).select("*").single());
      }
      if (error) return res.status(500).json({ error: error.message });

      if (templateProducts.length) {
        const rows = templateProducts.map((p: any) => stripUndefined(fromProduct(normalizeProductPayload({ ...p, companyId: data.id, itemType: 'Producto', stock: null }))));
        const { error: pErr } = await client.from("products").insert(rows);
        if (pErr) console.warn("[onboarding] No se pudieron crear productos de ejemplo:", pErr.message);
      }
      // Referidos: si llegó con un código válido, se registra (el premio lo aprueba el superadmin).
      const refCode = String(req.body?.referralCode || '').trim().toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 16);
      if (refCode && supabaseAdmin) {
        try {
          const { data: referrer } = await supabaseAdmin.from('companies').select('id,user_id').eq('referral_code', refCode).maybeSingle();
          if (referrer && referrer.id !== data.id && referrer.user_id !== user.id) {
            await supabaseAdmin.from('companies').update({ referred_by: referrer.id }).eq('id', data.id);
            await supabaseAdmin.from('referrals').insert({ referrer_company_id: referrer.id, referred_company_id: data.id, code: refCode, status: 'pendiente' });
          }
        } catch (e) { console.warn('[onboarding] referido no registrado'); }
      }
      return res.json(toCompany(data));
    }

    db.companies.push(company as any);
    templateProducts.forEach((p: any, i: number) => db.products.push({ id: `${Date.now()}${i}`, companyId: company.id, ...p }));
    res.json(company);
  });

  // Get dashboard data for user
  app.get("/api/dashboard/:userId", async (req, res) => {
    let user = (req as any).user;
    let userId = user ? user.id : req.params.userId;

    if (useSupabaseDb) {
      const client = getRequestSupabase(req);
      if (!client) return res.status(503).json({ error: "Supabase is not configured" });

      const { data: companyRow, error: companyError } = await client
        .from("companies")
        .select("*")
        .eq("user_id", userId)
        .single();

      if (companyError || !companyRow) {
        return res.status(404).json({ error: "Company not found" });
      }

      const company = toCompany(companyRow);
      const companyId = company.id;

      const [
        productsResult,
        ordersResult,
        expensesResult,
        customersResult,
        debtsResult,
        debtPaymentsResult,
        ingredientsResult,
        inventoryMovementsResult,
        crmDealsResult,
        auditLogsResult,
        systemUsersResult,
      ] = await Promise.all([
        client.from("products").select("*").eq("company_id", companyId),
        client.from("orders").select("*").eq("company_id", companyId),
        client.from("expenses").select("*").eq("company_id", companyId),
        client.from("customers").select("*").eq("company_id", companyId),
        client.from("debts").select("*").eq("company_id", companyId),
        client.from("debt_payments").select("*"),
        client.from("ingredients").select("*").eq("company_id", companyId),
        client.from("inventory_movements").select("*").eq("company_id", companyId),
        client.from("crm_deals").select("*").eq("company_id", companyId),
        client.from("audit_logs").select("*").eq("company_id", companyId),
        client.from("system_users").select("*").eq("company_id", companyId),
      ]);

      const firstError = [
        productsResult.error,
        ordersResult.error,
        expensesResult.error,
        customersResult.error,
        debtsResult.error,
        debtPaymentsResult.error,
        ingredientsResult.error,
        inventoryMovementsResult.error,
        crmDealsResult.error,
        auditLogsResult.error,
        systemUsersResult.error,
      ].find(Boolean);

      if (firstError) return res.status(500).json({ error: firstError.message });

      const products = (productsResult.data || []).map(toProduct);
      const orders = (ordersResult.data || []).map(toOrder);
      const expenses = expensesResult.data || [];
      const customers = (customersResult.data || []).map(toCustomer);
      const debts = debtsResult.data || [];
      const debtIds = new Set(debts.map((debt: any) => debt.id));
      const debtPayments = (debtPaymentsResult.data || []).filter((payment: any) => debtIds.has(payment.debt_id));
      const ingredients = ingredientsResult.data || [];
      const inventoryMovements = inventoryMovementsResult.data || [];
      const crmDeals = crmDealsResult.data || [];
      const auditLogs = auditLogsResult.data || [];
      const systemUsers = systemUsersResult.data || [];
      const backups: any[] = [];

      const completedOrders = orders.filter((o: any) => o.status !== 'Pendiente');
      const totalRevenue = completedOrders.reduce((sum: number, o: any) => sum + (o.total || 0), 0);
      const totalExpenses = expenses.reduce((sum: number, e: any) => sum + (Number(e.amount) || 0), 0);
      const totalOrdersCount = orders.length;
      const avgTicket = completedOrders.length > 0 ? totalRevenue / completedOrders.length : 0;
      const today = new Date().toISOString().split('T')[0];
      const todayOrders = completedOrders.filter((o: any) => new Date(o.createdAt).toISOString().split('T')[0] === today);
      const todayExpenses = expenses.filter((e: any) => e.date === today);
      const todayRevenue = todayOrders.reduce((sum: number, o: any) => sum + (o.total || 0), 0);
      const todayExpenseTotal = todayExpenses.reduce((sum: number, e: any) => sum + (Number(e.amount) || 0), 0);
      const productSales: Record<string, any> = {};

      completedOrders.forEach((o: any) => {
        (o.items || []).forEach((item: any) => {
          if (!productSales[item.productId]) {
            productSales[item.productId] = { name: item.name, qty: 0, revenue: 0 };
          }
          productSales[item.productId].qty += item.qty;
          productSales[item.productId].revenue += item.price * item.qty;
        });
      });

      const analytics = {
        totalRevenue,
        totalExpenses,
        totalProfit: totalRevenue - totalExpenses,
        todayRevenue,
        todayExpenseTotal,
        todayProfit: todayRevenue - todayExpenseTotal,
        totalOrdersCount,
        avgTicket,
        topProducts: Object.values(productSales).sort((a: any, b: any) => b.qty - a.qty).slice(0, 5),
        revenueData: [],
        productSales,
      };

      const inventoryAnalytics = {
        totalStockValue: products.reduce((sum: number, p: any) => sum + ((p.stock || 0) * (p.price || 0)), 0),
        totalStockCount: products.reduce((sum: number, p: any) => sum + (p.stock || 0), 0),
        lowStockItems: products.filter((p: any) => typeof p.stock === 'number' && p.stock <= (p.minStock ?? 5)),
        outOfStockItems: products.filter((p: any) => p.stock === 0),
        lowStockIngredients: ingredients.filter((i: any) => Number(i.stock || 0) <= Number(i.min_stock || 5)),
        salesRankings: products.map((p: any) => ({
          ...p,
          soldQty: productSales[p.id]?.qty || 0,
          revenue: productSales[p.id]?.revenue || 0,
        })).sort((a: any, b: any) => b.soldQty - a.soldQty),
      };

      return res.json({
        company,
        analytics,
        inventoryAnalytics,
        expenses,
        debts,
        debtPayments,
        ingredients,
        inventoryMovements,
        crmDeals,
        auditLogs,
        systemUsers,
        backups,
      });
    }

    let company = db.companies.find(c => c.userId === userId);
    
    // If not found and we are authenticated, auto-assign the first company to this new user for demo purposes, or create a mock one.
    if (!company && user) {
      if (db.companies.length > 0 && db.companies[0].userId === "1") {
        db.companies[0].userId = user.id; // Map mock company to real auth user
        company = db.companies[0];
      } else {
         company = {
          id: Date.now().toString(),
          userId: user.id,
          name: "Mi Nueva Empresa",
          slug: "mi-empresa-" + Date.now(),
          plan: "pro",
          subscriptionStatus: "Activa",
          subscriptionEndsAt: "2026-08-15",
          businessType: "Restaurante",
          color: "#8b5cf6",
          whatsapp: "",
          logo: "",
          banner: "",
          instagram: "",
          facebook: "",
           // currency
        } as any;
        db.companies.push(company as any);
      }
    }

    if (!company) {
      return res.status(404).json({ error: "Company not found" });
    }
    const products = db.products.filter(p => p.companyId === company.id);
    const orders = db.orders.filter(o => o.companyId === company.id);
    const expenses = db.expenses.filter(e => e.companyId === company.id);
    const customers = db.customers.filter(c => c.companyId === company.id);
    const debts = db.debts.filter(d => d.companyId === company.id);
    const debtPayments = db.debtPayments.filter(d => db.debts.find(db_debt => db_debt.id === d.debtId && db_debt.companyId === company.id));
    const ingredients = db.ingredients.filter(i => i.companyId === company.id);
    const inventoryMovements = db.inventoryMovements.filter(i => i.companyId === company.id);
    const crmDeals = db.crmDeals.filter(c => c.companyId === company.id);
    const auditLogs = db.auditLogs.filter(a => a.companyId === company.id);
    const systemUsers = db.systemUsers.filter(u => u.companyId === company.id);
    const backups = db.backups.filter(b => b.companyId === company.id);
    const suppliers = db.suppliers.filter(s => s.companyId === company.id);
    const purchaseOrders = db.purchaseOrders.filter(p => p.companyId === company.id);
    const batches = db.batches.filter(b => b.companyId === company.id);
    
    const completedOrders = orders.filter(o => o.status !== 'Pendiente');
    const totalRevenue = completedOrders.reduce((sum, o) => sum + (o.total || 0), 0);
    const totalExpenses = expenses.reduce((sum, e) => sum + (Number(e.amount) || 0), 0);
    const totalOrdersCount = orders.length;
    const avgTicket = completedOrders.length > 0 ? totalRevenue / completedOrders.length : 0;
    
    const today = new Date().toISOString().split('T')[0];
    const todayOrders = completedOrders.filter(o => new Date(o.createdAt).toISOString().split('T')[0] === today);
    const todayExpenses = expenses.filter(e => e.date === today);
    
    const todayRevenue = todayOrders.reduce((sum, o) => sum + (o.total || 0), 0);
    const todayExpenseTotal = todayExpenses.reduce((sum, e) => sum + (Number(e.amount) || 0), 0);
    const todayProfit = todayRevenue - todayExpenseTotal;
    const totalProfit = totalRevenue - totalExpenses;
    
    const productSales = {};
    completedOrders.forEach(o => {
      (o.items || []).forEach(item => {
        if (!productSales[item.productId]) {
          productSales[item.productId] = { name: item.name, qty: 0, revenue: 0 };
        }
        productSales[item.productId].qty += item.qty;
        productSales[item.productId].revenue += item.price * item.qty;
      });
    });
    
    const topProducts = Object.values(productSales)
      .sort((a: any, b: any) => b.qty - a.qty)
      .slice(0, 5);
      
    const revenueByDay = {};
    completedOrders.forEach(o => {
      const date = new Date(o.createdAt).toLocaleDateString();
      if (!revenueByDay[date]) revenueByDay[date] = 0;
      revenueByDay[date] += (o.total || 0);
    });
    
    const revenueData = Object.entries(revenueByDay).map(([date, revenue]) => ({
      date,
      revenue
    }));
    
    const analytics = {
      totalRevenue, totalExpenses, totalProfit,
      todayRevenue, todayExpenseTotal, todayProfit,
      totalOrdersCount, avgTicket, topProducts, revenueData, productSales
    };
    
    // Inventory analytics
    let totalStockValue = 0;
    let totalStockCount = 0;
    const lowStockThreshold = 5;
    const lowStockItems = [];
    const lowStockIngredients = [];
    const outOfStockItems = [];
    
    products.forEach(p => {
      const stock = p.stock || 0;
      totalStockCount += stock;
      totalStockValue += (stock * (p.price || 0));
      const threshold = p.minStock !== undefined ? p.minStock : lowStockThreshold;
      if (stock === 0) {
        outOfStockItems.push(p);
      } else if (stock <= threshold) {
        lowStockItems.push(p);
      }
    });
    
    ingredients.forEach(i => {
      const threshold = i.minStock !== undefined ? i.minStock : lowStockThreshold;
      if (i.stock <= threshold) {
        lowStockIngredients.push(i);
      }
    });
    
    const salesRankings = products.map(p => ({
      ...p,
      soldQty: productSales[p.id]?.qty || 0,
      revenue: productSales[p.id]?.revenue || 0
    })).sort((a, b) => b.soldQty - a.soldQty);
    
    const inventoryAnalytics = {
      totalStockValue, totalStockCount, lowStockItems, outOfStockItems, lowStockIngredients, salesRankings
    };
    res.json({ company, analytics, inventoryAnalytics, expenses, debts, debtPayments, ingredients, inventoryMovements, crmDeals, auditLogs, systemUsers, backups });
  });

  // Paginated endpoints
  app.get("/api/products", async (req, res) => {
    const companyId = (req.query as any).companyId;
    const page = parseInt((req.query as any).page) || 1;
    const limit = parseInt((req.query as any).limit) || 50;

    if (useSupabaseDb) {
      const client = getRequestSupabase(req);
      if (!client) return res.status(503).json({ error: "Supabase is not configured" });
      if (!companyId) return res.status(400).json({ error: "companyId required" });
      const reqUser = (req as any).user;
      if (!reqUser) return res.status(401).json({ error: "Unauthorized" });
      const { data: owned } = await client.from("companies").select("id").eq("id", companyId).eq("user_id", reqUser.id).maybeSingle();
      if (!owned) return res.status(403).json({ error: "No tienes acceso a esta empresa" });

      // Esta ruta la usan tanto el dashboard autenticado (ProductsTab,
      // InventoryTab, PosSystem — necesitan purchase_cost/margin_percent)
      // como el catálogo público sin login (Catalog.tsx). apiClient solo
      // manda el header Authorization cuando hay una sesión real, así que
      // lo usamos para decidir si consultamos la tabla completa o la vista
      // pública sin datos de costo/margen.
      // Solo el dueño autenticado llega aquí; el catálogo público usa /api/catalog/:slug.
      const sourceTable = "products";

      let query = client
        .from(sourceTable)
        .select("*", { count: "exact" })
        .eq("company_id", companyId)
        .order("created_at", { ascending: false });

      if ((req.query as any).search) {
        query = query.ilike("name", `%${(req.query as any).search}%`);
      }

      const startIndex = (page - 1) * limit;
      const endIndex = startIndex + limit - 1;
      const { data, error, count } = await query.range(startIndex, endIndex);

      if (error) return res.status(500).json({ error: error.message });

      return res.json({
        data: (data || []).map(toProduct),
        total: count || 0,
        page,
        totalPages: Math.ceil((count || 0) / limit),
      });
    }
    
    let filtered = db.products.filter(p => p.companyId === companyId);
    if ((req.query as any).search) {
      const s = ((req.query as any).search as string).toLowerCase();
      filtered = filtered.filter(p => p.name.toLowerCase().includes(s) || (p.sku && p.sku.toLowerCase().includes(s)) || (p.barcode && p.barcode.toLowerCase().includes(s)));
    }
    
    // Sort by id desc (newest first)
    filtered.sort((a, b) => parseInt(b.id || '0') - parseInt(a.id || '0'));
    
    const startIndex = (page - 1) * limit;
    const endIndex = page * limit;
    
    const paginated = filtered.slice(startIndex, endIndex);
    
    res.json({
      data: paginated,
      total: filtered.length,
      page,
      totalPages: Math.ceil(filtered.length / limit)
    });
  });

  app.get("/api/orders", async (req, res) => {
    const companyId = (req.query as any).companyId;
    const page = parseInt((req.query as any).page) || 1;
    const limit = parseInt((req.query as any).limit) || 50;

    if (useSupabaseDb) {
      const client = getRequestSupabase(req);
      if (!client) return res.status(503).json({ error: "Supabase is not configured" });
      if (!companyId) return res.status(400).json({ error: "companyId required" });

      const startIndex = (page - 1) * limit;
      const endIndex = startIndex + limit - 1;
      const { data, error, count } = await client
        .from("orders")
        .select("*", { count: "exact" })
        .eq("company_id", companyId)
        .order("created_at", { ascending: false })
        .range(startIndex, endIndex);

      if (error) return res.status(500).json({ error: error.message });

      return res.json({
        data: (data || []).map(toOrder),
        total: count || 0,
        page,
        totalPages: Math.ceil((count || 0) / limit),
      });
    }
    
    let filtered = db.orders.filter(o => o.companyId === companyId);
    filtered.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    
    const startIndex = (page - 1) * limit;
    const endIndex = page * limit;
    
    const paginated = filtered.slice(startIndex, endIndex);
    
    res.json({
      data: paginated,
      total: filtered.length,
      page,
      totalPages: Math.ceil(filtered.length / limit)
    });
  });

  app.get("/api/customers", async (req, res) => {
    const companyId = (req.query as any).companyId;
    const page = parseInt((req.query as any).page) || 1;
    const limit = parseInt((req.query as any).limit) || 50;

    if (useSupabaseDb) {
      const client = getRequestSupabase(req);
      if (!client) return res.status(503).json({ error: "Supabase is not configured" });
      if (!companyId) return res.status(400).json({ error: "companyId required" });

      let query = client
        .from("customers")
        .select("*", { count: "exact" })
        .eq("company_id", companyId)
        .order("created_at", { ascending: false });

      if ((req.query as any).search) {
        query = query.ilike("name", `%${(req.query as any).search}%`);
      }

      const startIndex = (page - 1) * limit;
      const endIndex = startIndex + limit - 1;
      const { data, error, count } = await query.range(startIndex, endIndex);

      if (error) return res.status(500).json({ error: error.message });

      return res.json({
        data: (data || []).map(toCustomer),
        total: count || 0,
        page,
        totalPages: Math.ceil((count || 0) / limit),
      });
    }
    
    let filtered = db.customers.filter(c => c.companyId === companyId);
    if ((req.query as any).search) {
      const s = ((req.query as any).search as string).toLowerCase();
      filtered = filtered.filter(c => c.name.toLowerCase().includes(s) || (c.phone && c.phone.toLowerCase().includes(s)) || (c.email && c.email.toLowerCase().includes(s)) || (c.documentNumber && c.documentNumber.toLowerCase().includes(s)));
    }
    filtered.sort((a, b) => parseInt(b.id || '0') - parseInt(a.id || '0'));
    
    const startIndex = (page - 1) * limit;
    const endIndex = page * limit;
    
    const paginated = filtered.slice(startIndex, endIndex);
    
    res.json({
      data: paginated,
      total: filtered.length,
      page,
      totalPages: Math.ceil(filtered.length / limit)
    });

  app.get("/api/expenses", async (req, res) => {
    const companyId = (req.query as any).companyId;
    if (!companyId) return res.status(400).json({ error: "companyId required" });

    if (useSupabaseDb) {
      const client = getRequestSupabase(req);
      if (!client) return res.status(503).json({ error: "Supabase is not configured" });

      const { data, error } = await client
        .from("expenses")
        .select("*")
        .eq("company_id", companyId)
        .order("date", { ascending: false });

      if (error) return res.status(500).json({ error: error.message });
      return res.json({ data: (data || []).map(toExpense) });
    }

    const result = db.expenses.filter(e => e.companyId === companyId).sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    res.json({ data: result });
  });

  app.get("/api/crm-deals", async (req, res) => {
    const companyId = (req.query as any).companyId;
    if (!companyId) return res.status(400).json({ error: "companyId required" });

    if (useSupabaseDb) {
      const client = getRequestSupabase(req);
      if (!client) return res.status(503).json({ error: "Supabase is not configured" });
      const { data, error } = await client.from("crm_deals").select("*").eq("company_id", companyId).order("created_at", { ascending: false });
      if (error) return res.status(500).json({ error: error.message });
      return res.json({ data: (data || []).map(toCRMDeal) });
    }

    const result = db.crmDeals.filter(d => d.companyId === companyId);
    res.json({ data: result });
  });

  app.get("/api/debts", async (req, res) => {
    const companyId = (req.query as any).companyId;
    if (!companyId) return res.status(400).json({ error: "companyId required" });

    if (useSupabaseDb) {
      const client = getRequestSupabase(req);
      if (!client) return res.status(503).json({ error: "Supabase is not configured" });
      const { data, error } = await client.from("debts").select("*").eq("company_id", companyId).order("created_at", { ascending: false });
      if (error) return res.status(500).json({ error: error.message });
      return res.json({ data: (data || []).map(toDebt) });
    }

    const result = db.debts.filter(d => d.companyId === companyId);
    res.json({ data: result });
  });

  app.get("/api/debt-payments", async (req, res) => {
    const companyId = (req.query as any).companyId;
    if (!companyId) return res.status(400).json({ error: "companyId required" });

    if (useSupabaseDb) {
      const client = getRequestSupabase(req);
      if (!client) return res.status(503).json({ error: "Supabase is not configured" });
      const { data: debtRows, error: debtError } = await client.from("debts").select("id").eq("company_id", companyId);
      if (debtError) return res.status(500).json({ error: debtError.message });
      const debtIds = (debtRows || []).map((d: any) => d.id);
      if (debtIds.length === 0) return res.json({ data: [] });
      const { data, error } = await client.from("debt_payments").select("*").in("debt_id", debtIds).order("date", { ascending: false });
      if (error) return res.status(500).json({ error: error.message });
      return res.json({ data: (data || []).map(toDebtPayment) });
    }

    const result = db.debtPayments.filter(p => p.companyId === companyId);
    res.json({ data: result });
  });

  app.get("/api/ingredients", async (req, res) => {
    const companyId = (req.query as any).companyId;
    if (!companyId) return res.status(400).json({ error: "companyId required" });

    if (useSupabaseDb) {
      const client = getRequestSupabase(req);
      if (!client) return res.status(503).json({ error: "Supabase is not configured" });
      const { data, error } = await client.from("ingredients").select("*").eq("company_id", companyId).order("name", { ascending: true });
      if (error) return res.status(500).json({ error: error.message });
      return res.json({ data: (data || []).map(toIngredient) });
    }

    const result = db.ingredients.filter(i => i.companyId === companyId);
    res.json({ data: result });
  });

  app.get("/api/inventory-movements", async (req, res) => {
    const companyId = (req.query as any).companyId;
    if (!companyId) return res.status(400).json({ error: "companyId required" });

    if (useSupabaseDb) {
      const client = getRequestSupabase(req);
      if (!client) return res.status(503).json({ error: "Supabase is not configured" });
      const { data, error } = await client.from("inventory_movements").select("*").eq("company_id", companyId).order("date", { ascending: false });
      if (error) return res.status(500).json({ error: error.message });
      return res.json({ data: (data || []).map(toInventoryMovement) });
    }

    const result = db.inventoryMovements.filter(m => m.companyId === companyId).sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    res.json({ data: result });
  });

  app.get("/api/inventory-analytics", async (req, res) => {
    const companyId = (req.query as any).companyId;
    if (!companyId) return res.status(400).json({ error: "companyId required" });

    if (useSupabaseDb) {
      const client = getRequestSupabase(req);
      if (!client) return res.status(503).json({ error: "Supabase is not configured" });
      const { data, error } = await client.from("products").select("stock, min_stock, price").eq("company_id", companyId);
      if (error) return res.status(500).json({ error: error.message });
      const products = data || [];
      const totalItems = products.length;
      const lowStock = products.filter((p: any) => typeof p.stock === 'number' && typeof p.min_stock === 'number' && p.stock <= p.min_stock).length;
      const totalValue = products.reduce((sum: number, p: any) => sum + (Number(p.price || 0) * (p.stock || 0)), 0);
      return res.json({ data: { totalItems, lowStock, totalValue } });
    }

    const companyProducts = db.products.filter(p => p.companyId === companyId);
    const totalItems = companyProducts.length;
    const lowStock = companyProducts.filter(p => typeof p.stock === 'number' && typeof p.minStock === 'number' && p.stock <= p.minStock).length;
    const totalValue = companyProducts.reduce((sum, p) => sum + (p.price * (p.stock || 0)), 0);
    res.json({ data: { totalItems, lowStock, totalValue } });
  });

  app.get("/api/suppliers", async (req, res) => {
    const companyId = (req.query as any).companyId;
    if (!companyId) return res.status(400).json({ error: "companyId required" });

    if (useSupabaseDb) {
      const client = getRequestSupabase(req);
      if (!client) return res.status(503).json({ error: "Supabase is not configured" });
      const { data, error } = await client.from("suppliers").select("*").eq("company_id", companyId).order("name", { ascending: true });
      if (error) return res.status(500).json({ error: error.message });
      return res.json({ data: (data || []).map(toSupplier) });
    }

    const result = db.suppliers.filter(s => s.companyId === companyId);
    res.json({ data: result });
  });

  app.get("/api/purchase-orders", async (req, res) => {
    const companyId = (req.query as any).companyId;
    if (!companyId) return res.status(400).json({ error: "companyId required" });

    if (useSupabaseDb) {
      const client = getRequestSupabase(req);
      if (!client) return res.status(503).json({ error: "Supabase is not configured" });
      const { data, error } = await client.from("purchase_orders").select("*").eq("company_id", companyId).order("created_at", { ascending: false });
      if (error) return res.status(500).json({ error: error.message });
      return res.json({ data: (data || []).map(toPurchaseOrder) });
    }

    const result = db.purchaseOrders.filter(po => po.companyId === companyId).sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    res.json({ data: result });
  });

  });

  // End paginated endpoints


  // Update company settings
  app.post("/api/companies/:id", async (req, res) => {
    if (useSupabaseDb) {
      const client = getRequestSupabase(req);
      if (!client) return res.status(503).json({ error: "Supabase is not configured" });

      const { data, error } = await client
        .from("companies")
        .update(stripUndefined(fromCompany(req.body)))
        .eq("id", (req.params as any).id)
        .select("*")
        .single();

      if (error) return res.status(500).json({ error: error.message });
      return res.json(toCompany(data));
    }

    const idx = db.companies.findIndex(c => c.id === (req.params as any).id);
    if (idx !== -1) {
      db.companies[idx] = { ...db.companies[idx], ...req.body };
      res.json(db.companies[idx]);
    } else {
      res.status(404).json({ error: "Company not found" });
    }
  });

  // Orders
  app.post("/api/orders", async (req, res) => {
    const isPublicOrder = !(req as any).user;
    const body = { ...(req.body || {}) };
    if (isPublicOrder) {
      // Pedido desde el catálogo: siempre entra como "Nuevo" al panel del negocio.
      body.type = 'online';
      body.status = 'Nuevo';
      body.items = Array.isArray(body.items) ? body.items.slice(0, 100) : [];
      if (!body.companyId || body.items.length === 0) return res.status(400).json({ error: "Pedido vacío" });
      body.frequentOptIn = body.frequentOptIn === true && Boolean(body.customerPhone);
    }
    if (useSupabaseDb) {
      const client = getRequestSupabase(req);
      if (!client) return res.status(503).json({ error: "Supabase is not configured" });

      // Inserción sin .select(): el visitante anónimo no tiene permiso de lectura.
      const orderRow: any = stripUndefined(fromOrder(body));
      if (body.frequentOptIn) orderRow.frequent_opt_in = true;
      const loy = isPublicOrder ? await loyalty.onPublicOrder(body) : { columns: {}, info: null };
      orderRow.id = crypto.randomUUID();
      Object.assign(orderRow, loy.columns);
      let { error } = await client.from("orders").insert(orderRow);
      if (error && /order_code|loyalty_|reward_/i.test(error.message || '')) {
        // La base aún no tiene las columnas de v5.sql: se guarda sin fidelización.
        for (const k of Object.keys(loy.columns)) delete orderRow[k];
        loy.info = null; (loy.columns as any) = {};
        ({ error } = await client.from("orders").insert(orderRow));
      }
      if (error && /frequent_opt_in/i.test(error.message || '')) {
        delete orderRow.frequent_opt_in;
        ({ error } = await client.from("orders").insert(orderRow));
      }
      if (error && body.status === 'Nuevo' && /check|status/i.test(error.message || '')) {
        // La base aún no tiene el estado "Nuevo" (falta v3.sql): se guarda como Pendiente.
        ({ error } = await client.from("orders").insert({ ...orderRow, status: 'Pendiente' }));
      }
      if (error) return res.status(500).json({ error: error.message });
      return res.json({ ok: true, status: body.status || 'Pendiente', orderCode: (loy.columns as any).order_code || null, loyalty: loy.info });
    }

    const newOrder = {
      id: Date.now().toString(),
      createdAt: new Date().toISOString(),
      status: req.body.status || (req.body.paymentProof ? 'Pago por Verificar' : 'Pendiente'),
      ...req.body
    };
    
    // Deduct stock and ingredients
    if (newOrder.items && Array.isArray(newOrder.items)) {
      newOrder.items.forEach((item: any) => {
        const prodIdx = db.products.findIndex(p => p.id === item.productId);
        if (prodIdx !== -1) {
          const product = db.products[prodIdx];
          if (product.stock !== null && product.stock !== undefined) {
            product.stock! -= item.qty;
          }
          if (product.recipe && Array.isArray(product.recipe)) {
            product.recipe.forEach((rItem: any) => {
              const ingIdx = db.ingredients.findIndex(ing => ing.id === rItem.ingredientId);
              if (ingIdx !== -1) {
                db.ingredients[ingIdx].stock -= (rItem.qty * item.qty);
              }
            });
          }
        }
      });
    }

    const loyMem = isPublicOrder ? await loyalty.onPublicOrder(body) : { columns: {}, info: null };
    Object.assign(newOrder, loyMem.columns);
    db.orders.unshift(newOrder); // Add to beginning
    res.json({ ...newOrder, orderCode: (loyMem.columns as any).order_code || null, loyalty: loyMem.info });
  });

  app.put("/api/orders/:id/status", async (req, res) => {
    if (useSupabaseDb) {
      const client = getRequestSupabase(req);
      if (!client) return res.status(503).json({ error: "Supabase is not configured" });

      const { data, error } = await client
        .from("orders")
        .update({ status: req.body.status })
        .eq("id", (req.params as any).id)
        .select("*")
        .single();

      if (error) return res.status(500).json({ error: error.message });
      const loyaltyResult = await loyalty.onOrderStatus(String((req.params as any).id), String(req.body.status));
      return res.json({ ...toOrder(data), loyaltyResult });
    }

    const idx = db.orders.findIndex(o => o.id === (req.params as any).id);
    if (idx !== -1) {
      db.orders[idx].status = req.body.status;
      (db.orders[idx] as any).loyaltyResult = await loyalty.onOrderStatus(String(db.orders[idx].id), String(req.body.status));
      addAuditLog(db.orders[idx].companyId, "ACTUALIZAR", "Pedidos", `Estado del pedido #${db.orders[idx].id} actualizado a ${req.body.status}`);
      res.json(db.orders[idx]);
    } else {
      res.status(404).json({ error: "Order not found" });
    }
  });

  // Add inventory movement
  app.post("/api/inventory-movements", async (req, res) => {
    if (useSupabaseDb) {
      const client = getRequestSupabase(req);
      if (!client) return res.status(503).json({ error: "Supabase is not configured" });

      const { data: movement, error: movementError } = await client
        .from("inventory_movements")
        .insert(stripUndefined(fromInventoryMovement(req.body)))
        .select("*")
        .single();
      if (movementError) return res.status(500).json({ error: movementError.message });

      const { data: product } = await client.from("products").select("id, name, stock, company_id").eq("id", req.body.productId).maybeSingle();
      if (product) {
        const currentStock = product.stock ?? 0;
        const newStock = req.body.type === 'Entrada' ? currentStock + req.body.qty : currentStock - req.body.qty;
        await client.from("products").update({ stock: newStock }).eq("id", product.id);
        addAuditLog(product.company_id, "INVENTARIO", "Productos", `Inventario de '${product.name}' modificado: ${req.body.type} de ${req.body.qty}`);
      }

      return res.json(toInventoryMovement(movement));
    }

    const newMovement = {
      id: Date.now().toString(),
      ...req.body
    };
    db.inventoryMovements.unshift(newMovement);
    
    // Update product stock
    const prodIdx = db.products.findIndex(p => p.id === newMovement.productId);
    if (prodIdx !== -1) {
      if (db.products[prodIdx].stock === null || db.products[prodIdx].stock === undefined) {
        db.products[prodIdx].stock = 0;
      }
      if (newMovement.type === 'Entrada') {
        db.products[prodIdx].stock! += newMovement.qty;
      } else {
        db.products[prodIdx].stock! -= newMovement.qty;
      }
      addAuditLog(newMovement.companyId, "INVENTARIO", "Productos", `Inventario de '${db.products[prodIdx].name}' modificado: ${newMovement.type} de ${newMovement.qty}`);
    }

    res.json(newMovement);
  });

  // Add product
  app.post("/api/products", async (req, res) => {
    const normalizedProduct = normalizeProductPayload(req.body);

    if (useSupabaseDb) {
      const client = getRequestSupabase(req);
      if (!client) return res.status(503).json({ error: "Supabase is not configured" });

      const { data, error } = await client
        .from("products")
        .insert(stripUndefined(fromProduct(normalizedProduct)))
        .select("*")
        .single();

      if (error) return res.status(500).json({ error: error.message });
      return res.json(toProduct(data));
    }

    const newProduct = {
      id: Date.now().toString(),
      ...normalizedProduct
    };
    db.products.push(newProduct);
    addAuditLog(newProduct.companyId, "CREAR", "Productos", `Producto '${newProduct.name}' agregado al catálogo`);
    res.json(newProduct);
  });

  // Update product
  app.put("/api/products/:id", async (req, res) => {
    const normalizedProduct = normalizeProductPayload(req.body);

    if (useSupabaseDb) {
      const client = getRequestSupabase(req);
      if (!client) return res.status(503).json({ error: "Supabase is not configured" });

      const { data, error } = await client
        .from("products")
        .update(stripUndefined(fromProduct(normalizedProduct)))
        .eq("id", (req.params as any).id)
        .select("*")
        .single();

      if (error) return res.status(500).json({ error: error.message });
      return res.json(toProduct(data));
    }

    const idx = db.products.findIndex(p => p.id === (req.params as any).id);
    if (idx !== -1) {
      db.products[idx] = { ...db.products[idx], ...normalizedProduct };
      addAuditLog(db.products[idx].companyId, "ACTUALIZAR", "Productos", `Producto '${db.products[idx].name}' actualizado`);
      res.json(db.products[idx]);
    } else {
      res.status(404).json({ error: "Product not found" });
    }
  });

  // Delete product
  app.delete("/api/products/:id", async (req, res) => {
    if (useSupabaseDb) {
      const client = getRequestSupabase(req);
      if (!client) return res.status(503).json({ error: "Supabase is not configured" });

      const { error } = await client
        .from("products")
        .delete()
        .eq("id", (req.params as any).id);

      if (error) return res.status(500).json({ error: error.message });
      return res.json({ success: true });
    }

    const prod = db.products.find(p => p.id === (req.params as any).id);
    if (prod) {
      addAuditLog(prod.companyId, "ELIMINAR", "Productos", `Producto '${prod.name}' eliminado del catálogo`);
    }
    db.products = db.products.filter(p => p.id !== (req.params as any).id);
    res.json({ success: true });
  });

  // Add ingredient
  app.post("/api/ingredients", async (req, res) => {
    if (useSupabaseDb) {
      const client = getRequestSupabase(req);
      if (!client) return res.status(503).json({ error: "Supabase is not configured" });
      const { data, error } = await client.from("ingredients").insert(stripUndefined(fromIngredient(req.body))).select("*").single();
      if (error) return res.status(500).json({ error: error.message });
      addAuditLog(req.body.companyId, "CREAR", "Insumos", `Insumo '${req.body.name}' agregado`);
      return res.json(toIngredient(data));
    }

    const newIngredient = {
      id: Date.now().toString(),
      ...req.body
    };
    db.ingredients.unshift(newIngredient);
    addAuditLog(newIngredient.companyId, "CREAR", "Insumos", `Insumo '${newIngredient.name}' agregado`);
    res.json(newIngredient);
  });

  // Update ingredient
  app.put("/api/ingredients/:id", async (req, res) => {
    if (useSupabaseDb) {
      const client = getRequestSupabase(req);
      if (!client) return res.status(503).json({ error: "Supabase is not configured" });
      const { data, error } = await client.from("ingredients").update(stripUndefined(fromIngredient(req.body))).eq("id", (req.params as any).id).select("*").single();
      if (error) return res.status(500).json({ error: error.message });
      addAuditLog(data.company_id, "ACTUALIZAR", "Insumos", `Insumo '${data.name}' actualizado`);
      return res.json(toIngredient(data));
    }

    const idx = db.ingredients.findIndex(i => i.id === (req.params as any).id);
    if (idx !== -1) {
      db.ingredients[idx] = { ...db.ingredients[idx], ...req.body };
      addAuditLog(db.ingredients[idx].companyId, "ACTUALIZAR", "Insumos", `Insumo '${db.ingredients[idx].name}' actualizado`);
      res.json(db.ingredients[idx]);
    } else {
      res.status(404).json({ error: "Ingredient not found" });
    }
  });

  // Delete ingredient
  app.delete("/api/ingredients/:id", async (req, res) => {
    if (useSupabaseDb) {
      const client = getRequestSupabase(req);
      if (!client) return res.status(503).json({ error: "Supabase is not configured" });
      const { data } = await client.from("ingredients").select("company_id, name").eq("id", (req.params as any).id).maybeSingle();
      const { error } = await client.from("ingredients").delete().eq("id", (req.params as any).id);
      if (error) return res.status(500).json({ error: error.message });
      if (data) addAuditLog(data.company_id, "ELIMINAR", "Insumos", `Insumo '${data.name}' eliminado`);
      return res.json({ success: true });
    }

    const ing = db.ingredients.find(i => i.id === (req.params as any).id);
    if (ing) {
      addAuditLog(ing.companyId, "ELIMINAR", "Insumos", `Insumo '${ing.name}' eliminado`);
    }
    db.ingredients = db.ingredients.filter(i => i.id !== (req.params as any).id);
    res.json({ success: true });
  });

  // Add expense
  app.post("/api/expenses", async (req, res) => {
    if (useSupabaseDb) {
      const client = getRequestSupabase(req);
      if (!client) return res.status(503).json({ error: "Supabase is not configured" });

      const { data, error } = await client
        .from("expenses")
        .insert(stripUndefined(fromExpense(req.body)))
        .select("*")
        .single();

      if (error) return res.status(500).json({ error: error.message });
      addAuditLog(req.body.companyId, "CREAR", "Gastos", `Gasto de S/ ${req.body.amount} registrado (${req.body.concept})`);
      return res.json(toExpense(data));
    }

    const newExpense = {
      id: Date.now().toString(),
      ...req.body
    };
    db.expenses.unshift(newExpense);
    addAuditLog(newExpense.companyId, "CREAR", "Gastos", `Gasto de S/ ${newExpense.amount} registrado (${newExpense.concept})`);
    res.json(newExpense);
  });

  // Delete expense
  app.delete("/api/expenses/:id", async (req, res) => {
    if (useSupabaseDb) {
      const client = getRequestSupabase(req);
      if (!client) return res.status(503).json({ error: "Supabase is not configured" });

      const { error } = await client
        .from("expenses")
        .delete()
        .eq("id", (req.params as any).id);

      if (error) return res.status(500).json({ error: error.message });
      return res.json({ success: true });
    }

    const exp = db.expenses.find(e => e.id === (req.params as any).id);
    if (exp) {
      addAuditLog(exp.companyId, "ELIMINAR", "Gastos", `Gasto de S/ ${exp.amount} eliminado`);
    }
    db.expenses = db.expenses.filter(e => e.id !== (req.params as any).id);
    res.json({ success: true });
  });

  // Add customer
  app.post("/api/customers", async (req, res) => {
    if (useSupabaseDb) {
      const client = getRequestSupabase(req);
      if (!client) return res.status(503).json({ error: "Supabase is not configured" });

      const { data, error } = await client
        .from("customers")
        .insert(stripUndefined(fromCustomer(req.body)))
        .select("*")
        .single();

      if (error) return res.status(500).json({ error: error.message });
      return res.json(toCustomer(data));
    }

    const newCustomer = {
      id: Date.now().toString(),
      ...req.body
    };
    db.customers.unshift(newCustomer);
    addAuditLog(newCustomer.companyId, "CREAR", "Clientes", `Cliente '${newCustomer.name}' registrado en directorio`);
    res.json(newCustomer);
  });

  // Import customers in batches. This avoids thousands of individual browser requests
  // when a business imports a real customer database from Excel or CSV.
  app.post("/api/customers/import", async (req, res) => {
    const companyId = req.body?.companyId;
    const customers = Array.isArray(req.body?.customers) ? req.body.customers : [];

    if (!companyId) return res.status(400).json({ error: "companyId is required" });
    if (customers.length === 0) return res.status(400).json({ error: "At least one customer is required" });
    if (customers.length > 500) return res.status(400).json({ error: "A maximum of 500 customers can be imported per batch" });

    const validCustomers = customers
      .filter((customer: any) => typeof customer?.name === 'string' && customer.name.trim())
      .map((customer: any) => ({ ...customer, companyId, name: customer.name.trim() }));

    if (validCustomers.length === 0) {
      return res.status(400).json({ error: "No valid customers were provided" });
    }

    if (useSupabaseDb) {
      const client = getRequestSupabase(req);
      if (!client) return res.status(503).json({ error: "Supabase is not configured" });

      const payload = validCustomers.map((customer: any) => stripUndefined(fromCustomer(customer)));
      const { data, error } = await client
        .from("customers")
        .insert(payload)
        .select("id");

      if (error) return res.status(500).json({ error: error.message });
      return res.json({ created: data?.length || 0 });
    }

    const created = validCustomers.map((customer: any, index: number) => ({
      id: `${Date.now()}-${index}`,
      ...customer,
    }));
    db.customers.unshift(...created);
    addAuditLog(companyId, "CREAR", "Clientes", `${created.length} clientes importados al directorio`);
    return res.json({ created: created.length });
  });

  // Parse XLSX files on the server, where large workbooks don't freeze the
  // browser. The file is imported in database batches after it is parsed.
  app.post("/api/customers/import-file", async (req, res) => {
    const { companyId, fileName, contentBase64 } = req.body || {};
    if (!companyId || typeof fileName !== 'string' || typeof contentBase64 !== 'string') {
      return res.status(400).json({ error: "companyId, fileName and contentBase64 are required" });
    }
    if (!fileName.toLowerCase().endsWith('.xlsx')) {
      return res.status(400).json({ error: "Only .xlsx files can be imported through this endpoint" });
    }

    const buffer = Buffer.from(contentBase64, 'base64');
    if (buffer.length === 0) return res.status(400).json({ error: "The uploaded file is empty" });
    if (buffer.length > 20 * 1024 * 1024) {
      return res.status(413).json({ error: "The Excel file exceeds the 20 MB import limit" });
    }

    let sheetRows: any[][];
    try {
      sheetRows = await readExcelSheet(buffer);
    } catch {
      return res.status(400).json({ error: "The Excel file could not be read. Export it again as .xlsx and try once more." });
    }

    let headerIndex = -1;
    for (let index = 0; index < Math.min(10, sheetRows.length); index += 1) {
      const rowText = sheetRows[index].map(cell => String(cell || '').toLowerCase()).join(' ');
      if (rowText.includes('nombre') || rowText.includes('cliente') || rowText.includes('ruc')) {
        headerIndex = index;
        break;
      }
    }
    if (headerIndex === -1) {
      return res.status(400).json({ error: "No header row was found. Include a Nombre, Cliente or RUC column." });
    }

    const normalizeHeader = (value: string) => value
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/^\uFEFF/, '')
      .toLowerCase()
      .replace(/[\s-]+/g, '_')
      .trim();
    const getField = (row: Record<string, any>, keys: string[]) => {
      for (const key of Object.keys(row)) {
        if (keys.includes(normalizeHeader(key))) return row[key];
      }
      return undefined;
    };
    const headers = sheetRows[headerIndex].map(header => String(header ?? '').trim());
    const importedCustomers = sheetRows
      .slice(headerIndex + 1)
      .filter(row => row.some(cell => cell !== null && cell !== undefined && String(cell).trim() !== ''))
      .map(row => {
        const source: Record<string, any> = {};
        headers.forEach((header, index) => {
          if (header) source[header] = row[index];
        });
        return {
          name: String(getField(source, ['nombre', 'nombre_completo', 'name', 'cliente', 'razon_social']) || '').trim(),
          phone: String(getField(source, ['telefono', 'phone', 'celular', 'whatsapp']) || '').trim() || undefined,
          email: String(getField(source, ['email', 'correo', 'correo_electronico']) || '').trim() || undefined,
          address: String(getField(source, ['direccion', 'address', 'distrito']) || '').trim() || undefined,
          documentNumber: String(getField(source, ['dni', 'ruc', 'dni_ruc', 'documentnumber', 'documento']) || '').trim() || undefined,
          notes: String(getField(source, ['notas', 'notes', 'observaciones', 'actividad', 'subrubro']) || '').trim() || undefined,
        };
      })
      .filter(customer => customer.name);

    if (importedCustomers.length === 0) {
      return res.status(400).json({ error: "No valid customers were found. Include a Nombre column with data." });
    }

    let created = 0;
    const batchSize = 500;
    if (useSupabaseDb) {
      const client = getRequestSupabase(req);
      if (!client) return res.status(503).json({ error: "Supabase is not configured" });

      for (let start = 0; start < importedCustomers.length; start += batchSize) {
        const batch = importedCustomers.slice(start, start + batchSize);
        const payload = batch.map(customer => stripUndefined(fromCustomer({ ...customer, companyId })));
        const { data, error } = await client.from("customers").insert(payload).select("id");
        if (error) return res.status(500).json({ error: error.message, created, total: importedCustomers.length });
        created += data?.length || 0;
      }
    } else {
      const entries = importedCustomers.map((customer, index) => ({
        id: `${Date.now()}-${index}`,
        companyId,
        ...customer,
      }));
      db.customers.unshift(...entries);
      created = entries.length;
      addAuditLog(companyId, "CREAR", "Clientes", `${created} clientes importados al directorio`);
    }

    return res.json({ created, skipped: sheetRows.length - headerIndex - 1 - importedCustomers.length, total: importedCustomers.length });
  });

  app.post("/api/crm-deals", async (req, res) => {
    if (useSupabaseDb) {
      const client = getRequestSupabase(req);
      if (!client) return res.status(503).json({ error: "Supabase is not configured" });
      const payload = { ...fromCRMDeal(req.body), stage: req.body.stage || 'Nuevo' };
      const { data, error } = await client.from("crm_deals").insert(stripUndefined(payload)).select("*").single();
      if (error) return res.status(500).json({ error: error.message });
      addAuditLog(req.body.companyId, "CREAR", "CRM", `Oportunidad '${req.body.title}' creada`);
      return res.json(toCRMDeal(data));
    }

    const newDeal = {
      id: Date.now().toString(),
      stage: 'Nuevo',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      ...req.body
    };
    db.crmDeals.unshift(newDeal);
    addAuditLog(newDeal.companyId, "CREAR", "CRM", `Oportunidad '${newDeal.title}' creada`);
    res.json(newDeal);
  });

  app.put("/api/crm-deals/:id", async (req, res) => {
    if (useSupabaseDb) {
      const client = getRequestSupabase(req);
      if (!client) return res.status(503).json({ error: "Supabase is not configured" });
      const { data, error } = await client
        .from("crm_deals")
        .update({ ...stripUndefined(fromCRMDeal(req.body)), updated_at: new Date().toISOString() })
        .eq("id", (req.params as any).id)
        .select("*")
        .single();
      if (error) return res.status(500).json({ error: error.message });
      addAuditLog(data.company_id, "ACTUALIZAR", "CRM", `Oportunidad actualizada`);
      return res.json(toCRMDeal(data));
    }

    const idx = db.crmDeals.findIndex(d => d.id === (req.params as any).id);
    if (idx !== -1) {
      db.crmDeals[idx] = { ...db.crmDeals[idx], ...req.body, updatedAt: new Date().toISOString() };
      addAuditLog(db.crmDeals[idx].companyId, "ACTUALIZAR", "CRM", `Oportunidad actualizada`);
      res.json(db.crmDeals[idx]);
    } else {
      res.status(404).json({ error: "Deal not found" });
    }
  });

  app.delete("/api/crm-deals/:id", async (req, res) => {
    if (useSupabaseDb) {
      const client = getRequestSupabase(req);
      if (!client) return res.status(503).json({ error: "Supabase is not configured" });
      const { data } = await client.from("crm_deals").select("company_id").eq("id", (req.params as any).id).maybeSingle();
      const { error } = await client.from("crm_deals").delete().eq("id", (req.params as any).id);
      if (error) return res.status(500).json({ error: error.message });
      if (data) addAuditLog(data.company_id, "ELIMINAR", "CRM", `Oportunidad eliminada`);
      return res.json({ success: true });
    }

    const deal = db.crmDeals.find(d => d.id === (req.params as any).id);
    if (deal) {
      addAuditLog(deal.companyId, "ELIMINAR", "CRM", `Oportunidad eliminada`);
    }
    db.crmDeals = db.crmDeals.filter(d => d.id !== (req.params as any).id);
    res.json({ success: true });
  });

  app.post("/api/debts", async (req, res) => {
    if (useSupabaseDb) {
      const client = getRequestSupabase(req);
      if (!client) return res.status(503).json({ error: "Supabase is not configured" });
      const { data, error } = await client.from("debts").insert(stripUndefined(fromDebt(req.body))).select("*").single();
      if (error) return res.status(500).json({ error: error.message });
      addAuditLog(req.body.companyId, "CREAR", "Deudas", `Deuda registrada por ${req.body.amount}`);
      return res.json(toDebt(data));
    }

    const newDebt = {
      id: Date.now().toString(),
      status: 'Pendiente',
      ...req.body
    };
    db.debts.unshift(newDebt);
    addAuditLog(newDebt.companyId, "CREAR", "Deudas", `Deuda registrada por ${newDebt.amount}`);
    res.json(newDebt);
  });

  app.put("/api/debts/:id", async (req, res) => {
    if (useSupabaseDb) {
      const client = getRequestSupabase(req);
      if (!client) return res.status(503).json({ error: "Supabase is not configured" });
      const { data, error } = await client.from("debts").update(stripUndefined(fromDebt(req.body))).eq("id", (req.params as any).id).select("*").single();
      if (error) return res.status(500).json({ error: error.message });
      addAuditLog(data.company_id, "ACTUALIZAR", "Deudas", `Deuda actualizada`);
      return res.json(toDebt(data));
    }

    const idx = db.debts.findIndex(d => d.id === (req.params as any).id);
    if (idx !== -1) {
      db.debts[idx] = { ...db.debts[idx], ...req.body };
      addAuditLog(db.debts[idx].companyId, "ACTUALIZAR", "Deudas", `Deuda actualizada`);
      res.json(db.debts[idx]);
    } else {
      res.status(404).json({ error: "Debt not found" });
    }
  });

  app.post("/api/debt-payments", async (req, res) => {
    if (useSupabaseDb) {
      const client = getRequestSupabase(req);
      if (!client) return res.status(503).json({ error: "Supabase is not configured" });

      const { data: payment, error: paymentError } = await client
        .from("debt_payments")
        .insert(stripUndefined(fromDebtPayment(req.body)))
        .select("*")
        .single();
      if (paymentError) return res.status(500).json({ error: paymentError.message });

      const { data: debt } = await client.from("debts").select("*").eq("id", req.body.debtId).maybeSingle();
      if (debt) {
        const newRemaining = Math.max(0, Number(debt.remaining_amount) - Number(req.body.amount));
        await client
          .from("debts")
          .update({ remaining_amount: newRemaining, status: newRemaining === 0 ? 'Pagado' : debt.status })
          .eq("id", debt.id);
        addAuditLog(debt.company_id, "PAGO", "Deudas", `Abono de ${req.body.amount} registrado para deuda`);
      }

      return res.json(toDebtPayment(payment));
    }

    const newPayment = {
      id: Date.now().toString(),
      ...req.body
    };
    db.debtPayments.unshift(newPayment);
    
    // Update remaining debt amount
    const debtIdx = db.debts.findIndex(d => d.id === newPayment.debtId);
    if (debtIdx !== -1) {
      const debt = db.debts[debtIdx];
      debt.remainingAmount = Math.max(0, debt.remainingAmount - newPayment.amount);
      if (debt.remainingAmount === 0) {
        debt.status = 'Pagado';
      }
      addAuditLog(debt.companyId, "PAGO", "Deudas", `Abono de ${newPayment.amount} registrado para deuda`);
    }

    res.json(newPayment);
  });

  // Delete customer
  app.delete("/api/customers/:id", async (req, res) => {
    if (useSupabaseDb) {
      const client = getRequestSupabase(req);
      if (!client) return res.status(503).json({ error: "Supabase is not configured" });

      const { error } = await client
        .from("customers")
        .delete()
        .eq("id", (req.params as any).id);

      if (error) return res.status(500).json({ error: error.message });
      return res.json({ success: true });
    }

    const c = db.customers.find(c => c.id === (req.params as any).id);
    if (c) {
      addAuditLog(c.companyId, "ELIMINAR", "Clientes", `Cliente '${c.name}' eliminado`);
    }
    db.customers = db.customers.filter(c => c.id !== (req.params as any).id);
    res.json({ success: true });
  });

  // Vite middleware for development

  app.post('/api/approve-subscription', requireSuperAdmin, express.json(), async (req, res) => {
    try {
      const { email, businessName, plan, amount } = req.body;
      
      if (!email) {
        return res.status(400).json({ error: 'Email is required' });
      }

      console.log('Sending approval email to:', email);
      
      if (resend) {
        const { data, error } = await resend.emails.send({
          from: MAIL_FROM,
          to: [email],
          subject: '¡Tu suscripción a WowSmart ha sido aprobada!',
          html: `
            <div style="font-family: sans-serif; max-w: 600px; margin: 0 auto;">
              <h1 style="color: #4f46e5;">¡Bienvenido a WowSmart!</h1>
              <p>Hola,</p>
              <p>Tu pago por el plan <strong>${plan}</strong> para <strong>${businessName}</strong> ha sido validado exitosamente.</p>
              <p>Monto pagado: S/ ${amount}</p>
              <div style="background-color: #f8fafc; padding: 20px; border-radius: 8px; margin: 20px 0;">
                <h3 style="margin-top: 0;">Ya puedes acceder a tu panel de control:</h3>
                <a href="${publicBaseUrl}/dashboard" style="display: inline-block; background-color: #4f46e5; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: bold;">
                  Ir al Dashboard
                </a>
              </div>
              <p>Gracias por confiar en nosotros.</p>
              <p>El equipo de WowSmart</p>
            </div>
          `
        });
        
        if (error) {
          console.error('Error sending email:', error);
          return res.status(500).json({ error: error.message });
        }
        
        return res.json({ success: true, data });
      } else {
        // Simulate sending if no key
        console.log('Simulating email send (faltan MAIL_SMTP_*/SMTP_*)');
        return res.json({ success: true, simulated: true });
      }
    } catch (err: any) {
      console.error(err);
      res.status(500).json({ error: 'Internal server error' });
    }
  });

  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    // Archivos con hash (assets/) se guardan 1 año en caché; imágenes 7 días; index.html nunca.
    app.use('/assets', express.static(path.join(distPath, 'assets'), { index: false, immutable: true, maxAge: '365d', fallthrough: false }));
    app.use(express.static(distPath, { index: false, maxAge: '7d', setHeaders: (res, p) => { if (p.endsWith('.html')) res.setHeader('Cache-Control', 'no-cache'); } }));
    const fs = await import('fs');
    const analyticsCfg: Record<string, string> = {};
    const idRules: Record<string, RegExp> = { VITE_GA4_ID: /^G-[A-Z0-9]+$/, VITE_GTM_ID: /^GTM-[A-Z0-9]+$/, VITE_META_PIXEL_ID: /^\d{6,20}$/, VITE_CLARITY_ID: /^[a-z0-9]{6,20}$/i };
    for (const [k, re] of Object.entries(idRules)) { const v = String(process.env[k] || '').trim(); if (re.test(v)) analyticsCfg[k] = v; }
    const indexHtml = fs.readFileSync(path.join(distPath, 'index.html'), 'utf8')
      .replace('</head>', `<meta name="ws-analytics" content='${JSON.stringify(analyticsCfg)}' />\n</head>`);
    const esc = (v: any) => String(v ?? '').replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
    const ogCache = new Map<string, { html: string; at: number }>();
    const catalogHtml = async (slug: string) => {
      const hit = ogCache.get(slug);
      if (hit && Date.now() - hit.at < 5 * 60 * 1000) return hit.html;
      if (!supabase) return null;
      const { data } = await supabase.from('companies_public').select('name,description,logo,banner,slug').eq('slug', slug).maybeSingle();
      if (!data) return null;
      const img = [data.logo, data.banner].find((u: any) => typeof u === 'string' && /^https?:\/\//.test(u)) || `${publicBaseUrl}/og-image.png`;
      const title = `${data.name} | Catálogo en WowSmart`;
      const desc = data.description || `Mira el catálogo de ${data.name} y haz tu pedido por WhatsApp.`;
      const url = `${publicBaseUrl}/c/${data.slug}`;
      const html = indexHtml
        .replace(/<title>[^<]*<\/title>/, `<title>${esc(title)}</title>`)
        .replace(/(<meta property="og:title" content=")[^"]*/, `$1${esc(title)}`)
        .replace(/(<meta property="og:description" content=")[^"]*/, `$1${esc(desc)}`)
        .replace(/(<meta property="og:url" content=")[^"]*/, `$1${esc(url)}`)
        .replace(/(<meta property="og:image" content=")[^"]*/, `$1${esc(img)}`)
        .replace(/(<meta name="twitter:title" content=")[^"]*/, `$1${esc(title)}`)
        .replace(/(<meta name="twitter:description" content=")[^"]*/, `$1${esc(desc)}`)
        .replace(/(<meta name="twitter:image" content=")[^"]*/, `$1${esc(img)}`)
        .replace(/(<meta name="description" content=")[^"]*/, `$1${esc(desc)}`)
        .replace(/(<link rel="canonical" href=")[^"]*/, `$1${esc(url)}`);
      ogCache.set(slug, { html, at: Date.now() });
      return html;
    };
    app.get('*', async (req, res, next) => {
      if (req.path.startsWith('/api/') || req.path === '/api') return next();
      const m = req.path.match(/^\/c\/([^/]+)\/?$/);
      if (m) {
        try {
          const html = await catalogHtml(decodeURIComponent(m[1]));
          if (html) return res.status(200).type('html').send(html);
          return res.status(404).type('html').send(indexHtml);
        } catch { /* cae al index normal */ }
      }
      const known = /^\/(|auth|checkout(\/[^/]+)?|privacidad|terminos|legal|cookies|reclamaciones|dashboard|superadmin|c\/[^/]+(\/mis-puntos)?)\/?$/.test(req.path);
      res.setHeader('Cache-Control', 'no-cache');
      res.status(known ? 200 : 404).type('html').send(indexHtml);
    });
  }

  
  // Suppliers
  app.post("/api/suppliers", async (req, res) => {
    if (useSupabaseDb) {
      const client = getRequestSupabase(req);
      if (!client) return res.status(503).json({ error: "Supabase is not configured" });
      const { data, error } = await client.from("suppliers").insert(stripUndefined(fromSupplier(req.body))).select("*").single();
      if (error) return res.status(500).json({ error: error.message });
      return res.json(toSupplier(data));
    }
    const supplier = { id: Date.now().toString(), ...req.body };
    db.suppliers.push(supplier);
    res.json(supplier);
  });
  app.put("/api/suppliers/:id", async (req, res) => {
    if (useSupabaseDb) {
      const client = getRequestSupabase(req);
      if (!client) return res.status(503).json({ error: "Supabase is not configured" });
      const { data, error } = await client.from("suppliers").update(stripUndefined(fromSupplier(req.body))).eq("id", (req.params as any).id).select("*").single();
      if (error) return res.status(500).json({ error: error.message });
      return res.json(toSupplier(data));
    }
    const idx = db.suppliers.findIndex(s => s.id === (req.params as any).id);
    if (idx > -1) {
      db.suppliers[idx] = { ...db.suppliers[idx], ...req.body };
      res.json(db.suppliers[idx]);
    } else {
      res.status(404).json({ error: 'Not found' });
    }
  });

  // Purchase Orders
  app.post("/api/purchase-orders", async (req, res) => {
    if (useSupabaseDb) {
      const client = getRequestSupabase(req);
      if (!client) return res.status(503).json({ error: "Supabase is not configured" });
      const { data, error } = await client.from("purchase_orders").insert(stripUndefined(fromPurchaseOrder(req.body))).select("*").single();
      if (error) return res.status(500).json({ error: error.message });
      return res.json(toPurchaseOrder(data));
    }
    const order = { id: Date.now().toString(), ...req.body };
    db.purchaseOrders.push(order);
    res.json(order);
  });
  app.put("/api/purchase-orders/:id/status", async (req, res) => {
    if (useSupabaseDb) {
      const client = getRequestSupabase(req);
      if (!client) return res.status(503).json({ error: "Supabase is not configured" });
      const { data, error } = await client.from("purchase_orders").update({ status: req.body.status }).eq("id", (req.params as any).id).select("*").single();
      if (error) return res.status(500).json({ error: error.message });
      return res.json(toPurchaseOrder(data));
    }
    const idx = db.purchaseOrders.findIndex(o => o.id === (req.params as any).id);
    if (idx > -1) {
      db.purchaseOrders[idx].status = req.body.status;
      res.json(db.purchaseOrders[idx]);
    } else {
      res.status(404).json({ error: 'Not found' });
    }
  });

  // Batches
  app.post("/api/batches", async (req, res) => {
    if (useSupabaseDb) {
      const client = getRequestSupabase(req);
      if (!client) return res.status(503).json({ error: "Supabase is not configured" });
      const { data, error } = await client.from("batches").insert(stripUndefined(fromBatch(req.body))).select("*").single();
      if (error) return res.status(500).json({ error: error.message });
      return res.json(toBatch(data));
    }
    const batch = { id: Date.now().toString(), ...req.body };
    db.batches.push(batch);
    res.json(batch);
  });

  // Rutas de API inexistentes: siempre JSON 404 (nunca el HTML de la SPA).
  app.use('/api', (_req, res) => {
    res.status(404).json({ error: 'Ruta no encontrada', code: 'NOT_FOUND' });
  });

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
