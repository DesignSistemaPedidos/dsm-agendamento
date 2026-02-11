-- Limpar dados anteriores (CUIDADO: roda em toda seed)
TRUNCATE TABLE transactions, expense_categories, appointments, barber_services, barber_schedules, services, barbers CASCADE;

-- 1. Inserir Categorias de Despesa
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

-- 2. Inserir Serviços
INSERT INTO services (name, description, duration_minutes, price, icon) VALUES
('Corte Masculino', 'Corte completo com lavagem e finalização.', 30, 45.00, '✂️'),
('Barba Completa', 'Barba modelada com toalha quente.', 25, 35.00, '🪒'),
('Corte + Barba', 'Combo completo para um visual renovado.', 50, 70.00, '✨'),
('Pezinho / Acabamento', 'Apenas manutenção dos contornos.', 15, 20.00, '📏');

-- 3. Inserir Barbeiros
INSERT INTO barbers (name, specialty, bio, avatar_url) VALUES
('João Silva', 'Degradê', 'Especialista em cortes modernos e degradê impecável.', 'https://ui-avatars.com/api/?name=Joao+Silva&background=D4A853&color=0F0F0F'),
('Pedro Santos', 'Barba', 'Mestre das navalhas e barbas desenhadas.', 'https://ui-avatars.com/api/?name=Pedro+Santos&background=D4A853&color=0F0F0F'),
('Marcos Costa', 'Clássico', 'Mais de 10 anos de experiência em cortes clássicos.', 'https://ui-avatars.com/api/?name=Marcos+Costa&background=D4A853&color=0F0F0F');

-- 4. Inserir Agendamentos (Exemplos)
-- Precisa recuperar IDs inseridos acima. Usando DO block.
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

-- 5. Configurar Horários (Seg-Sab, 09:00 - 19:00) para todos
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
