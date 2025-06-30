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

// Helper function for login validation with database
export const validateLogin = async (username: string, password: string) => {
  try {
    console.log("🔐 Validating login for:", username);

    // Primero intentar con usuarios demo (admin, gerente, etc.)
    const demoUser = Object.values(DEMO_USERS).find(
      (u) => u.username === username && u.password === password,
    );

    if (demoUser) {
      console.log("✅ Demo user authenticated:", demoUser.username);
      return {
        username: demoUser.username,
        name: demoUser.name,
        role: demoUser.role,
        employeeId: demoUser.employeeId,
        email: demoUser.email,
        permissions: demoUser.permissions,
        loginTime: new Date().toISOString(),
      };
    }

    // Si no es usuario demo, consultar base de datos
    const { data: user, error } = await supabase
      .from("users")
      .select(
        `
        *,
        employee:employees(id, name)
      `,
      )
      .eq("username", username)
      .eq("is_active", true)
      .single();

    if (error || !user) {
      console.log("❌ User not found or inactive");
      return null;
    }

    // Verificar contraseña (simple base64 decode para demo)
    const storedPassword = atob(user.password_hash);
    if (storedPassword !== password) {
      console.log("❌ Invalid password");
      return null;
    }

    console.log("✅ Database user authenticated:", user.username);

    // Actualizar último login
    await supabase
      .from("users")
      .update({ last_login: new Date().toISOString() })
      .eq("id", user.id);

    // Mapear permisos según rol
    const permissions = getRolePermissions(user.role);

    return {
      username: user.username,
      name: user.name,
      role: user.role,
      employeeId: user.employee?.id,
      email: user.email,
      permissions,
      loginTime: new Date().toISOString(),
      needsPasswordChange: user.needs_password_change,
    };
  } catch (error) {
    console.error("❌ Login validation error:", error);
    return null;
  }
};

// Helper para obtener permisos según rol
const getRolePermissions = (role: string): string[] => {
  switch (role) {
    case "admin":
      return ["all"];
    case "manager":
      return [
        "employees:view",
        "employees:create",
        "employees:edit",
        "payroll:view",
        "payroll:create",
        "payroll:edit",
        "reports:view",
        "vacations:view",
        "vacations:approve",
      ];
    case "hr":
      return [
        "employees:view",
        "employees:create",
        "employees:edit",
        "payroll:view",
        "payroll:create",
        "payroll:edit",
        "reports:view",
        "vacations:approve",
      ];
    case "employee":
      return ["portal:view"];
    case "readonly":
      return ["employees:view", "payroll:view", "reports:view"];
    default:
      return [];
  }
};

export { DEMO_USERS };
