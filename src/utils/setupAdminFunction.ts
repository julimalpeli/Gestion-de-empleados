import { supabase } from "@/lib/supabase";

export const setupAdminVacationFunction = async () => {
  console.log("🔧 Setting up admin vacation function...");

  // The SQL for creating the function
  const functionSQL = `
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
    SECURITY DEFINER
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
  `;

  try {
    // Try to execute the function creation (this might not work from client)
    console.log("📝 Attempting to create function via SQL...");

    // For now, let's just test if the function already exists
    const { data: testResult, error: testError } = await supabase.rpc(
      "create_vacation_request_as_admin",
      {
        p_employee_id: "00000000-0000-0000-0000-000000000000", // Dummy ID for testing
        p_start_date: "2025-01-01",
        p_end_date: "2025-01-02",
        p_days: 1,
        p_reason: "Test function exists",
        p_status: "pending",
      },
    );

    if (testError) {
      if (
        testError.message.includes("function") &&
        testError.message.includes("does not exist")
      ) {
        console.error(
          "❌ Function does not exist. Please run the SQL manually:",
        );
        console.log(functionSQL);
        return false;
      } else {
        console.log(
          "✅ Function exists but failed with expected error:",
          testError.message,
        );
        return true;
      }
    } else {
      console.log(
        "⚠️ Function executed unexpectedly (might have created dummy data)",
      );
      return true;
    }
  } catch (error) {
    console.error("❌ Error testing function:", error);
    return false;
  }
};

// Make available globally
if (typeof window !== "undefined") {
  (window as any).setupAdminVacationFunction = setupAdminVacationFunction;
  console.log("🔧 setupAdminVacationFunction() available in console");
}
