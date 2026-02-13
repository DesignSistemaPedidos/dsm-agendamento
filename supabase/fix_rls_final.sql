-- ==============================================================================
-- FINAL SECURITY FIX (RLS) - PUBLIC BOOKING & ADMIN ACCESS
-- ==============================================================================

-- 1. Drop existing policies to avoid conflicts (Clean Slate)
DROP POLICY IF EXISTS "Users can view own profile" ON profiles;
DROP POLICY IF EXISTS "Staff can view all profiles" ON profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON profiles;

DROP POLICY IF EXISTS "Public profiles" ON barbers;
DROP POLICY IF EXISTS "Admin manage barbers" ON barbers;

DROP POLICY IF EXISTS "Public services" ON services;
DROP POLICY IF EXISTS "Admin manage services" ON services;

DROP POLICY IF EXISTS "Admin manage all appointments" ON appointments;
DROP POLICY IF EXISTS "Barber view own appointments" ON appointments;
DROP POLICY IF EXISTS "Client view own appointments" ON appointments;
DROP POLICY IF EXISTS "Client create appointments" ON appointments;
DROP POLICY IF EXISTS "Public create appointments" ON appointments; -- Garantir que removemos anteriores

DROP POLICY IF EXISTS "Admin manage finances" ON transactions;

DROP POLICY IF EXISTS "Admin manage categories" ON expense_categories;
DROP POLICY IF EXISTS "Staff view categories" ON expense_categories;

DROP POLICY IF EXISTS "Public config" ON barbershop;
DROP POLICY IF EXISTS "Admin update config" ON barbershop;

-- 2. CREATE ROBUST POLICIES

-- PROFILES
CREATE POLICY "Users can view own profile" ON profiles FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Staff can view all profiles" ON profiles FOR SELECT USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('admin', 'barber')));
CREATE POLICY "Users can update own profile" ON profiles FOR UPDATE USING (auth.uid() = id);

-- BARBERS (Public Read, Admin Write)
CREATE POLICY "Public profiles" ON barbers FOR SELECT USING (true);
CREATE POLICY "Admin manage barbers" ON barbers FOR ALL USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'));

-- SERVICES (Public Read, Admin Write)
CREATE POLICY "Public services" ON services FOR SELECT USING (true);
CREATE POLICY "Admin manage services" ON services FOR ALL USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'));

-- APPOINTMENTS (CRITICAL UPDATE: Allow Public Insert)
CREATE POLICY "Admin manage all appointments" ON appointments FOR ALL USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'));

CREATE POLICY "Barber view own appointments" ON appointments FOR SELECT USING (EXISTS (SELECT 1 FROM barbers WHERE profile_id = auth.uid() AND id = appointments.barber_id));

CREATE POLICY "Client view own appointments" ON appointments FOR SELECT USING (auth.uid() = client_id);

-- ALLOW PUBLIC BOOKING (Guests + Clients)
CREATE POLICY "Enable insert for everyone" ON appointments FOR INSERT WITH CHECK (true);

-- FINANCEIRO
CREATE POLICY "Admin manage finances" ON transactions FOR ALL USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'));

-- EXPENSE CATEGORIES
CREATE POLICY "Admin manage categories" ON expense_categories FOR ALL USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'));
CREATE POLICY "Staff view categories" ON expense_categories FOR SELECT USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('admin', 'barber')));

-- CONFIG
CREATE POLICY "Public config" ON barbershop FOR SELECT USING (true);
CREATE POLICY "Admin update config" ON barbershop FOR UPDATE USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'));
