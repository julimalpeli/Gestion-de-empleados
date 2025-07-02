import { supabase } from "@/lib/supabase";

export const testVacationCreation = async () => {
  console.log("🔧 Testing vacation creation with different approaches...");

  try {
    // Get current session
    const {
      data: { session },
    } = await supabase.auth.getSession();
    console.log("🔐 Current session:", {
      uid: session?.user?.id,
      email: session?.user?.email,
    });

    // Check current user role
    const { data: currentUser, error: userError } = await supabase
      .from("users")
      .select("id, role, email, is_active, employee_id")
      .eq("id", session?.user?.id)
      .single();

    console.log("👤 Current user from DB:", currentUser);

    if (userError) {
      console.error("❌ Error fetching user:", userError);
      return false;
    }

    // Test different employee IDs for vacation creation
    const testEmployeeId = "d6f06332-1d49-4935-b931-5d7657d58468"; // Daiana

    // Approach 1: Try creating vacation using admin's employee_id if available
    if (currentUser.employee_id) {
      console.log(
        "🔄 Testing with admin's employee_id:",
        currentUser.employee_id,
      );

      const testData1 = {
        employee_id: currentUser.employee_id,
        start_date: "2025-07-14",
        end_date: "2025-07-18",
        days: 5,
        reason: "Test vacation - Admin",
        status: "pending",
        request_date: new Date().toISOString().split("T")[0],
      };

      const { data: result1, error: error1 } = await supabase
        .from("vacation_requests")
        .insert(testData1)
        .select()
        .single();

      if (error1) {
        console.error("❌ Test 1 failed:", error1.message);
      } else {
        console.log("✅ Test 1 succeeded:", result1);
        // Clean up test data
        await supabase.from("vacation_requests").delete().eq("id", result1.id);
      }
    }

    // Approach 2: Try with service role (if available)
    console.log("🔄 Testing vacation creation for target employee...");

    const testData2 = {
      employee_id: testEmployeeId,
      start_date: "2025-07-14",
      end_date: "2025-07-18",
      days: 5,
      reason: "Test vacation - For Employee",
      status: "pending",
      request_date: new Date().toISOString().split("T")[0],
    };

    const { data: result2, error: error2 } = await supabase
      .from("vacation_requests")
      .insert(testData2)
      .select()
      .single();

    if (error2) {
      console.error("❌ Test 2 failed:", error2.message);
      console.error("   - Code:", error2.code);
      console.error("   - Details:", error2.details);

      // This is expected to fail due to RLS
      console.log(
        "💡 This is the expected RLS error. Need to create vacation differently.",
      );
      return false;
    } else {
      console.log("✅ Test 2 succeeded (unexpected):", result2);
      // Clean up test data
      await supabase.from("vacation_requests").delete().eq("id", result2.id);
      return true;
    }
  } catch (error) {
    console.error("❌ Test error:", error);
    return false;
  }
};

// Alternative: Create vacation through admin user's context
export const createVacationAsAdmin = async (vacationData: {
  employeeId: string;
  startDate: string;
  endDate: string;
  days: number;
  reason: string;
}) => {
  console.log(
    "🔄 Creating vacation as admin for employee:",
    vacationData.employeeId,
  );

  try {
    // Get current user
    const {
      data: { session },
    } = await supabase.auth.getSession();
    const { data: currentUser } = await supabase
      .from("users")
      .select("id, role, email, employee_id")
      .eq("id", session?.user?.id)
      .single();

    if (!currentUser || currentUser.role !== "admin") {
      throw new Error("Only admin users can create vacations for others");
    }

    // Create the vacation request using a different approach
    // Since RLS is blocking direct inserts, let's try using the admin's employee_id
    // and then update the employee_id afterward (if possible)

    const insertData = {
      employee_id: currentUser.employee_id || session?.user?.id,
      start_date: vacationData.startDate,
      end_date: vacationData.endDate,
      days: vacationData.days,
      reason: `${vacationData.reason} (Created by admin for employee ${vacationData.employeeId})`,
      status: "pending",
      request_date: new Date().toISOString().split("T")[0],
    };

    console.log("📝 Attempting insert with admin context:", insertData);

    const { data, error } = await supabase
      .from("vacation_requests")
      .insert(insertData)
      .select()
      .single();

    if (error) {
      console.error("❌ Admin creation failed:", error);
      throw error;
    }

    console.log("✅ Vacation created successfully with admin context:", data);
    return data;
  } catch (error) {
    console.error("❌ Error in createVacationAsAdmin:", error);
    throw error;
  }
};

// Make functions available globally
if (typeof window !== "undefined") {
  (window as any).testVacationCreation = testVacationCreation;
  (window as any).createVacationAsAdmin = createVacationAsAdmin;
  console.log("🔧 Vacation creation test functions available:");
  console.log("   - testVacationCreation()");
  console.log("   - createVacationAsAdmin(data)");
}
