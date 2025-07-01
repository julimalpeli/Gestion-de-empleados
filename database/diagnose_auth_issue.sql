-- =====================================================
-- DIAGNÓSTICO DE PROBLEMA DE AUTENTICACIÓN
-- =====================================================

-- 1. Verificar si el usuario existe en auth.users
SELECT 
  '=== VERIFICACIÓN AUTH.USERS ===' as info;

SELECT 
  id,
  email,
  email_confirmed_at,
  created_at,
  encrypted_password IS NOT NULL as has_password,
  raw_user_meta_data
FROM auth.users 
WHERE email = 'julimalpeli@gmail.com';

-- 2. Verificar si el usuario existe en public.users
SELECT 
  '=== VERIFICACIÓN PUBLIC.USERS ===' as info;

SELECT 
  id,
  username,
  email,
  name,
  role,
  is_active,
  needs_password_change
FROM public.users 
WHERE email = 'julimalpeli@gmail.com';

-- 3. Verificar que los IDs coincidan
SELECT 
  '=== VERIFICACIÓN SINCRONIZACIÓN ===' as info;

SELECT 
  CASE 
    WHEN au.id = pu.id THEN '✅ IDs COINCIDEN'
    WHEN au.id IS NULL THEN '❌ NO EXISTE EN AUTH.USERS'
    WHEN pu.id IS NULL THEN '❌ NO EXISTE EN PUBLIC.USERS'
    ELSE '❌ IDs NO COINCIDEN'
  END as estado,
  au.id as auth_id,
  pu.id as public_id,
  au.email as auth_email,
  pu.email as public_email
FROM auth.users au
FULL OUTER JOIN public.users pu ON au.email = pu.email
WHERE COALESCE(au.email, pu.email) = 'julimalpeli@gmail.com';

-- 4. Contar usuarios en ambas tablas
SELECT 
  '=== CONTEO GENERAL ===' as info;

SELECT 
  'auth.users' as tabla,
  COUNT(*) as total_usuarios
FROM auth.users
UNION ALL
SELECT 
  'public.users' as tabla,
  COUNT(*) as total_usuarios
FROM public.users;

-- 5. Verificar configuración de la instancia
SELECT 
  '=== CONFIGURACIÓN SUPABASE ===' as info;

-- Verificar si hay algún usuario en auth.users
SELECT 
  COUNT(*) as usuarios_auth,
  COUNT(CASE WHEN email_confirmed_at IS NOT NULL THEN 1 END) as confirmados
FROM auth.users;

-- =====================================================
-- COMANDOS DE REPARACIÓN (si es necesario)
-- =====================================================

-- Si NO existe en auth.users, ejecutar esto:
/*
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
) VALUES (
  (SELECT COALESCE(id, gen_random_uuid()) FROM public.users WHERE email = 'julimalpeli@gmail.com'),
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
) ON CONFLICT (email) DO UPDATE SET
  encrypted_password = crypt('Jmalpeli3194', gen_salt('bf')),
  email_confirmed_at = NOW();
*/

-- Si existe pero la contraseña no funciona, resetearla:
/*
UPDATE auth.users 
SET 
  encrypted_password = crypt('Jmalpeli3194', gen_salt('bf')),
  email_confirmed_at = NOW(),
  updated_at = NOW()
WHERE email = 'julimalpeli@gmail.com';
*/

-- Verificación final después de reparar
/*
SELECT 
  '=== VERIFICACIÓN FINAL ===' as estado,
  email,
  email_confirmed_at IS NOT NULL as email_confirmado,
  encrypted_password IS NOT NULL as tiene_password,
  'Credenciales: julimalpeli@gmail.com / Jmalpeli3194' as login_info
FROM auth.users 
WHERE email = 'julimalpeli@gmail.com';
*/
