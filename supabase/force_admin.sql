/*
 FORCE ADMIN ACCESS - CORRECAO DE SINTAXE
 Este script forca o usuario com o email especificado a ser ADMIN.
 Substitua 'dsmempreedimentosdigitais@gmail.com' pelo email correto se for diferente.
*/

DO $$
BEGIN
    -- 1. Tentar atualizar o perfil se ele ja existir
    UPDATE profiles
    SET role = 'admin'
    WHERE id IN (
        SELECT id FROM auth.users WHERE email = 'dsmempreedimentosdigitais@gmail.com'
    );

    -- 2. Se o perfil nao existir, criar um novo vinculado ao ID do auth.users
    INSERT INTO profiles (id, full_name, role)
    SELECT id, 'Administrador', 'admin'
    FROM auth.users
    WHERE email = 'dsmempreedimentosdigitais@gmail.com'
    AND NOT EXISTS (
        SELECT 1 FROM profiles WHERE id = auth.users.id
    );
    
END $$;
