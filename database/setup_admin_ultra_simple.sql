-- Script ultra-simplificado para crear usuario administrador
-- EJECUTAR EN EL SQL EDITOR DE SUPABASE

-- 1. Primero verificar si ya existe
SELECT 'Verificando si ya existe...' as step;
SELECT id, email FROM auth.users WHERE email = 'julimalpeli@gmail.com';

-- 2. Crear usuario en auth.users (sin ON CONFLICT)
INSERT INTO auth.users (
  id,
  email,
  encrypted_password,
  email_confirmed_at,
  created_at,
  updated_at,
  aud,
  role
) VALUES (
  gen_random_uuid(),
  'julimalpeli@gmail.com',
  crypt('Jmalpeli3194', gen_salt('bf')),
  NOW(),
  NOW(),
  NOW(),
  'authenticated',
  'authenticated'
);

-- 3. Crear registro en la tabla users
INSERT INTO public.users (
  id,
  email,
  username,
  name,
  role,
  created_at,
  updated_at
) VALUES (
  (SELECT id FROM auth.users WHERE email = 'julimalpeli@gmail.com'),
  'julimalpeli@gmail.com',
  'admin',
  'Julian Malpeli',
  'admin',
  NOW(),
  NOW()
);

-- 4. Verificar que se creó correctamente
SELECT 'Usuario creado exitosamente' as result;
SELECT 
  au.id,
  au.email,
  au.email_confirmed_at,
  pu.username,
  pu.name,
  pu.role
FROM auth.users au
JOIN public.users pu ON au.id = pu.id
WHERE au.email = 'julimalpeli@gmail.com';
