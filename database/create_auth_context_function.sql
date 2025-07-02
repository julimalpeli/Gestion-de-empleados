-- Create function to check authentication context
-- Run this in Supabase SQL Editor

CREATE OR REPLACE FUNCTION get_auth_context()
RETURNS TABLE (
  auth_role text,
  auth_uid uuid,
  auth_email text,
  auth_jwt json
) 
SECURITY DEFINER
LANGUAGE sql
AS $$
  SELECT 
    auth.role()::text as auth_role,
    auth.uid() as auth_uid, 
    auth.email()::text as auth_email,
    auth.jwt() as auth_jwt;
$$;

-- Grant execute permission
GRANT EXECUTE ON FUNCTION get_auth_context() TO authenticated;
GRANT EXECUTE ON FUNCTION get_auth_context() TO anon;
