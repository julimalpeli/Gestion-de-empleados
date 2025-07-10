// Immediate auth fix - to be pasted directly in browser console

const fixAuthImmediately = async () => {
  console.log("🚨 === IMMEDIATE AUTH FIX ===");

  try {
    // Get Supabase instance from window
    let supabase;

    // Try to find supabase in the global scope
    if (window.supabase) {
      supabase = window.supabase;
      console.log("✅ Found global supabase instance");
    } else {
      // Try to import from CDN
      try {
        const { createClient } = await import(
          "https://cdn.skypack.dev/@supabase/supabase-js@2"
        );

        const supabaseUrl = "https://bkzwzipjysjxkqpqgcsr.supabase.co";
        const supabaseKey =
          "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJrend6aXBqeXNqeGtxcHFnY3NyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzQ0ODgxNzYsImV4cCI6MjA1MDA2NDE3Nn0.mAcVyN0j2ALqYF-P-X7fXBfwBKJhHVKp6hmlgPOZGwc";

        supabase = createClient(supabaseUrl, supabaseKey);
        console.log("✅ Created supabase client from CDN");
      } catch (cdnError) {
        console.error("❌ Could not load supabase from CDN:", cdnError);
        return;
      }
    }

    // List of known admin credentials to test and create
    const adminCredentials = [
      {
        email: "julimalpeli@gmail.com",
        password: "Jmalpeli3194",
        name: "Julian Malpeli",
        role: "admin",
      },
      {
        email: "admin@cadizbar.com",
        password: "Admin2025!",
        name: "Administrador",
        role: "admin",
      },
    ];

    console.log("🔍 Testing existing admin credentials...");

    let workingCredentials = null;

    // Test each credential
    for (const cred of adminCredentials) {
      console.log(`Testing: ${cred.email}`);

      try {
        const { data, error } = await supabase.auth.signInWithPassword({
          email: cred.email,
          password: cred.password,
        });

        if (!error && data.user) {
          console.log(`✅ SUCCESS: ${cred.email} works!`);
          workingCredentials = cred;

          // Sign out immediately
          await supabase.auth.signOut();
          break;
        } else {
          console.log(`❌ FAILED: ${cred.email} - ${error?.message}`);
        }
      } catch (testError) {
        console.log(`❌ ERROR testing ${cred.email}:`, testError.message);
      }
    }

    if (workingCredentials) {
      console.log("🎉 === WORKING CREDENTIALS FOUND ===");
      console.log(`📧 Email: ${workingCredentials.email}`);
      console.log(`🔑 Password: ${workingCredentials.password}`);
      console.log("✅ You can now login with these credentials");
      return workingCredentials;
    }

    console.log("⚠️ No working credentials found. Creating emergency admin...");

    // Create emergency admin
    const emergencyAdmin = {
      email: "emergency@cadizbar.com",
      password: "Emergency2025!",
      name: "Emergency Admin",
      role: "admin",
    };

    console.log("🔄 Creating emergency admin...");

    try {
      const { data: signUpData, error: signUpError } =
        await supabase.auth.signUp({
          email: emergencyAdmin.email,
          password: emergencyAdmin.password,
          options: {
            data: {
              name: emergencyAdmin.name,
              role: emergencyAdmin.role,
            },
          },
        });

      if (signUpError) {
        console.error("❌ Emergency admin signup failed:", signUpError.message);

        if (signUpError.message.includes("already registered")) {
          console.log("ℹ️ User already exists, trying to sign in...");

          const { data: signInData, error: signInError } =
            await supabase.auth.signInWithPassword({
              email: emergencyAdmin.email,
              password: emergencyAdmin.password,
            });

          if (!signInError && signInData.user) {
            console.log("✅ Emergency admin exists and login works!");
            await supabase.auth.signOut();

            console.log("🎉 === EMERGENCY ADMIN READY ===");
            console.log(`📧 Email: ${emergencyAdmin.email}`);
            console.log(`🔑 Password: ${emergencyAdmin.password}`);
            return emergencyAdmin;
          }
        }

        return null;
      }

      if (signUpData.user) {
        console.log("✅ Emergency admin created successfully");

        // Try to create users table entry
        try {
          const { error: usersError } = await supabase.from("users").insert({
            id: signUpData.user.id,
            username: "emergency_admin",
            email: emergencyAdmin.email,
            name: emergencyAdmin.name,
            role: emergencyAdmin.role,
            is_active: true,
            password_hash: btoa(emergencyAdmin.password),
            needs_password_change: false,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          });

          if (usersError) {
            console.warn(
              "⚠️ Could not create users table entry:",
              usersError.message,
            );
          } else {
            console.log("✅ Users table entry created");
          }
        } catch (dbError) {
          console.warn("⚠️ Database error:", dbError.message);
        }

        console.log("🎉 === EMERGENCY ADMIN CREATED ===");
        console.log(`📧 Email: ${emergencyAdmin.email}`);
        console.log(`🔑 Password: ${emergencyAdmin.password}`);
        return emergencyAdmin;
      }
    } catch (createError) {
      console.error("❌ Failed to create emergency admin:", createError);
    }

    console.log("❌ Could not create working credentials");
    console.log("🔧 Manual steps required:");
    console.log("1. Check Supabase Dashboard > Authentication > Settings");
    console.log("2. Ensure 'Enable sign ups' is ON");
    console.log("3. Ensure 'Enable email confirmations' is OFF");

    return null;
  } catch (error) {
    console.error("💥 Critical error:", error);
    return null;
  }
};

// Also create a simple credential tester
const testCredentials = async (email, password) => {
  console.log(`🧪 Testing credentials: ${email}`);

  try {
    const { createClient } = await import(
      "https://cdn.skypack.dev/@supabase/supabase-js@2"
    );

    const supabaseUrl = "https://bkzwzipjysjxkqpqgcsr.supabase.co";
    const supabaseKey =
      "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJrend6aXBqeXNqeGtxcHFnY3NyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzQ0ODgxNzYsImV4cCI6MjA1MDA2NDE3Nn0.mAcVyN0j2ALqYF-P-X7fXBfwBKJhHVKp6hmlgPOZGwc";

    const supabase = createClient(supabaseUrl, supabaseKey);

    const { data, error } = await supabase.auth.signInWithPassword({
      email: email,
      password: password,
    });

    if (error) {
      console.log(`❌ FAILED: ${error.message}`);
      return false;
    }

    if (data.user) {
      console.log(`✅ SUCCESS: Login works for ${email}`);
      await supabase.auth.signOut();
      return true;
    }

    return false;
  } catch (error) {
    console.error("❌ Test error:", error);
    return false;
  }
};

console.log("🚨 AUTH FIX FUNCTIONS LOADED:");
console.log(
  "  - fixAuthImmediately() - Find or create working admin credentials",
);
console.log("  - testCredentials(email, password) - Test specific credentials");

// Make functions available globally
window.fixAuthImmediately = fixAuthImmediately;
window.testCredentials = testCredentials;

// Auto-run disabled to prevent fetch errors
// Run manually if needed: fixAuthImmediately()
console.log("🔧 Auth fix functions available (manual execution only)");
// fixAuthImmediately();
