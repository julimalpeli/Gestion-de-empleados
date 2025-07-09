import { supabase } from "@/lib/supabase";

// Immediate fix for employee 35940844
export const createUserFor35940844 = async () => {
  console.log("🚨 === EMERGENCY USER CREATION FOR DNI 35940844 ===");

  try {
    // Get employee data
    const { data: employee, error: empError } = await supabase
      .from("employees")
      .select("*")
      .eq("dni", "35940844")
      .single();

    if (empError || !employee) {
      console.error("❌ Employee not found:", empError);
      return { success: false, error: "Employee not found" };
    }

    console.log("👤 Found employee:", employee.name, employee.email);

    if (!employee.email) {
      console.error("❌ Employee has no email");
      return { success: false, error: "Employee has no email" };
    }

    // Check if user already exists
    const { data: existingUser } = await supabase
      .from("users")
      .select("*")
      .eq("email", employee.email)
      .single();

    if (existingUser) {
      console.log("ℹ️ User already exists in database");
      return { success: true, message: "User already exists" };
    }

    // Try to create user in Supabase Auth
    console.log("🔄 Creating auth user...");
    const { data: authUser, error: authError } = await supabase.auth.signUp({
      email: employee.email,
      password: employee.dni, // DNI as password
      options: {
        data: {
          name: employee.name,
          role: "employee",
        },
      },
    });

    if (authError) {
      console.error("❌ Auth signup failed:", authError.message);

      // Try to sign in (maybe user exists in auth but not in our users table)
      const { data: signInData, error: signInError } =
        await supabase.auth.signInWithPassword({
          email: employee.email,
          password: employee.dni,
        });

      if (!signInError && signInData.user) {
        console.log("✅ User exists in auth, creating users table entry");

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

        await supabase.auth.signOut();

        if (usersError) {
          console.error("❌ Failed to create users table entry:", usersError);
          return { success: false, error: usersError.message };
        }

        console.log("✅ User created successfully!");
        return {
          success: true,
          message: "User created from existing auth user",
        };
      }

      return { success: false, error: authError.message };
    }

    if (!authUser.user) {
      console.error("❌ No user returned from signup");
      return { success: false, error: "No user returned" };
    }

    console.log("✅ Auth user created, now creating users table entry...");

    // Create users table entry
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
      return { success: false, error: usersError.message };
    }

    console.log("🎉 === USER CREATED SUCCESSFULLY ===");
    console.log(`Employee: ${employee.name}`);
    console.log(`Email: ${employee.email}`);
    console.log(`Password: ${employee.dni} (DNI)`);
    console.log(`Status: Active`);

    return { success: true, message: "User created successfully" };
  } catch (error) {
    console.error("💥 Unexpected error:", error);
    return { success: false, error: error.message };
  }
};

// Simple function to test login for this specific user
export const testLoginFor35940844 = async () => {
  console.log("🧪 Testing login for DNI 35940844...");

  try {
    // Get employee email
    const { data: employee } = await supabase
      .from("employees")
      .select("email")
      .eq("dni", "35940844")
      .single();

    if (!employee?.email) {
      console.error("❌ No email found for employee");
      return false;
    }

    const { data, error } = await supabase.auth.signInWithPassword({
      email: employee.email,
      password: "35940844",
    });

    if (error) {
      console.error("❌ Login failed:", error.message);
      return false;
    }

    console.log("✅ Login successful!");
    await supabase.auth.signOut();
    return true;
  } catch (error) {
    console.error("💥 Test failed:", error);
    return false;
  }
};

// Quick function to check all employees without users
export const quickCheckEmployeesWithoutUsers = async () => {
  console.log("🔍 Quick check for employees without users...");

  try {
    // Get all employees with basic info only
    const { data: employees, error: empError } = await supabase
      .from("employees")
      .select("id, name, dni, email")
      .not("email", "is", null)
      .neq("email", "");

    if (empError) {
      console.error("❌ Failed to fetch employees:", empError);
      return;
    }

    // Get users with employee_id
    const { data: users, error: usersError } = await supabase
      .from("users")
      .select("employee_id");

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

    console.log(`📊 Total employees with email: ${employees.length}`);
    console.log(`👤 Employees with users: ${employeeIdsWithUsers.length}`);
    console.log(`❌ Employees without users: ${employeesWithoutUsers.length}`);

    if (employeesWithoutUsers.length > 0) {
      console.log("\n📋 Employees without users:");
      employeesWithoutUsers.forEach((emp) => {
        console.log(`  - ${emp.name} (DNI: ${emp.dni}, Email: ${emp.email})`);
      });
    }

    return employeesWithoutUsers;
  } catch (error) {
    console.error("💥 Check failed:", error);
  }
};

// Global exposure
console.log("🚨 IMMEDIATE USER FIX LOADED");
console.log("Available functions:");
console.log("  - createUserFor35940844() - Create user for DNI 35940844");
console.log("  - testLoginFor35940844() - Test login for DNI 35940844");
console.log("  - quickCheckEmployeesWithoutUsers() - Quick employees check");

// Make available immediately
(window as any).createUserFor35940844 = createUserFor35940844;
(window as any).testLoginFor35940844 = testLoginFor35940844;
(window as any).quickCheckEmployeesWithoutUsers =
  quickCheckEmployeesWithoutUsers;
