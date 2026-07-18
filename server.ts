import { createClient } from "@supabase/supabase-js";
import "dotenv/config";
import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { Resend } from 'resend';

const isProduction = process.env.NODE_ENV === "production";
const requiredServerEnv = ["SUPABASE_URL", "SUPABASE_ANON_KEY"];
const missingServerEnv = requiredServerEnv.filter(key => !process.env[key]);

if (isProduction && missingServerEnv.length > 0) {
  throw new Error(`Missing required production environment variables: ${missingServerEnv.join(", ")}`);
}

const resend = process.env.RESEND_API_KEY ? new Resend(process.env.RESEND_API_KEY) : null;


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

async function startServer() {
  const app = express();
  const PORT = Number(process.env.PORT || 3000);

  app.use(express.json({ limit: '50mb' }));

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

const isSuperAdminRequest = (req: express.Request) => {
  const rawToken = getCookieValue(req, superAdminCookieName);
  if (!rawToken) return false;

  let token = rawToken;
  try {
    token = decodeURIComponent(rawToken);
  } catch {
    // Si no se puede decodificar, se compara tal cual llegó.
  }

  return Boolean(superAdminSessionSecret && token === superAdminSessionSecret);
};

const setSuperAdminCookie = (res: express.Response) => {
  const secure = isProduction ? "; Secure" : "";
  res.setHeader(
    "Set-Cookie",
    `${superAdminCookieName}=${encodeURIComponent(superAdminSessionSecret)}; HttpOnly; SameSite=Strict; Path=/; Max-Age=28800${secure}`,
  );
};

const clearSuperAdminCookie = (res: express.Response) => {
  const secure = isProduction ? "; Secure" : "";
  res.setHeader(
    "Set-Cookie",
    `${superAdminCookieName}=; HttpOnly; SameSite=Strict; Path=/; Max-Age=0${secure}`,
  );
};

const requireSuperAdmin = (req: express.Request, res: express.Response, next: express.NextFunction) => {
  if (!isSuperAdminRequest(req)) {
    return res.status(401).json({ error: "Unauthorized" });
  }

  next();
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
  notes: row.notes,
  createdAt: row.created_at,
});

const fromCustomer = (customer: any) => ({
  company_id: customer.companyId,
  name: customer.name,
  phone: customer.phone,
  email: customer.email,
  notes: customer.notes,
});

