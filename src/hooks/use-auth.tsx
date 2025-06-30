import {
  createContext,
  useContext,
  useState,
  useEffect,
  ReactNode,
} from "react";
import { supabase } from "@/lib/supabase";

interface User {
  username: string;
  name: string;
  role: "admin" | "manager" | "hr" | "employee" | "readonly";
  employeeId?: number;
  email: string;
  permissions: string[];
  loginTime: string;
}

interface AuthContextType {
  user: User | null;
  login: (userData: User) => void;
  logout: () => void;
  isAuthenticated: boolean;
  hasPermission: (permission: string) => boolean;
}

// Demo users with different roles
const DEMO_USERS = {
  admin: {
    username: "admin",
    password: "admin123",
    name: "Administrador",
    role: "admin" as const,
    email: "admin@cadizbartapas.com",
    permissions: ["all"],
  },
  gerente: {
    username: "gerente",
    password: "gerente123",
    name: "María López",
    role: "manager" as const,
    email: "maria.lopez@cadizbartapas.com",
    permissions: [
      "employees:view",
      "employees:create",
      "employees:edit",
      "payroll:view",
      "payroll:create",
      "payroll:edit",
      "reports:view",
    ],
  },
  rrhh: {
    username: "rrhh",
    password: "rrhh123",
    name: "Ana García",
    role: "hr" as const,
    email: "ana.garcia@cadizbartapas.com",
    permissions: [
      "employees:view",
      "employees:create",
      "employees:edit",
      "payroll:view",
      "payroll:create",
      "vacations:manage",
    ],
  },
  employee: {
    username: "employee",
    password: "empleado123",
    name: "Juan Pérez",
    role: "employee" as const,
    employeeId: 1,
    email: "juan.perez@cadizbartapas.com",
    permissions: ["profile:view", "payroll:view:own", "vacations:view:own"],
  },
  readonly: {
    username: "auditor",
    password: "auditor123",
    name: "Carlos Auditor",
    role: "readonly" as const,
    email: "auditor@cadizbartapas.com",
    permissions: ["employees:view", "payroll:view", "reports:view"],
  },
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);

  useEffect(() => {
    // Check if user is logged in on app start
    const savedUser = localStorage.getItem("user");
    if (savedUser) {
      try {
        const userData = JSON.parse(savedUser);
        // Verify the login is not too old (optional - 8 hours limit)
        const loginTime = new Date(userData.loginTime);
        const now = new Date();
        const hoursDiff =
          (now.getTime() - loginTime.getTime()) / (1000 * 60 * 60);

        if (hoursDiff < 8) {
          setUser(userData);
        } else {
          localStorage.removeItem("user");
        }
      } catch (error) {
        localStorage.removeItem("user");
      }
    }
  }, []);

  const login = (userData: User) => {
    setUser(userData);
    localStorage.setItem("user", JSON.stringify(userData));
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem("user");
  };

  const hasPermission = (permission: string) => {
    if (!user) return false;
    return (
      user.permissions.includes("all") || user.permissions.includes(permission)
    );
  };

  const value = {
    user,
    login,
    logout,
    isAuthenticated: !!user,
    hasPermission,
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

// Helper function for login validation
export const validateLogin = (username: string, password: string) => {
  const user = Object.values(DEMO_USERS).find(
    (u) => u.username === username && u.password === password,
  );

  if (user) {
    return {
      username: user.username,
      name: user.name,
      role: user.role,
      employeeId: user.employeeId,
      email: user.email,
      permissions: user.permissions,
      loginTime: new Date().toISOString(),
    };
  }

  return null;
};

export { DEMO_USERS };
