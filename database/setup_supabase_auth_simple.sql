-- =====================================================
-- SETUP SUPABASE AUTH SIMPLE - SIN ON CONFLICT
-- =====================================================

-- 1. Verificar si ya existe el usuario admin
SELECT id, email FROM auth.users WHERE email = 'julimalpeli@gmail.com';

-- 2. Si no existe, crear usuario admin en Supabase Auth
-- EJECUTA SOLO SI EL SELECT DE ARRIBA NO DEVUELVE NADA
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
  gen_random_uuid(),
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
);

-- 3. Obtener el ID del usuario creado
SELECT id, email FROM auth.users WHERE email = 'julimalpeli@gmail.com';

-- 4. Crear/actualizar usuario en tabla public.users
-- Primero borrar si existe
DELETE FROM public.users WHERE email = 'julimalpeli@gmail.com' OR username = 'jmalpeli';

-- Crear nuevo registro
INSERT INTO public.users (
  id,
  username,
  email,
  name,
  role,
  employee_id,
  is_active,
  password_hash,
  needs_password_change,
  created_at,
  updated_at
) 
SELECT 
  au.id,
  'jmalpeli',
  'julimalpeli@gmail.com',
  'Julian Malpeli',
  'admin',
  NULL,
  true,
  '$supabase$auth$handled',
  false,
  NOW(),
  NOW()
FROM auth.users au 
WHERE au.email = 'julimalpeli@gmail.com';

-- =====================================================
-- VERIFICACIONES FINALES
-- =====================================================

-- Verificar usuario en Supabase Auth
SELECT 
  id,
  email,
  email_confirmed_at IS NOT NULL as email_confirmed,
  raw_user_meta_data->>'role' as role,
  created_at
FROM auth.users
WHERE email = 'julimalpeli@gmail.com';

-- Verificar usuario en tabla public.users
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

-- Verificar que los IDs coincidan
SELECT 
  'auth.users' as tabla, id, email FROM auth.users WHERE email = 'julimalpeli@gmail.com'
UNION ALL
SELECT 
  'public.users' as tabla, id, email FROM public.users WHERE email = 'julimalpeli@gmail.com';
