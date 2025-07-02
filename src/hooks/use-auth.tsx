import {
  createContext,
  useContext,
  useState,
  useEffect,
  ReactNode,
} from "react";
import { supabase } from "@/lib/supabase";
import type { User as SupabaseUser, Session } from "@supabase/supabase-js";

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

// Security event logging
const logSecurityEvent = (
  eventType: string,
  details: Record<string, any> = {},
) => {
  const timestamp = new Date().toISOString();
  const logEntry = {
    timestamp,
    eventType,
    details,
    userAgent: navigator.userAgent,
    ip: "client-side", // En producción podrías obtener la IP real
  };

  console.log(`🔒 Security Event: ${eventType}`, logEntry);

  // Guardar en localStorage para auditoría
  try {
    const existingLogs = JSON.parse(
      localStorage.getItem("securityLogs") || "[]",
    );
    existingLogs.push(logEntry);

    // Keep only last 100 entries
    if (existingLogs.length > 100) {
      existingLogs.splice(0, existingLogs.length - 100);
    }

    localStorage.setItem("securityLogs", JSON.stringify(existingLogs));
  } catch (error) {
    console.error("Error logging security event:", error);
  }
};

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

  // Initialize Supabase Auth listener
  useEffect(() => {
    let mounted = true;

    const getInitialSession = async () => {
      try {
        const {
          data: { session },
          error,
        } = await supabase.auth.getSession();

        if (error) {
          console.error("Error getting session:", error);
          return;
        }

        if (mounted) {
          setSession(session);
          if (session?.user) {
            await loadUserProfile(session.user);
          }
        }
      } catch (error) {
        console.error("Error in getInitialSession:", error);
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    };

    getInitialSession();

    // Listen for auth changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, session) => {
      console.log("🔐 Auth state changed:", event, session?.user?.email);

      if (mounted) {
        setSession(session);

        if (session?.user) {
          await loadUserProfile(session.user);
          logSecurityEvent("SESSION_ESTABLISHED", {
            userId: session.user.id,
            email: session.user.email,
            event,
          });
        } else {
          setUser(null);
          if (event === "SIGNED_OUT") {
            logSecurityEvent("SESSION_ENDED", { event });
          }
        }

        setLoading(false);
      }
    });

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, []);

  // Load user profile from our users table
  const loadUserProfile = async (supabaseUser: SupabaseUser) => {
    try {
      const { data: userProfile, error } = await supabase
        .from("users")
        .select("*")
        .eq("email", supabaseUser.email)
        .eq("is_active", true)
        .single();

      if (error || !userProfile) {
        console.error("Error loading user profile:", {
          error: error,
          message: error?.message,
          details: error?.details,
          hint: error?.hint,
          code: error?.code,
          userProfile: userProfile,
          email: supabaseUser.email,
        });

        // If user doesn't exist in our users table, sign them out
        await supabase.auth.signOut();
        throw new Error(
          `Usuario no autorizado: ${error?.message || "Usuario no encontrado"}`,
        );
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
        supabaseUser,
      };

      setUser(userData);

      // Update last login
      await supabase
        .from("users")
        .update({ last_login: new Date().toISOString() })
        .eq("id", userProfile.id);
    } catch (error) {
      console.error("Error loading user profile:", error);
      throw error;
    }
  };

  // Get permissions based on role
  const getRolePermissions = (role: string): string[] => {
    const rolePermissions = {
      admin: ["all"],
      manager: [
        "employees:view",
        "employees:create",
        "employees:edit",
        "employees:export",
        "payroll:view",
        "payroll:create",
        "payroll:edit",
        "payroll:process",
        "vacations:view",
        "vacations:approve",
        "vacations:manage",
        "reports:view",
        "reports:generate",
        "files:manage",
      ],
      hr: [
        "employees:view",
        "employees:create",
        "employees:edit",
        "employees:export",
        "payroll:view",
        "payroll:create",
        "payroll:edit",
        "vacations:view",
        "vacations:approve",
        "vacations:manage",
        "reports:view",
        "files:manage",
      ],
      employee: [
        "employees:view-own",
        "payroll:view-own",
        "vacations:view-own",
        "files:view-own",
      ],
      readonly: [
        "employees:view",
        "payroll:view",
        "vacations:view",
        "reports:view",
      ],
    };

    return rolePermissions[role as keyof typeof rolePermissions] || [];
  };

  // Login function
  const login = async (email: string, password: string) => {
    try {
      setLoading(true);

      logSecurityEvent("LOGIN_ATTEMPT", {
        email,
        timestamp: new Date().toISOString(),
      });

      const { data, error } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password: password,
      });

      if (error) {
        logSecurityEvent("LOGIN_FAILED", {
          email,
          error: error.message,
          timestamp: new Date().toISOString(),
        });
        throw error;
      }

      if (!data.user) {
        throw new Error("No se pudo autenticar el usuario");
      }

      logSecurityEvent("LOGIN_SUCCESS", {
        userId: data.user.id,
        email: data.user.email,
        timestamp: new Date().toISOString(),
      });

      // User profile will be loaded automatically by onAuthStateChange
      console.log("✅ Login successful:", data.user.email);
    } catch (error) {
      setLoading(false);
      console.error("❌ Login error:", error);
      throw error;
    }
  };

  // Logout function
  const logout = async () => {
    try {
      if (user) {
        logSecurityEvent("LOGOUT", {
          userId: user.id,
          username: user.username,
          email: user.email,
        });
      }

      const { error } = await supabase.auth.signOut();

      if (error) {
        console.error("Error during logout:", error);
      }

      // Clear local state (will also be cleared by onAuthStateChange)
      setUser(null);
      setSession(null);
    } catch (error) {
      console.error("Logout error:", error);
      throw error;
    }
  };

  // Check permissions
  const hasPermission = (permission: string): boolean => {
    if (!user) return false;

    return (
      user.permissions.includes("all") || user.permissions.includes(permission)
    );
  };

  // Change password
  const changePassword = async (newPassword: string) => {
    try {
      if (!session?.user) {
        throw new Error("No hay sesión activa");
      }

      const { error } = await supabase.auth.updateUser({
        password: newPassword,
      });

      if (error) {
        throw error;
      }

      // Update user profile to remove password change requirement
      if (user?.needsPasswordChange) {
        await supabase
          .from("users")
          .update({ needs_password_change: false })
          .eq("id", user.id);

        const updatedUser = { ...user, needsPasswordChange: false };
        setUser(updatedUser);
      }

      logSecurityEvent("PASSWORD_CHANGE", {
        userId: user?.id,
        email: user?.email,
        timestamp: new Date().toISOString(),
      });

      console.log("✅ Password changed successfully");
    } catch (error) {
      console.error("❌ Error changing password:", error);
      throw error;
    }
  };

  // Reset password (send email)
  const resetPassword = async (email: string) => {
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/reset-password`,
      });

      if (error) {
        throw error;
      }

      logSecurityEvent("PASSWORD_RESET_REQUESTED", {
        email,
        timestamp: new Date().toISOString(),
      });

      console.log("✅ Password reset email sent");
    } catch (error) {
      console.error("❌ Error sending password reset:", error);
      throw error;
    }
  };

  // Export security logs for audit
  const exportSecurityLogs = () => {
    try {
      const logs = JSON.parse(localStorage.getItem("securityLogs") || "[]");
      const dataStr = JSON.stringify(logs, null, 2);
      const dataUri =
        "data:application/json;charset=utf-8," + encodeURIComponent(dataStr);

      const exportFileDefaultName = `security-logs-${
        new Date().toISOString().split("T")[0]
      }.json`;

      const linkElement = document.createElement("a");
      linkElement.setAttribute("href", dataUri);
      linkElement.setAttribute("download", exportFileDefaultName);
      linkElement.click();

      logSecurityEvent("SECURITY_LOGS_EXPORTED", {
        userId: user?.id,
        email: user?.email,
        logsCount: logs.length,
      });
    } catch (error) {
      console.error("Error exporting security logs:", error);
    }
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

// Export for compatibility
export { logSecurityEvent };

// Helper function to create user in Supabase Auth (for admin use)
export const createSupabaseUser = async (
  email: string,
  password: string,
  userData: any,
) => {
  try {
    // Create user in Supabase Auth
    const { data: authData, error: authError } =
      await supabase.auth.admin.createUser({
        email,
        password,
        email_confirm: true, // Auto-confirm email
        user_metadata: {
          name: userData.name,
          role: userData.role,
        },
      });

    if (authError) {
      throw authError;
    }

    // Create user in our users table
    const { error: dbError } = await supabase.from("users").insert({
      id: authData.user.id,
      username: userData.username,
      email: email,
      name: userData.name,
      role: userData.role,
      employee_id: userData.employeeId,
      is_active: true,
      needs_password_change: userData.needsPasswordChange || false,
    });

    if (dbError) {
      // If user table creation fails, delete the auth user
      await supabase.auth.admin.deleteUser(authData.user.id);
      throw dbError;
    }

    logSecurityEvent("USER_CREATED", {
      userId: authData.user.id,
      email: email,
      role: userData.role,
      createdBy: "system",
    });

    return authData.user;
  } catch (error) {
    console.error("Error creating Supabase user:", error);
    throw error;
  }
};
