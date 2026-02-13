-- ==============================================================================
-- INSTRUÇÕES DE USO
-- ==============================================================================
-- 1. Acesse o painel do Supabase: https://supabase.com/dashboard/project/_/sql
-- 2. Cole os comandos abaixo no "SQL Editor".
-- 3. Substitua o E-MAIL pelo e-mail do usuário que você criou no site.
-- 4. Clique em "Run".

-- ==============================================================================
-- 1. TORNAR UM USUÁRIO "ADMIN"
-- permite acesso total ao painel /admin
-- ==============================================================================

UPDATE public.profiles
SET role = 'admin'
WHERE email = 'dsmempreendimentosdigitais@gmail.com'; 
-- Substitua pelo e-mail exato que você usou no cadastro


-- ==============================================================================
-- 2. CRIAR/VINCULAR UM BARBEIRO
-- Se você criou uma conta para um barbeiro (ex: joao@barbearia.com) e quer que ele
-- apareça na lista de profissionais e tenha acesso à agenda dele.
-- ==============================================================================

-- Passo A: Garanta que o usuário já se cadastrou no site.

-- Passo B: Atualize a role dele para 'barber'
UPDATE public.profiles
SET role = 'barber'
WHERE email = 'EMAIL_DO_BARBEIRO_AQUI';

-- Passo C: Vincule o perfil dele à tabela de barbeiros
-- Se o barbeiro JÁ EXISTE na lista (criado via seed/painel) e você quer vincular a conta:
UPDATE public.barbers
SET profile_id = (SELECT id FROM public.profiles WHERE email = 'EMAIL_DO_BARBEIRO_AQUI')
WHERE name = 'NOME_DO_BARBEIRO_NO_SISTEMA';

-- OU, se for um NOVO barbeiro que não existe na lista:
INSERT INTO public.barbers (name, profile_id, is_active)
SELECT 
    'Nome do Barbeiro', -- Digite o nome aqui
    id,
    true
FROM public.profiles 
WHERE email = 'EMAIL_DO_BARBEIRO_AQUI';


-- ==============================================================================
-- 3. VERIFICAR SE DEU CERTO
-- ==============================================================================
SELECT email, role, full_name FROM public.profiles;
