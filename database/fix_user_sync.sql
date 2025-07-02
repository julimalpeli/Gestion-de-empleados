-- =====================================================
-- VERIFICAR Y ARREGLAR SINCRONIZACIÓN DE USUARIOS
-- =====================================================

-- 1. Verificar qué pasó con la sincronización
SELECT 
  '=== ESTADO ACTUAL ===' as info;

-- Verificar usuario en auth.users
SELECT 
  'AUTH TABLE' as tabla,
  id,
  email,
  email_confirmed_at IS NOT NULL as confirmado
FROM auth.users 
WHERE email = 'julimalpeli@gmail.com';

-- Verificar usuario en public.users
SELECT 
  'PUBLIC TABLE' as tabla,
  id,
  email,
  is_active,
  CASE WHEN id IS NULL THEN '❌ NO EXISTE' ELSE '✅ EXISTE' END as estado
FROM public.users 
WHERE email = 'julimalpeli@gmail.com';

-- 2. Si el usuario no existe en public.users, crearlo
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
WHERE au.email = 'julimalpeli@gmail.com'
ON CONFLICT (email) DO UPDATE SET
  id = (SELECT id FROM auth.users WHERE email = 'julimalpeli@gmail.com'),
  username = 'jmalpeli',
  name = 'Julian Malpeli',
  role = 'admin',
  is_active = true,
  needs_password_change = false,
  password_hash = '$supabase$auth$handled',
  updated_at = NOW();

-- 3. Verificación final
SELECT 
  '=== VERIFICACIÓN FINAL ===' as info;

-- Verificar ambas tablas
SELECT 
  'FINAL AUTH' as tabla,
  id,
  email,
  email_confirmed_at IS NOT NULL as confirmado
FROM auth.users 
WHERE email = 'julimalpeli@gmail.com'

UNION ALL

SELECT 
  'FINAL PUBLIC' as tabla,
  id,
  email,
  is_active::text as confirmado
FROM public.users 
WHERE email = 'julimalpeli@gmail.com';

-- Verificar que los IDs coincidan
SELECT 
  '=== RESULTADO SINCRONIZACIÓN ===' as tipo,
  CASE 
    WHEN au.id = pu.id THEN '✅ SINCRONIZACIÓN PERFECTA - LOGIN DEBERÍA FUNCIONAR'
    ELSE '❌ PROBLEMA PERSISTE'
  END as resultado,
  au.id as auth_id,
  pu.id as public_id
FROM auth.users au
LEFT JOIN public.users pu ON au.email = pu.email
WHERE au.email = 'julimalpeli@gmail.com';

-- 4. Mostrar perfil completo del usuario
SELECT 
  '=== PERFIL COMPLETO ===' as info,
  id,
  username,
  email,
  name,
  role,
  is_active,
  needs_password_change,
  'USER PROFILE READY' as status
FROM public.users 
WHERE email = 'julimalpeli@gmail.com' AND is_active = true;
