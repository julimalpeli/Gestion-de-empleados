-- Check existing users and recreate if needed
-- Run this in Supabase SQL Editor

-- 1. Check what users exist in auth.users
SELECT 'Auth Users' as check_type,
       id, email, created_at, email_confirmed_at, last_sign_in_at
FROM auth.users
ORDER BY created_at DESC;

-- 2. Check what users exist in public.users  
SELECT 'Public Users' as check_type,
       id, email, name, role, employee_id, is_active
FROM public.users
ORDER BY created_at DESC;

-- 3. Check employees that should have users
SELECT 'Employees needing users' as check_type,
       e.id, e.name, e.dni, e.email, e.status,
       u.id as user_id,
       CASE WHEN u.id IS NULL THEN 'NEEDS USER' ELSE 'HAS USER' END as status
FROM employees e
LEFT JOIN users u ON e.id = u.employee_id
WHERE e.status = 'active' AND e.email IS NOT NULL
ORDER BY e.name;

-- 4. Find orphaned users (users without employees)
SELECT 'Orphaned Users' as check_type,
       u.id, u.email, u.name, u.role, u.employee_id
FROM users u
LEFT JOIN employees e ON u.employee_id = e.id
WHERE u.role = 'employee' AND e.id IS NULL;
