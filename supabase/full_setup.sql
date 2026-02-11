-- SCRIPT COMPLETO DE CONFIGURAÇÃO (Schema + Dados)
-- Apaga tabelas antigas para evitar conflitos
DROP TABLE IF EXISTS transactions CASCADE;
DROP TABLE IF EXISTS expense_categories CASCADE;
DROP TABLE IF EXISTS time_blocks CASCADE;
DROP TABLE IF EXISTS appointments CASCADE;
DROP TABLE IF EXISTS barber_schedules CASCADE;
DROP TABLE IF EXISTS barber_services CASCADE;
DROP TABLE IF EXISTS services CASCADE;
DROP TABLE IF EXISTS barbers CASCADE;
DROP TABLE IF EXISTS barbershop CASCADE;
DROP TABLE IF EXISTS profiles CASCADE;

-- 1. CRIAR SCHEMA -----------------------------------------------------------

-- Perfis de usuário (extensão do auth.users)
CREATE TABLE profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id),
    full_name TEXT NOT NULL,
    email TEXT,
    phone TEXT,
    avatar_url TEXT,
    role TEXT CHECK (role IN ('client', 'barber', 'admin')) DEFAULT 'client',
    created_at TIMESTAMPTZ DEFAULT now()
);

-- Barbearia (configurações globais)
CREATE TABLE barbershop (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    address TEXT,
    phone TEXT,
    logo_url TEXT,
    opening_time TIME DEFAULT '08:00',
    closing_time TIME DEFAULT '20:00',
    slot_duration_minutes INT DEFAULT 30,
    working_days INT[] DEFAULT '{1,2,3,4,5,6}' -- 0=Dom, 6=Sáb
);

-- Barbeiros
CREATE TABLE barbers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    profile_id UUID REFERENCES profiles(id),
    name TEXT NOT NULL,
    specialty TEXT,
    bio TEXT,
    avatar_url TEXT,
    is_active BOOLEAN DEFAULT true,
    sort_order INT DEFAULT 0
);

-- Serviços
CREATE TABLE services (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    description TEXT,
    duration_minutes INT NOT NULL DEFAULT 30,
    price DECIMAL(10,2) NOT NULL,
    icon TEXT,
    is_active BOOLEAN DEFAULT true,
    sort_order INT DEFAULT 0
);

-- Barbeiros x Serviços
CREATE TABLE barber_services (
    barber_id UUID REFERENCES barbers(id) ON DELETE CASCADE,
    service_id UUID REFERENCES services(id) ON DELETE CASCADE,
    custom_price DECIMAL(10,2),
    PRIMARY KEY (barber_id, service_id)
);

-- Horários de trabalho
CREATE TABLE barber_schedules (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    barber_id UUID REFERENCES barbers(id) ON DELETE CASCADE,
    day_of_week INT CHECK (day_of_week BETWEEN 0 AND 6),
    start_time TIME NOT NULL,
    end_time TIME NOT NULL,
    is_available BOOLEAN DEFAULT true,
    UNIQUE (barber_id, day_of_week)
);

-- Agendamentos
CREATE TABLE appointments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    client_id UUID REFERENCES profiles(id),
    barber_id UUID REFERENCES barbers(id),
    service_id UUID REFERENCES services(id),
    date DATE NOT NULL,
    start_time TIME NOT NULL,
    end_time TIME NOT NULL,
    status TEXT CHECK (status IN ('pending', 'confirmed', 'completed', 'cancelled', 'no_show')) DEFAULT 'pending',
    notes TEXT,
    source TEXT CHECK (source IN ('app', 'whatsapp', 'walk_in')) DEFAULT 'app',
    client_name TEXT,
    client_phone TEXT,
    email_sent BOOLEAN DEFAULT false,
    reminder_sent BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now(),
    price DECIMAL(10,2)
);

-- Bloqueios de horário
CREATE TABLE time_blocks (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    barber_id UUID REFERENCES barbers(id) ON DELETE CASCADE,
    date DATE NOT NULL,
    start_time TIME,
    end_time TIME,
    reason TEXT,
    all_day BOOLEAN DEFAULT false
);

-- Transações financeiras
CREATE TABLE transactions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    type TEXT CHECK (type IN ('income', 'expense')) NOT NULL,
    category TEXT NOT NULL,
    description TEXT,
    amount DECIMAL(10,2) NOT NULL,
    date DATE NOT NULL DEFAULT CURRENT_DATE,
    appointment_id UUID REFERENCES appointments(id),
    payment_method TEXT CHECK (payment_method IN ('dinheiro', 'pix', 'cartao_credito', 'cartao_debito', 'boleto', 'outros')),
    created_by UUID REFERENCES profiles(id),
    created_at TIMESTAMPTZ DEFAULT now()
);

