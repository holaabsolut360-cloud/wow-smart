-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- COMPANIES
CREATE TABLE companies (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  plan TEXT DEFAULT 'free',
  business_type TEXT,
  color TEXT DEFAULT '#8b5cf6',
  whatsapp TEXT,
  logo TEXT,
  banner TEXT,
  description TEXT,
  email TEXT,
  website TEXT,
  address TEXT,
  hours TEXT,
  social_links JSONB DEFAULT '[]'::jsonb,
  instagram TEXT,
  facebook TEXT,
  tiktok TEXT,
  yape_number TEXT,
  yape_qr TEXT,
  plin_number TEXT,
  plin_qr TEXT,
  bank_name TEXT,
  bank_account TEXT,
  country_code TEXT,
  tax_rate NUMERIC DEFAULT 18,
  currency TEXT DEFAULT 'S/',
  categories JSONB DEFAULT '[]'::jsonb,
  coupons JSONB DEFAULT '[]'::jsonb,
  store_hours_type TEXT DEFAULT '24h',
  store_schedule JSONB DEFAULT '{}'::jsonb,
  subscription_status TEXT DEFAULT 'Activa',
  subscription_ends_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- RLS para Companies
ALTER TABLE companies ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Usuarios pueden ver sus propias empresas" ON companies FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Usuarios pueden actualizar sus propias empresas" ON companies FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Catálogo público de empresas" ON companies FOR SELECT USING (true); -- Cualquiera puede ver la empresa por el slug

-- SYSTEM USERS (Roles)
CREATE TABLE system_users (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  company_id UUID REFERENCES companies(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  role TEXT NOT NULL CHECK (role IN ('Administrador', 'Cajero', 'Vendedor', 'Supervisor')),
  status TEXT NOT NULL DEFAULT 'Activo' CHECK (status IN ('Activo', 'Suspendido')),
  last_login TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE system_users ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Compañía puede gestionar usuarios" ON system_users FOR ALL USING (
  EXISTS (SELECT 1 FROM companies WHERE companies.id = system_users.company_id AND companies.user_id = auth.uid())
);

-- PRODUCTS
CREATE TABLE products (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  company_id UUID REFERENCES companies(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  sku TEXT,
  barcode TEXT,
  item_type TEXT NOT NULL DEFAULT 'Producto' CHECK (item_type IN ('Producto', 'Servicio')),
  purchase_cost NUMERIC,
  margin_percent NUMERIC,
  tax_rate NUMERIC DEFAULT 18,
  price NUMERIC NOT NULL,
  sale_price NUMERIC,
  category TEXT,
  image TEXT,
  stock INTEGER,
  variants JSONB DEFAULT '[]'::jsonb,
  recipe JSONB DEFAULT '[]'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE products ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Gestión de productos por compañía" ON products FOR ALL USING (
  EXISTS (SELECT 1 FROM companies WHERE companies.id = products.company_id AND companies.user_id = auth.uid())
);
CREATE POLICY "Catálogo público de productos" ON products FOR SELECT USING (true);

-- CUSTOMERS
CREATE TABLE customers (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  company_id UUID REFERENCES companies(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  phone TEXT,
  email TEXT,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE customers ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Gestión de clientes por compañía" ON customers FOR ALL USING (
  EXISTS (SELECT 1 FROM companies WHERE companies.id = customers.company_id AND companies.user_id = auth.uid())
);

-- ORDERS
CREATE TABLE orders (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  company_id UUID REFERENCES companies(id) ON DELETE CASCADE,
  customer_name TEXT NOT NULL,
  customer_phone TEXT,
  delivery_method TEXT NOT NULL CHECK (delivery_method IN ('delivery', 'pickup')),
  address TEXT,
  reference TEXT,
  items JSONB NOT NULL DEFAULT '[]'::jsonb,
  subtotal NUMERIC NOT NULL,
  discount NUMERIC DEFAULT 0,
  tax NUMERIC DEFAULT 0,
  total NUMERIC NOT NULL,
  coupon_code TEXT,
  status TEXT NOT NULL DEFAULT 'Pendiente' CHECK (status IN ('Pendiente', 'Pagado', 'Enviado', 'Entregado', 'Cancelado')),
  type TEXT DEFAULT 'online',
  payment_method TEXT,
  amount_paid NUMERIC DEFAULT 0,
  seller_name TEXT,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE orders ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Gestión de pedidos por compañía" ON orders FOR ALL USING (
  EXISTS (SELECT 1 FROM companies WHERE companies.id = orders.company_id AND companies.user_id = auth.uid())
);
CREATE POLICY "Creación de pedidos públicos" ON orders FOR INSERT WITH CHECK (true); -- Los clientes pueden crear pedidos en el catálogo

-- EXPENSES
CREATE TABLE expenses (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  company_id UUID REFERENCES companies(id) ON DELETE CASCADE,
  concept TEXT NOT NULL,
  amount NUMERIC NOT NULL,
  date DATE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE expenses ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Gestión de gastos por compañía" ON expenses FOR ALL USING (
  EXISTS (SELECT 1 FROM companies WHERE companies.id = expenses.company_id AND companies.user_id = auth.uid())
);


-- DEBTS
CREATE TABLE debts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  company_id UUID REFERENCES companies(id) ON DELETE CASCADE,
  customer_id UUID REFERENCES customers(id) ON DELETE CASCADE,
  amount NUMERIC NOT NULL,
  remaining_amount NUMERIC NOT NULL,
  reason TEXT NOT NULL,
  due_date DATE,
  status TEXT NOT NULL DEFAULT 'Pendiente' CHECK (status IN ('Pendiente', 'Pagado', 'Vencido')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE debts ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Gestión de deudas por compañía" ON debts FOR ALL USING (
  EXISTS (SELECT 1 FROM companies WHERE companies.id = debts.company_id AND companies.user_id = auth.uid())
);

-- DEBT PAYMENTS
CREATE TABLE debt_payments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  debt_id UUID REFERENCES debts(id) ON DELETE CASCADE,
  amount NUMERIC NOT NULL,
  date DATE NOT NULL,
  method TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE debt_payments ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Gestión de pagos de deuda por compañía" ON debt_payments FOR ALL USING (
  EXISTS (SELECT 1 FROM debts JOIN companies ON debts.company_id = companies.id WHERE debts.id = debt_payments.debt_id AND companies.user_id = auth.uid())
);

-- INGREDIENTS
CREATE TABLE ingredients (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  company_id UUID REFERENCES companies(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  unit TEXT NOT NULL,
  stock NUMERIC NOT NULL DEFAULT 0,
  cost NUMERIC NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE ingredients ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Gestión de insumos por compañía" ON ingredients FOR ALL USING (
  EXISTS (SELECT 1 FROM companies WHERE companies.id = ingredients.company_id AND companies.user_id = auth.uid())
);

-- INVENTORY MOVEMENTS
CREATE TABLE inventory_movements (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  company_id UUID REFERENCES companies(id) ON DELETE CASCADE,
  product_id UUID REFERENCES products(id) ON DELETE CASCADE,
  type TEXT NOT NULL CHECK (type IN ('Entrada', 'Salida')),
  qty NUMERIC NOT NULL,
  reason TEXT NOT NULL,
  date DATE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE inventory_movements ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Gestión de inventario por compañía" ON inventory_movements FOR ALL USING (
  EXISTS (SELECT 1 FROM companies WHERE companies.id = inventory_movements.company_id AND companies.user_id = auth.uid())
);

-- CRM DEALS
CREATE TABLE crm_deals (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  company_id UUID REFERENCES companies(id) ON DELETE CASCADE,
  customer_id UUID REFERENCES customers(id) ON DELETE SET NULL,
  customer_name TEXT NOT NULL,
  customer_phone TEXT,
  customer_email TEXT,
  title TEXT NOT NULL,
  value NUMERIC NOT NULL DEFAULT 0,
  stage TEXT NOT NULL CHECK (stage IN ('Nuevo', 'Contactado', 'En Negociación', 'Ganado', 'Perdido')),
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE crm_deals ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Gestión de CRM por compañía" ON crm_deals FOR ALL USING (
  EXISTS (SELECT 1 FROM companies WHERE companies.id = crm_deals.company_id AND companies.user_id = auth.uid())
);

-- AUDIT LOGS
CREATE TABLE audit_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  company_id UUID REFERENCES companies(id) ON DELETE CASCADE,
  user_id UUID,
  user_name TEXT NOT NULL,
  action TEXT NOT NULL,
  resource TEXT NOT NULL,
  details TEXT NOT NULL,
  timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Ver auditoría por compañía" ON audit_logs FOR SELECT USING (
  EXISTS (SELECT 1 FROM companies WHERE companies.id = audit_logs.company_id AND companies.user_id = auth.uid())
);

