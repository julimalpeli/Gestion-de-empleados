import { ReactNode } from "react";
import { Navigate } from "react-router-dom";
import { useAuth } from "@/hooks/use-auth-simple";
import usePermissions from "@/hooks/use-permissions";

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

    // Debug logging
    console.log("🛡️ ProtectedRoute check:", {
      isAuthenticated,
      user: user?.name,
      role: user?.role,
      path: window.location.pathname,
    });

    if (!isAuthenticated) {
      console.log("❌ Not authenticated, redirecting to login");
      return <Navigate to="/login" replace />;
    }

    // Check if user is active
    if (user && user.isActive === false) {
      console.log(
        "🚫 SECURITY: User is inactive, redirecting to inactive page",
      );
      return <Navigate to="/inactive" replace />;
    }

    // Check specific role requirement
    if (requiredRole && user?.role !== requiredRole) {
      // Redirect to appropriate dashboard based on role
      if (isEmployee()) {
        return <Navigate to="/portal-empleado" replace />;
      } else {
        return <Navigate to="/" replace />;
      }
    }

    // Check allowed roles
    if (allowedRoles.length > 0 && !allowedRoles.includes(user?.role || "")) {
      if (isEmployee()) {
        return <Navigate to="/portal-empleado" replace />;
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

    console.log("✅ ProtectedRoute: All checks passed, rendering children");
    return <>{children}</>;
  } catch (error) {
    console.error("💥 ProtectedRoute error:", error);
    console.error("💥 Error details:", error.message, error.stack);
    // If there's an error with auth context, redirect to login
    return <Navigate to="/login" replace />;
  }
};

export default ProtectedRoute;
