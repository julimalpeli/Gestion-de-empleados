import { supabase } from "@/lib/supabase";

export const debugRLSPermissions = async () => {
  console.log("🔐 === RLS PERMISSIONS DEBUG ===");

  try {
    // 1. Check current auth session
    const {
      data: { session },
      error: sessionError,
    } = await supabase.auth.getSession();

    console.log("📱 Current Session:", {
      hasSession: !!session,
      userId: session?.user?.id,
      email: session?.user?.email,
      role: session?.user?.role,
      error: sessionError?.message,
    });

    if (!session?.user) {
      console.error("❌ No valid session found");
      return false;
    }

    // 2. Check user record in users table
    const { data: userRecord, error: userError } = await supabase
      .from("users")
      .select("id, email, role, is_active")
      .eq("id", session.user.id)
      .single();

    console.log("👤 User Record:", {
      found: !!userRecord,
      data: userRecord,
      error: userError?.message,
    });

    // 3. Test employees SELECT permission
    const { data: employeesTest, error: employeesError } = await supabase
      .from("employees")
      .select("id, name")
      .limit(1);

    console.log("👥 Employees SELECT Test:", {
      canSelect: !employeesError,
      count: employeesTest?.length || 0,
      error: employeesError?.message,
    });

    // 4. Test employees INSERT permission with a dummy record
    const testEmployee = {
      name: "TEST_USER_DELETE_ME",
      dni: "00000000",
      job_position: "TEST",
      white_wage: 0,
      informal_wage: 0,
      daily_wage: 0,
      presentismo: 0,
      loses_presentismo: false,
      status: "inactive",
      start_date: "2024-01-01",
      vacation_days: 0,
      vacations_taken: 0,
    };

    console.log("🧪 Testing INSERT permission...");
    const { data: insertTest, error: insertError } = await supabase
      .from("employees")
      .insert(testEmployee)
      .select()
      .single();

    if (insertError) {
      console.log("❌ INSERT Test Failed:", {
        error: insertError.message,
        code: insertError.code,
        details: insertError.details,
      });
    } else {
      console.log("✅ INSERT Test Successful:", insertTest);

      // Clean up test record
      await supabase.from("employees").delete().eq("id", insertTest.id);
      console.log("🧹 Test record cleaned up");
    }

    // 5. Check auth context with RPC if available
    try {
      const { data: authContext, error: authError } =
        await supabase.rpc("get_auth_context");
      console.log("🛡️ Auth Context:", {
        data: authContext,
        error: authError?.message,
      });
    } catch (e) {
      console.log("🛡️ Auth Context RPC not available");
    }

    return !insertError;
  } catch (error) {
    console.error("❌ Debug error:", error);
    return false;
  }
};

// Make available globally
if (typeof window !== "undefined") {
  (window as any).debugRLSPermissions = debugRLSPermissions;
  console.log("🔧 debugRLSPermissions() available in console");
}
