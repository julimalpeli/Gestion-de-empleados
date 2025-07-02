import { supabase } from "@/lib/supabase";

interface Employee {
  id: string;
  name: string;
  dni: string;
  email?: string;
  status: string;
}

export const recreateEmployeeUsers = async () => {
  try {
    console.log("🔄 Starting employee user recreation...");

    // 1. Get all active employees
    const { data: employees, error: employeesError } = await supabase
      .from("employees")
      .select("id, name, dni, email, status")
      .eq("status", "active");

    if (employeesError) {
      console.error("❌ Error fetching employees:", employeesError);
      return { success: false, error: employeesError.message };
    }

    console.log(`📊 Found ${employees.length} active employees`);

    const results = {
      total: employees.length,
      successful: 0,
      failed: 0,
      skipped: 0,
      details: [] as any[],
    };

    for (const employee of employees) {
      try {
        console.log(`\n🔄 Processing: ${employee.name} (DNI: ${employee.dni})`);

        // Skip if no email provided
        if (!employee.email) {
          console.log(`⏭️ Skipping ${employee.name} - no email provided`);
          results.skipped++;
          results.details.push({
            employee: employee.name,
            status: "skipped",
            reason: "No email provided",
          });
          continue;
        }

        // 2. Delete existing auth user if exists (cleanup)
        try {
          const { data: existingUsers } = await supabase.auth.admin.listUsers();
          const existingUser = existingUsers.users.find(
            (u) => u.email === employee.email,
          );

          if (existingUser) {
            console.log(`🗑️ Deleting existing auth user: ${employee.email}`);
            await supabase.auth.admin.deleteUser(existingUser.id);
          }
        } catch (deleteError) {
          console.warn(`⚠️ Could not delete existing user: ${deleteError}`);
        }

        // 3. Delete existing users table entry
        try {
          await supabase.from("users").delete().eq("email", employee.email);
          console.log(`🗑️ Cleaned up users table for: ${employee.email}`);
        } catch (cleanupError) {
          console.warn(`⚠️ Could not cleanup users table: ${cleanupError}`);
        }

        // 4. Create new Supabase Auth user
        const { data: authData, error: authError } =
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
          console.error(
            `❌ Auth user creation failed for ${employee.name}:`,
            authError,
          );
          results.failed++;
          results.details.push({
            employee: employee.name,
            status: "failed",
            reason: `Auth creation: ${authError.message}`,
          });
          continue;
        }

        console.log(`✅ Auth user created: ${authData.user.id}`);

        // 5. Create users table entry
        const { error: dbError } = await supabase.from("users").insert({
          id: authData.user.id,
          username: employee.dni,
          email: employee.email,
          name: employee.name,
          role: "employee",
          employee_id: employee.id,
          is_active: true,
          needs_password_change: false, // They can change it if they want
        });

        if (dbError) {
          console.error(
            `❌ Database user creation failed for ${employee.name}:`,
            dbError,
          );
          // Try to cleanup the auth user
          try {
            await supabase.auth.admin.deleteUser(authData.user.id);
          } catch (cleanupError) {
            console.warn(`⚠️ Could not cleanup auth user: ${cleanupError}`);
          }

          results.failed++;
          results.details.push({
            employee: employee.name,
            status: "failed",
            reason: `Database: ${dbError.message}`,
          });
          continue;
        }

        console.log(`✅ Complete user setup for: ${employee.name}`);
        console.log(`   📧 Email: ${employee.email}`);
        console.log(`   🔑 Password: ${employee.dni}`);

        results.successful++;
        results.details.push({
          employee: employee.name,
          email: employee.email,
          password: employee.dni,
          status: "success",
        });
      } catch (error) {
        console.error(
          `❌ Unexpected error processing ${employee.name}:`,
          error,
        );
        results.failed++;
        results.details.push({
          employee: employee.name,
          status: "failed",
          reason: `Unexpected: ${error}`,
        });
      }
    }

    // Final report
    console.log("\n📊 RECREATION COMPLETE:");
    console.log(`   ✅ Successful: ${results.successful}`);
    console.log(`   ❌ Failed: ${results.failed}`);
    console.log(`   ⏭️ Skipped: ${results.skipped}`);
    console.log(`   📝 Total: ${results.total}`);

    return { success: true, results };
  } catch (error) {
    console.error("❌ Recreation process failed:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
};

// Helper function to check user status
export const checkEmployeeUserStatus = async () => {
  try {
    console.log("🔍 Checking employee user status...");

    const { data: employees, error: employeesError } = await supabase
      .from("employees")
      .select("id, name, dni, email, status")
      .eq("status", "active");

    if (employeesError) {
      console.error("❌ Error fetching employees:", employeesError);
      return;
    }

    const { data: users, error: usersError } = await supabase
      .from("users")
      .select("id, email, name, role, employee_id, is_active");

    if (usersError) {
      console.error("❌ Error fetching users:", usersError);
      return;
    }

    console.log("\n📊 EMPLOYEE USER STATUS:");
    for (const employee of employees) {
      const hasUser = users.find((u) => u.employee_id === employee.id);
      const status = hasUser ? "✅ HAS USER" : "❌ NO USER";
      console.log(
        `   ${status} - ${employee.name} (${employee.email || "no email"})`,
      );
    }
  } catch (error) {
    console.error("❌ Status check failed:", error);
  }
};
