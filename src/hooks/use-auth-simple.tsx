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
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    // Get initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      console.log(
        "🔐 Initial session:",
        session?.user?.id,
        session?.user?.email,
      );
      setSession(session);
      if (session?.user) {
        loadUserProfile(session.user);
      }
    });

    // Listen for auth changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, session) => {
      console.log(
        "🔐 Auth state change:",
        event,
        session?.user?.id,
        session?.user?.email,
      );
      setSession(session);
      if (session?.user) {
        await loadUserProfile(session.user);
      } else {
        setUser(null);
      }
    });

    return () => subscription.unsubscribe();
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
          supabaseUser,
        };
        setUser(adminUser);
        return;
      }

      // Try to load from database
      const { data: users, error } = await supabase
        .from("users")
        .select("*")
        .eq("email", supabaseUser.email)
        .eq("is_active", true)
        .limit(1);

      if (error || !users?.[0]) {
        // Fallback for other users
        const fallbackUser: User = {
          id: supabaseUser.id,
          username: supabaseUser.email?.split("@")[0] || "user",
          name: supabaseUser.user_metadata?.name || "User",
          role: "employee",
          email: supabaseUser.email || "",
          permissions: getRolePermissions("employee"),
          loginTime: new Date().toISOString(),
          needsPasswordChange: false,
          supabaseUser,
        };
        setUser(fallbackUser);
        return;
      }

      const userProfile = users[0];
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
    } catch (error) {
      console.error("Error loading user profile:", error);
    }
  };

  // Login
  const login = async (email: string, password: string) => {
    setLoading(true);
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password: password,
      });

      if (error) throw error;
      // User will be set by onAuthStateChange
    } catch (error) {
      console.error("Login error details:", error);

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
    await supabase.auth.signOut();
    setUser(null);
    setSession(null);
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
    const { error } = await supabase.auth.updateUser({ password: newPassword });
    if (error) throw error;
  };

  // Reset password
  const resetPassword = async (email: string) => {
    const { error } = await supabase.auth.resetPasswordForEmail(email);
    if (error) throw error;
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

// Direct auth debugging function
const checkAuthContext = async () => {
  try {
    console.log("🔐 Checking authentication context...");

    // Check client-side session
    const {
      data: { session },
      error: sessionError,
    } = await supabase.auth.getSession();
    console.log("📱 Client session:", {
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
  console.log("🔧 Auth debug functions loaded:");
  console.log("   - checkAuthContext()");
  console.log("   - checkSession()");
  console.log("   - authDebug.checkAuthContext()");
  console.log("   - authDebug.checkSession()");
}
