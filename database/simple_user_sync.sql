-- =====================================================
-- SINCRONIZACIÓN SIMPLE SIN UNION
-- =====================================================

-- 1. Verificar usuario en auth.users
SELECT 
  '=== AUTH.USERS ===' as tabla,
  id,
  email,
  email_confirmed_at IS NOT NULL as confirmado
FROM auth.users 
WHERE email = 'julimalpeli@gmail.com';

-- 2. Verificar usuario en public.users
SELECT 
  '=== PUBLIC.USERS ===' as tabla,
  id,
  email,
  is_active
FROM public.users 
WHERE email = 'julimalpeli@gmail.com';

-- 3. Crear/actualizar usuario en public.users
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

-- 4. Verificar sincronización final
SELECT 
  '=== SINCRONIZACIÓN ===' as info,
  CASE 
    WHEN au.id = pu.id THEN '✅ PERFECTO - LOGIN LISTO'
    ELSE '❌ ERROR'
  END as resultado,
  au.id as auth_id,
  pu.id as public_id
FROM auth.users au
LEFT JOIN public.users pu ON au.email = pu.email
WHERE au.email = 'julimalpeli@gmail.com';

-- 5. Mostrar perfil final
SELECT 
  '=== PERFIL USUARIO ===' as info,
  username,
  email,
  name,
  role,
  is_active,
  'READY FOR LOGIN' as estado
FROM public.users 
WHERE email = 'julimalpeli@gmail.com';
