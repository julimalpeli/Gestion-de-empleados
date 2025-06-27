import { ReactNode } from "react";
import usePermissions from "@/hooks/use-permissions";

interface PermissionGateProps {
  children: ReactNode;
  module?: string;
  action?: string;
  requiredPermissions?: string[][]; // [module, action] pairs
  requireAllPermissions?: boolean; // true = ALL permissions required, false = ANY permission required
  allowedRoles?: string[]; // List of roles that can see this content
  fallback?: ReactNode; // What to show if permission is denied
  showForAdmin?: boolean; // Whether to show for admin regardless of permissions
}

const PermissionGate = ({
  children,
  module,
  action,
  requiredPermissions = [],
  requireAllPermissions = false,
  allowedRoles = [],
  fallback = null,
  showForAdmin = true,
}: PermissionGateProps) => {
  const {
    hasPermission,
    hasAllPermissions,
    hasAnyPermission,
    isAdmin,
    getUserRole,
  } = usePermissions();

  const userRole = getUserRole();

  // Always show for admin if showForAdmin is true
  if (showForAdmin && isAdmin()) {
    return <>{children}</>;
  }

  // Check specific module/action permission
  if (module && action) {
    if (!hasPermission(module, action)) {
      return <>{fallback}</>;
    }
  }

  // Check allowed roles
  if (allowedRoles.length > 0) {
    if (!allowedRoles.includes(userRole?.id || "")) {
      return <>{fallback}</>;
    }
  }

  // Check multiple permissions
  if (requiredPermissions.length > 0) {
    const hasRequiredPermissions = requireAllPermissions
      ? hasAllPermissions(requiredPermissions)
      : hasAnyPermission(requiredPermissions);

    if (!hasRequiredPermissions) {
      return <>{fallback}</>;
    }
  }

  return <>{children}</>;
};

export default PermissionGate;
