-- Script para cambiar la contraseña del administrador
-- EJECUTAR EN EL SQL EDITOR DE SUPABASE

-- Opción 1: Actualizar contraseña específica (RECOMENDADO)
-- Reemplaza 'nueva_contraseña_segura' con tu contraseña deseada
UPDATE auth.users 
SET 
  encrypted_password = crypt('nueva_contraseña_segura', gen_salt('bf')),
  email_confirmed_at = COALESCE(email_confirmed_at, NOW()),
  updated_at = NOW()
WHERE 
  email = 'admin@cadizbartapas.com' 
  OR id IN (
    SELECT auth_id FROM public.users WHERE role = 'admin' LIMIT 1
  );

-- Opción 2: Si quieres usar el email del admin para reset
-- UPDATE auth.users 
-- SET email = 'tu-email@gmail.com'
-- WHERE email = 'admin@cadizbartapas.com';

-- Opción 3: Crear nuevo usuario admin con contraseña segura
-- INSERT INTO auth.users (
--   id,
--   email,
--   encrypted_password,
--   email_confirmed_at,
--   created_at,
--   updated_at,
--   aud,
--   role
-- ) VALUES (
--   gen_random_uuid(),
--   'nuevo-admin@cadizbartapas.com',
--   crypt('nueva_contraseña_muy_segura', gen_salt('bf')),
--   NOW(),
--   NOW(),
--   NOW(),
--   'authenticated',
--   'authenticated'
-- );

-- Luego crear el registro en la tabla users
-- INSERT INTO public.users (
--   id,
--   email,
--   username,
--   name,
--   role,
--   created_at,
--   updated_at
-- ) VALUES (
--   (SELECT id FROM auth.users WHERE email = 'nuevo-admin@cadizbartapas.com'),
--   'nuevo-admin@cadizbartapas.com',
--   'admin',
--   'Administrador Principal',
--   'admin',
--   NOW(),
--   NOW()
-- );

-- Verificar el cambio
SELECT 
  u.email,
  u.created_at,
  pu.username,
  pu.name,
  pu.role
FROM auth.users u
JOIN public.users pu ON u.id = pu.id
WHERE pu.role = 'admin';
