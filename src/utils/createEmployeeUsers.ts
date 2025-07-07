import { supabase } from "@/lib/supabase";

interface Employee {
  id: string;
  name: string;
  dni: string;
  email: string;
  position?: string;
}

export const createUserForEmployee = async (employee: Employee) => {
  console.log(`👤 === CREATING USER FOR EMPLOYEE ===`);
  console.log(`Employee: ${employee.name} (${employee.dni})`);
  console.log(`Email: ${employee.email}`);

  if (!employee.email) {
    console.error("❌ No email provided for employee");
    return { success: false, error: "Email is required" };
  }

  try {
    // Step 1: Check if user already exists
    console.log("🔍 Checking if user already exists...");

    const { data: existingUser, error: fetchError } = await supabase
      .from("users")
      .select("*")
      .eq("email", employee.email)
      .single();

    if (!fetchError && existingUser) {
      console.log("ℹ️ User already exists in users table");

      // Update employee_id if needed
      if (existingUser.employee_id !== employee.id) {
        const { error: updateError } = await supabase
          .from("users")
          .update({ employee_id: employee.id })
          .eq("id", existingUser.id);

        if (updateError) {
          console.error("❌ Failed to update employee_id:", updateError);
        } else {
          console.log("✅ Updated employee_id association");
        }
      }

      return { success: true, message: "User already exists and updated" };
    }

    // Step 2: Try to create user in Supabase Auth (standard signup)
    console.log("🔄 Creating user in Supabase Auth...");

    const { data: authUser, error: authError } = await supabase.auth.signUp({
      email: employee.email,
      password: employee.dni, // DNI as password
      options: {
        data: {
          name: employee.name,
          role: "employee",
          employee_id: employee.id,
        },
      },
    });

    if (authError) {
      console.error("❌ Failed to create auth user:", authError.message);

      // Check if user might already exist in auth
      if (authError.message.includes("already registered")) {
        console.log("🔄 User exists in auth, trying to get session...");

        const { data: signInData, error: signInError } =
          await supabase.auth.signInWithPassword({
            email: employee.email,
            password: employee.dni,
          });

        if (!signInError && signInData.user) {
          console.log("✅ Found existing auth user");

          // Create users table entry
          const { error: usersError } = await supabase.from("users").insert({
            id: signInData.user.id,
            username: employee.dni,
            email: employee.email,
            name: employee.name,
            role: "employee",
            is_active: true,
            password_hash: btoa(employee.dni),
            needs_password_change: false,
            employee_id: employee.id,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          });

          if (usersError) {
            console.error("❌ Failed to create users table entry:", usersError);
            return { success: false, error: usersError.message };
          }

          await supabase.auth.signOut();
          console.log("✅ User created successfully from existing auth user");
          return {
            success: true,
            message: "User created from existing auth user",
          };
        }
      }

      return { success: false, error: authError.message };
    }

    if (!authUser.user) {
      console.error("❌ No user returned from auth signup");
      return { success: false, error: "No user returned from signup" };
    }

    console.log("✅ Auth user created successfully");

    // Step 3: Create entry in users table
    console.log("🔄 Creating users table entry...");

    const { error: usersError } = await supabase.from("users").insert({
      id: authUser.user.id,
      username: employee.dni,
      email: employee.email,
      name: employee.name,
      role: "employee",
      is_active: true,
      password_hash: btoa(employee.dni),
      needs_password_change: false,
      employee_id: employee.id,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    });

    if (usersError) {
      console.error("❌ Failed to create users table entry:", usersError);

      // Try to clean up auth user
      try {
        await supabase.auth.admin.deleteUser(authUser.user.id);
        console.log("🧹 Cleaned up auth user due to users table error");
      } catch (cleanupError) {
        console.warn("⚠️ Could not clean up auth user:", cleanupError);
      }

      return { success: false, error: usersError.message };
    }

    console.log("✅ Users table entry created successfully");
    console.log("\n🎉 === USER CREATED SUCCESSFULLY ===");
    console.log(`Email: ${employee.email}`);
    console.log(`Password: ${employee.dni} (DNI)`);
    console.log(`Role: employee`);

    return { success: true, message: "User created successfully" };
  } catch (error) {
    console.error("💥 Unexpected error:", error);
    return { success: false, error: error.message };
  }
};

