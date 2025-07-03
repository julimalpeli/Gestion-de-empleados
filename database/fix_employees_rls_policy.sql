-- Fix employees RLS policies to allow admins to create employees

-- Drop existing policies
DROP POLICY IF EXISTS "Employees visible to all authenticated users" ON employees;
DROP POLICY IF EXISTS "Employees manageable by authorized users" ON employees;

-- CREATE SELECT policy: All authenticated users can view employees
CREATE POLICY "employees_select_policy" ON employees
    FOR SELECT USING (auth.role() = 'authenticated');

-- CREATE INSERT policy: Only admins, managers, and HR can create employees
CREATE POLICY "employees_insert_policy" ON employees
    FOR INSERT WITH CHECK (
        auth.role() = 'authenticated' AND
        EXISTS (
            SELECT 1 FROM public.users 
            WHERE users.id = auth.uid() 
            AND users.role IN ('admin', 'manager', 'hr')
            AND users.is_active = true
        )
    );

-- CREATE UPDATE policy: Only admins, managers, and HR can update employees
CREATE POLICY "employees_update_policy" ON employees
    FOR UPDATE USING (
        auth.role() = 'authenticated' AND
        EXISTS (
            SELECT 1 FROM public.users 
            WHERE users.id = auth.uid() 
            AND users.role IN ('admin', 'manager', 'hr')
            AND users.is_active = true
        )
    ) WITH CHECK (
        auth.role() = 'authenticated' AND
        EXISTS (
            SELECT 1 FROM public.users 
            WHERE users.id = auth.uid() 
            AND users.role IN ('admin', 'manager', 'hr')
            AND users.is_active = true
        )
    );

-- CREATE DELETE policy: Only admins can delete employees
CREATE POLICY "employees_delete_policy" ON employees
    FOR DELETE USING (
        auth.role() = 'authenticated' AND
        EXISTS (
            SELECT 1 FROM public.users 
            WHERE users.id = auth.uid() 
            AND users.role = 'admin'
            AND users.is_active = true
        )
    );

SELECT 'Employees RLS policies updated successfully' as result;