-- Categorias de despesa
CREATE TABLE expense_categories (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    icon TEXT,
    is_fixed BOOLEAN DEFAULT false,
    default_amount DECIMAL(10,2)
);

-- 2. INSERIR DADOS (SEED) ---------------------------------------------------

-- Categorias de Despesa
INSERT INTO expense_categories (name, icon, is_fixed, default_amount) VALUES
('Aluguel', '🏢', true, 1500.00),
('Energia', '⚡', false, null),
('Água', '💧', false, null),
('Internet', '🌐', true, 120.00),
('Produtos', '🧴', false, null),
('Marketing', '📢', false, null),
('Manutenção', '🔧', false, null),
('Salários', '💸', true, null),
('Outros', '📦', false, null);

-- Serviços
INSERT INTO services (name, description, duration_minutes, price, icon) VALUES
('Corte Masculino', 'Corte completo com lavagem e finalização.', 30, 45.00, '✂️'),
('Barba Completa', 'Barba modelada com toalha quente.', 25, 35.00, '🪒'),
('Corte + Barba', 'Combo completo para um visual renovado.', 50, 70.00, '✨'),
('Pezinho / Acabamento', 'Apenas manutenção dos contornos.', 15, 20.00, '📏');

-- Barbeiros
INSERT INTO barbers (name, specialty, bio, avatar_url) VALUES
('João Silva', 'Degradê', 'Especialista em cortes modernos e degradê impecável.', 'https://ui-avatars.com/api/?name=Joao+Silva&background=D4A853&color=0F0F0F'),
('Pedro Santos', 'Barba', 'Mestre das navalhas e barbas desenhadas.', 'https://ui-avatars.com/api/?name=Pedro+Santos&background=D4A853&color=0F0F0F'),
('Marcos Costa', 'Clássico', 'Mais de 10 anos de experiência em cortes clássicos.', 'https://ui-avatars.com/api/?name=Marcos+Costa&background=D4A853&color=0F0F0F');

-- Agendamentos e Transações de Exemplo
DO $$
DECLARE
    barber_joao UUID;
    service_corte UUID;
    service_barba UUID;
    app_id UUID;
BEGIN
    SELECT id INTO barber_joao FROM barbers WHERE name = 'João Silva';
    SELECT id INTO service_corte FROM services WHERE name = 'Corte Masculino';
    SELECT id INTO service_barba FROM services WHERE name = 'Barba Completa';

    -- Agendamento Hoje (Confirmado)
    INSERT INTO appointments (barber_id, service_id, date, start_time, end_time, status, client_name, source, price)
    VALUES (barber_joao, service_corte, CURRENT_DATE, '10:00', '10:30', 'confirmed', 'Carlos Edu', 'whatsapp', 45.00)
    RETURNING id INTO app_id;

    -- Lançar Transação de Receita
    INSERT INTO transactions (type, category, description, amount, date, appointment_id, payment_method)
    VALUES ('income', 'Serviço', 'Corte - Carlos Edu', 45.00, CURRENT_DATE, app_id, 'pix');

    -- Agendamento Hoje (Pendente)
    INSERT INTO appointments (barber_id, service_id, date, start_time, end_time, status, client_name, source, price)
    VALUES (barber_joao, service_barba, CURRENT_DATE, '14:00', '14:25', 'pending', 'Roberto D.', 'app', 35.00);

    -- Despesa Exemplo (Ontem)
    INSERT INTO transactions (type, category, description, amount, date, payment_method)
    VALUES ('expense', 'Energia', 'Conta de Luz Fev', 250.00, CURRENT_DATE - 1, 'boleto');

     -- Receita Exemplo (Ontem)
    INSERT INTO transactions (type, category, description, amount, date, payment_method)
    VALUES ('income', 'Serviço', 'Corte + Barba - Felipe', 70.00, CURRENT_DATE - 1, 'cartao_credito');

END $$;

-- Configurar Horários (Seg-Sab, 09:00 - 19:00) para todos
DO $$
DECLARE
    barber_rec RECORD;
    d INTEGER;
BEGIN
    FOR barber_rec IN SELECT id FROM barbers LOOP
        FOR d IN 1..6 LOOP 
            INSERT INTO barber_schedules (barber_id, day_of_week, start_time, end_time)
            VALUES (barber_rec.id, d, '09:00', '19:00')
            ON CONFLICT DO NOTHING;
        END LOOP;
    END LOOP;
END $$;