const toOrder = (row: any) => row && ({
  id: row.id,
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
  status: order.status || 'Pendiente',
  type: order.type || 'online',
  payment_method: order.paymentMethod,
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
    req.path === '/approve-subscription' ||
    (req.method === 'GET' && req.path === '/products') ||
    (req.method === 'POST' && req.path === '/orders');

  if (publicApiRoute) {
    return next();
  }

  if (!supabase) {
    if (isProduction) {
      return res.status(503).json({ error: "Authentication is not configured" });
    }
    console.warn("Supabase credentials not found. Skipping auth for development.");
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
  matchesPath(path, '/subscription-payments')
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

  if (isTrialExpired) {
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
  const isBlocked = effectiveStatus === 'Vencida' || effectiveStatus === 'Suspendida';

  if (isBlocked && !isBillingRoute(path)) {
    return res.status(402).json({
      error: 'Tu suscripción está vencida. Debes activar uno de los planes para continuar.',
      code: 'SUBSCRIPTION_REQUIRED',
      subscriptionStatus: effectiveStatus,
    });
  }

  next();
};


  app.use('/api', authMiddleware);
  app.use('/api', subscriptionGuard);

  app.get("/api/superadmin/session", (req, res) => {
    res.json({ authenticated: isSuperAdminRequest(req) });
  });

  app.post("/api/superadmin/login", (req, res) => {
    if (!superAdminEmail || !superAdminPassword || !superAdminSessionSecret) {
      return res.status(503).json({ error: "SuperAdmin access is not configured" });
    }

    const { email, password } = req.body || {};
    if (email !== superAdminEmail || password !== superAdminPassword) {
      return res.status(401).json({ error: "Invalid credentials" });
    }

    setSuperAdminCookie(res);
    res.json({ authenticated: true });
  });

  // Registrar un comprobante de pago desde el Checkout del cliente
  app.post("/api/subscription-payments", async (req, res) => {
    const user = (req as any).user;
    if (!user) return res.status(401).json({ error: "Unauthorized" });

    const { businessName, plan, amount, paymentMethod, reference } = req.body || {};
    if (!businessName || !plan) {
      return res.status(400).json({ error: "businessName y plan son requeridos" });
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
      amount: Number(amount) || 0,
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
    }));

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

    const vencimiento = new Date();
    vencimiento.setDate(vencimiento.getDate() + 30);

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

    if (resend && payment.email) {
      try {
        await resend.emails.send({
          from: 'WowSmart <onboarding@resend.dev>',
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

    const { error } = await client
      .from("subscription_payments")
      .update({ status: "Rechazado", reviewed_at: new Date().toISOString() })
      .eq("id", req.params.id);

    if (error) return res.status(500).json({ error: error.message });
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
      .select("id, subscription_status, subscription_ends_at")
      .single();

    if (error) return res.status(500).json({ error: error.message });
    if (!data) return res.status(404).json({ error: "Empresa no encontrada" });

    res.json({ id: data.id, estado: data.subscription_status, vencimiento: data.subscription_ends_at });
  });


  app.get("/api/superadmin/suscripciones", requireSuperAdmin, async (_req, res) => {
    if (!useSupabaseDb) {
      const suscripciones = db.companies.map((c: any) => ({
        id: c.id,
        empresa: c.name,
        plan: c.plan,
        estado: c.subscriptionStatus || "Activa",
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
        estado: c.subscription_status || "Activa",
        vencimiento: c.subscription_ends_at || "-",
        precio: latestPayment ? Number(latestPayment.amount || 0) : 0,
        metodoPago: latestPayment ? latestPayment.payment_method || "-" : "-",
      };
    });

    res.json({ data: suscripciones });
  });


  // Métricas reales del Dashboard SuperAdmin
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
      client.from("companies").select("id, subscription_status, created_at"),
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

    const suscripcionesActivas = companies.filter((c: any) => c.subscription_status === "Activa").length;
    const retencionPct = totalEmpresas > 0 ? Math.round((suscripcionesActivas / totalEmpresas) * 100) : 0;

    res.json({
      totalEmpresas,
      totalEmpresasCambioPct,
      ingresosMes,
      ingresosMesCambioPct,
      suscripcionesActivas,
      retencionPct,
      pagosPendientes: pendingPaymentsResult.count || 0,
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
      .select("id, name, plan, subscription_status, created_at")
      .order("created_at", { ascending: false });

    if (error) return res.status(500).json({ error: error.message });

    const empresas = (data || []).map((row: any) => ({
      id: row.id,
      nombre: row.name,
      plan: row.plan,
      estado: row.subscription_status || "Activa",
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
      .select("id, subscription_status")
      .single();

    if (error) return res.status(500).json({ error: error.message });
    if (!data) return res.status(404).json({ error: "Empresa no encontrada" });

    res.json({ id: data.id, estado: data.subscription_status });
  });

  app.get("/api/companies", (req, res) => {
    res.json(db.companies);
  });

  // Get company by slug
  app.get("/api/catalog/:slug", async (req, res) => {
    if (useSupabaseDb) {
      const client = getRequestSupabase(req);
      if (!client) return res.status(503).json({ error: "Supabase is not configured" });

      const { data: companyRow, error: companyError } = await client
        .from("companies")
        .select("*")
        .eq("slug", req.params.slug)
        .single();

      if (companyError || !companyRow) {
        return res.status(404).json({ error: "Catalog not found" });
      }

      const { data: productRows, error: productsError } = await client
        .from("products")
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
    
    const { name, isTrial } = req.body;
    
    const trialDays = 15;
    const endsAt = new Date();
    endsAt.setDate(endsAt.getDate() + trialDays);
    
    const company: any = {
      id: Date.now().toString(),
      userId: user.id,
      name: name || "Mi Nueva Empresa",
      slug: (name || "mi-empresa").toLowerCase().replace(/[^a-z0-9]+/g, "-") + "-" + Date.now(),
      // Keep billing plan compatible with DB CHECK constraint (companies_plan_check).
      plan: "Emprendedor",
      subscriptionStatus: isTrial ? "Prueba Gratuita" : "Activa",
      subscriptionEndsAt: isTrial ? endsAt.toISOString().split('T')[0] : "2026-08-15",
      businessType: "Restaurante",
      color: "#8b5cf6",
      whatsapp: "",
      logo: "",
      banner: "",
      instagram: "",
      facebook: "",
      //  // currency
    };

    if (useSupabaseDb) {
      const client = supabaseAdmin || getRequestSupabase(req);
      if (!client) return res.status(503).json({ error: "Supabase is not configured" });

      const { data, error } = await client
        .from("companies")
        .insert(stripUndefined(fromCompany(company)))
        .select("*")
        .single();

      if (error) return res.status(500).json({ error: error.message });
      return res.json(toCompany(data));
    }

    db.companies.push(company as any);
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

      let query = client
        .from("products")
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

  app.get("/api/expenses", (req, res) => {
    const companyId = (req.query as any).companyId;
    if (!companyId) return res.status(400).json({ error: "companyId required" });
    const result = db.expenses.filter(e => e.companyId === companyId).sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    res.json({ data: result });
  });

  app.get("/api/crm-deals", (req, res) => {
    const companyId = (req.query as any).companyId;
    if (!companyId) return res.status(400).json({ error: "companyId required" });
    const result = db.crmDeals.filter(d => d.companyId === companyId);
    res.json({ data: result });
  });

  app.get("/api/debts", (req, res) => {
    const companyId = (req.query as any).companyId;
    if (!companyId) return res.status(400).json({ error: "companyId required" });
    const result = db.debts.filter(d => d.companyId === companyId);
    res.json({ data: result });
  });

  app.get("/api/debt-payments", (req, res) => {
    const companyId = (req.query as any).companyId;
    if (!companyId) return res.status(400).json({ error: "companyId required" });
    const result = db.debtPayments.filter(p => p.companyId === companyId);
    res.json({ data: result });
  });

  app.get("/api/ingredients", (req, res) => {
    const companyId = (req.query as any).companyId;
    if (!companyId) return res.status(400).json({ error: "companyId required" });
    const result = db.ingredients.filter(i => i.companyId === companyId);
    res.json({ data: result });
  });

  app.get("/api/inventory-movements", (req, res) => {
    const companyId = (req.query as any).companyId;
    if (!companyId) return res.status(400).json({ error: "companyId required" });
    const result = db.inventoryMovements.filter(m => m.companyId === companyId).sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    res.json({ data: result });
  });

  app.get("/api/inventory-analytics", (req, res) => {
    const companyId = (req.query as any).companyId;
    if (!companyId) return res.status(400).json({ error: "companyId required" });
    const companyProducts = db.products.filter(p => p.companyId === companyId);
    const totalItems = companyProducts.length;
    const lowStock = companyProducts.filter(p => typeof p.stock === 'number' && typeof p.minStock === 'number' && p.stock <= p.minStock).length;
    const totalValue = companyProducts.reduce((sum, p) => sum + (p.price * (p.stock || 0)), 0);
    res.json({ data: { totalItems, lowStock, totalValue } });
  });

  app.get("/api/suppliers", (req, res) => {
    const companyId = (req.query as any).companyId;
    if (!companyId) return res.status(400).json({ error: "companyId required" });
    const result = db.suppliers.filter(s => s.companyId === companyId);
    res.json({ data: result });
  });

  app.get("/api/purchase-orders", (req, res) => {
    const companyId = (req.query as any).companyId;
    if (!companyId) return res.status(400).json({ error: "companyId required" });
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
    if (useSupabaseDb) {
      const client = getRequestSupabase(req);
      if (!client) return res.status(503).json({ error: "Supabase is not configured" });

      const { data, error } = await client
        .from("orders")
        .insert(stripUndefined(fromOrder(req.body)))
        .select("*")
        .single();

      if (error) return res.status(500).json({ error: error.message });
      return res.json(toOrder(data));
    }

    const newOrder = {
      id: Date.now().toString(),
      createdAt: new Date().toISOString(),
      status: req.body.status || 'Pendiente',
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

    db.orders.unshift(newOrder); // Add to beginning
    res.json(newOrder);
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
      return res.json(toOrder(data));
    }

    const idx = db.orders.findIndex(o => o.id === (req.params as any).id);
    if (idx !== -1) {
      db.orders[idx].status = req.body.status;
      addAuditLog(db.orders[idx].companyId, "ACTUALIZAR", "Pedidos", `Estado del pedido #${db.orders[idx].id} actualizado a ${req.body.status}`);
      res.json(db.orders[idx]);
    } else {
      res.status(404).json({ error: "Order not found" });
    }
  });

  // Add inventory movement
  app.post("/api/inventory-movements", (req, res) => {
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
  app.post("/api/ingredients", (req, res) => {
    const newIngredient = {
      id: Date.now().toString(),
      ...req.body
    };
    db.ingredients.unshift(newIngredient);
    addAuditLog(newIngredient.companyId, "CREAR", "Insumos", `Insumo '${newIngredient.name}' agregado`);
    res.json(newIngredient);
  });

  // Update ingredient
  app.put("/api/ingredients/:id", (req, res) => {
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
  app.delete("/api/ingredients/:id", (req, res) => {
    const ing = db.ingredients.find(i => i.id === (req.params as any).id);
    if (ing) {
      addAuditLog(ing.companyId, "ELIMINAR", "Insumos", `Insumo '${ing.name}' eliminado`);
    }
    db.ingredients = db.ingredients.filter(i => i.id !== (req.params as any).id);
    res.json({ success: true });
  });

  // Add expense
  app.post("/api/expenses", (req, res) => {
    const newExpense = {
      id: Date.now().toString(),
      ...req.body
    };
    db.expenses.unshift(newExpense);
    addAuditLog(newExpense.companyId, "CREAR", "Gastos", `Gasto de S/ ${newExpense.amount} registrado (${newExpense.concept})`);
    res.json(newExpense);
  });

  // Delete expense
  app.delete("/api/expenses/:id", (req, res) => {
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

  app.post("/api/crm-deals", (req, res) => {
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

  app.put("/api/crm-deals/:id", (req, res) => {
    const idx = db.crmDeals.findIndex(d => d.id === (req.params as any).id);
    if (idx !== -1) {
      db.crmDeals[idx] = { ...db.crmDeals[idx], ...req.body, updatedAt: new Date().toISOString() };
      addAuditLog(db.crmDeals[idx].companyId, "ACTUALIZAR", "CRM", `Oportunidad actualizada`);
      res.json(db.crmDeals[idx]);
    } else {
      res.status(404).json({ error: "Deal not found" });
    }
  });

  app.delete("/api/crm-deals/:id", (req, res) => {
    const deal = db.crmDeals.find(d => d.id === (req.params as any).id);
    if (deal) {
      addAuditLog(deal.companyId, "ELIMINAR", "CRM", `Oportunidad eliminada`);
    }
    db.crmDeals = db.crmDeals.filter(d => d.id !== (req.params as any).id);
    res.json({ success: true });
  });

  app.post("/api/debts", (req, res) => {
    const newDebt = {
      id: Date.now().toString(),
      status: 'Pendiente',
      ...req.body
    };
    db.debts.unshift(newDebt);
    addAuditLog(newDebt.companyId, "CREAR", "Deudas", `Deuda registrada por ${newDebt.amount}`);
    res.json(newDebt);
  });

  app.put("/api/debts/:id", (req, res) => {
    const idx = db.debts.findIndex(d => d.id === (req.params as any).id);
    if (idx !== -1) {
      db.debts[idx] = { ...db.debts[idx], ...req.body };
      addAuditLog(db.debts[idx].companyId, "ACTUALIZAR", "Deudas", `Deuda actualizada`);
      res.json(db.debts[idx]);
    } else {
      res.status(404).json({ error: "Debt not found" });
    }
  });

  app.post("/api/debt-payments", (req, res) => {
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
          from: 'WowSmart <onboarding@resend.dev>',
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
                <a href="${req.headers.origin || 'http://localhost:3000'}/dashboard" style="display: inline-block; background-color: #4f46e5; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: bold;">
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
        console.log('Simulating email send (No RESEND_API_KEY found)');
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
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  
  // Suppliers
  app.post("/api/suppliers", (req, res) => {
    const supplier = { id: Date.now().toString(), ...req.body };
    db.suppliers.push(supplier);
    res.json(supplier);
  });
  app.put("/api/suppliers/:id", (req, res) => {
    const idx = db.suppliers.findIndex(s => s.id === (req.params as any).id);
    if (idx > -1) {
      db.suppliers[idx] = { ...db.suppliers[idx], ...req.body };
      res.json(db.suppliers[idx]);
    } else {
      res.status(404).json({ error: 'Not found' });
    }
  });

  // Purchase Orders
  app.post("/api/purchase-orders", (req, res) => {
    const order = { id: Date.now().toString(), ...req.body };
    db.purchaseOrders.push(order);
    res.json(order);
  });
  app.put("/api/purchase-orders/:id/status", (req, res) => {
    const idx = db.purchaseOrders.findIndex(o => o.id === (req.params as any).id);
    if (idx > -1) {
      db.purchaseOrders[idx].status = req.body.status;
      res.json(db.purchaseOrders[idx]);
    } else {
      res.status(404).json({ error: 'Not found' });
    }
  });

  // Batches
  app.post("/api/batches", (req, res) => {
    const batch = { id: Date.now().toString(), ...req.body };
    db.batches.push(batch);
    res.json(batch);
  });

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
