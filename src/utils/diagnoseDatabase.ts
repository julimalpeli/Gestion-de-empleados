import { supabase } from "@/lib/supabase";

export const diagnoseEmployeesTable = async () => {
  console.log("🔍 === DIAGNOSING EMPLOYEES TABLE ===");

  try {
    // Try to get one employee to see available columns
    console.log("1. Testing basic select...");
    const { data: basicTest, error: basicError } = await supabase
      .from("employees")
      .select("*")
      .limit(1);

    if (basicError) {
      console.error("❌ Basic select failed:", basicError);
      return false;
    }

    if (basicTest && basicTest.length > 0) {
      console.log("✅ Table exists and has data");
      console.log("📋 Available columns:", Object.keys(basicTest[0]));
      console.log("📊 Sample record:", basicTest[0]);
    } else {
      console.log("⚠️ Table exists but has no data");

      // Try to get table structure anyway
      const { data: emptyTest, error: emptyError } = await supabase
        .from("employees")
        .select("*")
        .limit(0);

      if (!emptyError) {
        console.log("✅ Table structure accessible");
      }
    }

    // Test specific columns that might have different names
    console.log("\n2. Testing common column variations...");

    const columnsToTest = [
      "id",
      "name",
      "dni",
      "email",
      "position", // Original name
      "cargo", // Spanish alternative
      "puesto", // Another Spanish alternative
      "job_title", // English alternative
      "role", // Alternative
      "created_at",
      "updated_at",
    ];

    const existingColumns = [];

    for (const column of columnsToTest) {
      try {
        const { data, error } = await supabase
          .from("employees")
          .select(column)
          .limit(1);

        if (!error) {
          existingColumns.push(column);
          console.log(`✅ ${column}: EXISTS`);
        } else {
          console.log(`❌ ${column}: ${error.message}`);
        }
      } catch (err) {
        console.log(`❌ ${column}: ${err.message}`);
      }
    }

    console.log("\n📋 Confirmed existing columns:", existingColumns);

    // Count total employees
    console.log("\n3. Counting employees...");
    const { count, error: countError } = await supabase
      .from("employees")
      .select("*", { count: "exact", head: true });

    if (!countError) {
      console.log(`📊 Total employees: ${count}`);
    }

    return {
      success: true,
      existingColumns,
      totalEmployees: count || 0,
      sampleRecord: basicTest?.[0] || null,
    };
  } catch (error) {
    console.error("💥 Diagnosis failed:", error);
    return { success: false, error: error.message };
  }
};

export const fixEmployeeUsersQuery = async () => {
  console.log("🔧 === FIXING EMPLOYEE USERS QUERY ===");

  try {
    // First diagnose the table
    const diagnosis = await diagnoseEmployeesTable();

    if (!diagnosis.success) {
      console.error("❌ Cannot proceed without table diagnosis");
      return;
    }

    console.log("\n4. Finding employees with safe column selection...");

    // Use only confirmed existing columns
    const safeColumns = ["id", "name", "dni", "email"];
    const selectClause = safeColumns
      .filter((col) => diagnosis.existingColumns.includes(col))
      .join(", ");

    console.log(`🔍 Using safe columns: ${selectClause}`);

    const { data: employees, error: employeesError } = await supabase
      .from("employees")
      .select(selectClause)
      .not("email", "is", null)
      .neq("email", "");

    if (employeesError) {
      console.error("❌ Safe query failed:", employeesError);
      return;
    }

    console.log(`📋 Found ${employees.length} employees with email`);

    // Get existing users
    const { data: existingUsers, error: usersError } = await supabase
      .from("users")
      .select("employee_id, email, name");

    if (usersError) {
      console.error("❌ Failed to fetch existing users:", usersError);
      return;
    }

    const employeeIdsWithUsers = existingUsers
      .filter((u) => u.employee_id)
      .map((u) => u.employee_id);

    const employeesWithoutUsers = employees.filter(
      (emp) => !employeeIdsWithUsers.includes(emp.id),
    );

    console.log(`👤 Employees with users: ${employeeIdsWithUsers.length}`);
    console.log(`❌ Employees without users: ${employeesWithoutUsers.length}`);

    if (employeesWithoutUsers.length > 0) {
      console.log("\n📋 Employees without users:");
      employeesWithoutUsers.forEach((emp) => {
        console.log(
          `  - ${emp.name} (DNI: ${emp.dni}, Email: ${emp.email || "NO EMAIL"})`,
        );
      });

      console.log("\n🔧 To create users for these employees, run:");
      employeesWithoutUsers.forEach((emp) => {
        console.log(
          `createUserForEmployee({ id: "${emp.id}", name: "${emp.name}", dni: "${emp.dni}", email: "${emp.email}" })`,
        );
      });
    }

    return {
      totalEmployees: employees.length,
      employeesWithUsers: employeeIdsWithUsers.length,
      employeesWithoutUsers: employeesWithoutUsers.length,
      employeesWithoutUsersData: employeesWithoutUsers,
    };
  } catch (error) {
    console.error("💥 Fix query failed:", error);
  }
};

// Make functions globally available
if (typeof window !== "undefined") {
  (window as any).diagnoseEmployeesTable = diagnoseEmployeesTable;
  (window as any).fixEmployeeUsersQuery = fixEmployeeUsersQuery;

  console.log("🔍 Database diagnosis functions loaded:");
  console.log("   - diagnoseEmployeesTable() - Check table structure");
  console.log("   - fixEmployeeUsersQuery() - Safe employee/user query");
}
