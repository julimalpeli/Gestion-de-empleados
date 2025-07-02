-- =====================================================
-- RECREAR USUARIO ADMIN CON FORMATO SUPABASE CORRECTO
-- =====================================================

-- 1. Eliminar usuario existente en auth.users
DELETE FROM auth.users WHERE email = 'julimalpeli@gmail.com';

-- 2. Crear usuario usando la función administrativa de Supabase
-- Este es el método correcto para crear usuarios programáticamente
SELECT auth.admin_create_user(
  'julimalpeli@gmail.com'::text,
  'Jmalpeli3194'::text,
  '{
    "name": "Julian Malpeli",
    "role": "admin"
  }'::jsonb,
  true -- email_confirm
);

-- 3. Obtener el ID del usuario recién creado
SELECT id, email, email_confirmed_at 
FROM auth.users 
WHERE email = 'julimalpeli@gmail.com';

-- 4. Actualizar usuario en public.users con el nuevo ID
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

-- 5. Verificación final
SELECT 
  '=== VERIFICACIÓN FINAL ===' as estado;

-- Verificar auth.users
SELECT 
  'AUTH' as tabla,
  id,
  email,
  email_confirmed_at IS NOT NULL as confirmado,
  created_at
FROM auth.users 
WHERE email = 'julimalpeli@gmail.com';

-- Verificar public.users
SELECT 
  'PUBLIC' as tabla,
  id,
  username,
  email,
  role,
  is_active
FROM public.users 
WHERE email = 'julimalpeli@gmail.com';

-- Verificar sincronización
SELECT 
  CASE 
    WHEN au.id = pu.id THEN '✅ TODO CORRECTO - LISTO PARA LOGIN'
    ELSE '❌ PROBLEMA DE SINCRONIZACIÓN'
  END as resultado,
  'Credenciales: julimalpeli@gmail.com / Jmalpeli3194' as login_info
FROM auth.users au
JOIN public.users pu ON au.email = pu.email
WHERE au.email = 'julimalpeli@gmail.com';
