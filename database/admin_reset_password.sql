-- Migration: Create admin_reset_password RPC function
-- This allows admins to reset user passwords directly from the UI
-- Must be run in Supabase SQL Editor (Dashboard > SQL Editor)

-- Enable pgcrypto if not already enabled
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- Create a SECURITY DEFINER function that allows admins to reset user passwords
-- This directly updates auth.users which is the only reliable way to change 
-- another user's password without service_role access from the client
CREATE OR REPLACE FUNCTION admin_reset_password(target_user_id UUID, new_password TEXT)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = auth, public
AS $$
DECLARE
  caller_role TEXT;
  target_email TEXT;
BEGIN
  -- Verify caller is an active admin
  SELECT role INTO caller_role
  FROM public.users 
  WHERE id = auth.uid() AND is_active = true;

  IF caller_role IS NULL OR caller_role != 'admin' THEN
    RETURN jsonb_build_object('success', false, 'error', 'Solo administradores activos pueden blanquear contraseñas');
  END IF;

  -- Validate password length
  IF length(new_password) < 6 THEN
    RETURN jsonb_build_object('success', false, 'error', 'La contraseña debe tener al menos 6 caracteres');
  END IF;

  -- Get target user email for response
  SELECT email INTO target_email FROM auth.users WHERE id = target_user_id;

  IF target_email IS NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'Usuario no encontrado en el sistema de autenticación');
  END IF;

  -- Update the password in auth.users using bcrypt
  UPDATE auth.users 
  SET encrypted_password = crypt(new_password, gen_salt('bf')),
      updated_at = now()
  WHERE id = target_user_id;

  -- Update internal users table: mark as needs password change and update hash placeholder
  UPDATE public.users 
  SET needs_password_change = true,
      password_hash = '$supabase$auth$handled',
      updated_at = now()
  WHERE id = target_user_id;

  RETURN jsonb_build_object(
    'success', true, 
    'email', target_email,
    'message', 'Contraseña actualizada exitosamente'
  );
END;
$$;
