-- SaaS lifecycle: real payments, feature flags per plan, and prep for
-- multi-company-per-user. Deliberately reuses existing structures instead of
-- duplicating them:
--   * companies.plan              -> already the plan column (constraint:
--                                     'Emprendedor' | 'Negocio' | 'Empresa')
--   * companies.subscription_status -> already free-text ('Activa',
--                                     'Suspendida', 'Pendiente', 'Vencida',
--                                     'Prueba Gratuita'), no CHECK constraint,
--                                     so no migration needed to add the trial
--                                     states.
--   * companies.subscription_ends_at -> already the renewal/trial end date.
--   * audit_logs                  -> already exists with (company_id,
--                                     user_id, user_name, action, resource,
--                                     details, timestamp). AuditService
--                                     writes here directly, no new table.

-- =========================================================================
-- PAYMENTS (replaces the localStorage-only "pendingPayments" mechanism)
-- =========================================================================
CREATE TABLE IF NOT EXISTS payments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  company_id UUID REFERENCES companies(id) ON DELETE CASCADE,
  plan TEXT NOT NULL CHECK (plan IN ('Emprendedor', 'Negocio', 'Empresa')),
  amount NUMERIC NOT NULL,
  currency TEXT NOT NULL DEFAULT 'PEN',
  method TEXT NOT NULL,
  reference TEXT,
  proof_url TEXT,
  status TEXT NOT NULL DEFAULT 'Pendiente' CHECK (status IN ('Pendiente', 'Aprobado', 'Rechazado')),
  reviewed_by TEXT,
  reviewed_at TIMESTAMP WITH TIME ZONE,
  rejection_reason TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE payments ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "payments_select_own_company" ON payments;
CREATE POLICY "payments_select_own_company"
  ON payments FOR SELECT
  USING (
    EXISTS (SELECT 1 FROM companies WHERE companies.id = payments.company_id AND companies.user_id = auth.uid())
  );

DROP POLICY IF EXISTS "payments_insert_own_company" ON payments;
CREATE POLICY "payments_insert_own_company"
  ON payments FOR INSERT
  WITH CHECK (
    EXISTS (SELECT 1 FROM companies WHERE companies.id = payments.company_id AND companies.user_id = auth.uid())
  );

-- Approval/rejection is done exclusively via the backend using the Supabase
-- service role (SuperAdmin flow), which bypasses RLS, so no UPDATE policy
-- for regular users is defined on purpose.

CREATE INDEX IF NOT EXISTS idx_payments_status ON payments(status);
CREATE INDEX IF NOT EXISTS idx_payments_company ON payments(company_id);

-- =========================================================================
-- FEATURE FLAGS PER PLAN
-- =========================================================================
CREATE TABLE IF NOT EXISTS plan_features (
  plan TEXT NOT NULL CHECK (plan IN ('Emprendedor', 'Negocio', 'Empresa')),
  feature TEXT NOT NULL,
  enabled BOOLEAN NOT NULL DEFAULT true,
  PRIMARY KEY (plan, feature)
);

ALTER TABLE plan_features ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "plan_features_public_read" ON plan_features;
CREATE POLICY "plan_features_public_read"
  ON plan_features FOR SELECT
  USING (true);

-- Seed based on the feature lists already advertised on the pricing page
-- (src/pages/Landing.tsx). Safe to re-run.
INSERT INTO plan_features (plan, feature, enabled) VALUES
  ('Emprendedor', 'catalog', true),
  ('Emprendedor', 'whatsapp_orders', true),
  ('Emprendedor', 'qr_code', true),
  ('Emprendedor', 'pos', false),
  ('Emprendedor', 'inventory', false),
  ('Emprendedor', 'crm', false),
  ('Emprendedor', 'recipes', false),
  ('Emprendedor', 'multi_branch', false),
  ('Negocio', 'catalog', true),
  ('Negocio', 'whatsapp_orders', true),
  ('Negocio', 'qr_code', true),
  ('Negocio', 'pos', true),
  ('Negocio', 'inventory', true),
  ('Negocio', 'crm', true),
  ('Negocio', 'recipes', true),
  ('Negocio', 'multi_branch', false),
  ('Empresa', 'catalog', true),
  ('Empresa', 'whatsapp_orders', true),
  ('Empresa', 'qr_code', true),
  ('Empresa', 'pos', true),
  ('Empresa', 'inventory', true),
  ('Empresa', 'crm', true),
  ('Empresa', 'recipes', true),
  ('Empresa', 'multi_branch', true)
ON CONFLICT (plan, feature) DO UPDATE SET enabled = EXCLUDED.enabled;

-- =========================================================================
-- COMPANY MEMBERS (prep for multiple companies per user / multiple users
-- per company). Not enforced everywhere yet -- companies.user_id remains
-- the source of truth for now -- but the data is backfilled so the switch
-- can happen later without a data migration.
-- =========================================================================
CREATE TABLE IF NOT EXISTS company_members (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  company_id UUID REFERENCES companies(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  role TEXT NOT NULL DEFAULT 'Propietario' CHECK (role IN ('Propietario', 'Administrador', 'Cajero', 'Vendedor', 'Supervisor')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE (company_id, user_id)
);

ALTER TABLE company_members ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "company_members_self_access" ON company_members;
CREATE POLICY "company_members_self_access"
  ON company_members FOR SELECT
  USING (
    user_id = auth.uid()
    OR EXISTS (SELECT 1 FROM companies WHERE companies.id = company_members.company_id AND companies.user_id = auth.uid())
  );

-- Backfill existing owners as members so future queries can join on
-- company_members without losing anyone.
INSERT INTO company_members (company_id, user_id, role)
SELECT id, user_id, 'Propietario'
FROM companies
WHERE user_id IS NOT NULL
ON CONFLICT (company_id, user_id) DO NOTHING;

-- =========================================================================
-- Index to make the trial-expiry cron job cheap even as companies grow.
-- =========================================================================
CREATE INDEX IF NOT EXISTS idx_companies_subscription_lookup
  ON companies (subscription_status, subscription_ends_at);
