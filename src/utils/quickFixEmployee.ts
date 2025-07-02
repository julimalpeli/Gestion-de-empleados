import { supabase } from "@/lib/supabase";

export const recreateEmployee44586777 = async () => {
  try {
    console.log("🔄 Recreating user for employee DNI 44586777...");

    const email = "daianaayelen0220@gmail.com";
    const password = "44586777";

    // 1. Get employee data
    const { data: employee, error: empError } = await supabase
      .from("employees")
      .select("*")
      .eq("dni", "44586777")
      .single();

    if (empError || !employee) {
      throw new Error(
        `Employee with DNI 44586777 not found: ${empError?.message}`,
      );
    }

    console.log("✅ Found employee:", employee.name);

    // 2. Check if auth user exists
    const { data: existingAuth } = await supabase.auth.admin.listUsers();
    const existingUser = existingAuth.users.find((u) => u.email === email);

    if (existingUser) {
      console.log("🗑️ Deleting existing auth user...");
      await supabase.auth.admin.deleteUser(existingUser.id);
    }

    // 3. Delete from public.users
    await supabase.from("users").delete().eq("email", email);
    console.log("🗑️ Cleaned up public.users");

    // 4. Create new auth user
    const { data: authData, error: authError } =
      await supabase.auth.admin.createUser({
        email: email,
        password: password,
        email_confirm: true,
        user_metadata: {
          name: employee.name,
          role: "employee",
          employee_id: employee.id,
        },
      });

    if (authError || !authData.user) {
      throw new Error(`Failed to create auth user: ${authError?.message}`);
    }

    console.log("✅ Created auth user:", authData.user.id);

    // 5. Create public.users entry
    const { error: dbError } = await supabase.from("users").insert({
      id: authData.user.id,
      username: employee.dni,
      email: email,
      name: employee.name,
      role: "employee",
      employee_id: employee.id,
      is_active: true,
      needs_password_change: false,
    });

    if (dbError) {
      // Cleanup auth user if db insert fails
      await supabase.auth.admin.deleteUser(authData.user.id);
      throw new Error(`Failed to create public user: ${dbError.message}`);
    }

    console.log("✅ Employee user recreated successfully!");
    console.log("📧 Email:", email);
    console.log("🔑 Password:", password);

    return {
      success: true,
      email,
      password,
      employee: employee.name,
    };
  } catch (error) {
    console.error("❌ Failed to recreate employee user:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
};

// Make available in window for console access
if (import.meta.env.DEV) {
  (window as any).recreateEmployee44586777 = recreateEmployee44586777;
}
