-- Fix RLS policies to allow updates for authenticated users
-- Run this in Supabase SQL Editor

-- Drop existing restrictive policies that might be blocking updates
DROP POLICY IF EXISTS "Users can update employees" ON employees;
DROP POLICY IF EXISTS "Employees can be updated by authenticated users" ON employees;
DROP POLICY IF EXISTS "Authenticated users can update employees" ON employees;

-- Create a permissive UPDATE policy for authenticated users
CREATE POLICY "Allow authenticated users to update employees" ON employees
FOR UPDATE TO authenticated
USING (true)
WITH CHECK (true);

-- Verify the policy was created
SELECT 'UPDATE policies after fix' as test_name,
       policyname,
       permissive,
       roles,
       cmd,
       qual,
       with_check
FROM pg_policies 
WHERE tablename = 'employees' 
  AND cmd = 'UPDATE'
ORDER BY policyname;

-- Test the update
UPDATE employees 
SET updated_at = NOW()
WHERE id = 'f33d0128-11b8-4ff2-b226-c6e9a2014fed';

-- Verify the update worked
SELECT 'Update test result' as test_name,
       id, name, updated_at
FROM employees 
WHERE id = 'f33d0128-11b8-4ff2-b226-c6e9a2014fed';
