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

const PASSWORD_PLACEHOLDER = "$supabase$auth$managed";

const EMAIL_FALLBACK_DOMAIN = "cadizbar.local";

const normalizeEmail = (email: string) => email.trim().toLowerCase();

const isValidEmail = (email: string) =>
  /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim());

const sanitizeUsername = (username: string) => username.trim();

type UpdateUserInput = Partial<User> & { passwordHash?: string };

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
      const username = sanitizeUsername(userRequest.username);
      const email = normalizeEmail(userRequest.email);
      const password = userRequest.password?.trim();

      if (!username) {
        throw new Error("El nombre de usuario es obligatorio");
      }
      if (!email) {
        throw new Error("El email es obligatorio");
      }
      if (!isValidEmail(email)) {
        throw new Error("El email no tiene un formato válido");
      }
      if (!password) {
        throw new Error("La contraseña es obligatoria");
      }


      const { data: authUserData, error: authError } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: undefined,
          data: {
            name: userRequest.name,
            role: userRequest.role,
            username,
          },
        },
      });

      let authUserId = authUserData?.user?.id ?? null;

      if (authError) {
        console.error("❌ Auth creation failed:", authError.message);

        if (authError.message.includes("already registered")) {
          const { data: signInData, error: signInError } =
            await supabase.auth.signInWithPassword({
              email,
              password,
            });

          if (!signInError && signInData.user) {
            authUserId = signInData.user.id;
            await supabase.auth.signOut();
          } else {
          throw new Error(`Error de autenticación: ${authError.message}`);
        }
      } else {
        throw new Error(`Error de autenticación: ${authError.message}`);
      }
      }

      if (!authUserId) {
        throw new Error("No se pudo obtener el identificador del usuario de autenticación");
      }


      const nowIso = new Date().toISOString();
      const { data, error } = await supabase
        .from("users")
        .insert({
          id: authUserId,
          username,
          email,
          name: userRequest.name,
          role: userRequest.role,
          employee_id: userRequest.employeeId || null,
          is_active: true,
          password_hash: PASSWORD_PLACEHOLDER,
          needs_password_change: userRequest.needsPasswordChange ?? false,
          created_at: nowIso,
          updated_at: nowIso,
        })
        .select()
        .single();

      if (error) {
        throw error;
      }

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
    const username = employee.dni?.trim();

    if (!username) {
      throw new Error("El empleado no tiene DNI, no se puede crear el usuario");
    }

    const existing = users.find((u) => u.employeeId === employee.id);
    if (existing) {
      return { success: true, emailUsed: existing.email, alreadyExisted: true };
    }

    const normalizedEmail = employee.email?.trim()
      ? normalizeEmail(employee.email)
      : "";

    if (!normalizedEmail || !isValidEmail(normalizedEmail)) {
      throw new Error("El empleado necesita un email válido para crear su cuenta de acceso al portal.");
    }

    try {
      const { data: authUserData, error: authError } = await supabase.auth.signUp({
        email: normalizedEmail,
        password: username,
        options: {
          emailRedirectTo: undefined,
          data: {
            name: employee.name,
            role: "employee",
            employee_id: employee.id,
            needs_password_change: true,
          },
        },
      });

      let authUserId = authUserData?.user?.id ?? null;

      if (authError) {
        if (authError.message.includes("already registered")) {
          const { data: signInData, error: signInError } =
            await supabase.auth.signInWithPassword({
              email: normalizedEmail,
              password: username,
            });

          if (!signInError && signInData.user) {
            authUserId = signInData.user.id;
            await supabase.auth.signOut();
          }
        } else {
          throw authError;
        }
      }

      if (!authUserId) {
        const { data: lookupRows, error: lookupError } = await supabase
          .from("users")
          .select("id")
          .eq("email", normalizedEmail)
          .limit(1);

        if (lookupError) {
          throw lookupError;
        }

        if (lookupRows && lookupRows.length > 0) {
          authUserId = lookupRows[0].id;
        }
      }

      if (!authUserId) {
        throw new Error("No se pudo obtener el usuario de autenticación empleado");
      }

      const nowIso = new Date().toISOString();
      const { error: dbError } = await supabase.from("users").insert({
        id: authUserId,
        username,
        email: normalizedEmail,
        name: employee.name,
        role: "employee",
        employee_id: employee.id,
        is_active: true,
        password_hash: PASSWORD_PLACEHOLDER,
        needs_password_change: true,
        created_at: nowIso,
        updated_at: nowIso,
      });

      if (dbError) {
        if (dbError.message?.includes("duplicate key")) {
          return {
            success: true,
            emailUsed: normalizedEmail,
            alreadyExisted: true,
            fallbackEmailUsed,
          };
        }
        throw dbError;
      }

      await fetchUsers();

      return { success: true, emailUsed: normalizedEmail };
    } catch (err) {
      throw new Error(
        err instanceof Error ? err.message : "Error creando usuario empleado",
      );
    }
  };

  // Actualizar usuario
  const updateUser = async (id: string, updates: UpdateUserInput) => {
    try {
      const targetUser = users.find((u) => u.id === id);

      if (!targetUser) {
        throw new Error("Usuario no encontrado");
      }

      const activeAdmins = users.filter(
        (u) => u.role === "admin" && u.isActive,
      );
      const isTargetAdmin = targetUser.role === "admin";

      if (isTargetAdmin && targetUser.isActive) {
        if (updates.role !== undefined && updates.role !== "admin") {
          if (activeAdmins.length <= 1) {
            throw new Error(
              "No se puede cambiar el rol del último administrador activo",
            );
          }
        }

        if (updates.isActive === false && activeAdmins.length <= 1) {
          throw new Error(
            "No se puede desactivar el último administrador activo del sistema",
          );
        }
      }


      const nowIso = new Date().toISOString();
      const updateData: Record<string, unknown> = {
        updated_at: nowIso,
      };

      if (updates.username !== undefined)
        updateData.username = sanitizeUsername(updates.username);
      if (updates.email !== undefined) {
        const email = normalizeEmail(updates.email);
        if (!isValidEmail(email)) {
          throw new Error("El email no tiene un formato válido");
        }
        updateData.email = email;
      }
      if (updates.name !== undefined) updateData.name = updates.name;
      if (updates.role !== undefined) updateData.role = updates.role;
      if (updates.isActive !== undefined)
        updateData.is_active = updates.isActive;
      if (updates.needsPasswordChange !== undefined)
        updateData.needs_password_change = updates.needsPasswordChange;
      if (updates.passwordHash !== undefined)
        updateData.password_hash = updates.passwordHash;

      const { error: userError } = await supabase
        .from("users")
        .update(updateData)
        .eq("id", id);

      if (userError) throw userError;

      if (updates.isActive !== undefined) {
        const { data: userData, error: userFetchError } = await supabase
          .from("users")
          .select("employee_id")
          .eq("id", id)
          .single();

        if (!userFetchError && userData?.employee_id) {
          const { error: employeeError } = await supabase
            .from("employees")
            .update({
              status: updates.isActive ? "active" : "inactive",
              updated_at: nowIso,
            })
            .eq("id", userData.employee_id);

          // Silently handle sync errors
        }
      }

      await fetchUsers();
    } catch (err) {
      throw new Error(
        err instanceof Error ? err.message : "Error updating user",
      );
    }
  };

  // Blanquear contraseña usando RPC seguro (SECURITY DEFINER)
  // Requiere que admin_reset_password() exista en la BD (ver database/admin_reset_password.sql)
  const resetPassword = async (
    userId: string,
    newPassword: string,
    _options?: { markNeedsPasswordChange?: boolean },
  ) => {
    try {
      // Call the SECURITY DEFINER RPC that directly updates auth.users
      const { data, error } = await supabase.rpc("admin_reset_password", {
        target_user_id: userId,
        new_password: newPassword,
      });

      if (error) {
        console.error("Error calling admin_reset_password RPC:", error);
        return {
          success: false,
          error: `Error al blanquear contraseña: ${error.message}`,
        };
      }

      const result = typeof data === "string" ? JSON.parse(data) : data;

      if (!result?.success) {
        return {
          success: false,
          error: result?.error || "Error desconocido al blanquear contraseña",
        };
      }

      await fetchUsers();

      return {
        success: true,
        email: result.email,
      };
    } catch (err) {
      console.error("❌ Full error:", err);
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
