import { supabase } from "@/lib/supabase";

export const fixVacationRLS = async () => {
  console.log("🔧 Fixing vacation_requests RLS policies...");

  try {
    // Drop existing policies
    const dropPolicies = [
      'DROP POLICY IF EXISTS "vacation_requests_select_policy" ON public.vacation_requests',
      'DROP POLICY IF EXISTS "vacation_requests_insert_policy" ON public.vacation_requests',
      'DROP POLICY IF EXISTS "vacation_requests_update_policy" ON public.vacation_requests',
      'DROP POLICY IF EXISTS "vacation_requests_delete_policy" ON public.vacation_requests',
    ];

    for (const sql of dropPolicies) {
      const { error } = await supabase.rpc("exec_sql", { sql_query: sql });
      if (error) console.warn("Warning dropping policy:", error.message);
    }

    // Create new INSERT policy that allows admins to insert for anyone
    const insertPolicy = `
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
        -- Employees can insert for themselves
        employee_id = auth.uid()
        OR
        -- Also allow if employee_id matches the user's employee_id
        EXISTS (
          SELECT 1 FROM public.users
          WHERE users.id = auth.uid()
          AND users.employee_id = vacation_requests.employee_id
          AND users.is_active = true
        )
      )
    `;

    const { error: insertError } = await supabase.rpc("exec_sql", {
      sql_query: insertPolicy,
    });

    if (insertError) {
      console.error("❌ Error creating INSERT policy:");
      console.error("   - Message:", insertError.message);
      console.error("   - Code:", insertError.code);
      console.error("   - Details:", insertError.details);
      console.error("   - Full error:", JSON.stringify(insertError, null, 2));
      throw insertError;
    }

    // Create SELECT policy
    const selectPolicy = `
      CREATE POLICY "vacation_requests_select_policy" ON public.vacation_requests
      FOR SELECT USING (
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
      )
    `;

    const { error: selectError } = await supabase.rpc("exec_sql", {
      sql_query: selectPolicy,
    });

    if (selectError) {
      console.error("❌ Error creating SELECT policy:", selectError);
    }

    // Create UPDATE policy
    const updatePolicy = `
      CREATE POLICY "vacation_requests_update_policy" ON public.vacation_requests
      FOR UPDATE USING (
        EXISTS (
          SELECT 1 FROM public.users
          WHERE users.id = auth.uid()
          AND users.role IN ('admin', 'manager', 'hr')
          AND users.is_active = true
        )
        OR
        (employee_id = auth.uid() AND status = 'pending')
      ) WITH CHECK (
        EXISTS (
          SELECT 1 FROM public.users
          WHERE users.id = auth.uid()
          AND users.role IN ('admin', 'manager', 'hr')
          AND users.is_active = true
        )
        OR
        employee_id = auth.uid()
      )
    `;

    const { error: updateError } = await supabase.rpc("exec_sql", {
      sql_query: updatePolicy,
    });

    if (updateError) {
      console.error("❌ Error creating UPDATE policy:", updateError);
    }

    // Create DELETE policy
    const deletePolicy = `
      CREATE POLICY "vacation_requests_delete_policy" ON public.vacation_requests
      FOR DELETE USING (
        EXISTS (
          SELECT 1 FROM public.users
          WHERE users.id = auth.uid()
          AND users.role IN ('admin', 'manager')
          AND users.is_active = true
        )
      )
    `;

    const { error: deleteError } = await supabase.rpc("exec_sql", {
      sql_query: deletePolicy,
    });

    if (deleteError) {
      console.error("❌ Error creating DELETE policy:", deleteError);
    }

    console.log("✅ Vacation RLS policies updated successfully!");
    return true;
  } catch (error) {
    console.error("❌ Error fixing RLS policies:");
    console.error("   - Error type:", typeof error);
    console.error(
      "   - Error message:",
      error instanceof Error ? error.message : String(error),
    );
    console.error("   - Full error:", JSON.stringify(error, null, 2));
    return false;
  }
};

// Make available in console
if (typeof window !== "undefined") {
  (window as any).fixVacationRLS = fixVacationRLS;
  console.log("🔧 fixVacationRLS() function available in console");
}
