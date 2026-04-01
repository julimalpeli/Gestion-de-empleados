import {
  createContext,
  useContext,
  useState,
  useEffect,
  ReactNode,
} from "react";
import { supabase } from "@/lib/supabase";
import { auditService } from "@/services/auditService";
import type { User as SupabaseUser, Session } from "@supabase/supabase-js";

const PASSWORD_PLACEHOLDER = "$supabase$auth$handled";

type InternalUserRecord = {
  id: string;
  is_active: boolean;
  role: string;
  name: string;
};

const sanitizeUsername = (value: string) =>
  value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-zA-Z0-9._-]/g, "")
    .slice(0, 48);

const logDatabaseError = (label: string, error: any) => {
  console.error(label, {
    message: error?.message,
    details: error?.details,
    hint: error?.hint,
    code: error?.code,
  });
};

const ensureInternalUserRecord = async (
  authUser: SupabaseUser,
  normalizedEmail?: string,
): Promise<InternalUserRecord> => {
  const emailToUse = normalizedEmail || authUser.email?.toLowerCase();

  if (!emailToUse) {
    throw new Error(
      "No se pudo determinar el email del usuario para sincronizar su perfil interno.",
    );
  }

  const fetchInternalUser = async (column: "id" | "email", value: string) => {
    const { data, error } = await supabase
      .from("users")
      .select("id, is_active, role, name")
      .eq(column, value)
      .maybeSingle();

    if (error && error.code !== "PGRST116") {
      logDatabaseError(`⚠️ Error fetching user by ${column}`, error);
      throw error;
    }

    return data;
  };

  // 1. Try by Supabase auth ID first
  const existingById = await fetchInternalUser("id", authUser.id);
  if (existingById) {
    return existingById;
  }

  const usernameBase =
    (authUser.user_metadata as Record<string, string | undefined>)?.username ||
    emailToUse.split("@")[0] ||
    authUser.email ||
    `user-${authUser.id.slice(0, 8)}`;

  const username =
    sanitizeUsername(`${usernameBase}-${authUser.id.slice(0, 4)}`) ||
    `user-${authUser.id.slice(0, 8)}`;

  const displayName =
    (authUser.user_metadata as Record<string, string | undefined>)?.full_name ||
    (authUser.user_metadata as Record<string, string | undefined>)?.name ||
    authUser.email ||
    username;

  // 2. Try to reuse record by email if it exists with different ID
  const existingByEmail = await fetchInternalUser("email", emailToUse);
  if (existingByEmail) {
    if (existingByEmail.id === authUser.id) {
      return existingByEmail;
    }

    const { data: syncedUser, error: syncError } = await supabase
      .from("users")
      .update({
        id: authUser.id,
        username,
        password_hash: PASSWORD_PLACEHOLDER,
        needs_password_change: false,
        is_active: true,
      })
      .eq("email", emailToUse)
      .select("id, is_active, role, name")
      .single();

    if (syncError) {
      logDatabaseError("❌ Error syncing internal user record", syncError);
      throw syncError;
    }

    return syncedUser;
  }

  // 3. Insert new internal record
  const insertPayload = {
    id: authUser.id,
    username,
    email: emailToUse,
    name: displayName,
    role: "employee" as const,
    is_active: true,
    password_hash: PASSWORD_PLACEHOLDER,
    needs_password_change: false,
  };

  const { data, error } = await supabase
    .from("users")
    .insert(insertPayload)
    .select("id, is_active, role, name")
    .single();

  if (error) {
    logDatabaseError("❌ Could not insert internal user record", error);
    throw error;
  }

  return data;
};

interface User {
  id: string;
  username: string;
  name: string;
  role: "admin" | "manager" | "hr" | "employee" | "readonly";
  employeeId?: string;
  email: string;
  permissions: string[];
  loginTime: string;
  needsPasswordChange?: boolean;
  isActive?: boolean;
  supabaseUser?: SupabaseUser;
}

interface AuthContextType {
  user: User | null;
  session: Session | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  isAuthenticated: boolean;
  hasPermission: (permission: string) => boolean;
  changePassword: (newPassword: string) => Promise<void>;
  resetPassword: (email: string) => Promise<void>;
  exportSecurityLogs: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Simple role permissions
const getRolePermissions = (role: string): string[] => {
  const rolePermissions = {
    admin: ["all"],
    manager: [
      "employees:view",
      "employees:create",
      "employees:edit",
      "payroll:view",
      "payroll:create",
      "vacations:view",
      "vacations:approve",
    ],
    hr: [
      "employees:view",
      "employees:create",
      "employees:edit",
      "payroll:view",
      "vacations:view",
      "vacations:approve",
    ],
    employee: ["employees:view-own", "payroll:view-own", "vacations:view-own"],
    readonly: ["employees:view", "payroll:view", "vacations:view"],
  };
  return rolePermissions[role as keyof typeof rolePermissions] || [];
};

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;

