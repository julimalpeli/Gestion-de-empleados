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
  login: (email: string, password: string) => Promise<{ error?: string }>;
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

        setUser(null);
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    loadInitialSession();

    // Safety net: force loading=false after 5s to prevent UI lockup
    const safetyTimeout = setTimeout(() => {
      if (isMounted && loading) {
        setLoading(false);
      }
    }, 5000);

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (!isMounted) {
        return;
      }

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
      clearTimeout(safetyTimeout);
      subscription.unsubscribe();
    };
  }, []);

  // Build user profile from JWT/auth data (instant, no DB needed)
  const buildProfileFromAuth = (supabaseUser: SupabaseUser): any => {
    // Extract role from user_metadata (set during user creation)
    const metadata = supabaseUser.user_metadata as Record<string, any> || {};
    const appMetadata = supabaseUser.app_metadata as Record<string, any> || {};
    const role = metadata.role || appMetadata.role || "employee";
    const name = metadata.name || metadata.full_name || supabaseUser.email?.split("@")[0] || "Usuario";

    return {
      id: supabaseUser.id,
      username: supabaseUser.email?.split("@")[0] || "user",
      email: supabaseUser.email || "",
      name,
      role,
      employee_id: metadata.employee_id || null,
      is_active: true,
      needs_password_change: false,
    };
  };

  // Try to load full profile from DB (non-blocking, enriches JWT profile)
  const tryLoadDbProfile = (supabaseUser: SupabaseUser) => {
    // Fire and forget - don't block login
    supabase.rpc("get_my_profile").then(({ data, error }) => {
      if (!error && data && data.length > 0) {
        const dbProfile = data[0];

        // Update user state with full DB profile
        const userData: User = {
          id: dbProfile.id,
          username: dbProfile.username,
          name: dbProfile.name,
          role: dbProfile.role,
          email: dbProfile.email,
          employeeId: dbProfile.employee_id,
          permissions: getRolePermissions(dbProfile.role),
          loginTime: new Date().toISOString(),
          needsPasswordChange: dbProfile.needs_password_change || false,
          isActive: dbProfile.is_active,
          supabaseUser,
        };
        setUser(userData);

        // Update last login (fire and forget)
        supabase
          .from("users")
          .update({ last_login: new Date().toISOString() })
          .eq("id", dbProfile.id)
          .then(() => {})
          .catch(() => {});
      }
    }).catch(() => {});
  };

  // Load user profile - instant from JWT, then enrich from DB in background
  const loadUserProfile = async (supabaseUser: SupabaseUser) => {
    try {
      // INSTANT: Build profile from authenticated session data (JWT)
      // Active status is checked in login() via check_email_exists RPC
      // and in background via tryLoadDbProfile + periodic status check
      const userProfile = buildProfileFromAuth(supabaseUser);

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

      // Try to enrich with full DB profile in the background (non-blocking)
      tryLoadDbProfile(supabaseUser);
    } catch (error) {
      // Profile loading failed silently - user will see login page
    }
  };

  // Login - always through Supabase Auth
  const login = async (email: string, password: string): Promise<{ error?: string }> => {
    setLoading(true);
    try {
      const trimmedEmail = email.trim();
      const normalizedEmail = trimmedEmail.toLowerCase();

      const { data, error } = await supabase.auth.signInWithPassword({
        email: trimmedEmail,
        password,
      });

      if (error) {
        if (error.message.includes("Invalid login credentials")) {
          // Check if the email exists using RPC (bypasses RLS via SECURITY DEFINER)
          try {
            const { data: checkResult } = await supabase.rpc("check_email_exists", {
              check_email: normalizedEmail,
            });

            if (checkResult) {
              const info = typeof checkResult === "string" ? JSON.parse(checkResult) : checkResult;

              if (!info.exists) {
                return { error: "El email ingresado no está registrado en el sistema. Verificá que esté bien escrito o contactá al administrador." };
              }
              if (!info.is_active) {
                return { error: "Tu cuenta está desactivada. Contactá al administrador para reactivarla." };
              }
              if (!info.has_auth) {
                return { error: "Tu cuenta existe pero no tiene acceso de login configurado. Contactá al administrador." };
              }
              // Email exists, is active, has auth → password is wrong
              return { error: "La contraseña es incorrecta. Intentá de nuevo o usá '¿Olvidaste tu contraseña?' para restablecerla." };
            }
          } catch (rpcError: any) {
            // If RPC failed, fall through to generic message
          }
          return { error: "Credenciales incorrectas. Verificá tu email y contraseña." };
        }

        if (error.message.includes("Email not confirmed")) {
          return { error: "El email del usuario no está confirmado. Contacte al administrador para confirmar la cuenta." };
        }

        if (error.message.includes("User not found")) {
          return { error: "Usuario no encontrado en el sistema de autenticación. Contacte al administrador." };
        }

        return { error: `Error de autenticación: ${error.message}` };
      }

      if (!data || !data.user) {
        return { error: "No se pudo autenticar al usuario. Intente nuevamente." };
      }

      // Auth succeeded! Set session and load profile from JWT immediately
      if (data.session) {
        setSession(data.session);
        await loadUserProfile(data.user);

        // Audit login in background (don't block)
        auditService.auditLogin("LOGIN", data.user.id, {
          ip_address: "unknown",
          user_agent: navigator.userAgent,
        }).catch(() => {});
      }

      return {}; // Success, no error
    } catch (err: any) {
      // Handle network connectivity errors
      if (
        err.message?.includes("Failed to fetch") ||
        err.name === "AuthRetryableFetchError"
      ) {
        return { error: "Error de conexión. Verificá tu conexión a internet e intentá nuevamente." };
      }
      return { error: err.message || "Error al iniciar sesión. Intente nuevamente." };
    } finally {
      setLoading(false);
    }
  };

  // Logout
  const logout = async () => {
    try {

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
          await supabase.auth.signOut();
        }
      } catch (sessionError) {
        // Ignore session check errors during logout
      }
    } catch (error) {
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
          await logout();
          window.location.href = "/inactive";
        }
      } catch (error) {
        // Silently handle status check errors
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

    } catch (error) {
      throw error;
    }
  };

  // Export security logs
  const exportSecurityLogs = () => {
    // Security logs export - to be implemented
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
