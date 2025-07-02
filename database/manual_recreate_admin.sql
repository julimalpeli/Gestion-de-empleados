-- =====================================================
-- RECREAR USUARIO ADMIN MANUALMENTE
-- =====================================================

-- 1. Eliminar usuario existente en auth.users
DELETE FROM auth.users WHERE email = 'julimalpeli@gmail.com';

-- 2. Crear usuario nuevo con formato correcto
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
  recovery_token,
  aud,
  role
) VALUES (
  gen_random_uuid(),
  '00000000-0000-0000-0000-000000000000',
  'julimalpeli@gmail.com',
  crypt('Jmalpeli3194', gen_salt('bf')),
  NOW(),
  NULL,
  NULL,
  '{"provider": "email", "providers": ["email"]}',
  '{"name": "Julian Malpeli", "role": "admin"}',
  NOW(),
  NOW(),
  '',
  '',
  '',
  '',
  'authenticated',
  'authenticated'
);

-- 3. Obtener el ID del usuario recién creado
SELECT 
  '=== NUEVO USUARIO CREADO ===' as info,
  id, 
  email, 
  email_confirmed_at,
  aud,
  role
FROM auth.users 
WHERE email = 'julimalpeli@gmail.com';

-- 4. Actualizar public.users con el nuevo ID
UPDATE public.users 
SET 
  id = (SELECT id FROM auth.users WHERE email = 'julimalpeli@gmail.com'),
  username = 'jmalpeli',
  name = 'Julian Malpeli',
  role = 'admin',
  is_active = true,
  needs_password_change = false,
  password_hash = '$supabase$auth$handled',
  updated_at = NOW()
WHERE email = 'julimalpeli@gmail.com';

-- 5. Verificación final completa
SELECT 
  '=== VERIFICACIÓN FINAL ===' as estado;

-- Verificar que ambos existen
SELECT 
  'AUTH TABLE' as tabla,
  id,
  email,
  email_confirmed_at IS NOT NULL as email_confirmed,
  aud,
  role as auth_role
FROM auth.users 
WHERE email = 'julimalpeli@gmail.com'

UNION ALL

SELECT 
  'PUBLIC TABLE' as tabla,
  id,
  email,
  is_active::text as email_confirmed,
  username as aud,
  role as auth_role
FROM public.users 
WHERE email = 'julimalpeli@gmail.com';

-- Verificar sincronización de IDs
SELECT 
  CASE 
    WHEN au.id = pu.id THEN '✅ SINCRONIZACIÓN PERFECTA - LISTO PARA LOGIN'
    ELSE '❌ ERROR DE SINCRONIZACIÓN'
  END as resultado_final,
  au.id as auth_id,
  pu.id as public_id
FROM auth.users au
JOIN public.users pu ON au.email = pu.email
WHERE au.email = 'julimalpeli@gmail.com';

-- Mensaje final
SELECT 
  '🎯 CREDENCIALES DE LOGIN' as info,
  'julimalpeli@gmail.com' as email,
  'Jmalpeli3194' as password,
  'PRUEBA AHORA EL LOGIN' as accion;
