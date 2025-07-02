import { ReactNode } from "react";
import { Navigate } from "react-router-dom";
import { useAuth } from "@/hooks/use-auth";
import usePermissions from "@/hooks/use-permissions";
import { EmployeeRedirect } from "@/components/EmployeeRedirect";

interface ProtectedRouteProps {
  children: ReactNode;
  requiredRole?: "admin" | "manager" | "hr" | "employee" | "readonly";
  requiredPermissions?: string[][]; // [module, action] pairs
  requireAllPermissions?: boolean; // true = ALL permissions required, false = ANY permission required
  allowedRoles?: string[]; // List of roles that can access this route
}

const ProtectedRoute = ({
  children,
  requiredRole,
  requiredPermissions = [],
  requireAllPermissions = false,
  allowedRoles = [],
}: ProtectedRouteProps) => {
  try {
    const { isAuthenticated, user } = useAuth();
    const {
      hasPermission,
      hasAllPermissions,
      hasAnyPermission,
      isAdmin,
      isManager,
      isEmployee,
    } = usePermissions();

    if (!isAuthenticated) {
      console.log("🔒 Redirecting to login - not authenticated");
      return <Navigate to="/login" replace />;
    }

    // Check specific role requirement
    if (requiredRole && user?.role !== requiredRole) {
      console.log("🔒 Role mismatch - redirecting", {
        required: requiredRole,
        actual: user?.role,
      });
      // Redirect to appropriate dashboard based on role
      if (isEmployee()) {
        return <Navigate to="/portal-empleado" replace />;
      } else {
        return <Navigate to="/" replace />;
      }
    }

    // Check allowed roles
    if (allowedRoles.length > 0 && !allowedRoles.includes(user?.role || "")) {
      console.log("🔒 Role not allowed - redirecting", {
        allowedRoles,
        actualRole: user?.role,
      });
      if (isEmployee()) {
        return <EmployeeRedirect />;
      } else {
        return <Navigate to="/unauthorized" replace />;
      }
    }

    // Check permissions
    if (requiredPermissions.length > 0) {
      const hasRequiredPermissions = requireAllPermissions
        ? hasAllPermissions(requiredPermissions)
        : hasAnyPermission(requiredPermissions);

      if (!hasRequiredPermissions && !isAdmin()) {
        return <Navigate to="/unauthorized" replace />;
      }
    }

    return <>{children}</>;
  } catch (error) {
    console.error("ProtectedRoute error:", error);
    // If there's an error with auth context, redirect to login
    return <Navigate to="/login" replace />;
  }
};

export default ProtectedRoute;
