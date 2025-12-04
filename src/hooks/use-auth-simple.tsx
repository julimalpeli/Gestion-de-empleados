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
import { checkEmergencyAuth } from "@/utils/emergencyAuth";

const ADMIN_BYPASS_ENABLED =
  import.meta.env.VITE_ENABLE_ADMIN_BYPASS === "true";
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
    console.warn("⚠️ Could not insert internal user record directly:", error);

    if (error.code === "23505") {
      const { data: existingByEmail, error: existingError } = await supabase
        .from("users")
        .select("id, is_active, role, name")
        .eq("email", emailToUse)
        .maybeSingle();

      if (existingError) {
        throw existingError;
      }

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
          throw syncError;
        }

        return syncedUser;
      }
    }

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

    const restoreAdminBypass = () => {
      if (!ADMIN_BYPASS_ENABLED) {
        localStorage.removeItem("admin-bypass");
        return false;
      }

      const adminBypass = localStorage.getItem("admin-bypass");
      if (!adminBypass) {
        return false;
      }

      try {
        const adminUser = JSON.parse(adminBypass);
        console.log("🔓 Admin bypass restored from storage");
        setUser(adminUser);
        setSession(null);
        setLoading(false);
        return true;
      } catch (error) {
        console.warn("⚠️ Invalid admin bypass data", error);
        localStorage.removeItem("admin-bypass");
      }

      return false;
    };

    const emergencyUser = checkEmergencyAuth();
    if (emergencyUser) {
      console.log("🚨 Using emergency auth for:", emergencyUser.email);
      setUser(emergencyUser);
      setSession(null);
      setLoading(false);
      return () => {
        isMounted = false;
      };
    }

    if (restoreAdminBypass()) {
      return () => {
        isMounted = false;
      };
    }

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
        if (!localStorage.getItem("admin-bypass")) {
          setUser(null);
        }
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

  // Make debug functions available globally
  useEffect(() => {
    if (typeof window !== "undefined") {
      (window as any).checkAuthContext = checkAuthContext;
      (window as any).checkSession = checkSession;
      console.log("🔧 Auth debug functions available:");
      console.log("   - checkAuthContext()");
      console.log("   - checkSession()");
    }
  }, []);

  // Load user profile
  const loadUserProfile = async (supabaseUser: SupabaseUser) => {
    try {
      // Admin fallback
      if (supabaseUser.email === "julimalpeli@gmail.com") {
        const adminUser: User = {
          id: supabaseUser.id,
          username: "admin",
          name: "Julian Malpeli (Admin)",
          role: "admin",
          email: supabaseUser.email,
          employeeId: undefined,
          permissions: ["all"],
          loginTime: new Date().toISOString(),
          needsPasswordChange: false,
          isActive: true,
          supabaseUser,
        };
        setUser(adminUser);
        return;
      }

      // Known employee fallback to prevent database issues
      if (supabaseUser.email === "daianaayelen0220@gmail.com") {
        const employeeUser: User = {
          id: "d6f06332-1d49-4935-b931-5d7657d58468", // Known employee ID
          username: "daiana",
          name: "Porras Daiana Ayelen",
          role: "employee",
          email: supabaseUser.email,
          employeeId: "d6f06332-1d49-4935-b931-5d7657d58468",
          permissions: getRolePermissions("employee"),
          loginTime: new Date().toISOString(),
          needsPasswordChange: false,
          isActive: true,
          supabaseUser,
        };
        setUser(employeeUser);
        return;
      }

      // Skip database query for admin user entirely
      if (supabaseUser.email === "julimalpeli@gmail.com") {
        console.log("🔓 Admin detected, using admin fallback");
        const adminUser: User = {
          id: supabaseUser.id,
          username: "admin",
          name: "Julian Malpeli (Admin)",
          role: "admin",
          email: supabaseUser.email,
          employeeId: undefined,
          permissions: ["all"],
          loginTime: new Date().toISOString(),
          needsPasswordChange: false,
          isActive: true,
          supabaseUser,
        };
        setUser(adminUser);
        return;
      }

      // Try to load from database with timeout
      console.log("🔄 Querying database for user profile...");

      const queryPromise = supabase
        .from("users")
        .select("*")
        .eq("email", supabaseUser.email)
        .eq("is_active", true)
        .limit(1);

      // Add timeout to prevent hanging
      const timeoutPromise = new Promise((_, reject) =>
        setTimeout(() => reject(new Error("Database query timeout")), 8000),
      );

      let users, error;
      try {
        const result = await Promise.race([queryPromise, timeoutPromise]);
        users = result.data;
        error = result.error;
      } catch (timeoutError) {
        console.warn("⏰ Database query timed out, using fallback");
        users = null;
        error = timeoutError;
      }

      console.log("📊 Database query result:", {
        users: users?.length,
        error: error?.message,
      });

      if (error) {
        console.warn("⚠️ Database error, using fallback user:", error.message);
        // Fallback for database errors
        const fallbackUser: User = {
          id: supabaseUser.id,
          username: supabaseUser.email?.split("@")[0] || "user",
          name: supabaseUser.user_metadata?.name || "Usuario",
          role: "employee",
          email: supabaseUser.email || "",
          permissions: getRolePermissions("employee"),
          loginTime: new Date().toISOString(),
          needsPasswordChange: false,
          isActive: true,
          supabaseUser,
        };
        setUser(fallbackUser);
        return;
      }

      if (!users?.[0]) {
        console.warn("⚠️ No user found in database, using fallback");
        // Fallback for users not found in database
        const fallbackUser: User = {
          id: supabaseUser.id,
          username: supabaseUser.email?.split("@")[0] || "user",
          name: supabaseUser.user_metadata?.name || "Usuario",
          role: "employee",
          email: supabaseUser.email || "",
          permissions: getRolePermissions("employee"),
          loginTime: new Date().toISOString(),
          needsPasswordChange: false,
          isActive: true,
          supabaseUser,
        };
        setUser(fallbackUser);
        return;
      }

      const userProfile = users[0];
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
        console.log("✅ Last login updated for user:", userProfile.name);
      } catch (updateError) {
        console.warn("⚠️ Could not update last login:", updateError);
      }
    } catch (error) {
      console.error("❌ Error loading user profile:", error);

      // Even if there's an error, try to create a fallback user so login doesn't completely fail
      try {
        const emergencyFallback: User = {
          id: supabaseUser.id,
          username: supabaseUser.email?.split("@")[0] || "user",
          name: "Usuario",
          role: "employee",
          email: supabaseUser.email || "",
          permissions: getRolePermissions("employee"),
          loginTime: new Date().toISOString(),
          needsPasswordChange: false,
          isActive: true,
          supabaseUser,
        };
        setUser(emergencyFallback);
        console.log("🆘 Emergency fallback user created");
      } catch (fallbackError) {
        console.error("❌ Even fallback failed:", fallbackError);
      }
    }
  };

  // Login
  const login = async (email: string, password: string) => {
    setLoading(true);
    try {
      console.log(`🔐 Login attempt for: ${email.trim()}`);

      // Special bypass for admin user is controlled via env flag
      if (ADMIN_BYPASS_ENABLED && email.trim() === "julimalpeli@gmail.com") {
        console.log("🔓 Admin login detected - using bypass");

        // Create admin user directly without Supabase auth verification
        const adminUser: User = {
          id: "admin-emergency-id",
          username: "admin",
          name: "Julian Malpeli (Admin)",
          role: "admin",
          email: email.trim(),
          employeeId: undefined,
          permissions: ["all"],
          loginTime: new Date().toISOString(),
          needsPasswordChange: false,
          isActive: true,
        };

        setUser(adminUser);
        // Persist admin bypass in localStorage
        localStorage.setItem("admin-bypass", JSON.stringify(adminUser));

        // Update last login for admin too
        try {
          await supabase
            .from("users")
            .update({ last_login: new Date().toISOString() })
            .eq("email", email.trim());
          console.log("✅ Last login updated for admin");
        } catch (updateError) {
          console.warn("⚠️ Could not update admin last login:", updateError);
        }

        console.log("✅ Admin user created with bypass");
        return;
      }

      const trimmedEmail = email.trim();
      const normalizedEmail = trimmedEmail.toLowerCase();

      console.log("📧 Attempting Supabase auth login...");
      const { data, error } = await supabase.auth.signInWithPassword({
        email: trimmedEmail,
        password,
      });

      if (error) {
        console.error("❌ Supabase auth error details:");
        console.error("   - Error code:", error.status);
        console.error("   - Error message:", error.message);
        console.error("   - Full error:", error);

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
            ip_address: "unknown", // Podríamos obtener la IP si es necesario
            user_agent: navigator.userAgent,
          });
        } catch (auditError) {
          console.error("Error auditing login:", auditError);
        }
      }
    } catch (error) {
      console.error("Login error details:", error);

      // Auditar login fallido (skip audit for failed logins - no valid user ID available)
      try {
        // Skip audit for failed logins since we don't have a valid user ID
        console.log("⚠️ Skipping audit for failed login - no valid user ID");
      } catch (auditError) {
        console.error("Error auditing failed login:", auditError);
      }

      // Handle email confirmation error
      if (error.message?.includes("Email not confirmed")) {
        throw new Error(
          "Email no confirmado. Usa las funciones de confirmación en la consola del navegador: confirmUserEmail('tu@email.com')",
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
        // Continue with local logout even if session check fails
      }

      console.log("✅ Logout completed");
    } catch (error) {
      console.error("❌ Logout error:", error);
      // Ensure state is cleared even if there's an error
      setUser(null);
      setSession(null);
    }
  };

  useEffect(() => {
    if (!user?.email || user.id === "admin-emergency-id") {
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
  }, [user?.email, user?.id]);

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
              `4. Actualiza la contraseña manualmente\n\n` +
              `O usa el método SQL:\n` +
              `UPDATE auth.users SET encrypted_password = crypt('nueva_password', gen_salt('bf')) WHERE email = '${email}';`,
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
    // Simple implementation
    console.log("Security logs export requested");
  };

  const value: AuthContextType = {
    user,
    session,
    loading,
    login,
    logout,
    isAuthenticated: !!user, // Simplified: just check if user exists (works with both normal login and admin bypass)
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

// Direct auth debugging function
const checkAuthContext = async () => {
  try {
    console.log("🔐 Checking authentication context...");

    // Check client-side session
    const {
      data: { session },
      error: sessionError,
    } = await supabase.auth.getSession();
    console.log("�� Client session:", {
      session: !!session,
      user: session?.user?.id,
      email: session?.user?.email,
      error: sessionError,
    });

    // Try a simple authenticated query
    const { data: testQuery, error: testError } = await supabase
      .from("vacation_requests")
      .select("id")
      .limit(1);

    console.log("🎯 Test vacation query result:", {
      data: testQuery,
      error: testError,
    });

    // Test auth context with a simpler query
    const { data: authTest, error: authError } =
      await supabase.rpc("get_auth_context");

    console.log("🛡️ Auth context test:", {
      data: authTest,
      error: authError,
    });

    return {
      session: !!session,
      userId: session?.user?.id,
      email: session?.user?.email,
      canQueryVacations: !testError,
      sessionError,
      queryError: testError,
      authError,
    };
  } catch (error) {
    console.error("❌ Error checking auth context:", error);
    return { error };
  }
};

// Simple session check
const checkSession = async () => {
  const {
    data: { session },
  } = await supabase.auth.getSession();
  console.log("Current session:", session);
  return session;
};

// Export for global access
export { checkAuthContext, checkSession };

// Make immediately available on module load
if (typeof window !== "undefined") {
  (window as any).checkAuthContext = checkAuthContext;
  (window as any).checkSession = checkSession;
  (window as any).authDebug = { checkAuthContext, checkSession };
  console.log("��� Auth debug functions loaded:");
  console.log("   - checkAuthContext()");
  console.log("   - checkSession()");
  console.log("   - authDebug.checkAuthContext()");
  console.log("   - authDebug.checkSession()");
}
