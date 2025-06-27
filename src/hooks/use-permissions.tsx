import { useAuth } from "./use-auth";

export interface Permission {
  module: string;
  action: string;
  description: string;
}

export interface Role {
  id: string;
  name: string;
  permissions: Permission[];
  level: number; // 1=Admin, 2=Manager, 3=Employee, 4=ReadOnly
}

const PERMISSIONS = {
  // Employee management
  EMPLOYEES_VIEW: {
    module: "employees",
    action: "view",
    description: "Ver empleados",
  },
  EMPLOYEES_CREATE: {
    module: "employees",
    action: "create",
    description: "Crear empleados",
  },
  EMPLOYEES_EDIT: {
    module: "employees",
    action: "edit",
    description: "Editar empleados",
  },
  EMPLOYEES_DELETE: {
    module: "employees",
    action: "delete",
    description: "Eliminar empleados",
  },
  EMPLOYEES_EXPORT: {
    module: "employees",
    action: "export",
    description: "Exportar datos de empleados",
  },

  // Payroll management
  PAYROLL_VIEW: {
    module: "payroll",
    action: "view",
    description: "Ver liquidaciones",
  },
  PAYROLL_CREATE: {
    module: "payroll",
    action: "create",
    description: "Crear liquidaciones",
  },
  PAYROLL_EDIT: {
    module: "payroll",
    action: "edit",
    description: "Editar liquidaciones",
  },
  PAYROLL_DELETE: {
    module: "payroll",
    action: "delete",
    description: "Eliminar liquidaciones",
  },
  PAYROLL_PROCESS: {
    module: "payroll",
    action: "process",
    description: "Procesar liquidaciones",
  },
  PAYROLL_EXPORT: {
    module: "payroll",
    action: "export",
    description: "Exportar liquidaciones",
  },

  // Vacation management
  VACATIONS_VIEW: {
    module: "vacations",
    action: "view",
    description: "Ver vacaciones",
  },
  VACATIONS_APPROVE: {
    module: "vacations",
    action: "approve",
    description: "Aprobar vacaciones",
  },
  VACATIONS_MANAGE: {
    module: "vacations",
    action: "manage",
    description: "Gestionar vacaciones",
  },

  // Reports
  REPORTS_VIEW: {
    module: "reports",
    action: "view",
    description: "Ver reportes",
  },
  REPORTS_GENERATE: {
    module: "reports",
    action: "generate",
    description: "Generar reportes",
  },
  REPORTS_EXPORT: {
    module: "reports",
    action: "export",
    description: "Exportar reportes",
  },

  // Files
  FILES_VIEW: { module: "files", action: "view", description: "Ver archivos" },
  FILES_UPLOAD: {
    module: "files",
    action: "upload",
    description: "Subir archivos",
  },
  FILES_DELETE: {
    module: "files",
    action: "delete",
    description: "Eliminar archivos",
  },

  // System administration
  SYSTEM_USERS: {
    module: "system",
    action: "users",
    description: "Gestionar usuarios",
  },
  SYSTEM_ROLES: {
    module: "system",
    action: "roles",
    description: "Gestionar roles",
  },
  SYSTEM_SETTINGS: {
    module: "system",
    action: "settings",
    description: "Configurar sistema",
  },
};

