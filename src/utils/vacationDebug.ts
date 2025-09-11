import { supabase } from "@/lib/supabase";

// Test vacation_requests table connectivity and permissions
export const testVacationAccess = async () => {
  console.group("🔍 Testing vacation system access");

  try {
    // Test 1: Basic table access
    console.log("Test 1: Basic table access...");
    const { data: countData, error: countError } = await supabase
      .from("vacation_requests")
      .select("count", { count: "exact", head: true });

    if (countError) {
      console.error("❌ Basic access failed:", countError);
      return false;
    }

    console.log("✅ Basic access successful, count:", countData);

    // Test 2: Simple select
    console.log("Test 2: Simple select...");
    const { data: simpleData, error: simpleError } = await supabase
      .from("vacation_requests")
      .select("id, employee_id, status")
      .limit(1);

    if (simpleError) {
      console.error("❌ Simple select failed:", simpleError);
      return false;
    }

    console.log("✅ Simple select successful:", simpleData?.length || 0, "records");

    // Test 3: Join with employees
    console.log("Test 3: Join with employees table...");
    const { data: joinData, error: joinError } = await supabase
      .from("vacation_requests")
      .select(`
        id,
        employee_id,
        status,
        employee:employees(name)
      `)
      .limit(1);

    if (joinError) {
      console.error("❌ Join query failed:", joinError);
      console.error("This might be a permissions issue with the employees table");
      return false;
    }

    console.log("✅ Join query successful:", joinData);

    // Test 4: Check current user context
    console.log("Test 4: Current user context...");
    const { data: { session } } = await supabase.auth.getSession();
    console.log("Current session:", {
      user_id: session?.user?.id,
      email: session?.user?.email,
      role: session?.user?.role,
    });

    console.log("✅ All vacation access tests passed!");
    return true;

  } catch (error) {
    console.error("❌ Vacation access test failed:", error);
    return false;
  } finally {
    console.groupEnd();
  }
};

// Debug vacation loading issues
export const debugVacationLoad = async (employeeId?: string) => {
  console.group("🔍 Debugging vacation load");

  try {
    console.log("Employee ID filter:", employeeId || "all employees");

    // Step 1: Basic connectivity
    const accessTest = await testVacationAccess();
    if (!accessTest) {
      console.error("❌ Basic access test failed - aborting");
      return;
    }

    // Step 2: Test the exact query used by the hook
    console.log("Step 2: Testing exact hook query...");
    
    let query = supabase
      .from("vacation_requests")
      .select(`
        *,
        employee:employees(name)
      `)
      .order("created_at", { ascending: false });

    if (employeeId) {
      query = query.eq("employee_id", employeeId);
    }

    const { data, error } = await query;

    if (error) {
      console.error("❌ Hook query failed:", error);
      
      // Try without the join to isolate the issue
      console.log("Trying without employee join...");
      const { data: simpleData, error: simpleError } = await supabase
        .from("vacation_requests")
        .select("*")
        .order("created_at", { ascending: false });

      if (simpleError) {
        console.error("❌ Even simple query failed:", simpleError);
      } else {
        console.log("✅ Simple query works, issue is with employee join");
        console.log("Data:", simpleData);
      }
    } else {
      console.log("✅ Hook query successful!");
      console.log("Data:", data);
    }

  } catch (error) {
    console.error("❌ Debug vacation load failed:", error);
  } finally {
    console.groupEnd();
  }
};

// Make functions available globally for debugging
if (typeof window !== "undefined") {
  (window as any).testVacationAccess = testVacationAccess;
  (window as any).debugVacationLoad = debugVacationLoad;
  console.log("🔧 Vacation debug functions available:");
  console.log("   - testVacationAccess()");
  console.log("   - debugVacationLoad(employeeId?)");
}
