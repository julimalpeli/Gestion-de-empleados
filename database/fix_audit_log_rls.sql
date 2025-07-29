-- Fix audit_log RLS policies
-- Execute this in Supabase SQL Editor

-- First, let's check current policies
SELECT 'Current audit_log policies:' as info;
SELECT schemaname, tablename, policyname, cmd, roles, qual, with_check
FROM pg_policies 
WHERE tablename = 'audit_log'
ORDER BY policyname;

-- Check if RLS is enabled
SELECT 'RLS Status for audit_log:' as info;
SELECT schemaname, tablename, rowsecurity 
FROM pg_tables 
WHERE tablename = 'audit_log';

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Audit log visible to admins" ON audit_log;
DROP POLICY IF EXISTS "Audit log insertable by system" ON audit_log;
DROP POLICY IF EXISTS "Audit log manageable by system" ON audit_log;

-- Create comprehensive policies for audit_log
-- 1. SELECT: Only admins can read audit logs
CREATE POLICY "audit_log_select_policy" ON audit_log
    FOR SELECT 
    USING (
        auth.role() = 'authenticated' AND (
            -- Admins can see all logs
            EXISTS (
                SELECT 1 FROM users 
                WHERE users.id = auth.uid() 
                AND users.role = 'admin' 
                AND users.is_active = true
            )
        )
    );

-- 2. INSERT: System can insert audit logs without restrictions
CREATE POLICY "audit_log_insert_policy" ON audit_log
    FOR INSERT 
    WITH CHECK (true); -- No restrictions on INSERT to allow system logging

-- 3. UPDATE: Only admins can update audit logs (if needed)
CREATE POLICY "audit_log_update_policy" ON audit_log
    FOR UPDATE 
    USING (
        auth.role() = 'authenticated' AND 
        EXISTS (
            SELECT 1 FROM users 
            WHERE users.id = auth.uid() 
            AND users.role = 'admin' 
            AND users.is_active = true
        )
    )
    WITH CHECK (
        auth.role() = 'authenticated' AND 
        EXISTS (
            SELECT 1 FROM users 
            WHERE users.id = auth.uid() 
            AND users.role = 'admin' 
            AND users.is_active = true
        )
    );

-- 4. DELETE: Only admins can delete audit logs (if needed)
CREATE POLICY "audit_log_delete_policy" ON audit_log
    FOR DELETE 
    USING (
        auth.role() = 'authenticated' AND 
        EXISTS (
            SELECT 1 FROM users 
            WHERE users.id = auth.uid() 
            AND users.role = 'admin' 
            AND users.is_active = true
        )
    );

-- Ensure RLS is enabled
ALTER TABLE audit_log ENABLE ROW LEVEL SECURITY;

-- Verify the new policies
SELECT 'Updated audit_log policies:' as info;
SELECT schemaname, tablename, policyname, cmd, roles
FROM pg_policies 
WHERE tablename = 'audit_log'
ORDER BY policyname;

-- Test audit log insertion (should work now)
INSERT INTO audit_log (
    entity_type,
    entity_id,
    action,
    old_values,
    new_values,
    user_id,
    user_email,
    timestamp
) VALUES (
    'test',
    'test-id',
    'RLS_TEST',
    '{}',
    '{"test": "value"}',
    auth.uid(),
    auth.email(),
    NOW()
);

SELECT 'Audit log RLS policies fixed successfully!' as result;
