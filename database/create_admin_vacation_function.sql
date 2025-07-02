-- Create a function that allows admins to create vacation requests for any employee
-- This function will execute with SECURITY DEFINER to bypass RLS

CREATE OR REPLACE FUNCTION create_vacation_request_as_admin(
  p_employee_id uuid,
  p_start_date date,
  p_end_date date,
  p_days integer,
  p_reason text,
  p_status text DEFAULT 'pending'
)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER -- This allows the function to bypass RLS
AS $$
DECLARE
  current_user_role text;
  result_record vacation_requests;
BEGIN
  -- Check if the current user is an admin or manager
  SELECT role INTO current_user_role
  FROM public.users
  WHERE id = auth.uid() AND is_active = true;
  
  -- Only allow admins and managers to use this function
  IF current_user_role NOT IN ('admin', 'manager', 'hr') THEN
    RAISE EXCEPTION 'Only admin, manager, or HR users can create vacation requests for others';
  END IF;
  
  -- Insert the vacation request
  INSERT INTO public.vacation_requests (
    employee_id,
    start_date,
    end_date,
    days,
    reason,
    status,
    request_date,
    approved_by,
    approved_date
  ) VALUES (
    p_employee_id,
    p_start_date,
    p_end_date,
    p_days,
    p_reason,
    CASE 
      WHEN current_user_role = 'admin' THEN 'approved'
      ELSE p_status
    END,
    CURRENT_DATE,
    CASE 
      WHEN current_user_role = 'admin' THEN auth.uid()
      ELSE NULL
    END,
    CASE 
      WHEN current_user_role = 'admin' THEN CURRENT_TIMESTAMP
      ELSE NULL
    END
  ) RETURNING * INTO result_record;
  
  -- Return the created record as JSON
  RETURN row_to_json(result_record);
END;
$$;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION create_vacation_request_as_admin TO authenticated;

-- Test the function
SELECT 'Function created successfully' as status;
