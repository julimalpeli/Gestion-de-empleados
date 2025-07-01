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
  needsPasswordChange?: boolean;
}

interface AuthContextType {
  user: User | null;
  login: (userData: User) => void;
  logout: () => void;
  isAuthenticated: boolean;
  hasPermission: (permission: string) => boolean;
  changePassword: (newPassword: string) => Promise<void>;
}

// Demo users with different roles
const DEMO_USERS = {
  jmalpeli: {
    username: "jmalpeli",
    password: "Jmalpeli3194",
    name: "Julian Malpeli",
    role: "admin" as const,
    email: "julimalpeli@gmail.com",
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
        // Verify the login is not too old (4 hours for security)
        const loginTime = new Date(userData.loginTime);
        const now = new Date();
        const hoursDiff =
          (now.getTime() - loginTime.getTime()) / (1000 * 60 * 60);

        if (hoursDiff < 4) {
          setUser(userData);

          // Set up session expiration warning (warn 15 minutes before expiry)
          const timeUntilWarning =
            4 * 60 * 60 * 1000 -
            15 * 60 * 1000 -
            (now.getTime() - loginTime.getTime());
          if (timeUntilWarning > 0) {
            setTimeout(() => {
              if (
                confirm("Su sesión expirará en 15 minutos. ¿Desea continuar?")
              ) {
                // Extend session by updating login time
                const extendedUser = {
                  ...userData,
                  loginTime: new Date().toISOString(),
                };
                setUser(extendedUser);
                localStorage.setItem("user", JSON.stringify(extendedUser));
              }
            }, timeUntilWarning);
          }

          // Set up automatic logout
          const timeUntilExpiry =
            4 * 60 * 60 * 1000 - (now.getTime() - loginTime.getTime());
          if (timeUntilExpiry > 0) {
            setTimeout(() => {
              console.log("🕐 Session expired - automatic logout");
              setUser(null);
              localStorage.removeItem("user");
              alert(
                "Su sesión ha expirado por seguridad. Por favor, inicie sesión nuevamente.",
              );
              window.location.href = "/login";
            }, timeUntilExpiry);
          }
        } else {
          console.log("🕐 Session expired on startup");
          localStorage.removeItem("user");
        }
      } catch (error) {
        localStorage.removeItem("user");
      }
    }
  }, []);

  // Separate useEffect for activity detection to avoid infinite loops
  useEffect(() => {
    if (!user) return;

    let activityTimeout: NodeJS.Timeout;

    const resetActivityTimer = () => {
      clearTimeout(activityTimeout);
      activityTimeout = setTimeout(
        () => {
          // Get current user from localStorage to avoid stale closure
          const currentUser = localStorage.getItem("user");
          if (currentUser) {
            try {
              const userData = JSON.parse(currentUser);
              const extendedUser = {
                ...userData,
                lastActivity: new Date().toISOString(),
              };
              localStorage.setItem("user", JSON.stringify(extendedUser));
            } catch (error) {
              console.error("Error updating activity:", error);
            }
          }
        },
        5 * 60 * 1000,
      ); // Update every 5 minutes of activity
    };

    // Listen for user activity
    const events = [
      "mousedown",
      "mousemove",
      "keypress",
      "scroll",
      "touchstart",
      "click",
    ];
    events.forEach((event) => {
      document.addEventListener(event, resetActivityTimer, true);
    });

    return () => {
      events.forEach((event) => {
        document.removeEventListener(event, resetActivityTimer, true);
      });
      clearTimeout(activityTimeout);
    };
  }, [user?.username]); // Only depend on username to avoid infinite loops

  // Security logging function
  const logSecurityEvent = (eventType: string, details: any) => {
    const logEntry = {
      timestamp: new Date().toISOString(),
      eventType,
      details,
      userAgent: navigator.userAgent,
      url: window.location.href,
    };

    console.log(`🔐 Security Event: ${eventType}`, logEntry);

    // Store in localStorage for audit (in production, send to server)
    const existingLogs = JSON.parse(
      localStorage.getItem("securityLogs") || "[]",
    );
    existingLogs.push(logEntry);

    // Keep only last 100 entries
    if (existingLogs.length > 100) {
      existingLogs.splice(0, existingLogs.length - 100);
    }

    localStorage.setItem("securityLogs", JSON.stringify(existingLogs));
  };

  const login = (userData: User) => {
    setUser(userData);
    localStorage.setItem("user", JSON.stringify(userData));

    // Log successful login
    logSecurityEvent("LOGIN_SUCCESS", {
      username: userData.username,
      role: userData.role,
      loginTime: userData.loginTime,
    });
  };

  const logout = () => {
    if (user) {
      // Log logout
      logSecurityEvent("LOGOUT", {
        username: user.username,
        role: user.role,
        sessionDuration:
          new Date().getTime() - new Date(user.loginTime).getTime(),
      });
    }

    setUser(null);
    localStorage.removeItem("user");
  };

  const hasPermission = (permission: string) => {
    if (!user) return false;
    return (
      user.permissions.includes("all") || user.permissions.includes(permission)
    );
  };

  const changePassword = async (newPassword: string) => {
    try {
      const { error } = await supabase.auth.updateUser({
        password: newPassword,
      });

      if (error) {
        throw new Error(error.message);
      }

      // Update user data to remove password change requirement
      if (user?.needsPasswordChange) {
        const updatedUser = { ...user, needsPasswordChange: false };
        setUser(updatedUser);
        localStorage.setItem("user", JSON.stringify(updatedUser));
      }
    } catch (error) {
      console.error("Error changing password:", error);
      throw error;
    }
  };

  // Export security logs for audit
  const exportSecurityLogs = () => {
    const logs = JSON.parse(localStorage.getItem("securityLogs") || "[]");
    const blob = new Blob([JSON.stringify(logs, null, 2)], {
      type: "application/json",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `security-logs-${new Date().toISOString().split("T")[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  // Get security logs summary
  const getSecurityLogsSummary = () => {
    const logs = JSON.parse(localStorage.getItem("securityLogs") || "[]");
    const summary = logs.reduce((acc: any, log: any) => {
      acc[log.eventType] = (acc[log.eventType] || 0) + 1;
      return acc;
    }, {});

    return {
      totalEvents: logs.length,
      eventTypes: summary,
      lastEvents: logs.slice(-10).reverse(),
    };
  };

  const value = {
    user,
    login,
    logout,
    isAuthenticated: !!user,
    hasPermission,
    changePassword,
    exportSecurityLogs,
    getSecurityLogsSummary,
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

// Security logging helper
const logSecurityEvent = (eventType: string, details: any) => {
  const logEntry = {
    timestamp: new Date().toISOString(),
    eventType,
    details,
    userAgent: navigator.userAgent,
  };

  console.log(`🔐 Security Event: ${eventType}`, logEntry);

  // Store in localStorage for audit (in production, send to server)
  const existingLogs = JSON.parse(localStorage.getItem("securityLogs") || "[]");
  existingLogs.push(logEntry);

  // Keep only last 100 entries
  if (existingLogs.length > 100) {
    existingLogs.splice(0, existingLogs.length - 100);
  }

  localStorage.setItem("securityLogs", JSON.stringify(existingLogs));
};

// Helper function for login validation with database
export const validateLogin = async (username: string, password: string) => {
  try {
    console.log("🔐 Validating login for:", username);

    // Log login attempt
    logSecurityEvent("LOGIN_ATTEMPT", {
      username,
      timestamp: new Date().toISOString(),
    });

    // Primero intentar con usuarios demo (admin, gerente, etc.)
    const demoUser = Object.values(DEMO_USERS).find(
      (u) => u.username === username && u.password === password,
    );

    if (demoUser) {
      console.log("✅ Demo user authenticated:", demoUser.username);

      logSecurityEvent("DEMO_LOGIN_SUCCESS", {
        username: demoUser.username,
        role: demoUser.role,
      });

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

      logSecurityEvent("LOGIN_FAILED_USER_NOT_FOUND", {
        username,
        error: error?.message || "User not found or inactive",
      });

      return null;
    }

    // Verificar contraseña usando Supabase Auth
    try {
      const { data: authData, error: authError } =
        await supabase.auth.signInWithPassword({
          email: user.email,
          password: password,
        });

      if (authError || !authData.user) {
        console.log("❌ Invalid password:", authError?.message);

        // Fallback: Si es el usuario admin y la contraseña coincide con la configurada
        if (
          (user.email === "julimalpeli@gmail.com" ||
            user.username === "jmalpeli") &&
          password === "Jmalpeli3194"
        ) {
          console.log("✅ Admin fallback authentication successful");
        } else {
          return null;
        }
      } else {
        // Sign out immediately after validation (we're using session-based auth)
        await supabase.auth.signOut();
      }
    } catch (authValidationError) {
      console.log("❌ Password validation error:", authValidationError);

      // Fallback para admin en caso de error de autenticación
      if (
        (user.email === "julimalpeli@gmail.com" ||
          user.username === "jmalpeli") &&
        password === "Jmalpeli3194"
      ) {
        console.log("✅ Admin fallback authentication on error");
      } else {
        return null;
      }
    }

    console.log("✅ Database user authenticated:", user.username);

    logSecurityEvent("DATABASE_LOGIN_SUCCESS", {
      username: user.username,
      role: user.role,
      email: user.email,
      employeeId: user.employee?.id,
    });

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

    logSecurityEvent("LOGIN_VALIDATION_ERROR", {
      username,
      error: error instanceof Error ? error.message : "Unknown error",
    });

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
