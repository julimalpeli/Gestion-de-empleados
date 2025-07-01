-- =====================================================
-- SETUP SUPABASE AUTH FOR EXISTING SYSTEM
-- =====================================================
-- Este script migra el sistema de autenticación local a Supabase Auth

-- 1. Crear usuario administrador en Supabase Auth
-- REEMPLAZA 'julimalpeli@gmail.com' con el email real del admin
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
  crypt('Jmalpeli3194', gen_salt('bf')), -- Password: Jmalpeli3194
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
  email_confirmed_at = NOW(),
  updated_at = NOW();

-- 2. Actualizar la tabla users para que coincida con el usuario de auth
-- Asumiendo que ya existe un usuario admin en la tabla users
UPDATE public.users 
SET 
  email = 'julimalpeli@gmail.com',
  username = 'jmalpeli',
  name = 'Julian Malpeli',
  role = 'admin',
  is_active = true,
  needs_password_change = false,
  updated_at = NOW()
WHERE role = 'admin' AND (email = 'julimalpeli@gmail.com' OR username = 'jmalpeli' OR username = 'admin');

-- Si no existe, crear el usuario admin
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
  id = EXCLUDED.id,
  username = 'jmalpeli',
  name = 'Julian Malpeli',
  role = 'admin',
  is_active = true,
  needs_password_change = false,
  updated_at = NOW();

-- =====================================================
-- EJEMPLO: CREAR EMPLEADO CON ACCESO AL SISTEMA
-- =====================================================
-- Para crear un empleado que pueda acceder al sistema:

/*
-- 1. Primero crear el empleado
INSERT INTO employees (name, dni, email, job_position, white_wage, informal_wage, start_date) 
VALUES ('Juan Empleado', '12345678', 'juan@cadizbar.com', 'Mozo', 300000, 100000, '2024-01-01');

-- 2. Crear usuario en Supabase Auth (DNI como contraseña inicial)
INSERT INTO auth.users (
  id,
  instance_id,
  email,
  encrypted_password,
  email_confirmed_at,
  raw_app_meta_data,
  raw_user_meta_data,
  created_at,
  updated_at
) VALUES (
  gen_random_uuid(),
  '00000000-0000-0000-0000-000000000000',
  'juan@cadizbar.com',
  crypt('12345678', gen_salt('bf')), -- Password = DNI
  NOW(),
  '{"provider": "email", "providers": ["email"]}',
  '{"name": "Juan Empleado", "role": "employee"}',
  NOW(),
  NOW()
);

-- 3. Crear registro en tabla users
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
  '12345678', -- username = DNI
  'juan@cadizbar.com',
  'Juan Empleado',
  'employee',
  e.id,
  true,
  '$supabase$auth$handled',
  true, -- Forzar cambio de contraseña
  NOW(),
  NOW()
FROM auth.users au, employees e
WHERE au.email = 'juan@cadizbar.com' AND e.email = 'juan@cadizbar.com';
*/

-- =====================================================
-- VERIFICAR CONFIGURACIÓN
-- =====================================================

-- Verificar usuarios en Supabase Auth
SELECT 
  id,
  email,
  email_confirmed_at IS NOT NULL as email_confirmed,
  raw_user_meta_data->>'role' as role,
  created_at
FROM auth.users
ORDER BY created_at DESC;

-- Verificar usuarios en nuestra tabla
SELECT 
  id,
  username,
  email,
  name,
  role,
  is_active,
  needs_password_change,
  created_at
FROM public.users
ORDER BY created_at DESC;

-- Verificar que las RLS policies estén activas
SELECT 
  schemaname,
  tablename,
  rowsecurity as rls_enabled
FROM pg_tables 
WHERE schemaname = 'public' 
    AND tablename IN (
        'employees', 'users', 'vacation_requests', 
        'audit_log', 'files', 'payroll_records'
    )
ORDER BY tablename;

-- =====================================================
-- NOTAS IMPORTANTES
-- =====================================================

/*
DESPUÉS DE EJECUTAR ESTE SCRIPT:

1. El usuario admin puede loguearse con:
   - Email: julimalpeli@gmail.com
   - Password: Jmalpeli3194

2. Para crear nuevos empleados que puedan acceder:
   - Usar la función createSupabaseUser desde el código
   - O seguir el ejemplo manual de arriba

3. Los usuarios demo ya no funcionarán
   - Solo usuarios reales en Supabase Auth

4. Las políticas RLS deben estar activas
   - Ejecutar fix_rls_security.sql si no lo hiciste

5. Cambios en el frontend:
   - Login ahora usa email en lugar de username
   - Autenticación completamente manejada por Supabase
   - Sesiones automáticas y seguras
*/
