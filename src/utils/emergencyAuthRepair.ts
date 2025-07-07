import { supabase } from "@/lib/supabase";

export const emergencyAuthRepair = async () => {
  console.log("🚨 === EMERGENCY AUTH REPAIR ===");

  try {
    // 1. Test basic connection
    console.log("1. Testing basic connection...");
    const { data: testData, error: testError } = await supabase
      .from("employees")
      .select("count")
      .limit(1);

    if (testError) {
      console.error("❌ Basic connection failed:", testError);
      return { success: false, error: "Database connection failed" };
    }
    console.log("✅ Database connection working");

    // 2. Check auth configuration
    console.log("\n2. Checking auth configuration...");
    const {
      data: { session },
      error: sessionError,
    } = await supabase.auth.getSession();
    console.log("Current session:", session?.user?.email || "None");

    // 3. Try to list existing users (if we have admin access)
    console.log("\n3. Attempting to list auth users...");
    try {
      const { data: authUsers, error: listError } =
        await supabase.auth.admin.listUsers();
      if (listError) {
        console.warn(
          "⚠️ Cannot list users (expected if not admin):",
          listError.message,
        );
      } else {
        console.log(`�� Found ${authUsers.users.length} auth users`);
        authUsers.users.forEach((user) => {
          console.log(`  - ${user.email} (${user.id})`);
        });
      }
    } catch (listErr) {
      console.warn("⚠️ List users not available:", listErr);
    }

    // 4. Emergency admin creation
    console.log("\n4. Emergency admin creation...");
    const emergencyEmail = "emergency@cadizbar.com";
    const emergencyPassword = "Emergency2025!";

    // Try to sign up emergency admin
    const { data: emergencySignUp, error: emergencyError } =
      await supabase.auth.signUp({
        email: emergencyEmail,
        password: emergencyPassword,
        options: {
          data: {
            name: "Emergency Admin",
            role: "admin",
          },
        },
      });

    if (emergencyError) {
      console.error(
        "❌ Emergency admin creation failed:",
        emergencyError.message,
      );

      // Try to sign in instead (maybe it already exists)
      const { data: emergencySignIn, error: signInError } =
        await supabase.auth.signInWithPassword({
          email: emergencyEmail,
          password: emergencyPassword,
        });

      if (!signInError) {
        console.log("✅ Emergency admin already exists and login successful");

        // Create users table entry if needed
        const { error: userTableError } = await supabase.from("users").upsert({
          id: emergencySignIn.user.id,
          username: "emergency_admin",
          email: emergencyEmail,
          name: "Emergency Admin",
          role: "admin",
          is_active: true,
          password_hash: "emergency_hash",
          needs_password_change: true,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        });

        if (userTableError) {
          console.error(
            "❌ Failed to create users table entry:",
            userTableError,
          );
        } else {
          console.log("✅ Users table entry created/updated");
        }

        return {
          success: true,
          emergencyCredentials: {
            email: emergencyEmail,
            password: emergencyPassword,
          },
        };
      }
    } else {
      console.log("✅ Emergency admin created successfully");

      // Create users table entry
      if (emergencySignUp.user) {
        const { error: userTableError } = await supabase.from("users").insert({
          id: emergencySignUp.user.id,
          username: "emergency_admin",
          email: emergencyEmail,
          name: "Emergency Admin",
          role: "admin",
          is_active: true,
          password_hash: "emergency_hash",
          needs_password_change: true,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        });

        if (userTableError) {
          console.error(
            "❌ Failed to create users table entry:",
            userTableError,
          );
        } else {
          console.log("✅ Users table entry created");
        }
      }

      return {
        success: true,
        emergencyCredentials: {
          email: emergencyEmail,
          password: emergencyPassword,
        },
      };
    }

    // 5. Check Supabase auth settings
    console.log("\n5. Auth settings recommendations:");
    console.log(
      "📋 Please check in Supabase Dashboard > Authentication > Settings:",
    );
    console.log("   - Confirm email: Should be DISABLED for development");
    console.log("   - Enable sign ups: Should be ENABLED");
    console.log("   - Email auth: Should be ENABLED");
    console.log("   - Site URL: Should include your domain");

    return { success: false, error: "Manual configuration required" };
  } catch (error) {
    console.error("💥 Emergency repair failed:", error);
    return { success: false, error: error.message };
  }
};

export const fixSupabaseAuthSettings = () => {
  console.log("🔧 === SUPABASE AUTH SETTINGS FIX ===");
  console.log("Please apply these settings in Supabase Dashboard:");
  console.log("");
  console.log("🌐 Authentication > Settings > General:");
  console.log("   ✅ Enable email confirmations: DISABLED");
  console.log("   ✅ Enable sign-ups: ENABLED");
  console.log("   ✅ Enable email auth: ENABLED");
  console.log("");
  console.log("🌐 Site URL should include:");
  console.log(
    "   - https://7d4015f9c8904773bd67813599695133-aa95f95ce3a14865ba266eb6b.fly.dev",
  );
  console.log("   - http://localhost:3000 (for development)");
  console.log("");
  console.log("🌐 Redirect URLs should include:");
  console.log(
    "   - https://7d4015f9c8904773bd67813599695133-aa95f95ce3a14865ba266eb6b.fly.dev",
  );
  console.log(
    "   - https://7d4015f9c8904773bd67813599695133-aa95f95ce3a14865ba266eb6b.fly.dev/login",
  );
  console.log("   - http://localhost:3000");
  console.log("");
  console.log("🔐 RLS Policies:");
  console.log("   - Make sure RLS is properly configured for users table");
  console.log("   - Check that INSERT/SELECT policies allow user creation");
};

export const testBasicAuth = async () => {
  console.log("🧪 === BASIC AUTH TEST ===");

  // Test 1: Simple signup
  const testEmail = `test_${Date.now()}@test.com`;
  const testPassword = "TestPassword123!";

  console.log(`Testing signup with: ${testEmail}`);

  const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
    email: testEmail,
    password: testPassword,
  });

  if (signUpError) {
    console.error("❌ Signup test failed:", signUpError.message);
    return false;
  }

  console.log("✅ Signup test successful");

  // Test 2: Try to sign in immediately
  const { data: signInData, error: signInError } =
    await supabase.auth.signInWithPassword({
      email: testEmail,
      password: testPassword,
    });

  if (signInError) {
    console.error("❌ Signin test failed:", signInError.message);
    return false;
  }

  console.log("✅ Signin test successful");

  // Clean up
  await supabase.auth.signOut();

  return true;
};

// Make functions globally available
if (typeof window !== "undefined") {
  (window as any).emergencyAuthRepair = emergencyAuthRepair;
  (window as any).fixSupabaseAuthSettings = fixSupabaseAuthSettings;
  (window as any).testBasicAuth = testBasicAuth;

  console.log("🚨 Emergency auth repair functions loaded:");
  console.log("   - emergencyAuthRepair()");
  console.log("   - fixSupabaseAuthSettings()");
  console.log("   - testBasicAuth()");
}
