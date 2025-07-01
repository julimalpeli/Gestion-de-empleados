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
import { LogIn, User, Shield, AlertTriangle, Eye, EyeOff } from "lucide-react";
import { validateLogin, DEMO_USERS } from "@/hooks/use-auth";
import { useAuth } from "@/hooks/use-auth";
import ForcePasswordChange from "@/components/ForcePasswordChange";

const Login = () => {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [showPasswordChange, setShowPasswordChange] = useState(false);
  const [pendingUser, setPendingUser] = useState(null);
  const [failedAttempts, setFailedAttempts] = useState(0);
  const [isBlocked, setIsBlocked] = useState(false);
  const [blockTimeRemaining, setBlockTimeRemaining] = useState(0);
  const [showPassword, setShowPassword] = useState(false);
  const navigate = useNavigate();
  const { login, isAuthenticated, user } = useAuth();

  const MAX_FAILED_ATTEMPTS = 6;
  const BLOCK_DURATION = 15 * 60 * 1000; // 15 minutes in milliseconds

  // Check for existing block on component mount
  useEffect(() => {
    const blockData = localStorage.getItem("loginBlock");
    if (blockData) {
      try {
        const { blockedUntil, attempts } = JSON.parse(blockData);
        const now = new Date().getTime();

        if (now < blockedUntil) {
          setIsBlocked(true);
          setFailedAttempts(attempts);
          setBlockTimeRemaining(Math.ceil((blockedUntil - now) / 1000));

          // Start countdown timer
          const timer = setInterval(() => {
            const remaining = Math.ceil(
              (blockedUntil - new Date().getTime()) / 1000,
            );
            if (remaining <= 0) {
              clearInterval(timer);
              setIsBlocked(false);
              setFailedAttempts(0);
              setBlockTimeRemaining(0);
              localStorage.removeItem("loginBlock");
            } else {
              setBlockTimeRemaining(remaining);
            }
          }, 1000);

          return () => clearInterval(timer);
        } else {
          // Block expired, clean up
          localStorage.removeItem("loginBlock");
          setFailedAttempts(attempts < MAX_FAILED_ATTEMPTS ? attempts : 0);
        }
      } catch (error) {
        localStorage.removeItem("loginBlock");
      }
    }
  }, []);

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

    // Check if blocked
    if (isBlocked) {
      setError(
        `Acceso bloqueado. Intenta nuevamente en ${Math.ceil(blockTimeRemaining / 60)} minutos.`,
      );
      return;
    }

    setIsLoading(true);
    setError("");

    try {
      const userData = await validateLogin(username, password);

      if (userData) {
        // Success - reset failed attempts
        setFailedAttempts(0);
        localStorage.removeItem("loginBlock");

        // Log successful login
        console.log("✅ Successful login:", {
          username: userData.username,
          role: userData.role,
          timestamp: new Date().toISOString(),
          ip: "client-side",
        });

        // Verificar si necesita cambiar contraseña
        if (userData.needsPasswordChange) {
          setPendingUser(userData);
          setShowPasswordChange(true);
          setIsLoading(false);
          return;
        }

        login(userData);

        // Redirect based on role
        if (userData.role === "employee") {
          navigate("/portal-empleado");
        } else {
          navigate("/");
        }
      } else {
        // Failed login - increment attempts
        const newFailedAttempts = failedAttempts + 1;
        setFailedAttempts(newFailedAttempts);

        // Log failed login attempt
        console.warn("❌ Failed login attempt:", {
          username,
          attempt: newFailedAttempts,
          timestamp: new Date().toISOString(),
          ip: "client-side",
        });

        if (newFailedAttempts >= MAX_FAILED_ATTEMPTS) {
          // Block user
          const blockedUntil = new Date().getTime() + BLOCK_DURATION;
          setIsBlocked(true);
          setBlockTimeRemaining(BLOCK_DURATION / 1000);

          localStorage.setItem(
            "loginBlock",
            JSON.stringify({
              blockedUntil,
              attempts: newFailedAttempts,
              timestamp: new Date().toISOString(),
            }),
          );

          setError(
            `Demasiados intentos fallidos. Acceso bloqueado por 15 minutos.`,
          );

          // Log security block
          console.error("🚫 User blocked due to failed attempts:", {
            username,
            attempts: newFailedAttempts,
            blockedUntil: new Date(blockedUntil).toISOString(),
            ip: "client-side",
          });
        } else {
          const remainingAttempts = MAX_FAILED_ATTEMPTS - newFailedAttempts;
          setError(
            `Usuario o contraseña incorrectos. ${remainingAttempts} intentos restantes.`,
          );
        }
      }
    } catch (error) {
      console.error("Login error:", error);
      setError("Error al intentar iniciar sesión");
    } finally {
      setIsLoading(false);
    }
  };

  const fillDemoCredentials = (userType: keyof typeof DEMO_USERS) => {
    setUsername(userType);
    setPassword(DEMO_USERS[userType].password);
    setError("");
  };

  const handlePasswordChanged = () => {
    if (pendingUser) {
      // Actualizar el usuario para indicar que ya no necesita cambiar contraseña
      const updatedUser = { ...pendingUser, needsPasswordChange: false };
      login(updatedUser);

      // Redirigir según rol
      if (updatedUser.role === "employee") {
        navigate("/portal-empleado");
      } else {
        navigate("/");
      }

      // Limpiar estados
      setShowPasswordChange(false);
      setPendingUser(null);
    }
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
                <div className="relative">
                  <Input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    placeholder="Ingresa tu contraseña"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    className="pr-10"
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                    onClick={() => setShowPassword(!showPassword)}
                  >
                    {showPassword ? (
                      <EyeOff className="h-4 w-4 text-muted-foreground" />
                    ) : (
                      <Eye className="h-4 w-4 text-muted-foreground" />
                    )}
                  </Button>
                </div>
              </div>

              {error && (
                <Alert variant="destructive">
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}

              {/* Security Status Indicators */}
              {failedAttempts > 0 && !isBlocked && (
                <Alert variant="destructive">
                  <AlertTriangle className="h-4 w-4" />
                  <AlertDescription>
                    ⚠️ {failedAttempts} intento(s) fallido(s). El acceso se
                    bloqueará tras {MAX_FAILED_ATTEMPTS - failedAttempts}{" "}
                    intentos más.
                  </AlertDescription>
                </Alert>
              )}

              {isBlocked && (
                <Alert variant="destructive">
                  <AlertTriangle className="h-4 w-4" />
                  <AlertDescription>
                    🚫 Acceso bloqueado por seguridad. Tiempo restante:{" "}
                    {Math.floor(blockTimeRemaining / 60)}:
                    {String(blockTimeRemaining % 60).padStart(2, "0")}
                  </AlertDescription>
                </Alert>
              )}

              <Button type="submit" className="w-full" disabled={isLoading}>
                {isLoading ? "Iniciando sesión..." : "Iniciar Sesión"}
              </Button>
            </form>
          </CardContent>
        </Card>

        {/* Access Information - Only in Development */}
        {import.meta.env.DEV && (
          <Card className="border-green-200 bg-green-50">
            <CardHeader>
              <CardTitle className="text-sm text-green-800 flex items-center gap-2">
                <Shield className="h-4 w-4" />
                Credenciales de Desarrollo
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="space-y-2">
                {Object.entries(DEMO_USERS).map(([key, user]) => (
                  <div key={key} className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Badge
                        variant={
                          user.role === "admin" ? "default" : "secondary"
                        }
                        className={
                          user.role === "admin"
                            ? "bg-blue-100 text-blue-800"
                            : user.role === "manager"
                              ? "bg-purple-100 text-purple-800"
                              : user.role === "hr"
                                ? "bg-orange-100 text-orange-800"
                                : user.role === "employee"
                                  ? "bg-green-100 text-green-800"
                                  : "bg-gray-100 text-gray-800"
                        }
                      >
                        <Shield className="h-3 w-3 mr-1" />
                        {user.role === "admin"
                          ? "Admin"
                          : user.role === "manager"
                            ? "Gerente"
                            : user.role === "hr"
                              ? "RRHH"
                              : user.role === "employee"
                                ? "Empleado"
                                : "Auditor"}
                      </Badge>
                      <span className="text-xs text-muted-foreground">
                        {key} / {user.password}
                      </span>
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() =>
                        fillDemoCredentials(key as keyof typeof DEMO_USERS)
                      }
                    >
                      Usar
                    </Button>
                  </div>
                ))}
              </div>
              <p className="text-xs text-green-700 mt-2">
                🔧 <strong>Modo Desarrollo</strong> - Todas las credenciales
                están disponibles para pruebas.
              </p>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Modal de cambio de contraseña obligatorio */}
      <ForcePasswordChange
        isOpen={showPasswordChange}
        username={username}
        onPasswordChanged={handlePasswordChanged}
      />
    </div>
  );
};

export default Login;
