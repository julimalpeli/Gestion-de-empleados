import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { UserX, LogOut, Phone, Mail } from "lucide-react";
import { useAuth } from "@/hooks/use-auth-simple";
import { useNavigate } from "react-router-dom";

const InactiveUser = () => {
  const { logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    try {
      await logout();
    } catch (error) {
      console.error("Error during logout:", error);
    } finally {
      navigate("/login", { replace: true });
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <Card className="border-red-200">
          <CardHeader className="text-center">
            <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-red-100 mb-4">
              <UserX className="h-6 w-6 text-red-600" />
            </div>
            <CardTitle className="text-2xl font-bold text-gray-900">
              Cuenta Inactiva
            </CardTitle>
            <CardDescription className="text-gray-600">
              Tu cuenta ha sido desactivada temporalmente
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="text-center">
              <p className="text-sm text-gray-700 mb-4">
                Tu cuenta de empleado ha sido desactivada por un administrador.
                No puedes acceder al sistema en este momento.
              </p>

              <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
                <p className="text-sm text-red-800">
                  <strong>¿Qué significa esto?</strong>
                  <br />
                  Tu acceso al portal de empleados ha sido suspendido
                  temporalmente. Esto puede deberse a cambios administrativos o
                  de personal.
                </p>
              </div>

              <div className="space-y-3">
                <div className="flex items-center justify-center space-x-2 text-sm text-gray-600">
                  <Mail className="h-4 w-4" />
                  <span>Contacta a Recursos Humanos</span>
                </div>

                <div className="flex items-center justify-center space-x-2 text-sm text-gray-600">
                  <Phone className="h-4 w-4" />
                  <span>O comunícate con tu supervisor directo</span>
                </div>
              </div>
            </div>

            <div className="space-y-3">
              <Button
                onClick={handleLogout}
                className="w-full"
                variant="destructive"
              >
                <LogOut className="h-4 w-4 mr-2" />
                Cerrar Sesión
              </Button>

              <p className="text-xs text-center text-gray-500">
                Si crees que esto es un error, contacta al administrador del
                sistema.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default InactiveUser;
