-- Test RLS policies for employees table
-- Run this in Supabase SQL Editor while authenticated as the admin user

-- Check current user context
SELECT 'Current user context' as test_name,
       auth.uid() as auth_uid,
       auth.email() as auth_email,
       current_user as db_user;

-- Check if the specific employee exists (bypassing RLS)
SET row_security = off;
SELECT 'Employee exists (no RLS)' as test_name, 
       id, name, job_position, status
FROM employees 
WHERE id = 'f33d0128-11b8-4ff2-b226-c6e9a2014fed';
SET row_security = on;

-- Check if the employee is visible with RLS enabled
SELECT 'Employee visible (with RLS)' as test_name,
       id, name, job_position, status  
FROM employees 
WHERE id = 'f33d0128-11b8-4ff2-b226-c6e9a2014fed';

-- Check all RLS policies on employees table
SELECT 'RLS policies on employees' as test_name,
       policyname,
       permissive,
       roles,
       cmd,
       qual
FROM pg_policies 
WHERE tablename = 'employees'
ORDER BY cmd, policyname;

-- Test update permission
UPDATE employees 
SET updated_at = NOW()
WHERE id = 'f33d0128-11b8-4ff2-b226-c6e9a2014fed';

-- Check if update worked
SELECT 'Update test result' as test_name,
       id, name, updated_at
FROM employees 
WHERE id = 'f33d0128-11b8-4ff2-b226-c6e9a2014fed';
