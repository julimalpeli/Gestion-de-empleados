import { supabase } from "@/lib/supabase";

export const fixNachitoUser = async () => {
  console.log("🔧 === FIXING NACHITO USER ===");

  const userData = {
    email: "nachito_ja@hotmail.com",
    password: "30728007", // DNI as password
    dni: "30728007",
    name: "Ignacio Alvarez",
    role: "employee" as const,
  };

  try {
    // Step 1: Try to sign in first
    console.log(`👤 Testing login for ${userData.email}...`);
    const { data: signInData, error: signInError } =
      await supabase.auth.signInWithPassword({
        email: userData.email,
        password: userData.password,
      });

    if (!signInError && signInData.user) {
      console.log("✅ User already exists in Supabase Auth");

      // Check if user exists in users table
      const { data: existingUser, error: fetchError } = await supabase
        .from("users")
        .select("*")
        .eq("email", userData.email)
        .single();

      if (fetchError || !existingUser) {
        console.log("🔄 Creating users table entry...");

        // Create users table entry
        const { error: usersError } = await supabase.from("users").insert({
          id: signInData.user.id,
          username: userData.dni,
          email: userData.email,
          name: userData.name,
          role: userData.role,
          is_active: true,
          password_hash: btoa(userData.password),
          needs_password_change: false,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
          employee_id: null, // Will be set when employee is associated
        });

        if (usersError) {
          console.error("❌ Failed to create users table entry:", usersError);
          return { success: false, error: usersError.message };
        }

        console.log("✅ Users table entry created successfully");
      } else {
        console.log("✅ Users table entry already exists");
      }

      await supabase.auth.signOut();
      return { success: true, message: "User fixed successfully" };
    }

    // Step 2: User doesn't exist, create it
    console.log(`🔄 Creating new user ${userData.email}...`);

    const { data: signUpData, error: signUpError } = await supabase.auth.signUp(
      {
        email: userData.email,
        password: userData.password,
        options: {
          data: {
            name: userData.name,
            role: userData.role,
            dni: userData.dni,
          },
        },
      },
    );

    if (signUpError) {
      console.error("❌ Failed to create user in Auth:", signUpError.message);

      // Check if it's because signups are disabled
      if (signUpError.message.includes("Signups not allowed")) {
        console.log("🚨 Signups are disabled in Supabase settings!");
        console.log("📋 To fix this:");
        console.log("1. Go to Supabase Dashboard");
        console.log("2. Authentication > Settings");
        console.log("3. Enable 'Enable sign ups'");
        console.log("4. Disable 'Enable email confirmations' for development");
        return {
          success: false,
          error: "Signups disabled in Supabase settings",
        };
      }

      return { success: false, error: signUpError.message };
    }

    if (!signUpData.user) {
      console.error("❌ No user returned from signup");
      return { success: false, error: "No user returned from signup" };
    }

    console.log("✅ User created in Supabase Auth");

    // Step 3: Create users table entry
    console.log("🔄 Creating users table entry...");

    const { error: usersError } = await supabase.from("users").insert({
      id: signUpData.user.id,
      username: userData.dni,
      email: userData.email,
      name: userData.name,
      role: userData.role,
      is_active: true,
      password_hash: btoa(userData.password),
      needs_password_change: false,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      employee_id: null, // Will be set when employee is associated
    });

    if (usersError) {
      console.error("❌ Failed to create users table entry:", usersError);
      // Try to clean up the auth user
      try {
        await supabase.auth.admin.deleteUser(signUpData.user.id);
        console.log("🧹 Cleaned up auth user due to users table error");
      } catch (cleanupError) {
        console.warn("⚠️ Could not clean up auth user:", cleanupError);
      }
      return { success: false, error: usersError.message };
    }

    console.log("✅ Users table entry created successfully");

    // Step 4: Check if employee exists with this DNI
    console.log("🔍 Checking for existing employee with DNI:", userData.dni);

    const { data: existingEmployee, error: employeeError } = await supabase
      .from("employees")
      .select("*")
      .eq("dni", userData.dni)
      .single();

    if (employeeError) {
      console.log("📝 No existing employee found with this DNI");
      console.log(
        "💡 You can create an employee record later and associate it",
      );
    } else {
      console.log("👤 Found existing employee:", existingEmployee.name);

      // Update users table with employee_id
      const { error: updateError } = await supabase
        .from("users")
        .update({ employee_id: existingEmployee.id })
        .eq("id", signUpData.user.id);

      if (updateError) {
        console.warn("⚠️ Could not associate user with employee:", updateError);
      } else {
        console.log("✅ User associated with existing employee");
      }
    }

    console.log("\n🎉 === NACHITO USER FIXED SUCCESSFULLY ===");
    console.log(`Email: ${userData.email}`);
    console.log(`Password: ${userData.password}`);
    console.log(`Name: ${userData.name}`);
    console.log(`Role: ${userData.role}`);

    return {
      success: true,
      message: "User created and configured successfully",
    };
  } catch (error) {
    console.error("💥 Unexpected error:", error);
    return { success: false, error: error.message };
  }
};

export const testNachitoLogin = async () => {
  console.log("🧪 === TESTING NACHITO LOGIN ===");

  const { data, error } = await supabase.auth.signInWithPassword({
    email: "nachito_ja@hotmail.com",
    password: "30728007",
  });

  if (error) {
    console.error("❌ Login test failed:", error.message);
    return false;
  }

  console.log("✅ Login test successful for nachito_ja@hotmail.com");
  await supabase.auth.signOut();
  return true;
};

// Make functions globally available
if (typeof window !== "undefined") {
  (window as any).fixNachitoUser = fixNachitoUser;
  (window as any).testNachitoLogin = testNachitoLogin;

  console.log("🔧 Nachito user fix functions loaded:");
  console.log("   - fixNachitoUser()");
  console.log("   - testNachitoLogin()");
}
