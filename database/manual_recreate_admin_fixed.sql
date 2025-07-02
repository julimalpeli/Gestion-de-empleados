-- =====================================================
-- RECREAR USUARIO ADMIN MANUALMENTE - CORREGIDO
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

-- 3. Verificar creación en auth.users
SELECT 
  '=== USUARIO CREADO EN AUTH ===' as info,
  id, 
  email, 
  email_confirmed_at IS NOT NULL as confirmado,
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

-- 5. Verificar actualización en public.users
SELECT 
  '=== USUARIO ACTUALIZADO EN PUBLIC ===' as info,
  id,
  username,
  email,
  role,
  is_active
FROM public.users 
WHERE email = 'julimalpeli@gmail.com';

-- 6. Verificar sincronización de IDs
SELECT 
  '=== VERIFICACIÓN SINCRONIZACIÓN ===' as info,
  CASE 
    WHEN au.id = pu.id THEN '✅ SINCRONIZACIÓN PERFECTA'
    ELSE '❌ ERROR DE SINCRONIZACIÓN'
  END as resultado,
  au.id as auth_id,
  pu.id as public_id
FROM auth.users au
JOIN public.users pu ON au.email = pu.email
WHERE au.email = 'julimalpeli@gmail.com';

-- 7. Mensaje final
SELECT 
  '🎯 CREDENCIALES FINALES' as tipo,
  'julimalpeli@gmail.com' as email,
  'Jmalpeli3194' as password,
  '✅ LISTO PARA LOGIN' as estado;
