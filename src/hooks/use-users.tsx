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
      // Simular hash de contraseña (en producción usarías bcrypt)
      const passwordHash = btoa(userRequest.password); // Base64 simple para demo

      const { data, error } = await supabase
        .from("users")
        .insert({
          username: userRequest.username,
          email: userRequest.email,
          name: userRequest.name,
          role: userRequest.role,
          employee_id: userRequest.employeeId,
          is_active: true,
          password_hash: passwordHash,
          needs_password_change: userRequest.needsPasswordChange || false,
        })
        .select()
        .single();

      if (error) throw error;

      await fetchUsers();
      return data;
    } catch (err) {
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
      // Import the helper function from use-auth
      const { createSupabaseUser } = await import("@/hooks/use-auth");

      await createSupabaseUser(
        employee.email,
        employee.dni, // Contraseña inicial = DNI
        {
          username: employee.dni,
          name: employee.name,
          role: "employee",
          employeeId: employee.id,
          needsPasswordChange: true, // Forzar cambio en primer login
        },
      );

      console.log("✅ Supabase user created for employee:", employee.name);
    } catch (err) {
      console.error("❌ Error creating Supabase user for employee:", err);
      // No lanzar error para no interferir con la creación del empleado
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

      const { error } = await supabase
        .from("users")
        .update(updateData)
        .eq("id", id);

      if (error) throw error;

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
