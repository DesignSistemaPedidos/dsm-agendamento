
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
    name TEXT NOT NULL, -- redundante mas útil p/ display rápido ou s/ perfil
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
    icon TEXT, -- emoji ou nome do ícone
    is_active BOOLEAN DEFAULT true,
    sort_order INT DEFAULT 0
);

-- Barbeiros x Serviços (quais serviços cada barbeiro faz)
CREATE TABLE barber_services (
    barber_id UUID REFERENCES barbers(id) ON DELETE CASCADE,
    service_id UUID REFERENCES services(id) ON DELETE CASCADE,
    custom_price DECIMAL(10,2), -- preço customizado (opcional)
    PRIMARY KEY (barber_id, service_id)
);

-- Horários de trabalho do barbeiro
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
    status TEXT CHECK (status IN ('pending', 'confirmed', 'completed', 'cancelled', 'no_show'))
        DEFAULT 'pending',
    notes TEXT,
    source TEXT CHECK (source IN ('app', 'whatsapp', 'walk_in')) DEFAULT 'app',
    client_name TEXT, -- para agendamentos sem login (bot/walk-in)
    client_phone TEXT, -- para agendamentos sem login
    email_sent BOOLEAN DEFAULT false,
    reminder_sent BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- Bloqueios de horário (férias, folgas, etc.)
CREATE TABLE time_blocks (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    barber_id UUID REFERENCES barbers(id) ON DELETE CASCADE,
    date DATE NOT NULL,
    start_time TIME,
    end_time TIME,
    reason TEXT,
    all_day BOOLEAN DEFAULT false
);

-- Transações financeiras (caixa)
CREATE TABLE transactions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    type TEXT CHECK (type IN ('income', 'expense')) NOT NULL,
    category TEXT NOT NULL, -- 'servico', 'aluguel', 'material', 'salario', 'outros'
    description TEXT,
    amount DECIMAL(10,2) NOT NULL,
    date DATE NOT NULL DEFAULT CURRENT_DATE,
    appointment_id UUID REFERENCES appointments(id), -- vincula receita ao agendamento
    payment_method TEXT CHECK (payment_method IN ('dinheiro', 'pix', 'cartao_credito', 'cartao_debito', 'outros')),
    created_by UUID REFERENCES profiles(id),
    created_at TIMESTAMPTZ DEFAULT now()
);

-- Categorias de despesa (personalizáveis)
CREATE TABLE expense_categories (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    icon TEXT, -- emoji
    is_fixed BOOLEAN DEFAULT false, -- despesa fixa mensal (ex: aluguel)
    default_amount DECIMAL(10,2) -- valor padrão para despesas fixas
);
