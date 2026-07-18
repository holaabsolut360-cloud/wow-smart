-- Production hardening for WowSmart.
-- Run this after the initial schema migration.

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Compatibility for existing projects that created companies.owner_id instead
-- of companies.user_id.
DO $$
BEGIN
  IF to_regclass('public.companies') IS NOT NULL THEN
    IF NOT EXISTS (
      SELECT 1
      FROM information_schema.columns
      WHERE table_schema = 'public'
      AND table_name = 'companies'
      AND column_name = 'user_id'
    ) THEN
      ALTER TABLE public.companies ADD COLUMN user_id UUID;
    END IF;

    IF EXISTS (
      SELECT 1
      FROM information_schema.columns
      WHERE table_schema = 'public'
      AND table_name = 'companies'
      AND column_name = 'owner_id'
    ) THEN
      UPDATE public.companies
      SET user_id = owner_id
      WHERE user_id IS NULL;
    END IF;

    IF NOT EXISTS (
      SELECT 1
      FROM pg_constraint
      WHERE conname = 'companies_user_id_fkey'
    ) THEN
      ALTER TABLE public.companies
      ADD CONSTRAINT companies_user_id_fkey
      FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;
    END IF;
  END IF;
END $$;

-- Some Supabase templates create recursive policies on profiles. If present,
-- replace them with direct user-owned policies.
DO $$
DECLARE
  policy_name text;
BEGIN
  IF to_regclass('public.profiles') IS NOT NULL THEN
    FOR policy_name IN
      SELECT policyname
      FROM pg_policies
      WHERE schemaname = 'public' AND tablename = 'profiles'
    LOOP
      EXECUTE format('DROP POLICY IF EXISTS %I ON public.profiles', policy_name);
    END LOOP;

    ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

    DROP POLICY IF EXISTS "profiles_select_own" ON public.profiles;
    DROP POLICY IF EXISTS "profiles_insert_own" ON public.profiles;
    DROP POLICY IF EXISTS "profiles_update_own" ON public.profiles;

    CREATE POLICY "profiles_select_own"
      ON public.profiles FOR SELECT
      USING (id = auth.uid());

    CREATE POLICY "profiles_insert_own"
      ON public.profiles FOR INSERT
      WITH CHECK (id = auth.uid());

    CREATE POLICY "profiles_update_own"
      ON public.profiles FOR UPDATE
      USING (id = auth.uid())
      WITH CHECK (id = auth.uid());
  END IF;
END $$;

-- Align columns with the current application model.
ALTER TABLE companies
  ADD COLUMN IF NOT EXISTS meta_title TEXT,
  ADD COLUMN IF NOT EXISTS meta_description TEXT,
  ADD COLUMN IF NOT EXISTS google_analytics_id TEXT,
  ADD COLUMN IF NOT EXISTS meta_pixel_id TEXT,
  ADD COLUMN IF NOT EXISTS country_code TEXT,
  ADD COLUMN IF NOT EXISTS tax_rate NUMERIC DEFAULT 18;

ALTER TABLE products
  ADD COLUMN IF NOT EXISTS min_stock INTEGER,
  ADD COLUMN IF NOT EXISTS item_type TEXT DEFAULT 'Producto',
  ADD COLUMN IF NOT EXISTS purchase_cost NUMERIC,
  ADD COLUMN IF NOT EXISTS margin_percent NUMERIC,
  ADD COLUMN IF NOT EXISTS tax_rate NUMERIC DEFAULT 18;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'products_item_type_check'
  ) THEN
    ALTER TABLE products
      ADD CONSTRAINT products_item_type_check
      CHECK (item_type IN ('Producto', 'Servicio'));
  END IF;
END $$;

ALTER TABLE customers
  ADD COLUMN IF NOT EXISTS document_number TEXT;

ALTER TABLE ingredients
  ADD COLUMN IF NOT EXISTS min_stock NUMERIC;

CREATE TABLE IF NOT EXISTS suppliers (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  company_id UUID REFERENCES companies(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  contact TEXT,
  phone TEXT,
  email TEXT,
  address TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS purchase_orders (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  company_id UUID REFERENCES companies(id) ON DELETE CASCADE,
  supplier_id UUID REFERENCES suppliers(id) ON DELETE SET NULL,
  items JSONB NOT NULL DEFAULT '[]'::jsonb,
  total NUMERIC NOT NULL DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'Borrador' CHECK (status IN ('Borrador', 'Enviada', 'Recibida', 'Cancelada')),
  expected_date DATE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS batches (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  company_id UUID REFERENCES companies(id) ON DELETE CASCADE,
  product_id UUID REFERENCES products(id) ON DELETE CASCADE,
  ingredient_id UUID REFERENCES ingredients(id) ON DELETE CASCADE,
  batch_number TEXT NOT NULL,
  qty NUMERIC NOT NULL DEFAULT 0,
  expiration_date DATE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE suppliers ENABLE ROW LEVEL SECURITY;
ALTER TABLE purchase_orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE batches ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Catálogo público de empresas" ON companies;
CREATE POLICY "catalog_public_companies"
  ON companies FOR SELECT
  USING (true);

DROP POLICY IF EXISTS "Catálogo público de productos" ON products;
CREATE POLICY "catalog_public_products"
  ON products FOR SELECT
  USING (true);

DROP POLICY IF EXISTS "Creación de pedidos públicos" ON orders;
CREATE POLICY "catalog_public_order_insert"
  ON orders FOR INSERT
  WITH CHECK (true);

DROP POLICY IF EXISTS "suppliers_company_access" ON suppliers;
CREATE POLICY "suppliers_company_access"
  ON suppliers FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM companies
      WHERE companies.id = suppliers.company_id
      AND companies.user_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM companies
      WHERE companies.id = suppliers.company_id
      AND companies.user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "purchase_orders_company_access" ON purchase_orders;
CREATE POLICY "purchase_orders_company_access"
  ON purchase_orders FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM companies
      WHERE companies.id = purchase_orders.company_id
      AND companies.user_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM companies
      WHERE companies.id = purchase_orders.company_id
      AND companies.user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "batches_company_access" ON batches;
CREATE POLICY "batches_company_access"
  ON batches FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM companies
      WHERE companies.id = batches.company_id
      AND companies.user_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM companies
      WHERE companies.id = batches.company_id
      AND companies.user_id = auth.uid()
    )
  );
