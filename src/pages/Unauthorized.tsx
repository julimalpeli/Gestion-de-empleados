import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { AlertTriangle } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/use-auth-simple";

const Unauthorized = () => {
  const navigate = useNavigate();
  const { user } = useAuth();

  const handleGoBack = () => {
    if (user?.role === "admin") {
      navigate("/");
    } else if (user?.role === "employee") {
      navigate("/portal-empleado");
    } else {
      navigate("/login");
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background to-muted flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="flex justify-center mb-4">
            <AlertTriangle className="h-16 w-16 text-orange-500" />
          </div>
          <CardTitle className="text-xl">Acceso No Autorizado</CardTitle>
          <CardDescription>
            No tienes permisos para acceder a esta sección del sistema.
          </CardDescription>
        </CardHeader>
        <CardContent className="text-center space-y-4">
          <p className="text-sm text-muted-foreground">
            Si crees que esto es un error, contacta con el administrador del
            sistema.
          </p>
          <Button onClick={handleGoBack} className="w-full">
            Volver al Inicio
          </Button>
        </CardContent>
      </Card>
    </div>
  );
};

export default Unauthorized;
