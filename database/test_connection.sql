-- Test database connection and RLS policies
-- Run this in Supabase SQL Editor to test connectivity

-- Test 1: Check if users table exists and has data
SELECT 'Users table test' as test_name, count(*) as user_count 
FROM users;

-- Test 2: Check specific admin user
SELECT 'Admin user test' as test_name, id, email, name, role, is_active
FROM users 
WHERE email = 'julimalpeli@gmail.com';

-- Test 3: Check RLS policies on users table
SELECT 'RLS policies' as test_name, schemaname, tablename, policyname, permissive, roles, cmd, qual
FROM pg_policies 
WHERE tablename = 'users';

-- Test 4: Test current user context
SELECT 'Current user context' as test_name, 
       current_user as current_user,
       session_user as session_user,
       auth.uid() as auth_uid,
       auth.email() as auth_email;

-- Test 5: Check table permissions
SELECT 'Table permissions' as test_name, table_name, privilege_type, grantee
FROM information_schema.table_privileges 
WHERE table_name = 'users';
