import { supabase } from "@/lib/supabase";

export const migrateExistingEmployees = async () => {
  try {
    console.log("🔄 Starting employee migration...");

    // 1. Get employees without auth users
    const { data: employees, error: employeesError } = await supabase
      .from("employees")
      .select("id, name, dni, email, status")
      .eq("status", "active")
      .not("email", "is", null);

    if (employeesError) {
      throw employeesError;
    }

    // 2. Check which employees don't have auth users
    const employeesToMigrate = [];

    for (const employee of employees) {
      const { data: existingUser } = await supabase.auth.admin.getUserByEmail(
        employee.email,
      );

      if (!existingUser.user) {
        employeesToMigrate.push(employee);
      }
    }

    console.log(`📊 Found ${employeesToMigrate.length} employees to migrate`);

    // 3. Create auth users for each employee
    const results = {
      success: 0,
      failed: 0,
      errors: [] as string[],
    };

    for (const employee of employeesToMigrate) {
      try {
        console.log(`🔄 Creating user for: ${employee.name}`);

        // Create user in Supabase Auth
        const { data: authUser, error: authError } =
          await supabase.auth.admin.createUser({
            email: employee.email,
            password: employee.dni, // Password = DNI
            email_confirm: true,
            user_metadata: {
              name: employee.name,
              role: "employee",
              employee_id: employee.id,
            },
          });

        if (authError) {
          throw authError;
        }

        // Create/update user in public.users
        const { error: dbError } = await supabase
          .from("users")
          .insert({
            id: authUser.user.id,
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
          })
          .select()
          .single();

        if (dbError) {
          // If public.users creation fails, cleanup auth user
          await supabase.auth.admin.deleteUser(authUser.user.id);
          throw dbError;
        }

        console.log(`✅ Success: ${employee.name} - ${employee.email}`);
        results.success++;
      } catch (error) {
        console.error(`❌ Failed: ${employee.name} - ${error}`);
        results.failed++;
        results.errors.push(`${employee.name}: ${error}`);
      }
    }

    // 4. Return results
    console.log("🎯 Migration completed:", results);
    return {
      total: employeesToMigrate.length,
      ...results,
    };
  } catch (error) {
    console.error("❌ Migration failed:", error);
    throw error;
  }
};

// Helper function to run migration from console
(window as any).migrateEmployees = migrateExistingEmployees;
