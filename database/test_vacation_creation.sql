-- Test vacation request creation
-- Run this in Supabase SQL Editor

-- 1. Check if vacation_requests table exists and structure
SELECT 'Table structure' as test_name, column_name, data_type, is_nullable
FROM information_schema.columns 
WHERE table_name = 'vacation_requests'
ORDER BY ordinal_position;

-- 2. Check RLS policies on vacation_requests
SELECT 'RLS policies' as test_name, 
       policyname, permissive, roles, cmd, qual
FROM pg_policies 
WHERE tablename = 'vacation_requests'
ORDER BY cmd, policyname;

-- 3. Check current user context
SELECT 'Current user' as test_name,
       auth.uid() as auth_uid,
       auth.email() as auth_email;

-- 4. Get a sample employee to test with
SELECT 'Sample employee' as test_name,
       id, name, email, status
FROM employees 
WHERE status = 'active'
LIMIT 1;

-- 5. Try a simple INSERT test (replace employee_id with actual ID from step 4)
-- INSERT INTO vacation_requests (
--   employee_id,
--   start_date,
--   end_date,
--   days,
--   reason,
--   status,
--   request_date
-- ) VALUES (
--   'REPLACE_WITH_ACTUAL_EMPLOYEE_ID',
--   '2024-03-01',
--   '2024-03-05',
--   5,
--   'Test vacation request',
--   'pending',
--   CURRENT_DATE
-- );

-- 6. Check existing vacation requests
SELECT 'Existing requests' as test_name,
       COUNT(*) as total_requests
FROM vacation_requests;
