-- SCRIPT COMPLETO E CORRIGIDO PARA DESTRAVAR TUDO
-- Este script:
-- 1. Encontra seu usuário pelo e-mail (maiúsculo ou minúsculo).
-- 2. CRIA o perfil se ele não existir (erro comum se criou a conta antes do trigger).
-- 3. Define você como ADMIN.
-- 4. Vincula você ao barbeiro.

DO $$
DECLARE
    target_email TEXT := 'dsmempreendimentosdigitais@gmail.com'; -- <<<< SEU E-MAIL AQUI
    param_barber_name TEXT := 'João Silva'; -- <<<< NOME DO BARBEIRO AQUI
    
    v_user_id UUID;
    v_meta_name TEXT;
BEGIN
    -- 1. Buscar ID do usuário no Auth (Case Insensitive)
    SELECT id, raw_user_meta_data->>'full_name'
    INTO v_user_id, v_meta_name
    FROM auth.users 
    WHERE LOWER(email) = LOWER(target_email);

    IF v_user_id IS NULL THEN
        RAISE EXCEPTION 'Usuário com email % não encontrado no sistema de Autenticação. Crie a conta primeiro na tela de Login.', target_email;
    END IF;

    -- 2. Garantir que exite na tabela PROFILES (Correção do erro 23503)
    -- Se não existir, cria agora mesmo.
    INSERT INTO public.profiles (id, full_name, email, role)
    VALUES (
        v_user_id, 
        COALESCE(v_meta_name, 'Admin Usuário'), -- Usa nome do cadastro ou genérico
        target_email,
        'admin' -- Já cria como admin
    )
    ON CONFLICT (id) DO UPDATE
    SET role = 'admin'; -- Se já existir, só garante que é admin

    -- 3. Vincular ao Barbeiro
    UPDATE public.barbers
    SET profile_id = v_user_id
    WHERE name = param_barber_name;

    RAISE NOTICE 'SUCESSO TOTAL! % agora é ADMIN e está vinculado a %.', target_email, param_barber_name;
END $$;
