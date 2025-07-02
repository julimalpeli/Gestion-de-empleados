import { supabase } from "@/lib/supabase";

export const checkAuthContext = async () => {
  try {
    console.log("🔐 Checking authentication context...");

    // Check client-side session
    const {
      data: { session },
      error: sessionError,
    } = await supabase.auth.getSession();
    console.log("📱 Client session:", {
      session: !!session,
      user: session?.user?.id,
      email: session?.user?.email,
      error: sessionError,
    });

    // Check server-side context with a simple query
    const { data: contextCheck, error: contextError } = await supabase
      .rpc("get_auth_context")
      .select();

    console.log("🛡️ Server context check:", {
      data: contextCheck,
      error: contextError,
    });

    // Try a simple authenticated query
    const { data: testQuery, error: testError } = await supabase
      .from("vacation_requests")
      .select("id")
      .limit(1);

    console.log("🎯 Test query result:", {
      data: testQuery,
      error: testError,
    });

    return {
      session: !!session,
      userId: session?.user?.id,
      email: session?.user?.email,
      canQuery: !testError,
      error: sessionError || contextError || testError,
    };
  } catch (error) {
    console.error("❌ Error checking auth context:", error);
    return { error };
  }
};

// Make available in window for console access
if (import.meta.env.DEV) {
  (window as any).checkAuthContext = checkAuthContext;
}
