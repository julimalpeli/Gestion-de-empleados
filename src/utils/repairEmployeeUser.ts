import { supabase } from "@/lib/supabase";

export const repairEmployeeUser = async (employeeEmail: string) => {
  try {
    console.log(`🔧 Repairing user for employee: ${employeeEmail}`);

    // 1. Find the employee
    const { data: employee, error: empError } = await supabase
      .from("employees")
      .select("*")
      .eq("email", employeeEmail)
      .single();

    if (empError || !employee) {
      throw new Error(`Employee not found: ${empError?.message}`);
    }

    console.log("✅ Employee found:", employee.name);

    // 2. Check if user already exists in users table
    const { data: existingUser, error: userError } = await supabase
      .from("users")
      .select("*")
      .eq("email", employeeEmail)
      .single();

    if (existingUser) {
      console.log("ℹ️ User already exists in users table");
      return { success: true, message: "User already exists" };
    }

    // 3. Create auth user
    console.log("🔄 Creating auth user...");
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email: employee.email,
      password: employee.dni, // Use DNI as password
      options: {
        emailRedirectTo: undefined, // Skip email confirmation
        data: {
          name: employee.name,
          role: "employee",
          employee_id: employee.id,
        },
      },
    });

    if (authError) {
      if (authError.message.includes("already registered")) {
        console.log(
          "ℹ️ Auth user already exists, continuing with user table creation",
        );
        // Try to sign in to get the user ID
        const { data: signInData, error: signInError } =
          await supabase.auth.signInWithPassword({
            email: employee.email,
            password: employee.dni,
          });

        if (signInError || !signInData.user) {
          throw new Error(
            `Cannot authenticate existing user: ${signInError?.message}`,
          );
        }

        authData.user = signInData.user;
        // Sign out immediately after getting user data
        await supabase.auth.signOut();
      } else {
        throw new Error(`Auth creation failed: ${authError.message}`);
      }
    }

    if (!authData.user) {
      throw new Error("No user returned from auth");
    }

    console.log("✅ Auth user created/found:", authData.user.email);

    // 4. Create user in public.users table
    console.log("🔄 Creating user in database...");
    const { error: dbError } = await supabase.from("users").insert({
      id: authData.user.id,
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

    console.log("✅ User created successfully in database");
    return {
      success: true,
      message: `User created successfully for ${employee.name}`,
      userId: authData.user.id,
      email: employee.email,
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

export const diagnoseEmployeeUser = async (employeeEmail: string) => {
  try {
    console.log(`🔍 Diagnosing user for employee: ${employeeEmail}`);

    // 1. Check employee exists
    const { data: employee, error: empError } = await supabase
      .from("employees")
      .select("*")
      .eq("email", employeeEmail)
      .single();

    console.log(
      "Employee in database:",
      employee ? "✅ Found" : "❌ Not found",
    );
    if (empError) console.log("Employee error:", empError.message);

    // 2. Check user exists in users table
    const { data: user, error: userError } = await supabase
      .from("users")
      .select("*")
      .eq("email", employeeEmail)
      .single();

    console.log("User in users table:", user ? "✅ Found" : "❌ Not found");
    if (userError) console.log("User error:", userError.message);

    // 3. Try to check auth (limited from client)
    console.log("Auth user: Cannot check from client (requires admin API)");

    return {
      employee: !!employee,
      user: !!user,
      recommendation: !employee
        ? "Employee not found - create employee first"
        : !user
          ? "User missing - run repairEmployeeUser()"
          : "All good!",
    };
  } catch (error) {
    console.error("❌ Diagnosis failed:", error);
    return { error: error.message };
  }
};

// Make functions available globally for debugging
if (typeof window !== "undefined") {
  (window as any).repairEmployeeUser = repairEmployeeUser;
  (window as any).diagnoseEmployeeUser = diagnoseEmployeeUser;
}
