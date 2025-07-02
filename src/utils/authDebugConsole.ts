import { supabase } from "@/lib/supabase";

// Simple auth debugging functions that can be run immediately
export const debugAuth = async () => {
  console.log("🔐 === AUTH DEBUGGING STARTED ===");

  try {
    // 1. Check client session
    const {
      data: { session },
      error: sessionError,
    } = await supabase.auth.getSession();
    console.log("📱 Client Session:", {
      hasSession: !!session,
      userId: session?.user?.id,
      email: session?.user?.email,
      sessionError: sessionError?.message,
    });

    // 2. Check if we can query the database
    const { data: testQuery, error: testError } = await supabase
      .from("vacation_requests")
      .select("id")
      .limit(1);

    console.log("🎯 Database Query Test:", {
      canQuery: !testError,
      error: testError?.message,
      errorCode: testError?.code,
      errorDetails: testError?.details,
      errorHint: testError?.hint,
      dataCount: testQuery?.length || 0,
    });

    if (testError) {
      console.error("🎯 Full database error:", testError);
    }

    // 3. Test auth context function (if it exists)
    try {
      const { data: authContext, error: authError } =
        await supabase.rpc("get_auth_context");
      console.log("🛡️ Auth Context (Database):", {
        data: authContext,
        error: authError?.message,
      });
    } catch (e) {
      console.log("🛡️ Auth Context: Function not available");
    }

    // 4. Try to get current user profile
    if (session?.user?.email) {
      const { data: userProfile, error: userError } = await supabase
        .from("users")
        .select("*")
        .eq("email", session.user.email)
        .limit(1);

      console.log("👤 User Profile:", {
        found: !!userProfile?.[0],
        profile: userProfile?.[0],
        error: userError?.message,
      });
    }

    console.log("🔐 === AUTH DEBUGGING COMPLETED ===");

    return {
      hasSession: !!session,
      userId: session?.user?.id,
      email: session?.user?.email,
      canQueryDB: !testError,
      dbError: testError?.message,
    };
  } catch (error) {
    console.error("❌ Debug error:", error);
    return { error: error.message };
  }
};

// Make it available globally
if (typeof window !== "undefined") {
  (window as any).debugAuth = debugAuth;
  console.log("🔧 debugAuth() function available in console");
}
