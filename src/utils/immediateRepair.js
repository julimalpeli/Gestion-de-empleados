// Función de reparación inmediata para usar en consola
const immediateRepairUser = async (email) => {
  // Import supabase
  const { createClient } = await import("@supabase/supabase-js");

  const supabaseUrl = "https://sqxqhpqfxncxvphymnlf.supabase.co";
  const supabaseKey =
    "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNxeHFocHFmeG5jeHZwaHltbmxmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzMzMzgwNzMsImV4cCI6MjA0ODkxNDA3M30.c0lJhIK7wcrH6vJCBJKM2pU2kAzgv-1YyqvQLhxD2Go";

  const supabase = createClient(supabaseUrl, supabaseKey);

  try {
    console.log(`🔧 Repairing user for: ${email}`);

    // 1. Find the employee
    const { data: employee, error: empError } = await supabase
      .from("employees")
      .select("*")
      .eq("email", email)
      .single();

    if (empError || !employee) {
      throw new Error(`Employee not found: ${empError?.message}`);
    }

    console.log("✅ Employee found:", employee.name, "DNI:", employee.dni);

    // 2. Check if user already exists in users table
    const { data: existingUser } = await supabase
      .from("users")
      .select("*")
      .eq("email", email)
      .single();

    if (existingUser) {
      console.log("ℹ️ User already exists in users table");
      return { success: true, message: "User already exists" };
    }

    // 3. Create auth user
    console.log("🔄 Creating auth user...");
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email: employee.email,
      password: employee.dni,
      options: {
        emailRedirectTo: undefined,
        data: {
          name: employee.name,
          role: "employee",
          employee_id: employee.id,
        },
      },
    });

    let userId = null;

    if (authError) {
      if (authError.message.includes("already registered")) {
        console.log("ℹ️ Auth user already exists, trying to get user ID...");

        // Try to sign in to get user ID
        const { data: signInData, error: signInError } =
          await supabase.auth.signInWithPassword({
            email: employee.email,
            password: employee.dni,
          });

        if (signInError || !signInData.user) {
          throw new Error(`Cannot get user ID: ${signInError?.message}`);
        }

        userId = signInData.user.id;
        await supabase.auth.signOut();
        console.log("✅ Got existing user ID:", userId);
      } else {
        throw new Error(`Auth creation failed: ${authError.message}`);
      }
    } else {
      userId = authData.user.id;
      console.log("✅ Auth user created with ID:", userId);
    }

    // 4. Create user in public.users table
    console.log("🔄 Creating user in database...");
    const { error: dbError } = await supabase.from("users").insert({
      id: userId,
      username: employee.dni,
      email: employee.email,
      name: employee.name,
      role: "employee",
      employee_id: employee.id,
      is_active: true,
      password_hash: "$supabase$auth$handled",
      needs_password_change: true,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    });

    if (dbError) {
      console.error("❌ Database user creation failed:", dbError);
      throw new Error(`Database creation failed: ${dbError.message}`);
    }

    console.log("🎉 SUCCESS! User created successfully");
    console.log("📧 Email:", employee.email);
    console.log("🔑 Password:", employee.dni);
    console.log("👤 Name:", employee.name);

    return {
      success: true,
      message: `User created successfully for ${employee.name}`,
      credentials: {
        email: employee.email,
        password: employee.dni,
      },
    };
  } catch (error) {
    console.error("❌ Repair failed:", error);
    throw error;
  }
};

// Make it globally available
window.immediateRepairUser = immediateRepairUser;
console.log(
  "🔧 immediateRepairUser function loaded. Use: immediateRepairUser('email@example.com')",
);