    // Clean up any old bypass data from previous versions
    localStorage.removeItem("admin-bypass");
    localStorage.removeItem("emergency-auth");

    const loadInitialSession = async () => {
      try {
        const { data, error } = await supabase.auth.getSession();

        if (!isMounted) {
          return;
        }

        if (error) {
          console.warn("⚠️ Error getting session:", error.message);
          setSession(null);
          setUser(null);
          return;
        }

        const currentSession = data?.session ?? null;
        setSession(currentSession);

        if (currentSession?.user) {
          await loadUserProfile(currentSession.user);
        } else {
          setUser(null);
        }
      } catch (error) {
        if (!isMounted) {
          return;
        }

        console.error("❌ Error loading initial session:", error);
        setUser(null);
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    loadInitialSession();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (!isMounted) {
        return;
      }

      console.log("🔄 Auth state change:", event, session?.user?.email);

      if (event === "SIGNED_OUT" || !session?.user) {
        setSession(null);
        setUser(null);
        return;
      }

      if (session?.user) {
        setSession(session);
        await loadUserProfile(session.user);
      }
    });

    return () => {
      isMounted = false;
      subscription.unsubscribe();
    };
  }, []);

  // Load user profile from the database
  const loadUserProfile = async (supabaseUser: SupabaseUser, retryCount = 0) => {
    const MAX_RETRIES = 2;

    try {
      console.log("🔄 Querying database for user profile...", retryCount > 0 ? `(retry ${retryCount})` : "");

      // Simple query by ID (primary key = fastest)
      let result = await supabase
        .from("users")
        .select("*")
        .eq("id", supabaseUser.id)
        .maybeSingle();

      // If not found by ID, try by email
      if (!result.data && (!result.error || result.error.code === "PGRST116")) {
        console.log("🔄 User not found by ID, trying by email...");
        const emailResult = await supabase
          .from("users")
          .select("*")
          .eq("email", supabaseUser.email?.toLowerCase() || "")
          .limit(1);

        result = {
          data: emailResult.data?.[0] || null,
          error: emailResult.error,
        } as any;
      }

      const userProfile = result.data;
      const error = result.error;

      console.log("📊 Database query result:", {
        found: !!userProfile,
        error: error?.message,
      });

      if (error) {
        const errMsg = error.message || String(error);
        const isTransientError =
          errMsg.includes("Failed to fetch") ||
          errMsg.includes("network") ||
          errMsg.includes("connection") ||
          errMsg.includes("aborted") ||
          errMsg.includes("AbortError") ||
          error.name === "AbortError";

        if (isTransientError && retryCount < MAX_RETRIES) {
          const delay = (retryCount + 1) * 3000; // 3s, 6s
          console.warn(`⏳ Network error, retrying in ${delay / 1000}s...`);
          await new Promise((resolve) => setTimeout(resolve, delay));
          return loadUserProfile(supabaseUser, retryCount + 1);
        }

        console.error("❌ Database error loading user profile:", errMsg);
        // Don't sign out on network errors - user might recover
        if (!isTransientError) {
          await supabase.auth.signOut();
          setUser(null);
          setSession(null);
        }
        return;
      }

      if (!userProfile) {
        console.warn("⚠️ No user found in database for:", supabaseUser.email);
        // Try to auto-create internal user record
        try {
          const newRecord = await ensureInternalUserRecord(
            supabaseUser,
            supabaseUser.email?.toLowerCase(),
          );
          if (newRecord) {
            const userData: User = {
              id: newRecord.id,
              username: supabaseUser.email?.split("@")[0] || "user",
              name: newRecord.name || "Usuario",
              role: newRecord.role as User["role"],
              email: supabaseUser.email || "",
              permissions: getRolePermissions(newRecord.role),
              loginTime: new Date().toISOString(),
              needsPasswordChange: false,
              isActive: newRecord.is_active,
              supabaseUser,
            };
            setUser(userData);
            console.log("✅ User profile auto-created:", userData.name, userData.role);
            return;
          }
        } catch (syncError) {
          console.error("❌ Could not auto-create user profile:", syncError);
        }

        // If we can't find or create a profile, sign out
        await supabase.auth.signOut();
        setUser(null);
        setSession(null);
        return;
      }

      console.log(
        "✅ User found in database:",
        userProfile.name,
        userProfile.role,
        "Active:",
        userProfile.is_active,
      );

      // 🚫 CRITICAL: Check if user is active before proceeding
      if (!userProfile.is_active) {
        console.log("🚫 USER IS INACTIVE - Redirecting to inactive page");

        // Sign out immediately
        await supabase.auth.signOut();

        // Clear any stored state
        setUser(null);
        setSession(null);

        // Redirect to inactive page
        window.location.href = "/inactive";
        return;
      }

      const userData: User = {
        id: userProfile.id,
        username: userProfile.username,
        name: userProfile.name,
        role: userProfile.role,
        email: userProfile.email,
        employeeId: userProfile.employee_id,
        permissions: getRolePermissions(userProfile.role),
        loginTime: new Date().toISOString(),
        needsPasswordChange: userProfile.needs_password_change || false,
        isActive: userProfile.is_active,
        supabaseUser,
      };

      setUser(userData);
      console.log(
        "🎯 User profile loaded successfully:",
        userData.name,
        userData.role,
      );

      // Update last login timestamp
      try {
        await supabase
          .from("users")
          .update({ last_login: new Date().toISOString() })
          .eq("id", userProfile.id);
      } catch (updateError) {
        console.warn("⚠️ Could not update last login:", updateError);
      }
    } catch (error) {
      console.error("❌ Error loading user profile:", error);
      const errMsg = error?.message || String(error);
      const isTransient =
        errMsg.includes("timeout") ||
        errMsg.includes("Failed to fetch") ||
        errMsg.includes("network") ||
        errMsg.includes("connection");

      if (isTransient) {
        console.warn("⚠️ Transient error loading profile, will retry on next auth event");
      } else {
        // Only sign out on definitive errors (e.g. permission denied)
        await supabase.auth.signOut();
        setUser(null);
        setSession(null);
      }
    }
  };

  // Login - always through Supabase Auth
  const login = async (email: string, password: string) => {
    setLoading(true);
    try {
      console.log(`🔐 Login attempt for: ${email.trim()}`);

      const trimmedEmail = email.trim();
      const normalizedEmail = trimmedEmail.toLowerCase();

      console.log("📧 Attempting Supabase auth login...");
      const { data, error } = await supabase.auth.signInWithPassword({
        email: trimmedEmail,
        password,
      });

      if (error) {
        console.error("❌ Supabase auth error:", error.message);

        if (error.message.includes("Invalid login credentials")) {
          throw new Error(
            "Credenciales incorrectas. Verifique su email y contraseña.",
          );
        }

        if (error.message.includes("Email not confirmed")) {
          throw new Error(
            "El email del usuario no está confirmado. Contacte al administrador para confirmar la cuenta.",
          );
        }

        if (error.message.includes("User not found")) {
          throw new Error(
            "Usuario no encontrado en el sistema de autenticación. Contacte al administrador.",
          );
        }

        throw new Error(`Error de autenticación: ${error.message}`);
      }

      if (!data || !data.user) {
        throw new Error(
          "No se pudo autenticar al usuario. Intente nuevamente.",
        );
      }

      const { data: userRecord, error: userRecordError } = await supabase
        .from("users")
        .select("id, is_active, role, name")
        .eq("id", data.user.id)
        .maybeSingle();

      if (userRecordError && userRecordError.code !== "PGRST116") {
        console.warn(
          "⚠️ No se pudo verificar el registro del usuario antes de continuar:",
          userRecordError,
        );
      }

      let resolvedUserRecord = userRecord ?? null;

      if (!resolvedUserRecord) {
        try {
          console.log(
            "ℹ️ Internal user record missing, attempting automatic creation...",
          );
          resolvedUserRecord = await ensureInternalUserRecord(
            data.user,
            normalizedEmail,
          );
          console.log("✅ Internal user record created/synced successfully");
        } catch (syncError) {
          console.error("❌ Could not auto-create internal user record:", syncError);
          await supabase.auth.signOut();
          throw new Error(
            "Usuario no encontrado en la base de datos interna y no se pudo crear automáticamente. Contacte al administrador.",
          );
        }
      }

      if (!resolvedUserRecord) {
        await supabase.auth.signOut();
        throw new Error(
          "Usuario no encontrado en la base de datos interna. Contacte al administrador.",
        );
      }

      if (!resolvedUserRecord.is_active) {
        await supabase.auth.signOut();
        throw new Error("Usuario inactivo. Contacte al administrador.");
      }

      // Set session and load user profile directly
      if (data.session) {
        console.log("🔑 Setting session and loading user profile directly");
        setSession(data.session);
        await loadUserProfile(data.user);

        // Auditar login exitoso
        try {
          await auditService.auditLogin("LOGIN", data.user.id, {
            ip_address: "unknown",
            user_agent: navigator.userAgent,
          });
        } catch (auditError) {
          console.error("Error auditing login:", auditError);
        }
      }
    } catch (error) {
      console.error("Login error details:", error);

      // Handle email confirmation error
      if (error.message?.includes("Email not confirmed")) {
        throw new Error(
          "Email no confirmado. Contacte al administrador para confirmar la cuenta.",
        );
      }

      // Handle network connectivity errors
      if (
        error.message?.includes("Failed to fetch") ||
        error.name === "AuthRetryableFetchError"
      ) {
        throw new Error(
          "Error de conexión. Verifique su conexión a internet e intente nuevamente.",
        );
      }

      // Handle other auth errors
      if (error.message?.includes("Invalid login credentials")) {
        throw new Error(
          "Credenciales incorrectas. Verifique su email y contraseña.",
        );
      }

      // Handle inactive user error
      if (
        error.message?.includes("desactivada") ||
        error.message?.includes("inactive")
      ) {
        throw new Error(
          "Tu cuenta ha sido desactivada. Contacta al administrador.",
        );
      }

      // Default error message
      throw new Error(
        error.message || "Error al iniciar sesión. Intente nuevamente.",
      );
    } finally {
      setLoading(false);
    }
  };

  // Logout
  const logout = async () => {
    try {
      console.log("🚪 Logging out user...");

      // Auditar logout antes de cerrar sesión
      if (user) {
        try {
          await auditService.auditLogin("LOGOUT", user.id);
        } catch (auditError) {
          console.error("Error auditing logout:", auditError);
        }
      }

      // Clear local state first
      setUser(null);
      setSession(null);

      // Clear any stored auth data
      localStorage.removeItem("supabase.auth.token");
      localStorage.removeItem("emergency-auth");
      localStorage.removeItem("admin-bypass");
      sessionStorage.clear();

      // Check if there's an active session before trying to sign out
      try {
        const {
          data: { session },
        } = await supabase.auth.getSession();

        if (session) {
          console.log("📤 Active session found, signing out from Supabase...");
          const { error } = await supabase.auth.signOut();

          if (error) {
            console.warn("⚠️ Supabase logout error (ignoring):", error.message);
          }
        } else {
          console.log("📭 No active session found, local logout only");
        }
      } catch (sessionError) {
        console.warn(
          "⚠️ Could not check session status:",
          sessionError.message,
        );
      }

      console.log("✅ Logout completed");
    } catch (error) {
      console.error("❌ Logout error:", error);
      // Ensure state is cleared even if there's an error
      setUser(null);
      setSession(null);
    }
  };

  // Periodic user status check
  useEffect(() => {
    if (!user?.email) {
      return;
    }

    const checkUserStatus = async () => {
      try {
        const { data: userCheck, error } = await supabase
          .from("users")
          .select("is_active")
          .eq("email", user.email)
          .single();

        if (!error && userCheck && !userCheck.is_active) {
          console.log("🚫 User became inactive, logging out");
          await logout();
          window.location.href = "/inactive";
        }
      } catch (error) {
        console.warn("Could not check user status:", error);
      }
    };

    const statusCheckInterval = setInterval(checkUserStatus, 5 * 60 * 1000);

    return () => {
      clearInterval(statusCheckInterval);
    };
  }, [user?.email]);

  // Check permissions
  const hasPermission = (permission: string): boolean => {
    if (!user) return false;
    return (
      user.permissions.includes("all") || user.permissions.includes(permission)
    );
  };

  // Change password
  const changePassword = async (newPassword: string) => {
    const { error } = await supabase.auth.updateUser({ password: newPassword });
    if (error) throw error;
  };

  // Reset password
  const resetPassword = async (email: string) => {
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email);

      if (error) {
        // Handle specific rate limit error
        if (
          error.message.includes("rate limit") ||
          error.message.includes("email rate limit exceeded")
        ) {
          throw new Error(
            `Límite de emails excedido. \n\n` +
              `Solución manual:\n` +
              `1. Ve al dashboard de Supabase\n` +
              `2. Authentication > Users\n` +
              `3. Busca el usuario: ${email}\n` +
              `4. Actualiza la contraseña manualmente`,
          );
        }

        // Handle other email errors (like SMTP not configured)
        if (error.message.includes("SMTP") || error.message.includes("email")) {
          throw new Error(
            `Servicio de email no configurado.\n\n` +
              `Para resetear contraseñas necesitas:\n` +
              `1. Configurar SMTP en Supabase (recomendado)\n` +
              `2. O usar el método SQL manual\n\n` +
              `Contacta al administrador para configurar el email.`,
          );
        }

        throw error;
      }

      console.log("✅ Reset password email sent successfully");
    } catch (error) {
      console.error("Error sending reset email:", error);
      throw error;
    }
  };

  // Export security logs
  const exportSecurityLogs = () => {
    console.log("Security logs export requested");
  };

  const value: AuthContextType = {
    user,
    session,
    loading,
    login,
    logout,
    isAuthenticated: !!session?.user && !!user,
    hasPermission,
    changePassword,
    resetPassword,
    exportSecurityLogs,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};
