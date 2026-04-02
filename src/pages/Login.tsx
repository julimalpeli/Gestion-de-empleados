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
import {
  LogIn,
  AlertTriangle,
  Eye,
  EyeOff,
  Mail,
} from "lucide-react";
import { useAuth } from "@/hooks/use-auth-simple";

const Login = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  // Removed showPasswordChange and pendingUser - handled by Supabase Auth
  const [failedAttempts, setFailedAttempts] = useState(0);
  const [isBlocked, setIsBlocked] = useState(false);
  const [blockTimeRemaining, setBlockTimeRemaining] = useState(0);
  const [showPassword, setShowPassword] = useState(false);
  const [showResetPassword, setShowResetPassword] = useState(false);
  const navigate = useNavigate();
  const { login, isAuthenticated, user, loading, resetPassword } = useAuth();

  const MAX_FAILED_ATTEMPTS = 6;
  const BLOCK_DURATION = 5 * 60 * 1000; // 5 minutes in milliseconds

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

  // Redirect if already authenticated and on login page
  useEffect(() => {
    // Only redirect if we're actually on the login page
    if (window.location.pathname !== "/login") {
      return;
    }

    console.log("🔄 Login redirect check:", {
      isAuthenticated,
      user: user?.name,
      role: user?.role,
      loading,
      path: window.location.pathname,
    });

    // Don't redirect if still loading
    if (loading) return;

    if (isAuthenticated && user) {
      // Add small delay to ensure state is stable
      setTimeout(() => {
        if (user.role === "employee") {
          console.log("👤 Redirecting employee to portal");
          navigate("/portal-empleado", { replace: true });
        } else {
          console.log("👑 Redirecting admin/manager to dashboard");
          navigate("/", { replace: true });
        }
      }, 100);
    }
  }, [isAuthenticated, user, loading, navigate]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();

    // Check if blocked
    if (isBlocked) {
      setError(
        `Acceso bloqueado. Intenta nuevamente en ${Math.ceil(blockTimeRemaining / 60)} minutos.`,
      );
      return;
    }

    if (!email || !password) {
      setError("Por favor complete todos los campos");
      return;
    }

    setError("");
    const result = await login(email, password);

    if (!result?.error) {
      // Login successful
      setFailedAttempts(0);
      setError("");
      localStorage.removeItem("loginBlock");
      // Navigation will be handled by the auth state change
      return;
    }

    // Login failed - handle error
    const newFailedAttempts = failedAttempts + 1;
    setFailedAttempts(newFailedAttempts);

    // Bloquear después de 6 intentos
    if (newFailedAttempts >= MAX_FAILED_ATTEMPTS) {
      const blockUntil = new Date().getTime() + BLOCK_DURATION;
      localStorage.setItem(
        "loginBlock",
        JSON.stringify({
          attempts: newFailedAttempts,
          blockedUntil: blockUntil,
        }),
      );
      setIsBlocked(true);
      setBlockTimeRemaining(Math.ceil(BLOCK_DURATION / 1000));

      setError(
        "Demasiados intentos fallidos. Acceso bloqueado por 5 minutos.",
      );
    } else {
      const remainingAttempts = MAX_FAILED_ATTEMPTS - newFailedAttempts;
      const baseMessage = result.error;

      if (remainingAttempts <= 2) {
        setError(`${baseMessage} ⚠️ Solo te quedan ${remainingAttempts} intento(s) antes del bloqueo.`);
      } else {
        setError(baseMessage);
      }
    }
  };

  const handleResetPassword = async () => {
    if (!email) {
      setError("Por favor ingresa tu email primero");
      return;
    }

    try {
      await resetPassword(email);
      alert(
        "Se ha enviado un email con instrucciones para restablecer tu contraseña",
      );
      setShowResetPassword(false);
    } catch (error: any) {
      console.error("Error sending reset email:", error);
      setError("Error al enviar email de restablecimiento: " + error.message);
    }
  };

  // Demo credentials are no longer available with Supabase Auth
  // Users must be created through the admin panel

  // Password changes are now handled by Supabase Auth
  // via the ChangePasswordDialog component in the user menu

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
                <Label htmlFor="email">Email</Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
                  <Input
                    id="email"
                    type="email"
                    placeholder="tu-email@ejemplo.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="pl-10"
                    required
                  />
                </div>
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

              <div className="flex justify-end">
                <Button
                  type="button"
                  variant="link"
                  className="text-sm"
                  onClick={handleResetPassword}
                  disabled={!email}
                >
                  ¿Olvidaste tu contraseña?
                </Button>
              </div>

              {error && !isBlocked && (
                <Alert variant="destructive">
                  <AlertTriangle className="h-4 w-4" />
                  <AlertDescription>{error}</AlertDescription>
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

              <Button type="submit" className="w-full" disabled={loading}>
                {loading ? "Iniciando sesión..." : "Iniciar Sesión"}
              </Button>
            </form>
          </CardContent>
        </Card>

        {/* Auth is handled entirely by Supabase */}
      </div>

      {/* Password changes now handled by Supabase Auth */}
    </div>
  );
};

export default Login;
