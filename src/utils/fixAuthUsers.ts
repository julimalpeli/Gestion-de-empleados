import { supabase } from "@/lib/supabase";

export const verifyAuthUsers = async () => {
  console.log("🔐 === VERIFYING AUTH USERS ===");

  const knownUsers = [
    {
      email: "julimalpeli@gmail.com",
      password: "Jmalpeli3194",
      role: "admin",
      name: "Julian Malpeli",
    },
    {
      email: "daianaayelen0220@gmail.com",
      password: "44586777",
      role: "employee",
      name: "Porras Daiana Ayelen",
    },
    {
      email: "nachito_ja@hotmail.com",
      password: "30728007",
      role: "employee",
      name: "Ignacio Alvarez",
    },
  ];

  for (const user of knownUsers) {
    console.log(`\n👤 Testing user: ${user.email}`);

    // Try to sign in
    const { data: signInData, error: signInError } =
      await supabase.auth.signInWithPassword({
        email: user.email,
        password: user.password,
      });

    if (signInError) {
      console.error(`❌ Login failed for ${user.email}:`, signInError.message);

      // Try to create the user
      console.log(`🔄 Attempting to create user ${user.email}...`);

      try {
        const { data: signUpData, error: signUpError } =
          await supabase.auth.signUp({
            email: user.email,
            password: user.password,
            options: {
              data: {
                name: user.name,
                role: user.role,
              },
            },
          });

        if (signUpError) {
          console.error(
            `❌ Failed to create ${user.email}:`,
            signUpError.message,
          );
        } else {
          console.log(`✅ User ${user.email} created successfully`);

          // Create corresponding users table entry
          if (signUpData.user) {
            const { error: usersError } = await supabase.from("users").upsert({
              id: signUpData.user.id,
              email: user.email,
              username: user.email.split("@")[0],
              name: user.name,
              role: user.role,
              is_active: true,
              password_hash: btoa(user.password), // Base64 encoded password
              needs_password_change: false,
              created_at: new Date().toISOString(),
              updated_at: new Date().toISOString(),
              employee_id:
                user.role === "employee"
                  ? "d6f06332-1d49-4935-b931-5d7657d58468"
                  : null,
            });

            if (usersError) {
              console.error(
                `❌ Failed to create users table entry:`,
                usersError.message,
              );
            } else {
              console.log(`✅ Users table entry created for ${user.email}`);
            }
          }
        }
      } catch (createError) {
        console.error(`❌ Exception creating ${user.email}:`, createError);
      }
    } else {
      console.log(`✅ Login successful for ${user.email}`);

      // Check if user exists in users table
      const { data: userData, error: userError } = await supabase
        .from("users")
        .select("*")
        .eq("email", user.email)
        .single();

      if (userError || !userData) {
        console.log(`🔄 Creating users table entry for ${user.email}...`);

        const { error: usersError } = await supabase.from("users").upsert({
          id: signInData.user.id,
          email: user.email,
          username: user.email.split("@")[0],
          name: user.name,
          role: user.role,
          is_active: true,
          password_hash: btoa(user.password), // Base64 encoded password
          needs_password_change: false,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
          employee_id:
            user.role === "employee"
              ? "d6f06332-1d49-4935-b931-5d7657d58468"
              : null,
        });

        if (usersError) {
          console.error(
            `❌ Failed to create users table entry:`,
            usersError.message,
          );
        } else {
          console.log(`✅ Users table entry created for ${user.email}`);
        }
      } else {
        console.log(`✅ Users table entry exists for ${user.email}`);
      }

      // Sign out after test
      await supabase.auth.signOut();
    }
  }

  console.log("\n🔐 === AUTH VERIFICATION COMPLETE ===");
};

export const resetUserPassword = async (email: string, newPassword: string) => {
  console.log(`🔄 Resetting password for ${email}...`);

  try {
    // This requires admin privileges - might not work from client
    const { error } = await supabase.auth.admin.updateUserById(
      "user-id-here", // We would need the user ID
      { password: newPassword },
    );

    if (error) {
      console.error(`❌ Failed to reset password:`, error.message);
      return false;
    }

    console.log(`✅ Password reset successful for ${email}`);
    return true;
  } catch (error) {
    console.error(`❌ Exception resetting password:`, error);
    return false;
  }
};

export const listAuthUsers = async () => {
  console.log("👥 === LISTING AUTH USERS ===");

  try {
    // This might require admin privileges
    const { data, error } = await supabase.auth.admin.listUsers();

    if (error) {
      console.error("❌ Cannot list users (admin required):", error.message);
      return;
    }

    console.log(
      "📋 Auth Users:",
      data.users.map((u) => ({
        id: u.id,
        email: u.email,
        created_at: u.created_at,
        last_sign_in_at: u.last_sign_in_at,
      })),
    );
  } catch (error) {
    console.error("❌ Exception listing users:", error);
  }
};

// Make functions available globally
if (typeof window !== "undefined") {
  (window as any).verifyAuthUsers = verifyAuthUsers;
  (window as any).resetUserPassword = resetUserPassword;
  (window as any).listAuthUsers = listAuthUsers;
  console.log("🔧 Auth fix functions available:");
  console.log("   - verifyAuthUsers()");
  console.log("   - resetUserPassword(email, newPassword)");
  console.log("   - listAuthUsers()");
}