const ROLES: Role[] = [
  {
    id: "admin",
    name: "Administrador",
    level: 1,
    permissions: Object.values(PERMISSIONS), // All permissions
  },
  {
    id: "manager",
    name: "Gerente",
    level: 2,
    permissions: [
      PERMISSIONS.EMPLOYEES_VIEW,
      PERMISSIONS.EMPLOYEES_CREATE,
      PERMISSIONS.EMPLOYEES_EDIT,
      PERMISSIONS.EMPLOYEES_EXPORT,
      PERMISSIONS.PAYROLL_VIEW,
      PERMISSIONS.PAYROLL_CREATE,
      PERMISSIONS.PAYROLL_EDIT,
      PERMISSIONS.PAYROLL_PROCESS,
      PERMISSIONS.PAYROLL_EXPORT,
      PERMISSIONS.VACATIONS_VIEW,
      PERMISSIONS.VACATIONS_APPROVE,
      PERMISSIONS.VACATIONS_MANAGE,
      PERMISSIONS.REPORTS_VIEW,
      PERMISSIONS.REPORTS_GENERATE,
      PERMISSIONS.REPORTS_EXPORT,
      PERMISSIONS.FILES_VIEW,
      PERMISSIONS.FILES_UPLOAD,
      PERMISSIONS.FILES_DELETE,
    ],
  },
  {
    id: "hr",
    name: "Recursos Humanos",
    level: 2,
    permissions: [
      PERMISSIONS.EMPLOYEES_VIEW,
      PERMISSIONS.EMPLOYEES_CREATE,
      PERMISSIONS.EMPLOYEES_EDIT,
      PERMISSIONS.EMPLOYEES_EXPORT,
      PERMISSIONS.PAYROLL_VIEW,
      PERMISSIONS.PAYROLL_CREATE,
      PERMISSIONS.PAYROLL_EDIT,
      PERMISSIONS.PAYROLL_EXPORT,
      PERMISSIONS.VACATIONS_VIEW,
      PERMISSIONS.VACATIONS_APPROVE,
      PERMISSIONS.VACATIONS_MANAGE,
      PERMISSIONS.REPORTS_VIEW,
      PERMISSIONS.REPORTS_GENERATE,
      PERMISSIONS.FILES_VIEW,
      PERMISSIONS.FILES_UPLOAD,
    ],
  },
  {
    id: "employee",
    name: "Empleado",
    level: 3,
    permissions: [
      PERMISSIONS.EMPLOYEES_VIEW, // Only own data
      PERMISSIONS.PAYROLL_VIEW, // Only own payroll
      PERMISSIONS.VACATIONS_VIEW, // Only own vacations
      PERMISSIONS.FILES_VIEW, // Only own files
    ],
  },
  {
    id: "readonly",
    name: "Solo Lectura",
    level: 4,
    permissions: [
      PERMISSIONS.EMPLOYEES_VIEW,
      PERMISSIONS.PAYROLL_VIEW,
      PERMISSIONS.VACATIONS_VIEW,
      PERMISSIONS.REPORTS_VIEW,
      PERMISSIONS.FILES_VIEW,
    ],
  },
];

export const usePermissions = () => {
  const { user } = useAuth();

  const getUserRole = (): Role | null => {
    if (!user?.role) return null;
    return ROLES.find((role) => role.id === user.role) || null;
  };

  const hasPermission = (module: string, action: string): boolean => {
    const role = getUserRole();
    if (!role) return false;

    // Admin has all permissions
    if (role.id === "admin") return true;

    return role.permissions.some(
      (permission) =>
        permission.module === module && permission.action === action,
    );
  };

  const hasAnyPermission = (permissions: string[][]): boolean => {
    return permissions.some(([module, action]) =>
      hasPermission(module, action),
    );
  };

  const hasAllPermissions = (permissions: string[][]): boolean => {
    return permissions.every(([module, action]) =>
      hasPermission(module, action),
    );
  };

  const canViewModule = (module: string): boolean => {
    return hasPermission(module, "view");
  };

  const canEditModule = (module: string): boolean => {
    return hasPermission(module, "edit");
  };

  const canCreateInModule = (module: string): boolean => {
    return hasPermission(module, "create");
  };

  const canDeleteInModule = (module: string): boolean => {
    return hasPermission(module, "delete");
  };

  const getRoleLevel = (): number => {
    const role = getUserRole();
    return role?.level || 999;
  };

  const isAdmin = (): boolean => {
    return user?.role === "admin";
  };

  const isManager = (): boolean => {
    return ["admin", "manager", "hr"].includes(user?.role || "");
  };

  const isEmployee = (): boolean => {
    return user?.role === "employee";
  };

  const canAccessEmployeeData = (employeeId: number): boolean => {
    if (isManager()) return true;
    if (isEmployee()) return user?.employeeId === employeeId;
    return false;
  };

  const getAvailableActions = (module: string): string[] => {
    const role = getUserRole();
    if (!role) return [];

    return role.permissions
      .filter((permission) => permission.module === module)
      .map((permission) => permission.action);
  };

  return {
    // Core permission checking
    hasPermission,
    hasAnyPermission,
    hasAllPermissions,

    // Module-specific helpers
    canViewModule,
    canEditModule,
    canCreateInModule,
    canDeleteInModule,

    // Role helpers
    getUserRole,
    getRoleLevel,
    isAdmin,
    isManager,
    isEmployee,

    // Data access helpers
    canAccessEmployeeData,
    getAvailableActions,

    // Available data
    roles: ROLES,
    permissions: PERMISSIONS,
  };
};

export default usePermissions;
