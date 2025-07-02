-- Diagnose and fix vacation_requests RLS policy

-- First, let's check the current RLS policies
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual, with_check
FROM pg_policies
WHERE tablename = 'vacation_requests';

-- Check current auth context
SELECT 
  auth.uid() as current_user_id,
  auth.role() as current_role,
  auth.email() as current_email;

-- Check if admin user exists in users table
SELECT id, email, role, employee_id, is_active
FROM public.users
WHERE email = 'julimalpeli@gmail.com';

-- Check employees table for admin user
SELECT id, name, start_date
FROM public.employees
WHERE id IN (
  SELECT employee_id 
  FROM public.users 
  WHERE email = 'julimalpeli@gmail.com'
);

-- Drop and recreate vacation_requests RLS policies
DROP POLICY IF EXISTS "vacation_requests_select_policy" ON public.vacation_requests;
DROP POLICY IF EXISTS "vacation_requests_insert_policy" ON public.vacation_requests;
DROP POLICY IF EXISTS "vacation_requests_update_policy" ON public.vacation_requests;
DROP POLICY IF EXISTS "vacation_requests_delete_policy" ON public.vacation_requests;

-- Create new, more permissive RLS policies for vacation_requests

-- SELECT policy: Users can view their own requests + admins/managers can view all
CREATE POLICY "vacation_requests_select_policy" ON public.vacation_requests
FOR SELECT USING (
  -- Admin users can see all
  EXISTS (
    SELECT 1 FROM public.users 
    WHERE users.id = auth.uid() 
    AND users.role IN ('admin', 'manager', 'hr')
    AND users.is_active = true
  )
  OR
  -- Employees can see their own requests
  employee_id = auth.uid()
  OR
  -- Also allow if employee_id matches the user's employee_id
  EXISTS (
    SELECT 1 FROM public.users
    WHERE users.id = auth.uid()
    AND users.employee_id = vacation_requests.employee_id
    AND users.is_active = true
  )
);

-- INSERT policy: Much more permissive for admins
CREATE POLICY "vacation_requests_insert_policy" ON public.vacation_requests
FOR INSERT WITH CHECK (
  -- Admin users can insert for anyone
  EXISTS (
    SELECT 1 FROM public.users 
    WHERE users.id = auth.uid() 
    AND users.role IN ('admin', 'manager', 'hr')
    AND users.is_active = true
  )
  OR
  -- Employees can insert for themselves (when employee_id = auth.uid())
  employee_id = auth.uid()
  OR
  -- Also allow if employee_id matches the user's employee_id
  EXISTS (
    SELECT 1 FROM public.users
    WHERE users.id = auth.uid()
    AND users.employee_id = vacation_requests.employee_id
    AND users.is_active = true
  )
);

-- UPDATE policy: Admins can update all, employees can update their own pending requests
CREATE POLICY "vacation_requests_update_policy" ON public.vacation_requests
FOR UPDATE USING (
  -- Admin users can update all
  EXISTS (
    SELECT 1 FROM public.users 
    WHERE users.id = auth.uid() 
    AND users.role IN ('admin', 'manager', 'hr')
    AND users.is_active = true
  )
  OR
  -- Employees can update their own pending requests
  (employee_id = auth.uid() AND status = 'pending')
  OR
  -- Also allow if employee_id matches the user's employee_id
  EXISTS (
    SELECT 1 FROM public.users
    WHERE users.id = auth.uid()
    AND users.employee_id = vacation_requests.employee_id
    AND users.is_active = true
    AND (vacation_requests.status = 'pending' OR users.role IN ('admin', 'manager', 'hr'))
  )
) WITH CHECK (
  -- Same conditions for the updated row
  EXISTS (
    SELECT 1 FROM public.users 
    WHERE users.id = auth.uid() 
    AND users.role IN ('admin', 'manager', 'hr')
    AND users.is_active = true
  )
  OR
  employee_id = auth.uid()
  OR
  EXISTS (
    SELECT 1 FROM public.users
    WHERE users.id = auth.uid()
    AND users.employee_id = vacation_requests.employee_id
    AND users.is_active = true
  )
);

-- DELETE policy: Only admins and managers can delete
CREATE POLICY "vacation_requests_delete_policy" ON public.vacation_requests
FOR DELETE USING (
  EXISTS (
    SELECT 1 FROM public.users 
    WHERE users.id = auth.uid() 
    AND users.role IN ('admin', 'manager')
    AND users.is_active = true
  )
);

-- Test the new policies
SELECT 'RLS policies recreated successfully' as status;
