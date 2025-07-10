import { supabase } from "@/lib/supabase";

export const checkUserStatus = async (email: string) => {
  console.log(`🔍 === CHECKING USER STATUS FOR: ${email} ===`);

  try {
    // Check user in users table
    const { data: userData, error: userError } = await supabase
      .from("users")
      .select("*")
      .eq("email", email)
      .single();

    if (userError) {
      console.error("❌ User not found in users table:", userError.message);
      return { success: false, error: userError.message };
    }

    console.log("👤 User found in database:");
    console.log({
      id: userData.id,
      username: userData.username,
      email: userData.email,
      name: userData.name,
      role: userData.role,
      is_active: userData.is_active,
      employee_id: userData.employee_id,
      created_at: userData.created_at,
      updated_at: userData.updated_at,
    });

    // Check if user exists in Supabase Auth
    try {
      const { data: authCheck, error: authError } =
        await supabase.auth.signInWithPassword({
          email: email,
          password: "test", // This will fail but tells us if user exists
        });

      console.log("🔐 Auth status: User exists in Supabase Auth");
    } catch (authError) {
      if (authError.message?.includes("Invalid login credentials")) {
        console.log(
          "🔐 Auth status: User exists in Supabase Auth (invalid password is expected)",
        );
      } else {
        console.log("🔐 Auth status:", authError.message);
      }
    }

    // Check associated employee if exists
    if (userData.employee_id) {
      const { data: employeeData, error: empError } = await supabase
        .from("employees")
        .select("*")
        .eq("id", userData.employee_id)
        .single();

      if (!empError && employeeData) {
        console.log("👨‍💼 Associated employee:");
        console.log({
          id: employeeData.id,
          name: employeeData.name,
          dni: employeeData.dni,
          email: employeeData.email,
          status: employeeData.status,
        });
      }
    }

    const result = {
      success: true,
      user: userData,
      canLogin: userData.is_active,
      status: userData.is_active ? "ACTIVE" : "INACTIVE",
      reason: userData.is_active
        ? "User can login normally"
        : "User is marked as inactive",
    };

    console.log(`📊 FINAL STATUS: ${result.status}`);
    console.log(`📝 REASON: ${result.reason}`);

    return result;
  } catch (error) {
    console.error("💥 Error checking user status:", error);
    return { success: false, error: error.message };
  }
};

export const activateUser = async (email: string) => {
  console.log(`🔄 === ACTIVATING USER: ${email} ===`);

  try {
    const { data, error } = await supabase
      .from("users")
      .update({
        is_active: true,
        updated_at: new Date().toISOString(),
      })
      .eq("email", email)
      .select()
      .single();

    if (error) {
      console.error("❌ Failed to activate user:", error.message);
      return { success: false, error: error.message };
    }

    console.log("✅ User activated successfully:");
    console.log({
      email: data.email,
      name: data.name,
      is_active: data.is_active,
      updated_at: data.updated_at,
    });

    return { success: true, user: data };
  } catch (error) {
    console.error("💥 Error activating user:", error);
    return { success: false, error: error.message };
  }
};

export const deactivateUser = async (email: string) => {
  console.log(`🔄 === DEACTIVATING USER: ${email} ===`);

  try {
    const { data, error } = await supabase
      .from("users")
      .update({
        is_active: false,
        updated_at: new Date().toISOString(),
      })
      .eq("email", email)
      .select()
      .single();

    if (error) {
      console.error("❌ Failed to deactivate user:", error.message);
      return { success: false, error: error.message };
    }

    console.log("✅ User deactivated successfully:");
    console.log({
      email: data.email,
      name: data.name,
      is_active: data.is_active,
      updated_at: data.updated_at,
    });

    return { success: true, user: data };
  } catch (error) {
    console.error("💥 Error deactivating user:", error);
    return { success: false, error: error.message };
  }
};

export const listAllUsers = async () => {
  console.log("👥 === LISTING ALL USERS ===");

  try {
    const { data: users, error } = await supabase
      .from("users")
      .select("email, username, name, role, is_active, updated_at")
      .order("updated_at", { ascending: false });

    if (error) {
      console.error("❌ Failed to list users:", error.message);
      return;
    }

    console.log(`📊 Found ${users.length} users:`);

    const activeUsers = users.filter((u) => u.is_active);
    const inactiveUsers = users.filter((u) => !u.is_active);

    console.log(`✅ Active users (${activeUsers.length}):`);
    activeUsers.forEach((user) => {
      console.log(`  - ${user.name} (${user.email}) - ${user.role}`);
    });

    console.log(`❌ Inactive users (${inactiveUsers.length}):`);
    inactiveUsers.forEach((user) => {
      console.log(`  - ${user.name} (${user.email}) - ${user.role}`);
    });

    return { activeUsers, inactiveUsers, totalUsers: users.length };
  } catch (error) {
    console.error("💥 Error listing users:", error);
  }
};

export const fixUserLoginIssue = async (email: string) => {
  console.log(`🔧 === FIXING LOGIN ISSUE FOR: ${email} ===`);

  // First check current status
  const status = await checkUserStatus(email);

  if (!status.success) {
    console.log("❌ Cannot proceed - user not found");
    return status;
  }

  if (status.canLogin) {
    console.log("ℹ️ User is already active and should be able to login");
    console.log("🔍 The issue might be elsewhere. Try:");
    console.log("1. Check if email is spelled correctly");
    console.log("2. Verify password");
    console.log("3. Check browser console for other errors");
    return { success: true, message: "User is already active" };
  }

  // User is inactive, offer to activate
  console.log("🔄 User is inactive. Activating...");
  const activationResult = await activateUser(email);

  if (activationResult.success) {
    console.log("🎉 User has been activated and should now be able to login!");
  }

  return activationResult;
};

// Make functions globally available
if (typeof window !== "undefined") {
  (window as any).checkUserStatus = checkUserStatus;
  (window as any).activateUser = activateUser;
  (window as any).deactivateUser = deactivateUser;
  (window as any).listAllUsers = listAllUsers;
  (window as any).fixUserLoginIssue = fixUserLoginIssue;

  console.log("🔧 User debugging functions loaded:");
  console.log("   - checkUserStatus('email@example.com') - Check user status");
  console.log("   - activateUser('email@example.com') - Activate user");
  console.log("   - deactivateUser('email@example.com') - Deactivate user");
  console.log("   - listAllUsers() - List all users with status");
  console.log(
    "   - fixUserLoginIssue('email@example.com') - Auto-fix login issue",
  );
}
