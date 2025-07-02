-- Check user data bypassing RLS
-- Run this in Supabase SQL Editor

-- Bypass RLS to see actual data
SET row_security = off;

-- Check if admin user exists
SELECT 'Direct user check' as test_name, id, email, name, role, is_active, created_at
FROM users 
WHERE email = 'julimalpeli@gmail.com';

-- Check all users
SELECT 'All users' as test_name, count(*) as total_users FROM users;

-- Check RLS policies that might be blocking
SELECT 'RLS policies blocking' as test_name, 
       policyname, 
       permissive,
       roles,
       cmd,
       qual
FROM pg_policies 
WHERE tablename = 'users' 
  AND cmd = 'SELECT';

-- Reset row security
SET row_security = on;
