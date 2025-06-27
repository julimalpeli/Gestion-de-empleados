import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { LogIn, User, Shield } from "lucide-react";
import { useAuth, validateLogin, DEMO_USERS } from "@/hooks/use-auth";

const Login = () => {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();
  const { login, isAuthenticated, user } = useAuth();

  // Redirect if already authenticated
  useEffect(() => {
    if (isAuthenticated && user) {
      if (user.role === "admin") {
        navigate("/");
      } else {
        navigate("/portal-empleado");
      }
    }
  }, [isAuthenticated, user, navigate]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError("");

    // Simulate API call
    setTimeout(() => {
      const userData = validateLogin(username, password);

      if (userData) {
        login(userData);

        // Redirect based on role
        if (userData.role === "employee") {
          navigate("/portal-empleado");
        } else {
          navigate("/");
        }
      } else {
        setError("Usuario o contraseña incorrectos");
      }
      setIsLoading(false);
    }, 1000);
  };

  const fillDemoCredentials = (userType: "admin" | "employee") => {
    setUsername(userType);
    setPassword(DEMO_USERS[userType].password);
    setError("");
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background to-muted flex items-center justify-center p-4">
      <div className="w-full max-w-md space-y-6">
        {/* Logo and Title */}
        <div className="text-center space-y-4">
          <div className="flex justify-center">
            <div className="flex h-16 w-16 items-center justify-center rounded-xl bg-white p-2 border border-gray-200 shadow-lg">
              <img
                src="https://cdn.builder.io/api/v1/image/assets%2Fba484c5e9b3d409b8f430aad946b1b02%2F12f46da7c0a34ce3b09600a8825776cc?format=webp&width=800"
                alt="Cádiz Bar de Tapas"
                className="h-full w-full object-contain"
              />
            </div>
          </div>
          <div>
            <h1 className="text-3xl font-bold text-foreground">
              Cádiz Bar de Tapas
            </h1>
            <p className="text-muted-foreground">
              Sistema de Gestión de Personal
            </p>
          </div>
        </div>

        {/* Login Form */}
        <Card>
          <CardHeader className="text-center">
            <CardTitle className="flex items-center justify-center gap-2">
              <LogIn className="h-5 w-5" />
              Iniciar Sesión
            </CardTitle>
            <CardDescription>
              Ingresa tus credenciales para acceder al sistema
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleLogin} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="username">Usuario</Label>
                <Input
                  id="username"
                  type="text"
                  placeholder="Ingresa tu usuario"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="password">Contraseña</Label>
                <Input
                  id="password"
                  type="password"
                  placeholder="Ingresa tu contraseña"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
              </div>

              {error && (
                <Alert variant="destructive">
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}

              <Button type="submit" className="w-full" disabled={isLoading}>
                {isLoading ? "Iniciando sesión..." : "Iniciar Sesión"}
              </Button>
            </form>
          </CardContent>
        </Card>

        {/* Demo Credentials */}
        <Card className="border-amber-200 bg-amber-50">
          <CardHeader>
            <CardTitle className="text-sm text-amber-800 flex items-center gap-2">
              <Shield className="h-4 w-4" />
              Credenciales de Demostración
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Badge
                    variant="default"
                    className="bg-blue-100 text-blue-800"
                  >
                    <Shield className="h-3 w-3 mr-1" />
                    Administrador
                  </Badge>
                  <span className="text-sm text-muted-foreground">
                    admin / admin123
                  </span>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => fillDemoCredentials("admin")}
                >
                  Usar
                </Button>
              </div>

              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Badge
                    variant="secondary"
                    className="bg-green-100 text-green-800"
                  >
                    <User className="h-3 w-3 mr-1" />
                    Empleado
                  </Badge>
                  <span className="text-sm text-muted-foreground">
                    employee / empleado123
                  </span>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => fillDemoCredentials("employee")}
                >
                  Usar
                </Button>
              </div>
            </div>

            <p className="text-xs text-amber-700 mt-2">
              Estas son credenciales de demostración. En producción se usarían
              usuarios reales.
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Login;
