-- Script para crear el primer usuario administrador en Supabase
-- EJECUTAR EN EL SQL EDITOR DE SUPABASE

-- 1. Crear usuario en auth.users (tabla de autenticación de Supabase)
-- REEMPLAZA 'admin@cadizbartapas.com' y 'tu_contraseña_segura' con tus datos
INSERT INTO auth.users (
  id,
  instance_id,
  email,
  encrypted_password,
  email_confirmed_at,
  created_at,
  updated_at,
  last_sign_in_at,
  aud,
  role,
  confirmation_token,
  email_change_token_current,
  email_change_confirm_status,
  banned_until,
  raw_app_meta_data,
  raw_user_meta_data,
  is_super_admin,
  phone,
  phone_confirmed_at,
  phone_change,
  phone_change_token,
  email_change,
  email_change_token_new,
  recovery_token,
  email_change_sent_at,
  phone_change_sent_at,
  confirmed_at,
  invited_at,
  action_link,
  email_otp,
  phone_otp,
  recovery_sent_at
) VALUES (
  gen_random_uuid(), -- id único
  '00000000-0000-0000-0000-000000000000', -- instance_id estándar
  'admin@cadizbartapas.com', -- CAMBIA ESTE EMAIL
  crypt('admin123456', gen_salt('bf')), -- CAMBIA ESTA CONTRASEÑA
  NOW(), -- email confirmado
  NOW(), -- created_at
  NOW(), -- updated_at
  NOW(), -- last_sign_in_at
  'authenticated', -- audience
  'authenticated', -- role
  '', -- confirmation_token (vacío porque ya está confirmado)
  '', -- email_change_token_current
  0, -- email_change_confirm_status
  NULL, -- banned_until
  '{"provider": "email", "providers": ["email"]}', -- raw_app_meta_data
  '{}', -- raw_user_meta_data
  false, -- is_super_admin
  NULL, -- phone
  NULL, -- phone_confirmed_at
  '', -- phone_change
  '', -- phone_change_token
  '', -- email_change
  '', -- email_change_token_new
  '', -- recovery_token
  NULL, -- email_change_sent_at
  NULL, -- phone_change_sent_at
  NOW(), -- confirmed_at
  NULL, -- invited_at
  '', -- action_link
  '', -- email_otp
  '', -- phone_otp
  NULL -- recovery_sent_at
)
ON CONFLICT (email) DO NOTHING;

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
  (SELECT id FROM auth.users WHERE email = 'admin@cadizbartapas.com'),
  'admin@cadizbartapas.com',
  'admin',
  'Administrador Principal',
  'admin',
  NULL, -- Sin empleado asociado
  false, -- No forzar cambio de contraseña
  NOW(),
  NOW()
)
ON CONFLICT (id) DO UPDATE SET
  role = 'admin',
  name = 'Administrador Principal',
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
WHERE au.email = 'admin@cadizbartapas.com';

-- 4. (OPCIONAL) Si quieres crear un segundo admin de respaldo
-- Descomenta las siguientes líneas y cambia los datos:

/*
INSERT INTO auth.users (
  id,
  instance_id,
  email,
  encrypted_password,
  email_confirmed_at,
  created_at,
  updated_at,
  last_sign_in_at,
  aud,
  role,
  confirmation_token,
  email_change_token_current,
  email_change_confirm_status,
  banned_until,
  raw_app_meta_data,
  raw_user_meta_data,
  is_super_admin,
  confirmed_at
) VALUES (
  gen_random_uuid(),
  '00000000-0000-0000-0000-000000000000',
  'respaldo@cadizbartapas.com', -- SEGUNDO EMAIL
  crypt('respaldo123456', gen_salt('bf')), -- SEGUNDA CONTRASEÑA
  NOW(),
  NOW(),
  NOW(),
  NOW(),
  'authenticated',
  'authenticated',
  '',
  '',
  0,
  NULL,
  '{"provider": "email", "providers": ["email"]}',
  '{}',
  false,
  NOW()
)
ON CONFLICT (email) DO NOTHING;

INSERT INTO public.users (
  id,
  email,
  username,
  name,
  role,
  created_at,
  updated_at
) VALUES (
  (SELECT id FROM auth.users WHERE email = 'respaldo@cadizbartapas.com'),
  'respaldo@cadizbartapas.com',
  'respaldo',
  'Admin Respaldo',
  'admin',
  NOW(),
  NOW()
)
ON CONFLICT (id) DO NOTHING;
*/

-- 5. Mostrar resumen de usuarios creados
SELECT 
  'Usuario creado exitosamente' as status,
  COUNT(*) as admin_users_count
FROM public.users 
WHERE role = 'admin';
