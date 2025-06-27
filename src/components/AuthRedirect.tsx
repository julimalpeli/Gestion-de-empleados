import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/use-auth";

const AuthRedirect = () => {
  const { isAuthenticated, user } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (isAuthenticated && user) {
      // Redirect based on user role
      if (user.role === "admin") {
        navigate("/", { replace: true });
      } else if (user.role === "employee") {
        navigate("/portal-empleado", { replace: true });
      }
    } else {
      navigate("/login", { replace: true });
    }
  }, [isAuthenticated, user, navigate]);

  // Show loading while redirecting
  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="text-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
        <p className="mt-2 text-muted-foreground">Redirigiendo...</p>
      </div>
    </div>
  );
};

export default AuthRedirect;
