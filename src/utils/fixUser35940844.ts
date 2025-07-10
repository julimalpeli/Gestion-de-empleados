import { supabase } from "@/lib/supabase";

export const fixUser35940844 = async () => {
  console.log("🔧 === FIXING USER DNI 35940844 ===");

  try {
    // Step 1: Get the user from database
    const { data: dbUser, error: dbError } = await supabase
      .from("users")
      .select("*")
      .eq("username", "35940844")
      .single();

    if (dbError || !dbUser) {
      console.error("❌ User not found in database:", dbError);
      return { success: false, error: "User not found in database" };
    }

    console.log("👤 Found user in database:", dbUser.name, dbUser.email);

    // Step 2: Check if user exists in Supabase Auth
    console.log("🔍 Testing if user can login...");

    const { data: testLogin, error: testError } =
      await supabase.auth.signInWithPassword({
        email: dbUser.email,
        password: "35940844", // DNI as password
      });

    if (!testError && testLogin.user) {
      console.log("✅ User already works in Auth!");
      await supabase.auth.signOut();

      console.log("🎉 === USER IS ALREADY WORKING ===");
      console.log(`📧 Email: ${dbUser.email}`);
      console.log(`🔑 Password: 35940844 (DNI)`);

      return { success: true, message: "User already works" };
    }

    console.log("⚠️ User not found in Auth, creating...");

    // Step 3: Create user in Supabase Auth
    const { data: authUser, error: authError } = await supabase.auth.signUp({
      email: dbUser.email,
      password: "35940844",
      options: {
        data: {
          name: dbUser.name,
          role: dbUser.role,
          username: dbUser.username,
        },
      },
    });

    if (authError) {
      console.error("❌ Auth creation failed:", authError.message);

      if (authError.message.includes("already registered")) {
        console.log("ℹ️ User exists in auth but password might be wrong");
        console.log("🔄 Trying different password combinations...");

        // Try different password combinations
        const passwordsToTry = [
          "35940844",
          dbUser.username,
          dbUser.email.split("@")[0],
        ];

        for (const pass of passwordsToTry) {
          const { data: tryLogin, error: tryError } =
            await supabase.auth.signInWithPassword({
              email: dbUser.email,
              password: pass,
            });

          if (!tryError && tryLogin.user) {
            console.log(`✅ Found working password: ${pass}`);
            await supabase.auth.signOut();

            console.log("🎉 === USER FIXED ===");
            console.log(`📧 Email: ${dbUser.email}`);
            console.log(`🔑 Password: ${pass}`);

            return { success: true, password: pass };
          }
        }
      }

      return { success: false, error: authError.message };
    }

    if (!authUser.user) {
      console.error("❌ No user returned from signup");
      return { success: false, error: "No user returned from signup" };
    }

    console.log("✅ Auth user created successfully");

    // Step 4: Update database user with correct Auth ID
    const { error: updateError } = await supabase
      .from("users")
      .update({
        id: authUser.user.id,
        updated_at: new Date().toISOString(),
      })
      .eq("username", "35940844");

    if (updateError) {
      console.error("❌ Failed to update user ID:", updateError);
      return { success: false, error: updateError.message };
    }

    console.log("✅ Database user updated with Auth ID");

    console.log("🎉 === USER FIXED SUCCESSFULLY ===");
    console.log(`📧 Email: ${dbUser.email}`);
    console.log(`🔑 Password: 35940844 (DNI)`);
    console.log(`👤 Name: ${dbUser.name}`);
    console.log(`🎭 Role: ${dbUser.role}`);

    return {
      success: true,
      email: dbUser.email,
      password: "35940844",
      message: "User fixed successfully",
    };
  } catch (error) {
    console.error("💥 Unexpected error:", error);
    return { success: false, error: error.message };
  }
};

export const testUser35940844Login = async () => {
  console.log("🧪 Testing login for DNI 35940844...");

  try {
    // Get user email from database
    const { data: dbUser, error: dbError } = await supabase
      .from("users")
      .select("email, name")
      .eq("username", "35940844")
      .single();

    if (dbError || !dbUser) {
      console.error("❌ User not found in database");
      return false;
    }

    const { data, error } = await supabase.auth.signInWithPassword({
      email: dbUser.email,
      password: "35940844",
    });

    if (error) {
      console.error("❌ Login failed:", error.message);
      return false;
    }

    console.log("✅ Login successful for:", dbUser.name);
    await supabase.auth.signOut();
    return true;
  } catch (error) {
    console.error("💥 Test failed:", error);
    return false;
  }
};

// Make functions globally available
if (typeof window !== "undefined") {
  (window as any).fixUser35940844 = fixUser35940844;
  (window as any).testUser35940844Login = testUser35940844Login;

  console.log("🔧 User 35940844 fix functions loaded:");
  console.log("   - fixUser35940844() - Fix the user");
  console.log("   - testUser35940844Login() - Test login");
}
