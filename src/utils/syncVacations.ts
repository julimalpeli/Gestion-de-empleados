import { supabase } from "@/lib/supabase";

export const syncVacationsTaken = async () => {
  console.log("🔄 Syncing vacations_taken field with actual vacation data...");

  try {
    // First, let's see the current state
    const { data: currentState, error: currentError } = await supabase.rpc(
      "execute_sql",
      {
        sql: `
          SELECT 
            e.id,
            e.name,
            e.vacations_taken as current_vacations_taken,
            COALESCE(SUM(vr.days), 0) as actual_vacations_taken
          FROM employees e
          LEFT JOIN vacation_requests vr ON e.id = vr.employee_id AND vr.status = 'approved'
          GROUP BY e.id, e.name, e.vacations_taken
          ORDER BY e.name;
        `,
      },
    );

    if (currentError) {
      console.warn("Could not check current state:", currentError);
    } else {
      console.log("📊 Current state before sync:", currentState);
    }

    // Update all employees to sync their vacations_taken
    const { error: updateError } = await supabase.rpc("execute_sql", {
      sql: `
        UPDATE employees 
        SET vacations_taken = (
          SELECT COALESCE(SUM(vr.days), 0)
          FROM vacation_requests vr 
          WHERE vr.employee_id = employees.id 
          AND vr.status = 'approved'
        );
      `,
    });

    if (updateError) {
      console.error("❌ Error during sync:", updateError);
      throw updateError;
    }

    console.log("✅ Vacations_taken field synchronized successfully");

    // Verify the results
    const { data: verificationData } = await supabase.rpc("execute_sql", {
      sql: `
        SELECT 
          e.id,
          e.name,
          e.vacations_taken as updated_vacations_taken,
          COALESCE(SUM(vr.days), 0) as actual_vacations_taken
        FROM employees e
        LEFT JOIN vacation_requests vr ON e.id = vr.employee_id AND vr.status = 'approved'
        GROUP BY e.id, e.name, e.vacations_taken
        ORDER BY e.name;
      `,
    });

    console.log("✅ Updated state after sync:", verificationData);
    return true;
  } catch (error) {
    console.error("❌ Error syncing vacations:", error);
    return false;
  }
};

// Alternative manual approach if RPC doesn't work
export const manualSyncVacations = async () => {
  console.log("🔄 Manual sync: Updating each employee individually...");

  try {
    // Get all employees
    const { data: employees, error: employeesError } = await supabase
      .from("employees")
      .select("id, name, vacations_taken");

    if (employeesError) throw employeesError;

    // For each employee, calculate their actual vacations taken
    for (const employee of employees) {
      const { data: vacations, error: vacationsError } = await supabase
        .from("vacation_requests")
        .select("days")
        .eq("employee_id", employee.id)
        .eq("status", "approved");

      if (vacationsError) {
        console.error(
          `Error getting vacations for ${employee.name}:`,
          vacationsError,
        );
        continue;
      }

      const actualVacationsTaken = vacations.reduce(
        (sum, v) => sum + v.days,
        0,
      );

      // Update the employee record
      const { error: updateError } = await supabase
        .from("employees")
        .update({ vacations_taken: actualVacationsTaken })
        .eq("id", employee.id);

      if (updateError) {
        console.error(`Error updating ${employee.name}:`, updateError);
      } else {
        console.log(
          `✅ ${employee.name}: ${employee.vacations_taken} → ${actualVacationsTaken}`,
        );
      }
    }

    console.log("✅ Manual sync completed");
    return true;
  } catch (error) {
    console.error("❌ Error in manual sync:", error);
    return false;
  }
};

// Make functions available globally for debugging
if (typeof window !== "undefined") {
  (window as any).syncVacationsTaken = syncVacationsTaken;
  (window as any).manualSyncVacations = manualSyncVacations;
  console.log("🔧 Vacation sync functions available:");
  console.log("   - syncVacationsTaken()");
  console.log("   - manualSyncVacations()");
}
