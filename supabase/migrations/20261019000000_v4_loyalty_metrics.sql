-- WowSmart v4 — cambios ADITIVOS (no borran ni modifican datos existentes).
-- Ejecutar en Supabase > SQL Editor (proyecto bdpdwdcaocvnrtggctuw). Idempotente.

-- 1) Referidos: código propio por empresa y quién la invitó
ALTER TABLE public.companies ADD COLUMN IF NOT EXISTS referral_code text;
ALTER TABLE public.companies ADD COLUMN IF NOT EXISTS referred_by uuid NULL REFERENCES public.companies(id) ON DELETE SET NULL;
ALTER TABLE public.companies ADD COLUMN IF NOT EXISTS weekly_summary_opt_out boolean NOT NULL DEFAULT false;
CREATE UNIQUE INDEX IF NOT EXISTS companies_referral_code_key ON public.companies (referral_code) WHERE referral_code IS NOT NULL;

CREATE TABLE IF NOT EXISTS public.referrals (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  referrer_company_id uuid NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  referred_company_id uuid NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  code text NOT NULL,
  status text NOT NULL DEFAULT 'pendiente' CHECK (status IN ('pendiente','calificado','aprobado','rechazado')),
  created_at timestamptz NOT NULL DEFAULT now(),
  qualified_at timestamptz NULL,
  reviewed_at timestamptz NULL,
  UNIQUE (referred_company_id)
);
CREATE INDEX IF NOT EXISTS referrals_referrer_idx ON public.referrals (referrer_company_id);
ALTER TABLE public.referrals ENABLE ROW LEVEL SECURITY;
-- Solo lectura para el dueño que invitó; las escrituras las hace el servidor (service role).
DROP POLICY IF EXISTS referrals_owner_select ON public.referrals;
CREATE POLICY referrals_owner_select ON public.referrals FOR SELECT TO authenticated
  USING (referrer_company_id IN (SELECT id FROM public.companies WHERE user_id = auth.uid()));

-- 2) Plan anual con descuento de fidelidad
ALTER TABLE public.subscription_payments ADD COLUMN IF NOT EXISTS period_months integer NOT NULL DEFAULT 1;

-- 3) Cliente frecuente (opt-in del comprador en el catálogo)
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS frequent_opt_in boolean NOT NULL DEFAULT false;
CREATE INDEX IF NOT EXISTS orders_company_phone_idx ON public.orders (company_id, customer_phone);

-- 4) Índices para métricas de plataforma
CREATE INDEX IF NOT EXISTS catalog_events_created_idx ON public.catalog_events (created_at DESC);
CREATE INDEX IF NOT EXISTS orders_created_idx ON public.orders (created_at DESC);
