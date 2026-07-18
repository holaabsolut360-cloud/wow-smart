// Central place to read environment variables for the layered backend.
// Keeping this separate from the legacy top-level consts in server.ts
// avoids a risky refactor of the existing routes while every *new* feature
// (subscriptions, payments, feature flags, cron) is built on top of this.

export const env = {
  isProduction: process.env.NODE_ENV === "production",
  supabaseUrl: process.env.SUPABASE_URL || "",
  supabaseAnonKey: process.env.SUPABASE_ANON_KEY || "",
  supabaseServiceRoleKey: process.env.SUPABASE_SERVICE_ROLE_KEY || "",
  resendApiKey: process.env.RESEND_API_KEY || "",
  emailFrom: process.env.EMAIL_FROM || "WowSmart <onboarding@resend.dev>",
  cronSecret: process.env.CRON_SECRET || "",
  superAdminSessionSecret: process.env.SUPERADMIN_SESSION_SECRET || "",
  superAdminCookieName: "wowsmart_sa",
  trialDurationBusinessDays: Number(process.env.TRIAL_DURATION_BUSINESS_DAYS || 15),
  billingCycleDays: Number(process.env.BILLING_CYCLE_DAYS || 30),

  // Payment proof uploads (Supabase Storage)
  paymentProofsBucket: process.env.PAYMENT_PROOFS_BUCKET || "payment-proofs",
  maxProofFileSizeBytes: Number(process.env.MAX_PROOF_FILE_SIZE_MB || 5) * 1024 * 1024,
  allowedProofMimeTypes: (
    process.env.ALLOWED_PROOF_MIME_TYPES || "image/jpeg,image/png,image/webp,application/pdf"
  )
    .split(",")
    .map(t => t.trim())
    .filter(Boolean),
  proofSignedUrlTtlSeconds: Number(process.env.PROOF_SIGNED_URL_TTL_SECONDS || 300),

  // Where "new payment proof" notifications go.
  superAdminNotificationEmail: process.env.SUPERADMIN_NOTIFICATION_EMAIL || process.env.SUPERADMIN_EMAIL || "",
};

export const useSupabaseDb = Boolean(env.supabaseUrl && env.supabaseAnonKey);
