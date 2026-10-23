/**
 * SQL Schema for DHAQAN-KAABA Hair-Care Retail Management System
 * To be run once in the Supabase Dashboard -> SQL Editor.
 * Includes Row Level Security (RLS) policies allowing access via publishable/anon key.
 */
export const SUPABASE_SQL_SCHEMA = `-- ========================================================
-- DHAQAN-KAABA Hair-Care Retail Management System
-- Supabase PostgreSQL Schema & Security Policies (RLS)
-- ========================================================

-- 1. Products Table (7-da badeeco & kuwa cusub)
CREATE TABLE IF NOT EXISTS products (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  cost_price NUMERIC(12, 2) NOT NULL DEFAULT 0,
  current_stock INT NOT NULL DEFAULT 0,
  min_stock_level INT NOT NULL DEFAULT 5,
  active BOOLEAN NOT NULL DEFAULT TRUE,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Business Settings Table
CREATE TABLE IF NOT EXISTS business_settings (
  id TEXT PRIMARY KEY DEFAULT 'settings_default',
  business_name TEXT NOT NULL DEFAULT 'DHAQAN-KAABA',
  phone TEXT DEFAULT '0615123456',
  address TEXT DEFAULT 'Mogadishu, Somalia',
  currency TEXT DEFAULT 'USD',
  currency_symbol TEXT DEFAULT '$',
  invoice_prefix TEXT DEFAULT 'DK-INV-',
  purchase_prefix TEXT DEFAULT 'DK-PO-',
  next_invoice_number INT DEFAULT 1001,
  next_purchase_number INT DEFAULT 501,
  receipt_footer_note TEXT DEFAULT 'Waad ku mahadsan tahay booqashadaada!',
  has_completed_setup BOOLEAN DEFAULT FALSE,
  admin_password_hash TEXT,
  admin_salt TEXT,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. Sales Invoices Table
CREATE TABLE IF NOT EXISTS sales (
  id TEXT PRIMARY KEY,
  invoice_number TEXT NOT NULL UNIQUE,
  date DATE NOT NULL,
  time TIME NOT NULL,
  customer_phone TEXT NOT NULL,
  customer_name TEXT,
  subtotal NUMERIC(12, 2) NOT NULL,
  grand_total NUMERIC(12, 2) NOT NULL,
  total_cost NUMERIC(12, 2) NOT NULL,
  gross_profit NUMERIC(12, 2) NOT NULL,
  payment_status TEXT NOT NULL,
  credit_note TEXT,
  created_by TEXT NOT NULL DEFAULT 'OPERATOR',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. Sale Items Table
CREATE TABLE IF NOT EXISTS sale_items (
  id TEXT PRIMARY KEY,
  sale_id TEXT NOT NULL REFERENCES sales(id) ON DELETE CASCADE,
  product_id TEXT NOT NULL REFERENCES products(id),
  product_name TEXT NOT NULL,
  quantity INT NOT NULL,
  unit_cost NUMERIC(12, 2) NOT NULL,
  unit_price NUMERIC(12, 2) NOT NULL,
  line_total NUMERIC(12, 2) NOT NULL,
  line_cost_total NUMERIC(12, 2) NOT NULL,
  line_profit NUMERIC(12, 2) NOT NULL
);

-- 5. Purchases Table
CREATE TABLE IF NOT EXISTS purchases (
  id TEXT PRIMARY KEY,
  purchase_number TEXT NOT NULL UNIQUE,
  date DATE NOT NULL,
  supplier_name TEXT,
  total_cost NUMERIC(12, 2) NOT NULL,
  payment_status TEXT NOT NULL,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 6. Purchase Items Table
CREATE TABLE IF NOT EXISTS purchase_items (
  id TEXT PRIMARY KEY,
  purchase_id TEXT NOT NULL REFERENCES purchases(id) ON DELETE CASCADE,
  product_id TEXT NOT NULL REFERENCES products(id),
  product_name TEXT NOT NULL,
  quantity INT NOT NULL,
  unit_cost NUMERIC(12, 2) NOT NULL,
  total_cost NUMERIC(12, 2) NOT NULL
);

-- 7. Expenses Table
CREATE TABLE IF NOT EXISTS expenses (
  id TEXT PRIMARY KEY,
  date DATE NOT NULL,
  category TEXT NOT NULL,
  description TEXT NOT NULL,
  amount NUMERIC(12, 2) NOT NULL,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 8. Cash Transactions Table
CREATE TABLE IF NOT EXISTS cash_transactions (
  id TEXT PRIMARY KEY,
  date DATE NOT NULL,
  time TIME NOT NULL,
  type TEXT NOT NULL,
  direction TEXT NOT NULL,
  amount NUMERIC(12, 2) NOT NULL,
  description TEXT NOT NULL,
  reference TEXT,
  running_balance NUMERIC(12, 2) NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 9. Accounts Receivable Table (Daymaha Macaamiisha)
CREATE TABLE IF NOT EXISTS accounts_receivable (
  id TEXT PRIMARY KEY,
  customer_phone TEXT NOT NULL,
  customer_name TEXT,
  sale_id TEXT REFERENCES sales(id) ON DELETE SET NULL,
  invoice_number TEXT,
  original_amount NUMERIC(12, 2) NOT NULL,
  amount_paid NUMERIC(12, 2) NOT NULL DEFAULT 0,
  outstanding_balance NUMERIC(12, 2) NOT NULL,
  date DATE NOT NULL,
  status TEXT NOT NULL,
  description TEXT,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 10. Receivable Payments Table
CREATE TABLE IF NOT EXISTS receivable_payments (
  id TEXT PRIMARY KEY,
  receivable_id TEXT NOT NULL REFERENCES accounts_receivable(id) ON DELETE CASCADE,
  amount NUMERIC(12, 2) NOT NULL,
  date DATE NOT NULL,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 11. Accounts Payable Table (Daymaha Alaab-qeybiyeyaasha)
CREATE TABLE IF NOT EXISTS accounts_payable (
  id TEXT PRIMARY KEY,
  supplier_name TEXT NOT NULL,
  purchase_id TEXT REFERENCES purchases(id) ON DELETE SET NULL,
  purchase_number TEXT,
  original_amount NUMERIC(12, 2) NOT NULL,
  amount_paid NUMERIC(12, 2) NOT NULL DEFAULT 0,
  outstanding_balance NUMERIC(12, 2) NOT NULL,
  date DATE NOT NULL,
  status TEXT NOT NULL,
  description TEXT,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 12. Payable Payments Table
CREATE TABLE IF NOT EXISTS payable_payments (
  id TEXT PRIMARY KEY,
  payable_id TEXT NOT NULL REFERENCES accounts_payable(id) ON DELETE CASCADE,
  amount NUMERIC(12, 2) NOT NULL,
  date DATE NOT NULL,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 13. Stock Movements Table
CREATE TABLE IF NOT EXISTS stock_movements (
  id TEXT PRIMARY KEY,
  product_id TEXT NOT NULL REFERENCES products(id),
  product_name TEXT NOT NULL,
  date DATE NOT NULL,
  time TIME NOT NULL,
  transaction_type TEXT NOT NULL,
  reference_number TEXT,
  quantity_in INT NOT NULL DEFAULT 0,
  quantity_out INT NOT NULL DEFAULT 0,
  previous_stock INT NOT NULL,
  current_stock INT NOT NULL,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ========================================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- Ammaan adag: Oggolow akhrinta iyo qorista kaliya kuwa haysta
-- Publishable Key (sb_publishable_...) ama Anon Key.
-- Weligaa looma baahna mana la isticmaalayo Secret/Service Role Key.
-- ========================================================

ALTER TABLE products ENABLE ROW LEVEL SECURITY;
ALTER TABLE business_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE sales ENABLE ROW LEVEL SECURITY;
ALTER TABLE sale_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE purchases ENABLE ROW LEVEL SECURITY;
ALTER TABLE purchase_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE expenses ENABLE ROW LEVEL SECURITY;
ALTER TABLE cash_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE accounts_receivable ENABLE ROW LEVEL SECURITY;
ALTER TABLE receivable_payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE accounts_payable ENABLE ROW LEVEL SECURITY;
ALTER TABLE payable_payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE stock_movements ENABLE ROW LEVEL SECURITY;

-- Abuur ama dib u cusboonaysii Policies-ka
DO $$
DECLARE
  tbl text;
BEGIN
  FOR tbl IN 
    SELECT unnest(ARRAY[
      'products', 'business_settings', 'sales', 'sale_items', 
      'purchases', 'purchase_items', 'expenses', 'cash_transactions', 
      'accounts_receivable', 'receivable_payments', 'accounts_payable', 
      'payable_payments', 'stock_movements'
    ])
  LOOP
    EXECUTE format('DROP POLICY IF EXISTS "DHAQAN_KAABA_access" ON %I;', tbl);
    EXECUTE format('CREATE POLICY "DHAQAN_KAABA_access" ON %I FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);', tbl);
  END LOOP;
END $$;

-- ========================================================
-- REALTIME SUBSCRIPTIONS
-- Si labada computer ay isla markiiba u arkaan xogta cusub
-- ========================================================
DO $$
BEGIN
  BEGIN
    ALTER PUBLICATION supabase_realtime ADD TABLE 
      products, business_settings, sales, sale_items, 
      purchases, purchase_items, expenses, cash_transactions, 
      accounts_receivable, accounts_payable, stock_movements;
  EXCEPTION
    WHEN duplicate_object THEN
      NULL;
  END;
END $$;
`;
