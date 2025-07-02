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
        "�� Initial session:",
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
      throw error;
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
