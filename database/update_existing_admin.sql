-- =====================================================
-- ACTUALIZAR USUARIO ADMIN EXISTENTE
-- =====================================================

-- 1. Verificar usuario existente en public.users
SELECT id, username, email, name, role FROM public.users WHERE email = 'julimalpeli@gmail.com';

-- 2. Verificar si existe en auth.users
SELECT id, email FROM auth.users WHERE email = 'julimalpeli@gmail.com';

-- 3. Si NO existe en auth.users, crearlo (ejecutar solo si el SELECT anterior no devuelve nada)
INSERT INTO auth.users (
  id,
  instance_id,
  email,
  encrypted_password,
  email_confirmed_at,
  recovery_sent_at,
  last_sign_in_at,
  raw_app_meta_data,
  raw_user_meta_data,
  created_at,
  updated_at,
  confirmation_token,
  email_change,
  email_change_token_new,
  recovery_token
) 
SELECT 
  COALESCE(pu.id, gen_random_uuid()), -- Usar ID existente o generar nuevo
  '00000000-0000-0000-0000-000000000000',
  'julimalpeli@gmail.com',
  crypt('Jmalpeli3194', gen_salt('bf')),
  NOW(),
  NOW(),
  NOW(),
  '{"provider": "email", "providers": ["email"]}',
  '{"name": "Julian Malpeli", "role": "admin"}',
  NOW(),
  NOW(),
  '',
  '',
  '',
  ''
FROM public.users pu 
WHERE pu.email = 'julimalpeli@gmail.com'
AND NOT EXISTS (SELECT 1 FROM auth.users au WHERE au.email = 'julimalpeli@gmail.com');

-- 4. Actualizar usuario en public.users para que coincida
UPDATE public.users 
SET 
  username = 'jmalpeli',
  name = 'Julian Malpeli',
  role = 'admin',
  is_active = true,
  needs_password_change = false,
  password_hash = '$supabase$auth$handled',
  updated_at = NOW()
WHERE email = 'julimalpeli@gmail.com';

-- 5. Si existe en auth.users pero con ID diferente, sincronizar IDs
UPDATE public.users 
SET id = (SELECT id FROM auth.users WHERE email = 'julimalpeli@gmail.com')
WHERE email = 'julimalpeli@gmail.com'
AND EXISTS (SELECT 1 FROM auth.users WHERE email = 'julimalpeli@gmail.com');

-- =====================================================
-- VERIFICACIONES FINALES
-- =====================================================

-- Verificar sincronización
SELECT 
  'auth.users' as fuente, 
  id, 
  email,
  email_confirmed_at IS NOT NULL as confirmado
FROM auth.users 
WHERE email = 'julimalpeli@gmail.com'

UNION ALL

SELECT 
  'public.users' as fuente, 
  id, 
  email,
  is_active::text as confirmado
FROM public.users 
WHERE email = 'julimalpeli@gmail.com';

-- Verificar que los IDs coincidan
SELECT 
  CASE 
    WHEN au.id = pu.id THEN '✅ IDs coinciden'
    ELSE '❌ IDs NO coinciden - PROBLEMA'
  END as estado,
  au.id as auth_id,
  pu.id as users_id
FROM auth.users au
JOIN public.users pu ON au.email = pu.email
WHERE au.email = 'julimalpeli@gmail.com';

-- Estado final del usuario admin
SELECT 
  username,
  email,
  name,
  role,
  is_active,
  needs_password_change,
  'Listo para login' as estado
FROM public.users 
WHERE email = 'julimalpeli@gmail.com';