export const createUsersForAllEmployees = async () => {
  console.log("👥 === CREATING USERS FOR ALL EMPLOYEES ===");

  try {
    // Get all employees without users
    const { data: employees, error: employeesError } = await supabase
      .from("employees")
      .select("*")
      .neq("email", null)
      .neq("email", "");

    if (employeesError) {
      console.error("❌ Failed to fetch employees:", employeesError);
      return { success: false, error: employeesError.message };
    }

    console.log(`📋 Found ${employees.length} employees with email`);

    // Get existing users
    const { data: existingUsers, error: usersError } = await supabase
      .from("users")
      .select("employee_id")
      .not("employee_id", "is", null);

    if (usersError) {
      console.error("❌ Failed to fetch existing users:", usersError);
      return { success: false, error: usersError.message };
    }

    const existingEmployeeIds = existingUsers.map((u) => u.employee_id);
    console.log(`👤 Found ${existingEmployeeIds.length} employees with users`);

    // Filter employees without users
    const employeesWithoutUsers = employees.filter(
      (emp) => !existingEmployeeIds.includes(emp.id),
    );

    console.log(
      `🔄 Need to create users for ${employeesWithoutUsers.length} employees`,
    );

    const results = [];
    for (const employee of employeesWithoutUsers) {
      console.log(`\n👤 Processing: ${employee.name} (${employee.email})`);
      const result = await createUserForEmployee(employee);
      results.push({ employee: employee.name, ...result });

      // Small delay to avoid rate limiting
      await new Promise((resolve) => setTimeout(resolve, 500));
    }

    const successful = results.filter((r) => r.success).length;
    const failed = results.filter((r) => !r.success).length;

    console.log(`\n📊 === SUMMARY ===`);
    console.log(`✅ Successful: ${successful}`);
    console.log(`❌ Failed: ${failed}`);

    if (failed > 0) {
      console.log("\n❌ Failed employees:");
      results
        .filter((r) => !r.success)
        .forEach((r) => {
          console.log(`  - ${r.employee}: ${r.error}`);
        });
    }

    return {
      success: failed === 0,
      successful,
      failed,
      results,
    };
  } catch (error) {
    console.error("💥 Unexpected error:", error);
    return { success: false, error: error.message };
  }
};

export const findEmployeesWithoutUsers = async () => {
  console.log("🔍 === FINDING EMPLOYEES WITHOUT USERS ===");

  try {
    // Get all employees (removed position column that doesn't exist)
    const { data: employees, error: employeesError } = await supabase
      .from("employees")
      .select("id, name, dni, email");

    if (employeesError) {
      console.error("❌ Failed to fetch employees:", employeesError);
      return;
    }

    // Get all users with employee_id
    const { data: users, error: usersError } = await supabase
      .from("users")
      .select("employee_id, email, name");

    if (usersError) {
      console.error("❌ Failed to fetch users:", usersError);
      return;
    }

    const employeeIdsWithUsers = users
      .filter((u) => u.employee_id)
      .map((u) => u.employee_id);

    const employeesWithoutUsers = employees.filter(
      (emp) => !employeeIdsWithUsers.includes(emp.id),
    );

    console.log(`📊 Total employees: ${employees.length}`);
    console.log(`👤 Employees with users: ${employeeIdsWithUsers.length}`);
    console.log(`❌ Employees without users: ${employeesWithoutUsers.length}`);

    if (employeesWithoutUsers.length > 0) {
      console.log("\n📋 Employees without users:");
      employeesWithoutUsers.forEach((emp) => {
        console.log(
          `  - ${emp.name} (DNI: ${emp.dni}, Email: ${emp.email || "NO EMAIL"})`,
        );
      });
    }

    return employeesWithoutUsers;
  } catch (error) {
    console.error("💥 Error:", error);
  }
};

// Make functions globally available
if (typeof window !== "undefined") {
  (window as any).createUserForEmployee = createUserForEmployee;
  (window as any).createUsersForAllEmployees = createUsersForAllEmployees;
  (window as any).findEmployeesWithoutUsers = findEmployeesWithoutUsers;

  console.log("👥 Employee user creation functions loaded:");
  console.log(
    "   - findEmployeesWithoutUsers() - List employees without users",
  );
  console.log(
    "   - createUserForEmployee({ id, name, dni, email }) - Create user for specific employee",
  );
  console.log(
    "   - createUsersForAllEmployees() - Create users for all employees",
  );
}
