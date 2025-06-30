-- Script simplificado para crear usuario administrador en Supabase
-- EJECUTAR EN EL SQL EDITOR DE SUPABASE

-- 1. Crear usuario en auth.users (versión simplificada)
INSERT INTO auth.users (
  id,
  instance_id,
  email,
  encrypted_password,
  email_confirmed_at,
  created_at,
  updated_at,
  aud,
  role,
  raw_app_meta_data,
  raw_user_meta_data,
  confirmed_at
) VALUES (
  gen_random_uuid(),
  '00000000-0000-0000-0000-000000000000',
  'julimalpeli@gmail.com',
  crypt('Jmalpeli3194', gen_salt('bf')),
  NOW(),
  NOW(),
  NOW(),
  'authenticated',
  'authenticated',
  '{"provider": "email", "providers": ["email"]}',
  '{"name": "Julian Malpeli"}',
  NOW()
)
ON CONFLICT (email) DO UPDATE SET
  encrypted_password = crypt('Jmalpeli3194', gen_salt('bf')),
  email_confirmed_at = NOW(),
  confirmed_at = NOW(),
  updated_at = NOW();

-- 2. Crear registro en la tabla users (nuestra tabla personalizada)
INSERT INTO public.users (
  id,
  email,
  username,
  name,
  role,
  employee_id,
  force_password_change,
  created_at,
  updated_at
) VALUES (
  (SELECT id FROM auth.users WHERE email = 'julimalpeli@gmail.com'),
  'julimalpeli@gmail.com',
  'admin',
  'Julian Malpeli',
  'admin',
  NULL,
  false,
  NOW(),
  NOW()
)
ON CONFLICT (id) DO UPDATE SET
  role = 'admin',
  name = 'Julian Malpeli',
  email = 'julimalpeli@gmail.com',
  username = 'admin',
  force_password_change = false,
  updated_at = NOW();

-- 3. Verificar que se creó correctamente
SELECT 
  au.id,
  au.email,
  au.created_at as auth_created_at,
  au.email_confirmed_at,
  pu.username,
  pu.name,
  pu.role,
  pu.created_at as profile_created_at
FROM auth.users au
LEFT JOIN public.users pu ON au.id = pu.id
WHERE au.email = 'julimalpeli@gmail.com';

-- 4. Mostrar resumen
SELECT 
  'Usuario admin creado/actualizado exitosamente' as status,
  COUNT(*) as admin_users_count
FROM public.users 
WHERE role = 'admin';
