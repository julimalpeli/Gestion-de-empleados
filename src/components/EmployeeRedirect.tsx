import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/use-auth";

export const EmployeeRedirect = () => {
  const { user } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (user?.role === "employee") {
      console.log("🔄 Redirecting employee to portal");
      navigate("/portal-empleado", { replace: true });
    } else {
      console.log("🔄 Redirecting non-employee to dashboard");
      navigate("/", { replace: true });
    }
  }, [user, navigate]);

  return (
    <div className="flex items-center justify-center min-h-screen">
      <div className="text-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-2"></div>
        <p className="text-sm text-muted-foreground">Redirigiendo...</p>
      </div>
    </div>
  );
};
