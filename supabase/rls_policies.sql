-- ==============================================================================
-- SEGURANÇA E POLÍTICAS DE ACESSO (RLS - ROW LEVEL SECURITY)
-- ==============================================================================
-- Este script garante que:
-- 1. Os dados estejam protegidos (ninguém acessa sem permissão).
-- 2. O ADMIN possa ver TUDO.
-- 3. Os BARBEIROS possam ver seus agendamentos.
-- 4. Os CLIENTES possam ver e criar seus próprios agendamentos.

-- Habilitar RLS em todas as tabelas (Proteção padrão: Ninguém vê nada)
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE barbers ENABLE ROW LEVEL SECURITY;
ALTER TABLE services ENABLE ROW LEVEL SECURITY;
ALTER TABLE appointments ENABLE ROW LEVEL SECURITY;
ALTER TABLE transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE expense_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE barbershop ENABLE ROW LEVEL SECURITY;

-- ==============================================================================
-- POLÍTICAS (Regras de quem pode ver o quê)
-- ==============================================================================

-- 1. PROFILES (Perfis de Usuário)
-- Todos podem ver seu próprio perfil
CREATE POLICY "Users can view own profile" ON profiles
    FOR SELECT USING (auth.uid() = id);

-- Admin e Barbeiros podem ver todos os perfis (necessário para agendamentos)
CREATE POLICY "Staff can view all profiles" ON profiles
    FOR SELECT USING (
        EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('admin', 'barber'))
    );

-- Todo mundo pode atualizar seu próprio perfil
CREATE POLICY "Users can update own profile" ON profiles
    FOR UPDATE USING (auth.uid() = id);

-- 2. BARBERS (Barbeiros)
-- Público: Todo mundo precisa ver a lista de barbeiros para agendar
CREATE POLICY "Public profiles" ON barbers
    FOR SELECT USING (true);

-- Admin pode gerenciar barbeiros
CREATE POLICY "Admin manage barbers" ON barbers
    FOR ALL USING (
        EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
    );

-- 3. SERVICES (Serviços)
-- Público: Todo mundo precisa ver os serviços
CREATE POLICY "Public services" ON services
    FOR SELECT USING (true);

-- Admin pode gerenciar serviços
CREATE POLICY "Admin manage services" ON services
    FOR ALL USING (
        EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
    );

-- 4. APPOINTMENTS (Agendamentos)
-- Admin: Pode ver e editar TUDO
CREATE POLICY "Admin manage all appointments" ON appointments
    FOR ALL USING (
        EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
    );

-- Barbeiro: Pode ver agendamentos onde ele é o barbeiro
CREATE POLICY "Barber view own appointments" ON appointments
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM barbers 
            WHERE profile_id = auth.uid() 
            AND id = appointments.barber_id
        )
    );

-- Cliente: Pode ver e criar seus próprios agendamentos
CREATE POLICY "Client view own appointments" ON appointments
    FOR SELECT USING (auth.uid() = client_id);

CREATE POLICY "Client create appointments" ON appointments
    FOR INSERT WITH CHECK (auth.uid() = client_id);

-- 5. TRANSACTIONS (Financeiro)
-- Apenas Admin pode ver e gerenciar financeiro
CREATE POLICY "Admin manage finances" ON transactions
    FOR ALL USING (
        EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
    );

-- 6. EXPENSE CATEGORIES
-- Admin gerencia, Barbeiro pode ver (se tiver comissão futura)
CREATE POLICY "Admin manage categories" ON expense_categories
    FOR ALL USING (
        EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
    );

CREATE POLICY "Staff view categories" ON expense_categories
    FOR SELECT USING (
        EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('admin', 'barber'))
    );

-- 7. BARBERSHOP (Configs)
-- Público: Ver horários e endereço
CREATE POLICY "Public config" ON barbershop
    FOR SELECT USING (true);

-- Admin: Editar configs
CREATE POLICY "Admin update config" ON barbershop
    FOR UPDATE USING (
        EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
    );
