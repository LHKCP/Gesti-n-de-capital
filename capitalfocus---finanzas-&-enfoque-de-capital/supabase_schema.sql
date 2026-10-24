-- =====================================================================
-- CAPITALFOCUS - ESQUEMA DE BASE DE DATOS SUPABASE
-- =====================================================================
-- Instrucciones:
-- 1. Ve a tu panel de Supabase: https://supabase.com/dashboard
-- 2. Entra en tu proyecto y abre la pestaña "SQL Editor" (icono de consola a la izquierda).
-- 3. Crea una "New Query", pega todo este script y pulsa "Run" (ejecutar).
-- =====================================================================

-- 1. Tabla: profiles (perfil del usuario, configuración, PIN y divisas)
CREATE TABLE IF NOT EXISTS public.profiles (
  id TEXT PRIMARY KEY DEFAULT 'default_user',
  name TEXT NOT NULL DEFAULT 'Lucas Collazo',
  email TEXT DEFAULT 'collazolucas@gmail.com',
  avatar_url TEXT DEFAULT 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=160&q=80',
  bio TEXT DEFAULT 'Gestión patrimonial & finanzas personales',
  theme TEXT DEFAULT 'dark',
  pin_code TEXT DEFAULT '1234',
  currency TEXT DEFAULT '€',
  base_income NUMERIC DEFAULT 4250,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Tabla: transactions (ingresos y gastos diarios)
CREATE TABLE IF NOT EXISTS public.transactions (
  id TEXT PRIMARY KEY,
  profile_id TEXT REFERENCES public.profiles(id) ON DELETE CASCADE DEFAULT 'default_user',
  type TEXT NOT NULL CHECK (type IN ('expense', 'income')),
  amount NUMERIC NOT NULL,
  concept TEXT NOT NULL,
  category TEXT NOT NULL,
  date_str TEXT NOT NULL,
  time_str TEXT NOT NULL,
  icon TEXT DEFAULT 'payments',
  currency TEXT DEFAULT '€',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. Tabla: fixed_expenses (gastos fijos mensuales / recurrentes)
CREATE TABLE IF NOT EXISTS public.fixed_expenses (
  id TEXT PRIMARY KEY,
  profile_id TEXT REFERENCES public.profiles(id) ON DELETE CASCADE DEFAULT 'default_user',
  name TEXT NOT NULL,
  amount NUMERIC NOT NULL,
  category TEXT NOT NULL,
  due_date_note TEXT,
  icon TEXT DEFAULT 'receipt',
  applicable_months JSONB DEFAULT '[]'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. Tabla: fixed_incomes (ingresos fijos mensuales)
CREATE TABLE IF NOT EXISTS public.fixed_incomes (
  id TEXT PRIMARY KEY,
  profile_id TEXT REFERENCES public.profiles(id) ON DELETE CASCADE DEFAULT 'default_user',
  name TEXT NOT NULL,
  amount NUMERIC NOT NULL,
  category TEXT NOT NULL,
  periodicity_note TEXT,
  icon TEXT DEFAULT 'payments',
  applicable_months JSONB DEFAULT '[]'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 5. Tabla: savings_goals (metas de ahorro, fondos de emergencia, expediciones)
CREATE TABLE IF NOT EXISTS public.savings_goals (
  id TEXT PRIMARY KEY,
  profile_id TEXT REFERENCES public.profiles(id) ON DELETE CASCADE DEFAULT 'default_user',
  name TEXT NOT NULL,
  tag TEXT,
  current_amount NUMERIC DEFAULT 0,
  target_amount NUMERIC DEFAULT 0,
  monthly_contribution NUMERIC DEFAULT 0,
  target_date_str TEXT,
  icon TEXT DEFAULT 'savings',
  image_url TEXT,
  last_contribution_month TEXT,
  auto_contribute_enabled BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 6. Tabla: debts (gestión y amortización de deudas / créditos)
CREATE TABLE IF NOT EXISTS public.debts (
  id TEXT PRIMARY KEY,
  profile_id TEXT REFERENCES public.profiles(id) ON DELETE CASCADE DEFAULT 'default_user',
  name TEXT NOT NULL,
  interest_rate NUMERIC,
  initial_amount NUMERIC NOT NULL,
  amortized_amount NUMERIC DEFAULT 0,
  priority INTEGER DEFAULT 1,
  estimated_end_date TEXT,
  icon TEXT DEFAULT 'credit_card',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 7. Tabla: custom_categories (categorías personalizadas)
CREATE TABLE IF NOT EXISTS public.custom_categories (
  id TEXT PRIMARY KEY,
  profile_id TEXT REFERENCES public.profiles(id) ON DELETE CASCADE DEFAULT 'default_user',
  name TEXT NOT NULL,
  icon TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- =====================================================================
-- HABILITAR SEGURIDAD A NIVEL DE FILA (RLS)
-- =====================================================================
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.fixed_expenses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.fixed_incomes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.savings_goals ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.debts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.custom_categories ENABLE ROW LEVEL SECURITY;

-- Políticas de acceso para anon y authenticated (permite acceso con la Anon Public Key de Supabase)
DO $$
BEGIN
  -- Profiles
  DROP POLICY IF EXISTS "Allow all for profiles" ON public.profiles;
  CREATE POLICY "Allow all for profiles" ON public.profiles FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);

  -- Transactions
  DROP POLICY IF EXISTS "Allow all for transactions" ON public.transactions;
  CREATE POLICY "Allow all for transactions" ON public.transactions FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);

  -- Fixed Expenses
  DROP POLICY IF EXISTS "Allow all for fixed_expenses" ON public.fixed_expenses;
  CREATE POLICY "Allow all for fixed_expenses" ON public.fixed_expenses FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);

  -- Fixed Incomes
  DROP POLICY IF EXISTS "Allow all for fixed_incomes" ON public.fixed_incomes;
  CREATE POLICY "Allow all for fixed_incomes" ON public.fixed_incomes FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);

  -- Savings Goals
  DROP POLICY IF EXISTS "Allow all for savings_goals" ON public.savings_goals;
  CREATE POLICY "Allow all for savings_goals" ON public.savings_goals FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);

  -- Debts
  DROP POLICY IF EXISTS "Allow all for debts" ON public.debts;
  CREATE POLICY "Allow all for debts" ON public.debts FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);

  -- Custom Categories
  DROP POLICY IF EXISTS "Allow all for custom_categories" ON public.custom_categories;
  CREATE POLICY "Allow all for custom_categories" ON public.custom_categories FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);
