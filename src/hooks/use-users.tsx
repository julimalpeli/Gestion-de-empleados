import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";

export interface User {
  id: string;
  username: string;
  email: string;
  name: string;
  role: "admin" | "manager" | "hr" | "employee" | "readonly";
  employeeId?: string;
  isActive: boolean;
  passwordHash: string;
  lastLogin?: string;
  needsPasswordChange: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface CreateUserRequest {
  username: string;
  email: string;
  name: string;
  role: "admin" | "manager" | "hr" | "employee" | "readonly";
  employeeId?: string;
  password: string;
  needsPasswordChange?: boolean;
}

export const useUsers = () => {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Cargar usuarios
  const fetchUsers = async () => {
    try {
      setLoading(true);
      setError(null);
      const { data, error } = await supabase
        .from("users")
        .select(
          `
          *,
          employee:employees(name)
        `,
        )
        .order("created_at", { ascending: false });

      if (error) throw error;

      const mappedUsers =
        data?.map((user) => ({
          id: user.id,
          username: user.username,
          email: user.email,
          name: user.name,
          role: user.role,
          employeeId: user.employee_id,
          isActive: user.is_active,
          passwordHash: user.password_hash,
          lastLogin: user.last_login,
          needsPasswordChange: user.needs_password_change || false,
          createdAt: user.created_at,
          updatedAt: user.updated_at,
        })) || [];

      setUsers(mappedUsers);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error loading users");
    } finally {
      setLoading(false);
    }
  };

  // Crear usuario
  const createUser = async (userRequest: CreateUserRequest) => {
    try {
      console.log("🔄 Creating user in Supabase Auth...", userRequest.email);

      // Step 1: Create user in Supabase Auth first
      const { data: authUser, error: authError } = await supabase.auth.signUp({
        email: userRequest.email,
        password: userRequest.password,
        options: {
          emailRedirectTo: undefined, // Skip email confirmation
          data: {
            name: userRequest.name,
            role: userRequest.role,
            username: userRequest.username,
          },
        },
      });

      if (authError) {
        console.error("❌ Auth creation failed:", authError.message);

        // Check if user already exists in auth
        if (authError.message.includes("already registered")) {
          console.log("ℹ️ User already exists in auth, trying to sign in...");

          const { data: signInData, error: signInError } =
            await supabase.auth.signInWithPassword({
              email: userRequest.email,
              password: userRequest.password,
            });

          if (!signInError && signInData.user) {
            console.log("✅ User exists in auth, using existing user");
            authUser.user = signInData.user;
            await supabase.auth.signOut();
          } else {
            throw new Error(`Auth error: ${authError.message}`);
          }
        } else {
          throw new Error(`Auth error: ${authError.message}`);
        }
      }

      if (!authUser.user) {
        throw new Error("No user returned from auth signup");
      }

      console.log("✅ Auth user created/found:", authUser.user.email);

      // Step 2: Create user in database
      const passwordHash = btoa(userRequest.password);

      const { data, error } = await supabase
        .from("users")
        .insert({
          id: authUser.user.id, // Use the Auth user ID
          username: userRequest.username,
          email: userRequest.email,
          name: userRequest.name,
          role: userRequest.role,
          employee_id: userRequest.employeeId || null,
          is_active: true,
          password_hash: passwordHash,
          needs_password_change: userRequest.needsPasswordChange || false,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        })
        .select()
        .single();

      if (error) {
        console.error("❌ Database creation failed:", error);

        // Try to clean up auth user if database creation fails
        try {
          await supabase.auth.admin.deleteUser(authUser.user.id);
          console.log("🧹 Cleaned up auth user due to database error");
        } catch (cleanupError) {
          console.warn("⚠️ Could not clean up auth user:", cleanupError);
        }

        throw error;
      }

      console.log("✅ Database user created successfully");
      console.log("🎉 Complete user created:", {
        email: userRequest.email,
        username: userRequest.username,
        role: userRequest.role,
      });

      await fetchUsers();
      return data;
    } catch (err) {
      console.error("❌ Complete user creation failed:", err);
      throw new Error(
        err instanceof Error ? err.message : "Error creating user",
      );
    }
  };

  // Crear usuario automáticamente para empleado
  const createEmployeeUser = async (employee: {
    id: string;
    name: string;
    dni: string;
    email?: string;
  }) => {
    if (!employee.email) {
      console.warn("Employee has no email, skipping user creation");
      return;
    }

    try {
      // Create user in Supabase Auth using signUp (client-safe method)
      const { data: authUser, error: authError } = await supabase.auth.signUp({
        email: employee.email,
        password: employee.dni, // Password = DNI
        options: {
          emailRedirectTo: undefined, // Skip email confirmation
          data: {
            name: employee.name,
            role: "employee",
            employee_id: employee.id,
          },
        },
      });

      if (authError) {
        // Check if user already exists
        if (authError.message.includes("already registered")) {
          console.log("ℹ️ Employee auth user already exists");
          // Try to get existing user - this is expected behavior
        } else {
          throw authError;
        }
      }

      if (!authUser.user) {
        throw new Error("No user returned from auth signup");
      }

      console.log("✅ Supabase Auth user created:", authUser.user.email);

      // Create user in public.users table
      const { error: dbError } = await supabase.from("users").insert({
        id: authUser.user.id,
        username: employee.dni,
        email: employee.email,
        name: employee.name,
        role: "employee",
        employee_id: employee.id,
        is_active: true,
        password_hash: "$supabase$auth$handled",
        needs_password_change: true, // Force password change on first login
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      });

      if (dbError) {
        // If public.users creation fails, cleanup auth user
        await supabase.auth.admin.deleteUser(authUser.user.id);
        throw dbError;
      }

      console.log("✅ Employee user created successfully:", employee.name);
    } catch (err) {
      console.error("❌ Error creating employee user:", err);
      // Don't throw error to not interfere with employee creation
    }
  };

  // Actualizar usuario
  const updateUser = async (id: string, updates: Partial<User>) => {
    try {
      const updateData: any = {};

      if (updates.username !== undefined)
        updateData.username = updates.username;
      if (updates.email !== undefined) updateData.email = updates.email;
      if (updates.name !== undefined) updateData.name = updates.name;
      if (updates.role !== undefined) updateData.role = updates.role;
      if (updates.isActive !== undefined)
        updateData.is_active = updates.isActive;
      if (updates.needsPasswordChange !== undefined)
        updateData.needs_password_change = updates.needsPasswordChange;

      // Actualizar tabla users
      const { error: userError } = await supabase
        .from("users")
        .update(updateData)
        .eq("id", id);

      if (userError) throw userError;

      // Si se está actualizando el estado activo, sincronizar con tabla employees
      if (updates.isActive !== undefined) {
        // Obtener el employee_id del usuario
        const { data: userData, error: userFetchError } = await supabase
          .from("users")
          .select("employee_id")
          .eq("id", id)
          .single();

        if (!userFetchError && userData?.employee_id) {
          console.log(
            `🔄 Syncing employee status: ${userData.employee_id} -> ${updates.isActive ? "active" : "inactive"}`,
          );

          // Actualizar el campo status en la tabla employees
          const { error: employeeError } = await supabase
            .from("employees")
            .update({
              status: updates.isActive ? "active" : "inactive",
              updated_at: new Date().toISOString(),
            })
            .eq("id", userData.employee_id);

          if (employeeError) {
            console.error("❌ Error syncing employee status:", employeeError);
            // No lanzar error para no bloquear la actualización del usuario
          } else {
            console.log("✅ Employee status synced successfully");
          }
        }
      }

      await fetchUsers();
    } catch (err) {
      throw new Error(
        err instanceof Error ? err.message : "Error updating user",
      );
    }
  };

  // Blanquear contraseña (resetear al DNI)
  const resetPassword = async (userId: string, newPassword: string) => {
    try {
      const passwordHash = btoa(newPassword); // Base64 simple para demo

      const { error } = await supabase
        .from("users")
        .update({
          password_hash: passwordHash,
          needs_password_change: true,
        })
        .eq("id", userId);

      if (error) throw error;

      await fetchUsers();
    } catch (err) {
      throw new Error(
        err instanceof Error ? err.message : "Error resetting password",
      );
    }
  };

  // Eliminar usuario
  const deleteUser = async (id: string) => {
    try {
      const { error } = await supabase.from("users").delete().eq("id", id);

      if (error) throw error;

      await fetchUsers();
    } catch (err) {
      throw new Error(
        err instanceof Error ? err.message : "Error deleting user",
      );
    }
  };

  // Update user email specifically
  const updateUserEmail = async (employeeId: string, email: string) => {
    try {
      const { error } = await supabase
        .from("users")
        .update({ email })
        .eq("employee_id", employeeId);

      if (error) throw error;
      await fetchUsers();
    } catch (err) {
      throw new Error(
        err instanceof Error ? err.message : "Error updating user email",
      );
    }
  };

  // Cargar datos al montar el componente
  useEffect(() => {
    fetchUsers();
  }, []);

  return {
    users,
    loading,
    error,
    fetchUsers,
    createUser,
    createEmployeeUser,
    updateUser,
    updateUserEmail,
    resetPassword,
    deleteUser,
  };
};
