-- SCRIPT: GERAR DADOS FICTÍCIOS PARA TESTE DASHBOARD
-- Este script garante que o usuário 'dsmempreendimentosdigitais@gmail.com' 
-- seja um Barbeiro Admin e cria 10 agendamentos + transações financeiras.

DO $$
DECLARE
    target_email TEXT := 'dsmempreendimentosdigitais@gmail.com';
    v_user_id UUID;
    v_barber_id UUID;
    v_service_corte UUID;
    v_service_barba UUID;
    v_service_combo UUID;
    v_app_id UUID;
    v_today DATE := CURRENT_DATE;
    v_tomorrow DATE := CURRENT_DATE + 1;
BEGIN
    -- 1. Obter ID do Usuário (Se não existir, avisa)
    SELECT id INTO v_user_id FROM auth.users WHERE email = target_email;
    
    IF v_user_id IS NULL THEN
        RAISE EXCEPTION 'Usuário % não encontrado. Crie a conta na tela de Login primeiro.', target_email;
    END IF;

    -- 2. Garantir Perfil e Role Admin
    INSERT INTO public.profiles (id, full_name, email, role)
    VALUES (v_user_id, 'Admin Barber', target_email, 'admin')
    ON CONFLICT (id) DO UPDATE SET role = 'admin';

    -- 3. Garantir Vinculo com Barbeiro 'João Silva'
    -- Se João Silva não existir, cria.
    SELECT id INTO v_barber_id FROM barbers WHERE name = 'João Silva';
    
    IF v_barber_id IS NULL THEN
        INSERT INTO barbers (name, specialty, bio, is_active)
        VALUES ('João Silva', 'Degradê', 'Especialista', true)
        RETURNING id INTO v_barber_id;
    END IF;

    UPDATE barbers SET profile_id = v_user_id WHERE id = v_barber_id;

    -- 4. Obter IDs dos Serviços
    SELECT id INTO v_service_corte FROM services WHERE name LIKE 'Corte%' LIMIT 1;
    SELECT id INTO v_service_barba FROM services WHERE name LIKE 'Barba%' LIMIT 1;
    SELECT id INTO v_service_combo FROM services WHERE name LIKE 'Cor%Barba%' LIMIT 1;

    -- Se não achar serviços, aborta (significa que o banco está vazio)
    IF v_service_corte IS NULL THEN
        RAISE EXCEPTION 'Serviços não encontrados. Rode o seed.sql ou full_setup.sql primeiro.';
    END IF;

    -- 5. LIMPAR DADOS ANTIGOS DESTE BARBEIRO (opcional, para limpar a visão)
    -- Primeiro apaga as transações vinculadas para não dar erro de chave estrangeira
    DELETE FROM transactions 
    WHERE appointment_id IN (
        SELECT id FROM appointments WHERE barber_id = v_barber_id AND date >= v_today
    );

    DELETE FROM appointments WHERE barber_id = v_barber_id AND date >= v_today;
    
    -- 6. CRIAR 10 AGENDAMENTOS (5 Hoje, 5 Amanhã)
    
    -- HOJE 09:00 (Concluído + Pago)
    INSERT INTO appointments (barber_id, service_id, date, start_time, end_time, status, client_name, price)
    VALUES (v_barber_id, v_service_corte, v_today, '09:00', '09:30', 'completed', 'Marcos Teste', 45.00) RETURNING id INTO v_app_id;
    
    INSERT INTO transactions (type, category, description, amount, date, appointment_id, payment_method)
    VALUES ('income', 'Serviço', 'Corte - Marcos Teste', 45.00, v_today, v_app_id, 'pix');

    -- HOJE 10:00 (Concluído + Pago)
    INSERT INTO appointments (barber_id, service_id, date, start_time, end_time, status, client_name, price)
    VALUES (v_barber_id, v_service_combo, v_today, '10:00', '10:50', 'completed', 'Lucas Silva', 70.00) RETURNING id INTO v_app_id;
    
    INSERT INTO transactions (type, category, description, amount, date, appointment_id, payment_method)
    VALUES ('income', 'Serviço', 'Combo - Lucas Silva', 70.00, v_today, v_app_id, 'cartao_credito');

    -- HOJE 14:00 (Confirmado - Ainda não pago/concluído)
    INSERT INTO appointments (barber_id, service_id, date, start_time, end_time, status, client_name, price)
    VALUES (v_barber_id, v_service_barba, v_today, '14:00', '14:25', 'confirmed', 'Pedro Henrique', 35.00);

    -- HOJE 15:30 (Pendente)
    INSERT INTO appointments (barber_id, service_id, date, start_time, end_time, status, client_name, price)
    VALUES (v_barber_id, v_service_corte, v_today, '15:30', '16:00', 'pending', 'João Paulo', 45.00);

    -- HOJE 17:00 (Cancelado)
    INSERT INTO appointments (barber_id, service_id, date, start_time, end_time, status, client_name, price)
    VALUES (v_barber_id, v_service_corte, v_today, '17:00', '17:30', 'cancelled', 'Felipe Cancelou', 45.00);

    -- AMANHÃ 09:00 (Confirmado)
    INSERT INTO appointments (barber_id, service_id, date, start_time, end_time, status, client_name, price)
    VALUES (v_barber_id, v_service_corte, v_tomorrow, '09:00', '09:30', 'confirmed', 'André Amanhã', 45.00);

    -- AMANHÃ 10:30 (Confirmado)
    INSERT INTO appointments (barber_id, service_id, date, start_time, end_time, status, client_name, price)
    VALUES (v_barber_id, v_service_combo, v_tomorrow, '10:30', '11:20', 'confirmed', 'Bruno Amanhã', 70.00);
    
    -- AMANHÃ 13:00 (Pendente)
    INSERT INTO appointments (barber_id, service_id, date, start_time, end_time, status, client_name, price)
    VALUES (v_barber_id, v_service_barba, v_tomorrow, '13:00', '13:25', 'pending', 'Carlos Amanhã', 35.00);

    -- AMANHÃ 15:00 (Pendente)
    INSERT INTO appointments (barber_id, service_id, date, start_time, end_time, status, client_name, price)
    VALUES (v_barber_id, v_service_corte, v_tomorrow, '15:00', '15:30', 'pending', 'Daniel Amanhã', 45.00);

    -- AMANHÃ 18:00 (Pendente)
    INSERT INTO appointments (barber_id, service_id, date, start_time, end_time, status, client_name, price)
    VALUES (v_barber_id, v_service_combo, v_tomorrow, '18:00', '18:50', 'pending', 'Eduardo Amanhã', 70.00);

    RAISE NOTICE 'Dados fictícios criados para o usuário % no barbeiro João Silva.', target_email;
END $$;