END $$;

-- =====================================================================
-- DATOS INICIALES (SEMILLA)
-- =====================================================================
INSERT INTO public.profiles (id, name, email, avatar_url, bio, theme, pin_code, currency, base_income)
VALUES (
  'default_user',
  'Lucas Collazo',
  'collazolucas@gmail.com',
  'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=160&q=80',
  'Gestión patrimonial & finanzas personales',
  'dark',
  '1234',
  '€',
  4250
)
ON CONFLICT (id) DO NOTHING;

INSERT INTO public.custom_categories (id, profile_id, name, icon)
VALUES
  ('cat-1', 'default_user', 'Supermercado', 'local_grocery_store'),
  ('cat-2', 'default_user', 'Cafetería', 'coffee'),
  ('cat-3', 'default_user', 'Transporte', 'directions_subway'),
  ('cat-4', 'default_user', 'Restaurante', 'restaurant'),
  ('cat-5', 'default_user', 'Farmacia', 'medication'),
  ('cat-6', 'default_user', 'Ocio', 'sports_esports'),
  ('cat-7', 'default_user', 'Hogar', 'home')
ON CONFLICT (id) DO NOTHING;

INSERT INTO public.fixed_expenses (id, profile_id, name, amount, category, due_date_note, icon, applicable_months)
VALUES
  ('fix-1', 'default_user', 'Alquiler / Hipoteca', 900.0, 'Vivienda', 'Vencimiento día 1', 'apartment', '[1,2,3,4,5,6,7,8,9,10,11,12]'::jsonb),
  ('fix-2', 'default_user', 'Seguros Pólizas', 300.0, 'Seguros', 'Salud + Hogar + Coche', 'verified_user', '[1,2,3,4,5,6,7,8,9,10,11,12]'::jsonb),
  ('fix-3', 'default_user', 'Suministros Básicos', 180.0, 'Servicios', 'Luz, Agua, Fibra', 'bolt', '[1,2,3,4,5,6,7,8,9,10,11,12]'::jsonb),
  ('fix-4', 'default_user', 'Suscripciones & Cloud', 70.0, 'Digital', 'Herramientas & Medios', 'subscriptions', '[1,2,3,4,5,6,7,8,9,10,11,12]'::jsonb),
  ('fix-5', 'default_user', 'Seguro Anual Vehículo', 240.0, 'Transporte', 'Pago anual recurrente', 'directions_car', '[11]'::jsonb)
ON CONFLICT (id) DO NOTHING;

INSERT INTO public.fixed_incomes (id, profile_id, name, amount, category, periodicity_note, icon, applicable_months)
VALUES
  ('inc-1', 'default_user', 'Nómina Principal', 3200.0, 'Nómina', 'Cobro mensual (Día 1)', 'payments', '[1,2,3,4,5,6,7,8,9,10,11,12]'::jsonb),
  ('inc-2', 'default_user', 'Rendimientos / Inversión', 1050.0, 'Inversiones', 'Mensual recurrente', 'trending_up', '[1,2,3,4,5,6,7,8,9,10,11,12]'::jsonb)
ON CONFLICT (id) DO NOTHING;

INSERT INTO public.savings_goals (id, profile_id, name, tag, current_amount, target_amount, monthly_contribution, target_date_str, icon)
VALUES
  ('save-1', 'default_user', 'Fondo de Emergencia', 'NIVEL 4', 6500, 10000, 300, 'Noviembre 2027', 'shield'),
  ('save-2', 'default_user', 'Viaje Japón 2025', 'EXPEDICIÓN', 2100, 3500, 233, 'Octubre 2025', 'flight_takeoff')
ON CONFLICT (id) DO NOTHING;

INSERT INTO public.debts (id, profile_id, name, interest_rate, initial_amount, amortized_amount, priority, estimated_end_date, icon)
VALUES
  ('debt-1', 'default_user', 'Préstamo Vehículo', 5.25, 12000, 7850, 1, 'Agosto 2026', 'directions_car'),
  ('debt-2', 'default_user', 'Crédito Estudio Máster', 3.1, 5000, 3200, 2, 'Enero 2026', 'school')
ON CONFLICT (id) DO NOTHING;
