-- Fix vacation_requests DELETE policy to allow admins to delete any vacation

-- Drop existing policies
DROP POLICY IF EXISTS "Vacation requests visible to authorized users" ON vacation_requests;
DROP POLICY IF EXISTS "Vacation requests manageable by authorized users" ON vacation_requests;

-- Create specific policies for different operations

-- SELECT: All authenticated users can view vacation requests
CREATE POLICY "vacation_requests_select_policy" ON vacation_requests
    FOR SELECT USING (auth.role() = 'authenticated');

-- INSERT: All authenticated users can create vacation requests
CREATE POLICY "vacation_requests_insert_policy" ON vacation_requests
    FOR INSERT WITH CHECK (
        auth.role() = 'authenticated' AND (
            -- Admins can create for anyone
            EXISTS (
                SELECT 1 FROM public.users 
                WHERE users.id = auth.uid() 
                AND users.role IN ('admin', 'manager', 'hr')
                AND users.is_active = true
            )
            OR
            -- Employees can create for themselves
            employee_id = auth.uid()
        )
    );

-- UPDATE: Users can update vacation requests based on role
CREATE POLICY "vacation_requests_update_policy" ON vacation_requests
    FOR UPDATE USING (
        auth.role() = 'authenticated' AND (
            -- Admins can update any vacation
            EXISTS (
                SELECT 1 FROM public.users 
                WHERE users.id = auth.uid() 
                AND users.role IN ('admin', 'manager', 'hr')
                AND users.is_active = true
            )
            OR
            -- Employees can update their own pending requests
            (employee_id = auth.uid() AND status = 'pending')
        )
    ) WITH CHECK (
        auth.role() = 'authenticated' AND (
            -- Admins can update any vacation
            EXISTS (
                SELECT 1 FROM public.users 
                WHERE users.id = auth.uid() 
                AND users.role IN ('admin', 'manager', 'hr')
                AND users.is_active = true
            )
            OR
            -- Employees can update their own requests
            employee_id = auth.uid()
        )
    );

-- DELETE: Only admins and managers can delete vacation requests
CREATE POLICY "vacation_requests_delete_policy" ON vacation_requests
    FOR DELETE USING (
        auth.role() = 'authenticated' AND
        EXISTS (
            SELECT 1 FROM public.users 
            WHERE users.id = auth.uid() 
            AND users.role IN ('admin', 'manager')
            AND users.is_active = true
        )
    );

SELECT 'Vacation deletion policies updated successfully' as result;
